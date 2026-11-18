import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { DEFAULT_TZ, monthRange, todayIn } from "./dates";
import { DEFAULT_CURRENCY, isCurrency, type Currency } from "./money";
import { createClient, getUser } from "./supabase/server";
import type { Account, Debt, DebtPayment, Entry, Transaction, Transfer } from "./types";

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

export async function getTotals(): Promise<{ income: number; expense: number; balance: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("balance_totals")
    .single<{ income: number; expense: number; initial: number }>();
  if (error) throw new Error(error.message);
  const income = Number(data?.income ?? 0);
  const expense = Number(data?.expense ?? 0);
  const initial = Number(data?.initial ?? 0);
  return { income, expense, balance: initial + income - expense };
}

/** Cuentas (incluye archivadas) con su saldo actual, deduplicado por petición. */
export const getAccounts = cache(async (): Promise<Account[]> => {
  const supabase = await createClient();
  const [accRes, balRes] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name, kind, parent_id, color, initial_balance, archived")
      .order("created_at", { ascending: true }),
    supabase.rpc("account_balances"),
  ]);
  if (accRes.error) throw new Error(accRes.error.message);
  if (balRes.error) throw new Error(balRes.error.message);
  const balances = new Map<string, number>(
    ((balRes.data ?? []) as { account_id: string; balance: number }[]).map((b) => [b.account_id, Number(b.balance)]),
  );
  return (accRes.data ?? []).map((a) => ({
    ...(a as Omit<Account, "balance">),
    initial_balance: Number(a.initial_balance),
    balance: balances.get(a.id) ?? Number(a.initial_balance),
  }));
});

const toTransfer = (row: Record<string, unknown>): Transfer => ({
  ...(row as Transfer),
  amount: Number(row.amount),
});

function sortEntries(entries: Entry[]) {
  return entries.sort((a, b) =>
    a.occurred_on === b.occurred_on ? b.created_at.localeCompare(a.created_at) : b.occurred_on.localeCompare(a.occurred_on),
  );
}

/** Gastos, ingresos y movimientos entre cuentas de un mes (opcionalmente de una cuenta). */
export async function getMonthEntries(month: string, accountId?: string): Promise<Entry[]> {
  const supabase = await createClient();
  const { start, end } = monthRange(month);
  let txQ = supabase
    .from("transactions")
    .select("id, type, account_id, amount, category, note, occurred_on, created_at")
    .gte("occurred_on", start)
    .lte("occurred_on", end);
  let trQ = supabase
    .from("transfers")
    .select("id, from_account_id, to_account_id, amount, occurred_on, note, created_at")
    .gte("occurred_on", start)
    .lte("occurred_on", end);
  if (accountId) {
    txQ = txQ.eq("account_id", accountId);
    trQ = trQ.or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`);
  }
  const [txRes, trRes] = await Promise.all([txQ, trQ]);
  if (txRes.error) throw new Error(txRes.error.message);
  if (trRes.error) throw new Error(trRes.error.message);
  return sortEntries([
    ...(txRes.data ?? []).map((r) => ({ kind: "tx" as const, ...toTx(r) })),
    ...(trRes.data ?? []).map((r) => ({ kind: "transfer" as const, ...toTransfer(r) })),
  ]);
}

/** ¿La cuenta (o sus bolsillos) tiene movimientos? Decide si se puede eliminar o sólo archivar. */
export async function accountHasEntries(ids: string[]): Promise<boolean> {
  const supabase = await createClient();
  const list = ids.join(",");
  const [tx, tr] = await Promise.all([
    supabase.from("transactions").select("id", { count: "exact", head: true }).in("account_id", ids),
    supabase
      .from("transfers")
      .select("id", { count: "exact", head: true })
      .or(`from_account_id.in.(${list}),to_account_id.in.(${list})`),
  ]);
  return (tx.count ?? 0) + (tr.count ?? 0) > 0;
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
