import { HandCoins } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DebtRow } from "@/components/debt-row";
import { DebtSheetButton } from "@/components/debt-sheet";
import { Money } from "@/components/money";
import { EmptyState } from "@/components/states";
import { Link } from "@/i18n/navigation";
import { getDebts, getPrefs } from "@/lib/data";
import type { DebtDirection } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("debts");
  return { title: t("title") };
}

export default async function DebtsPage({ searchParams }: PageProps<"/[locale]/debts">) {
  const [{ view, deleted }, locale, prefs, t, debts] = await Promise.all([
    searchParams,
    getLocale(),
    getPrefs(),
    getTranslations(),
    getDebts(),
  ]);
  const direction: DebtDirection = view === "owed_to_me" ? "owed_to_me" : "i_owe";

  let totalIOwe = 0;
  let totalOwed = 0;
  for (const d of debts) {
    if (d.direction === "i_owe") totalIOwe += d.remaining;
    else totalOwed += d.remaining;
  }

  const list = debts.filter((d) => d.direction === direction);
  const open = list.filter((d) => d.remaining > 0);
  const settled = list.filter((d) => d.remaining <= 0);
  const money = { locale, currency: prefs.currency };

  const tabs: { key: DebtDirection; label: string; total: number; tone: string }[] = [
    { key: "i_owe", label: t("debts.iOwe"), total: totalIOwe, tone: "text-expense" },
    { key: "owed_to_me", label: t("debts.owedToMe"), total: totalOwed, tone: "text-income" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{t("debts.title")}</h1>
        <DebtSheetButton defaultDirection={direction} />
      </header>

      {deleted ? (
        <p role="status" className="rounded-field bg-surface-2 px-3 py-2.5 text-sm">
          {t("toast.debtDeleted")}
        </p>
      ) : null}

      <nav aria-label={t("debts.view")} className="grid grid-cols-2 gap-3">
        {tabs.map((tab) => {
          const active = tab.key === direction;
          return (
            <Link
              key={tab.key}
              href={{ pathname: "/debts", query: tab.key === "i_owe" ? {} : { view: tab.key } }}
              aria-current={active ? "page" : undefined}
              className={`rounded-panel border px-4 py-3 transition-colors duration-150 ${
                active ? "border-primary bg-surface ring-1 ring-gold" : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              <span className="block text-sm font-semibold text-ink-soft">{tab.label}</span>
              <Money value={tab.total} {...money} className={`mt-0.5 block text-xl font-medium md:text-2xl ${tab.total ? tab.tone : "text-ink-soft"}`} />
            </Link>
          );
        })}
      </nav>

      {open.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-panel border border-line bg-surface">
          {open.map((d) => (
            <li key={d.id}>
              <DebtRow debt={d} today={prefs.today} {...money} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={HandCoins} title={t(direction === "i_owe" ? "debts.emptyIOwe" : "debts.emptyOwed")}>
          <p className="max-w-sm text-sm text-ink-soft">{t("debts.emptyHint")}</p>
        </EmptyState>
      )}

      {settled.length ? (
        <details className="group rounded-panel border border-line bg-surface">
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-semibold text-ink-soft hover:text-ink">
            {t("debts.settledSection", { count: settled.length })}
          </summary>
          <ul className="divide-y divide-line border-t border-line">
            {settled.map((d) => (
              <li key={d.id}>
                <DebtRow debt={d} today={prefs.today} {...money} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
