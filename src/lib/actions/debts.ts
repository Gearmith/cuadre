"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { isUuid, readAmount, readDate, readLocale, requireUser, str } from "./helpers";

export async function saveDebt(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const locale = readLocale(form);
  const id = str(form, "id", 36);
  const direction = str(form, "direction", 12);
  const person = str(form, "person", 80);
  const description = str(form, "description", 200) || null;
  const amount = readAmount(form, locale);
  const dueRaw = str(form, "due_on", 10);
  const dueOn = dueRaw ? readDate(form, "due_on") : null;

  const fieldErrors: Record<string, string> = {};
  if (direction !== "i_owe" && direction !== "owed_to_me") return { error: "errors.generic" };
  if (!person) fieldErrors.person = "errors.person";
  if (amount === null) fieldErrors.amount = "errors.amount";
  if (dueRaw && !dueOn) fieldErrors.due_on = "errors.date";
  if (id && !isUuid(id)) return { error: "errors.generic" };
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const values = { direction, person, description, amount, due_on: dueOn };
  const { error } = id
    ? await supabase.from("debts").update(values).eq("id", id)
    : await supabase.from("debts").insert(values);
  if (error) return { error: "errors.save" };

  revalidatePath("/[locale]", "layout");
  return { ok: true, message: id ? "toast.debtUpdated" : "toast.debtSaved" };
}

export async function deleteDebt(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const id = str(form, "id", 36);
  const locale = readLocale(form);
  if (!isUuid(id)) return { error: "errors.generic" };
  const supabase = await createClient();
  const { error } = await supabase.from("debts").delete().eq("id", id);
  if (error) return { error: "errors.delete" };
  revalidatePath("/[locale]", "layout");
  redirect(`/${locale}/debts?deleted=1`);
}

export async function savePayment(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const locale = readLocale(form);
  const debtId = str(form, "debt_id", 36);
  const amount = readAmount(form, locale);
  const paidOn = readDate(form, "paid_on");
  const note = str(form, "note", 200) || null;

  const fieldErrors: Record<string, string> = {};
  if (!isUuid(debtId)) return { error: "errors.generic" };
  if (amount === null) fieldErrors.amount = "errors.amount";
  if (!paidOn) fieldErrors.paid_on = "errors.date";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("debt_payments")
    .insert({ debt_id: debtId, amount, paid_on: paidOn, note });
  if (error) return { error: "errors.save" };
  revalidatePath("/[locale]", "layout");
  return { ok: true, message: "toast.paymentSaved" };
}

export async function deletePayment(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const id = str(form, "id", 36);
  if (!isUuid(id)) return { error: "errors.generic" };
  const supabase = await createClient();
  const { error } = await supabase.from("debt_payments").delete().eq("id", id);
  if (error) return { error: "errors.delete" };
  revalidatePath("/[locale]", "layout");
  return { ok: true, message: "toast.paymentDeleted" };
}
