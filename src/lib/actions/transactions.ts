"use server";

import { revalidatePath } from "next/cache";
import { isValidCategory } from "@/lib/categories";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, TxType } from "@/lib/types";
import { isUuid, readAmount, readDate, readLocale, requireUser, str } from "./helpers";

export async function saveTransaction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const locale = readLocale(form);
  const id = str(form, "id", 36);
  const type = str(form, "type", 10) as TxType;
  const category = str(form, "category", 30);
  const amount = readAmount(form, locale);
  const occurredOn = readDate(form, "occurred_on");
  const note = str(form, "note", 200) || null;
  const accountId = str(form, "account_id", 36);

  const fieldErrors: Record<string, string> = {};
  if (type !== "expense" && type !== "income") return { error: "errors.generic" };
  if (!isUuid(accountId)) fieldErrors.account_id = "errors.account";
  if (amount === null) fieldErrors.amount = "errors.amount";
  if (!isValidCategory(type, category)) fieldErrors.category = "errors.category";
  if (!occurredOn) fieldErrors.occurred_on = "errors.date";
  if (id && !isUuid(id)) return { error: "errors.generic" };
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const values = { type, amount, category, note, occurred_on: occurredOn, account_id: accountId };
  const { error } = id
    ? await supabase.from("transactions").update(values).eq("id", id)
    : await supabase.from("transactions").insert(values);

  if (error) return { error: "errors.save" };
  revalidatePath("/[locale]", "layout");
  return { ok: true, message: `toast.${type}${id ? "Updated" : "Saved"}` };
}

export async function deleteTransaction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const id = str(form, "id", 36);
  const type = str(form, "type", 10) === "income" ? "income" : "expense";
  if (!isUuid(id)) return { error: "errors.generic" };
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) return { error: "errors.delete" };
  revalidatePath("/[locale]", "layout");
  return { ok: true, message: `toast.${type}Deleted` };
}

export async function saveTransfer(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const locale = readLocale(form);
  const id = str(form, "id", 36);
  const from = str(form, "from_account_id", 36);
  const to = str(form, "to_account_id", 36);
  const amount = readAmount(form, locale);
  const occurredOn = readDate(form, "occurred_on");
  const note = str(form, "note", 200) || null;

  const fieldErrors: Record<string, string> = {};
  if (!isUuid(from)) fieldErrors.from_account_id = "errors.account";
  if (!isUuid(to)) fieldErrors.to_account_id = "errors.account";
  else if (to === from) fieldErrors.to_account_id = "errors.sameAccount";
  if (amount === null) fieldErrors.amount = "errors.amount";
  if (!occurredOn) fieldErrors.occurred_on = "errors.date";
  if (id && !isUuid(id)) return { error: "errors.generic" };
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const values = { from_account_id: from, to_account_id: to, amount, occurred_on: occurredOn, note };
  const { error } = id
    ? await supabase.from("transfers").update(values).eq("id", id)
    : await supabase.from("transfers").insert(values);
  if (error) return { error: "errors.save" };
  revalidatePath("/[locale]", "layout");
  return { ok: true, message: id ? "toast.transferUpdated" : "toast.transferSaved" };
}

export async function deleteTransfer(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const id = str(form, "id", 36);
  if (!isUuid(id)) return { error: "errors.generic" };
  const supabase = await createClient();
  const { error } = await supabase.from("transfers").delete().eq("id", id);
  if (error) return { error: "errors.delete" };
  revalidatePath("/[locale]", "layout");
  return { ok: true, message: "toast.transferDeleted" };
}
