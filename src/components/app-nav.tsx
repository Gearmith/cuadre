"use client";

import { ArrowLeftRight, HandCoins, LayoutGrid, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { BrandMark } from "./brand";

const ITEMS = [
  { href: "/", key: "summary", icon: LayoutGrid },
  { href: "/transactions", key: "transactions", icon: ArrowLeftRight },
  { href: "/debts", key: "debts", icon: HandCoins },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
}

export function SideNav() {
  const t = useTranslations();
  const isActive = useIsActive();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 md:flex">
      <Link href="/" translate="no" className="mb-8 flex items-center gap-2.5 px-3 font-display text-xl font-semibold">
        <BrandMark />
        {t("meta.appName")}
      </Link>
      <nav aria-label={t("nav.main")}>
        <ul className="flex flex-col gap-1">
          {ITEMS.map(({ href, key, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-field px-3 font-semibold transition-colors duration-150 ${
                    active ? "bg-surface-2 text-navy" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  <Icon size={20} strokeWidth={1.75} aria-hidden />
                  {t(`nav.${key}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export function BottomNav() {
  const t = useTranslations("nav");
  const isActive = useIsActive();
  return (
    <nav aria-label={t("main")} className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-safe md:hidden">
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ href, key, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  active ? "text-navy" : "text-ink-soft"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
