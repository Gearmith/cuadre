"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CURRENCIES, isCurrency } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { readLocale, requireUser, str } from "./helpers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
}

export async function signIn(_prev: ActionState, form: FormData): Promise<ActionState> {
  const locale = readLocale(form);
  const email = str(form, "email", 254);
  const password = str(form, "password", 72);
  const fieldErrors: Record<string, string> = {};
  if (!EMAIL_RE.test(email)) fieldErrors.email = "errors.email";
  if (!password) fieldErrors.password = "errors.passwordRequired";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "errors.notConfirmed" };
    return { error: "errors.badCredentials" };
  }
  redirect(`/${locale}`);
}

export async function signUp(_prev: ActionState, form: FormData): Promise<ActionState> {
  const locale = readLocale(form);
  const email = str(form, "email", 254);
  const password = str(form, "password", 72);
  const currency = str(form, "currency", 3);
  const fieldErrors: Record<string, string> = {};
  if (!EMAIL_RE.test(email)) fieldErrors.email = "errors.email";
  if (password.length < 8) fieldErrors.password = "errors.passwordShort";
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await origin()}/auth/callback?next=/${locale}`,
      data: { currency: isCurrency(currency) ? currency : CURRENCIES[0] },
    },
  });
  if (error) {
    if (error.code === "weak_password") return { fieldErrors: { password: "errors.passwordWeak" } };
    if (error.code === "over_email_send_rate_limit") return { error: "errors.rateLimit" };
    return { error: "errors.signup" };
  }
  // Si la confirmación por correo está desactivada, ya hay sesión.
  if (data.session) redirect(`/${locale}`);
  return { ok: true, message: "auth.checkEmail" };
}

export async function requestPasswordReset(_prev: ActionState, form: FormData): Promise<ActionState> {
  const locale = readLocale(form);
  const email = str(form, "email", 254);
  if (!EMAIL_RE.test(email)) return { fieldErrors: { email: "errors.email" } };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/${locale}/reset-password`,
  });
  if (error?.code === "over_email_send_rate_limit") return { error: "errors.rateLimit" };
  // No revelamos si el correo existe.
  return { ok: true, message: "auth.resetSent" };
}

export async function updatePassword(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const locale = readLocale(form);
  const password = str(form, "password", 72);
  if (password.length < 8) return { fieldErrors: { password: "errors.passwordShort" } };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { fieldErrors: { password: "errors.samePassword" } };
    if (error.code === "weak_password") return { fieldErrors: { password: "errors.passwordWeak" } };
    return { error: "errors.save" };
  }
  redirect(`/${locale}?password=updated`);
}

export async function signOut(form: FormData) {
  const locale = readLocale(form);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/login`);
}

export async function updateCurrency(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireUser();
  const currency = str(form, "currency", 3);
  if (!isCurrency(currency)) return { error: "errors.generic" };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { currency } });
  if (error) return { error: "errors.save" };
  revalidatePath("/[locale]", "layout");
  return { ok: true, message: "toast.currencySaved" };
}
