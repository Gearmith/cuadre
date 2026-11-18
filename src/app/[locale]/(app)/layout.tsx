import { getLocale, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "@/i18n/navigation";
import { BottomNav, SideNav } from "@/components/app-nav";
import { PrefsProvider } from "@/components/prefs";
import { TimezoneSync } from "@/components/timezone-sync";
import { ToastProvider } from "@/components/toast";
import { AddFab, TxSheetProvider } from "@/components/tx-sheet";
import { getAccounts, getPrefs } from "@/lib/data";
import { getUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/[locale]">) {
  const [user, locale, prefs, cookieStore, t] = await Promise.all([getUser(), getLocale(), getPrefs(), cookies(), getTranslations("nav")]);
  if (!user) redirect({ href: "/login", locale });
  const accounts = (await getAccounts()).map(({ id, name, kind, parent_id, color, archived }) => ({ id, name, kind, parent_id, color, archived }));

  return (
    <PrefsProvider value={{ locale, currency: prefs.currency, today: prefs.today, accounts }}>
      <ToastProvider>
        <TxSheetProvider>
          <TimezoneSync current={cookieStore.get("tz")?.value} />
          <a href="#main" className="sr-only z-50 rounded-field bg-primary px-4 py-3 font-semibold text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
            {t("skip")}
          </a>
          <div className="flex min-h-dvh">
            <SideNav />
            <main id="main" tabIndex={-1} className="min-w-0 flex-1 pb-28 outline-none md:pb-12">
              <div className="mx-auto w-full max-w-[1040px] px-4 pt-5 md:px-8 md:pt-8">{children}</div>
            </main>
          </div>
          <AddFab />
          <BottomNav />
        </TxSheetProvider>
      </ToastProvider>
    </PrefsProvider>
  );
}
