import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Banknote, NoteLabel } from "./banknote";
import { BrandMark } from "./brand";

/** Marco de las pantallas de entrada: un billete con la marca arriba y el formulario debajo. */
export async function AuthShell({ title, lead, children, footer, path }: { title: string; lead: string; children: ReactNode; footer?: ReactNode; path: string }) {
  const [t, tAuth, locale] = await Promise.all([getTranslations("meta"), getTranslations("auth"), getLocale()]);
  const other = routing.locales.find((l) => l !== locale) ?? "en";
  return (
    <main className="flex min-h-dvh flex-col px-4 py-6">
      <div className="mx-auto flex w-full max-w-[28rem] justify-end">
        <Link href={path} locale={other} lang={other} className="rounded-field px-2 py-2 text-sm font-semibold text-ink-soft hover:text-ink">
          {other === "en" ? "English" : "Español"}
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center py-6">
        <div className="w-full max-w-[28rem]">
          <Banknote color="green" className="relative z-10">
            <div className="flex flex-col gap-6 px-6 pt-6 pb-7 sm:px-8">
              <span translate="no" className="flex items-center gap-2.5">
                <BrandMark size={34} />
                <NoteLabel>{t("appName")}</NoteLabel>
              </span>
              <p className="font-display max-w-[16ch] text-[2rem] leading-[1.05] font-extrabold">{tAuth("tagline")}</p>
            </div>
          </Banknote>
          <div className="-mt-4 rounded-b-panel border border-t-0 border-line bg-surface px-6 pt-9 pb-6 sm:px-8">
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            <p className="mt-1 mb-6 text-ink-soft">{lead}</p>
            {children}
          </div>
          {footer ? <div className="mt-5 text-center text-sm text-ink-soft">{footer}</div> : null}
        </div>
      </div>
    </main>
  );
}
