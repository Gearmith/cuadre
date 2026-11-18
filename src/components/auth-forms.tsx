"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/lib/actions/auth";
import { CURRENCIES } from "@/lib/money";
import { inputClass } from "./styles";
import { Field, FormAlert, PasswordInput, SubmitButton, useFocusFirstError } from "./ui";

function useErr(fieldErrors: Record<string, string> | undefined) {
  const t = useTranslations();
  return (k: string) => (fieldErrors?.[k] ? t(fieldErrors[k]) : undefined);
}

export function LoginForm({ linkError }: { linkError: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const [state, action] = useActionState(signIn, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state.fieldErrors);
  const err = useErr(state.fieldErrors);
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {linkError && !state.error ? <FormAlert tone="error">{t("auth.linkError")}</FormAlert> : null}
      <Field label={t("auth.email")} error={err("email")}>
        {(p) => <input {...p} type="email" name="email" autoComplete="email" inputMode="email" spellCheck={false} autoCapitalize="none" className={inputClass} />}
      </Field>
      <Field label={t("auth.password")} error={err("password")}>
        {(p) => <PasswordInput {...p} name="password" autoComplete="current-password" />}
      </Field>
      <div className="-mt-2 flex justify-end">
        <Link href="/forgot-password" className="rounded-field py-1 text-sm font-semibold text-gold hover:underline">
          {t("auth.forgot")}
        </Link>
      </div>
      {state.error ? <FormAlert tone="error">{t(state.error)}</FormAlert> : null}
      <SubmitButton pendingLabel={t("auth.signingIn")} className="w-full">
        {t("auth.signIn")}
      </SubmitButton>
    </form>
  );
}

export function SignupForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [state, action] = useActionState(signUp, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state.fieldErrors);
  const err = useErr(state.fieldErrors);
  const names = new Intl.DisplayNames([locale], { type: "currency" });

  if (state.ok && state.message) return <FormAlert tone="success">{t(state.message)}</FormAlert>;

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <Field label={t("auth.email")} error={err("email")}>
        {(p) => <input {...p} type="email" name="email" autoComplete="email" inputMode="email" spellCheck={false} autoCapitalize="none" className={inputClass} />}
      </Field>
      <Field label={t("auth.password")} error={err("password")} hint={t("auth.passwordHint")}>
        {(p) => <PasswordInput {...p} name="password" autoComplete="new-password" minLength={8} />}
      </Field>
      <Field label={t("auth.currency")}>
        {(p) => (
          <select {...p} name="currency" defaultValue={locale === "es" ? "COP" : "USD"} className={inputClass}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c} · {names.of(c)}
              </option>
            ))}
          </select>
        )}
      </Field>
      {state.error ? <FormAlert tone="error">{t(state.error)}</FormAlert> : null}
      <SubmitButton pendingLabel={t("auth.signingUp")} className="w-full">
        {t("auth.signUp")}
      </SubmitButton>
    </form>
  );
}

export function ForgotForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [state, action] = useActionState(requestPasswordReset, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state.fieldErrors);
  const err = useErr(state.fieldErrors);

  if (state.ok && state.message) return <FormAlert tone="success">{t(state.message)}</FormAlert>;

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <Field label={t("auth.email")} error={err("email")}>
        {(p) => <input {...p} type="email" name="email" autoComplete="email" inputMode="email" spellCheck={false} autoCapitalize="none" className={inputClass} />}
      </Field>
      {state.error ? <FormAlert tone="error">{t(state.error)}</FormAlert> : null}
      <SubmitButton pendingLabel={t("auth.sending")} className="w-full">
        {t("auth.sendLink")}
      </SubmitButton>
    </form>
  );
}

export function ResetForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [state, action] = useActionState(updatePassword, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state.fieldErrors);
  const err = useErr(state.fieldErrors);
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <Field label={t("auth.newPassword")} error={err("password")} hint={t("auth.passwordHint")}>
        {(p) => <PasswordInput {...p} name="password" autoComplete="new-password" minLength={8} autoFocus />}
      </Field>
      {state.error ? <FormAlert tone="error">{t(state.error)}</FormAlert> : null}
      <SubmitButton pendingLabel={t("auth.saving")} className="w-full">
        {t("auth.savePassword")}
      </SubmitButton>
    </form>
  );
}
