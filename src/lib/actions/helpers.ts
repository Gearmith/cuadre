import "server-only";
import { getUser } from "@/lib/supabase/server";
import { isIsoDate } from "@/lib/dates";
import { parseAmount } from "@/lib/money";

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error("unauthorized");
  return user;
}

export function str(form: FormData, key: string, max = 200) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export function readAmount(form: FormData, locale: string) {
  return parseAmount(str(form, "amount", 32), locale);
}

export function readDate(form: FormData, key: string) {
  const v = str(form, key, 10);
  return isIsoDate(v) ? v : null;
}

export function readLocale(form: FormData) {
  return str(form, "locale", 2) === "en" ? "en" : "es";
}

export const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
