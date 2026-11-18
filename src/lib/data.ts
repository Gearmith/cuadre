import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { DEFAULT_TZ, monthRange, todayIn } from "./dates";
import { DEFAULT_CURRENCY, isCurrency, type Currency } from "./money";
import { createClient, getUser } from "./supabase/server";
import type { Debt, DebtPayment, Transaction } from "./types";

export const getPrefs = cache(async (): Promise<{ currency: Currency; timeZone: string; today: string; email: string }> => {
  const [user, cookieStore] = await Promise.all([getUser(), cookies()]);
  const meta = user?.user_metadata ?? {};
  const timeZone = cookieStore.get("tz")?.value || DEFAULT_TZ;
  return {
    currency: isCurrency(meta.currency) ? meta.currency : DEFAULT_CURRENCY,
    timeZone,
    today: todayIn(timeZone),
    email: user?.email ?? "",
  };
});

const toTx = (row: Record<string, unknown>): Transaction => ({
  ...(row as Transaction),
  amount: Number(row.amount),
});

export async function getMonthTransactions(month: string): Promise<Transaction[]> {
  const supabase = await createClient();
  const { start, end } = monthRange(month);
  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, amount, category, note, occurred_on, created_at")
    .gte("occurred_on", start)
    .lte("occurred_on", end)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toTx);
}

export async function getTotals(): Promise<{ income: number; expense: number; balance: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("balance_totals").single<{ income: number; expense: number }>();
  if (error) throw new Error(error.message);
  const income = Number(data?.income ?? 0);
  const expense = Number(data?.expense ?? 0);
  return { income, expense, balance: income - expense };
}

type DebtRow = Omit<Debt, "paid" | "remaining"> & { debt_payments: { amount: number }[] };

function toDebt(row: DebtRow): Debt {
  const amount = Number(row.amount);
  const paid = row.debt_payments.reduce((s, p) => s + Number(p.amount), 0);
  return {
    id: row.id,
    direction: row.direction,
    person: row.person,
    description: row.description,
    amount,
    due_on: row.due_on,
    created_at: row.created_at,
    paid,
    remaining: Math.max(amount - paid, 0),
  };
}

export async function getDebts(): Promise<Debt[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("debts")
    .select("id, direction, person, description, amount, due_on, created_at, debt_payments(amount)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as DebtRow[] | null ?? []).map(toDebt);
}

export async function getDebt(id: string): Promise<{ debt: Debt; payments: DebtPayment[] } | null> {
  const supabase = await createClient();
  const [debtRes, payRes] = await Promise.all([
    supabase
      .from("debts")
      .select("id, direction, person, description, amount, due_on, created_at, debt_payments(amount)")
      .eq("id", id)
      .maybeSingle<DebtRow>(),
    supabase
      .from("debt_payments")
      .select("id, debt_id, amount, paid_on, note")
      .eq("debt_id", id)
      .order("paid_on", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (debtRes.error) throw new Error(debtRes.error.message);
  if (payRes.error) throw new Error(payRes.error.message);
  if (!debtRes.data) return null;
  return {
    debt: toDebt(debtRes.data),
    payments: (payRes.data ?? []).map((p) => ({ ...p, amount: Number(p.amount) }) as DebtPayment),
  };
}
