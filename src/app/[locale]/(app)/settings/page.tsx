import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { CurrencyForm, LanguageSelect, ThemeSelect } from "@/components/settings-controls";
import { buttonStyles } from "@/components/styles";
import { signOut } from "@/lib/actions/auth";
import { getPrefs } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-b border-line py-6 last:border-0 md:grid-cols-[12rem_1fr] md:gap-8">
      <h2 className="font-display text-base font-medium md:pt-2.5">{title}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const [locale, prefs, t] = await Promise.all([getLocale(), getPrefs(), getTranslations("settings")]);
  return (
    <div className="flex flex-col">
      <h1 className="font-display text-2xl font-medium md:text-[1.75rem]">{t("title")}</h1>
      <div className="mt-5 rounded-panel border border-line bg-surface px-5 md:px-7">
        <Section title={t("currency")}>
          <CurrencyForm current={prefs.currency} />
        </Section>
        <Section title={t("language")}>
          <LanguageSelect />
        </Section>
        <Section title={t("theme")}>
          <ThemeSelect />
        </Section>
        <Section title={t("account")}>
          <p className="text-sm text-ink-soft">{t("signedInAs")}</p>
          <p className="font-semibold break-all">{prefs.email}</p>
          <form action={signOut} className="mt-4">
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className={buttonStyles.secondary}>
              <LogOut size={18} strokeWidth={1.75} aria-hidden />
              {t("signOut")}
            </button>
          </form>
        </Section>
      </div>
    </div>
  );
}
