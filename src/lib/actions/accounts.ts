"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isKind, isNoteColor } from "@/lib/accounts";
import { accountHasEntries } from "@/lib/data";
import { parseSignedAmount } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { isUuid, readLocale, requireUser, str } from "./helpers";

export async function saveAccount(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const locale = readLocale(form);
  const id = str(form, "id", 36);
  const name = str(form, "name", 40);
  const kind = str(form, "kind", 10);
  const color = str(form, "color", 10);
  const parentId = str(form, "parent_id", 36) || null;
  const rawInitial = str(form, "initial_balance", 32);
  const initial = rawInitial ? parseSignedAmount(rawInitial, locale) : 0;

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "errors.accountName";
  if (!isKind(kind)) return { error: "errors.generic" };
  if (!isNoteColor(color)) return { error: "errors.generic" };
  if (kind === "pocket" && (!parentId || !isUuid(parentId))) fieldErrors.parent_id = "errors.parent";
  if (initial === null) fieldErrors.initial_balance = "errors.initialBalance";
  if (id && !isUuid(id)) return { error: "errors.generic" };
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const values = {
    name,
    kind,
    color,
    parent_id: kind === "pocket" ? parentId : null,
    // En una tarjeta de crédito la persona escribe lo que debe; se guarda en negativo.
    initial_balance: kind === "credit" ? -Math.abs(initial ?? 0) : initial,
  };
  const { error } = id
    ? await supabase.from("accounts").update(values).eq("id", id)
    : await supabase.from("accounts").insert(values);
  if (error) return { error: "errors.save" };
  revalidatePath("/[locale]", "layout");
  return { ok: true, message: id ? "toast.accountUpdated" : "toast.accountSaved" };
}

/** Crea varias cuentas de una vez desde los atajos de bienvenida. */
export async function createStarterAccounts(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const picks = form.getAll("starter").filter((v): v is string => typeof v === "string");
  const STARTERS: Record<string, { name: string; kind: string; color: string }> = {
    bancolombia: { name: "Bancolombia", kind: "bank", color: "gold" },
    nu: { name: "Nu", kind: "bank", color: "purple" },
    cash: { name: str(form, "cash_name", 40) || "Efectivo", kind: "cash", color: "green" },
    credit: { name: str(form, "credit_name", 40) || "Tarjeta de crédito", kind: "credit", color: "slate" },
  };
  const rows = picks.filter((p) => p in STARTERS).map((p) => STARTERS[p]);
  if (!rows.length) return { error: "errors.pickAccount" };
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").insert(rows);
  if (error) return { error: "errors.save" };
  revalidatePath("/[locale]", "layout");
  return { ok: true, message: "toast.accountsCreated" };
}

export async function archiveAccount(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const id = str(form, "id", 36);
  const archived = str(form, "archived", 5) === "true";
  if (!isUuid(id)) return { error: "errors.generic" };
  const supabase = await createClient();
  const { error } = await supabase.from("accounts").update({ archived }).or(`id.eq.${id},parent_id.eq.${id}`);
  if (error) return { error: "errors.save" };
  revalidatePath("/[locale]", "layout");
  return { ok: true, message: archived ? "toast.accountArchived" : "toast.accountRestored" };
}

export async function deleteAccount(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const id = str(form, "id", 36);
  const locale = readLocale(form);
  if (!isUuid(id)) return { error: "errors.generic" };
  const supabase = await createClient();
  const { data: pockets } = await supabase.from("accounts").select("id").eq("parent_id", id);
  const ids = [id, ...(pockets ?? []).map((p) => p.id as string)];
  if (await accountHasEntries(ids)) return { error: "errors.accountInUse" };
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return { error: "errors.delete" };
  revalidatePath("/[locale]", "layout");
  redirect(`/${locale}/accounts?deleted=1`);
}
