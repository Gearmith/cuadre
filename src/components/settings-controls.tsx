"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { updateCurrency } from "@/lib/actions/auth";
import { CURRENCIES } from "@/lib/money";
import { inputClass } from "./styles";
import { useToast } from "./toast";
import { FormAlert, SubmitButton } from "./ui";

const segment =
  "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[5px] px-3 text-sm font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold";

const subscribe = () => () => {};

export function ThemeSelect() {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const options = [
    { key: "light", label: t("light"), icon: Sun },
    { key: "dark", label: t("dark"), icon: Moon },
    { key: "system", label: t("system"), icon: Monitor },
  ] as const;
  return (
    <fieldset>
      <legend className="sr-only">{t("theme")}</legend>
      <div className="grid grid-cols-3 gap-1 rounded-field bg-surface-2 p-1">
        {options.map(({ key, label, icon: Icon }) => {
          const active = mounted && theme === key;
          return (
            <label key={key} className={`${segment} flex-col gap-1 py-2 sm:flex-row sm:gap-2 sm:py-0 ${active ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}>
              <input type="radio" name="theme" value={key} checked={active} onChange={() => setTheme(key)} className="sr-only" />
              <Icon size={18} strokeWidth={1.75} aria-hidden />
              <span>{label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

const LANGUAGE_NAMES: Record<string, string> = { es: "Español", en: "English" };

export function LanguageSelect() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <fieldset>
      <legend className="sr-only">{t("language")}</legend>
      <div className="grid grid-cols-2 gap-1 rounded-field bg-surface-2 p-1">
        {routing.locales.map((l) => (
          <label key={l} lang={l} className={`${segment} ${l === locale ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}>
            <input
              type="radio"
              name="language"
              value={l}
              checked={l === locale}
              onChange={() => router.replace(pathname, { locale: l })}
              className="sr-only"
            />
            {LANGUAGE_NAMES[l]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function CurrencyForm({ current }: { current: string }) {
  const t = useTranslations();
  const toast = useToast();
  const [value, setValue] = useState(current);
  const [state, formAction] = useActionState(updateCurrency, {});
  useEffect(() => {
    if (state.ok && state.message) toast(t(state.message));
  }, [state, toast, t]);

  const names = new Intl.DisplayNames([useLocale()], { type: "currency" });
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="currency" className="sr-only">
          {t("settings.currency")}
        </label>
        <select
          id="currency"
          name="currency"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${inputClass} sm:flex-1`}
          aria-describedby="currency-hint"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c} · {names.of(c)}
            </option>
          ))}
        </select>
        <SubmitButton pendingLabel={t("tx.saving")} variant={value === current ? "secondary" : "primary"}>
          {value === current ? <Check size={18} strokeWidth={1.75} aria-hidden /> : null}
          {t("settings.saveCurrency")}
        </SubmitButton>
      </div>
      <p id="currency-hint" className="text-sm text-ink-soft">
        {t("settings.currencyHint")}
      </p>
      {state.error ? <FormAlert tone="error">{t(state.error)}</FormAlert> : null}
    </form>
  );
}
