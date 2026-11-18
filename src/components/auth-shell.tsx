import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { BrandMark } from "./brand";

/** Marco común de las pantallas de entrada: marca arriba, panel con el formulario, pie con enlace. */
export async function AuthShell({ title, lead, children, footer, path }: { title: string; lead: string; children: ReactNode; footer?: ReactNode; path: string }) {
  const [t, locale] = await Promise.all([getTranslations("meta"), getLocale()]);
  const other = routing.locales.find((l) => l !== locale) ?? "en";
  return (
    <main className="flex min-h-dvh flex-col px-4 py-6">
      <div className="mx-auto flex w-full max-w-[26rem] items-center justify-between">
        <span translate="no" className="flex items-center gap-2.5 font-display text-xl font-semibold">
          <BrandMark />
          {t("appName")}
        </span>
        <Link href={path} locale={other} lang={other} className="rounded-field px-2 py-2 text-sm font-semibold text-ink-soft hover:text-ink">
          {other === "en" ? "English" : "Español"}
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-[26rem]">
          <div className="rounded-panel border border-line bg-surface p-6 sm:p-8">
            <h1 className="font-display text-2xl font-medium">{title}</h1>
            <p className="mt-1 mb-6 text-ink-soft">{lead}</p>
            {children}
          </div>
          {footer ? <div className="mt-5 text-center text-sm text-ink-soft">{footer}</div> : null}
        </div>
      </div>
    </main>
  );
}
