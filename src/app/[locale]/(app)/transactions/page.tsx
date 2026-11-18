import { ArrowLeftRight } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Ledger } from "@/components/ledger";
import { Money } from "@/components/money";
import { MonthSwitcher } from "@/components/month-switcher";
import { EmptyState } from "@/components/states";
import { AddButtons } from "@/components/tx-sheet";
import { Link } from "@/i18n/navigation";
import { formatDay, isMonthKey, monthOf } from "@/lib/dates";
import { getMonthTransactions, getPrefs } from "@/lib/data";

const FILTERS = ["all", "expense", "income"] as const;
type Filter = (typeof FILTERS)[number];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tx");
  return { title: t("title") };
}

export default async function TransactionsPage({ searchParams }: PageProps<"/[locale]/transactions">) {
  const [{ m, type }, locale, prefs, t] = await Promise.all([searchParams, getLocale(), getPrefs(), getTranslations()]);
  const currentMonth = monthOf(prefs.today);
  const month = isMonthKey(m) && m <= currentMonth ? m : currentMonth;
  const filter: Filter = FILTERS.includes(type as Filter) ? (type as Filter) : "all";

  const all = await getMonthTransactions(month);
  const shown = filter === "all" ? all : all.filter((tx) => tx.type === filter);

  let totalIn = 0;
  let totalOut = 0;
  for (const tx of all) {
    if (tx.type === "income") totalIn += tx.amount;
    else totalOut += tx.amount;
  }

  const money = { locale, currency: prefs.currency };
  const monthName = formatDay(`${month}-01`, locale, { month: "long" }).toLowerCase();
  const filterLabels: Record<Filter, string> = { all: t("tx.all"), expense: t("tx.expenses"), income: t("tx.incomes") };
  const query = (f: Filter) => ({ ...(month === currentMonth ? {} : { m: month }), ...(f === "all" ? {} : { type: f }) });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-medium md:text-[1.75rem]">{t("tx.title")}</h1>
        <AddButtons className="hidden md:flex" />
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <MonthSwitcher
          month={month}
          currentMonth={currentMonth}
          locale={locale}
          basePath="/transactions"
          query={filter === "all" ? {} : { type: filter }}
        />
        <nav aria-label={t("tx.filter")} className="grid grid-cols-3 gap-1 rounded-field bg-surface-2 p-1 sm:w-80">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={{ pathname: "/transactions", query: query(f) }}
              aria-current={filter === f ? "page" : undefined}
              className={`flex min-h-10 items-center justify-center rounded-[5px] text-sm font-semibold transition-colors duration-150 ${
                filter === f ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
              }`}
            >
              {filterLabels[f]}
            </Link>
          ))}
        </nav>
      </div>

      {all.length ? (
        <dl className="grid grid-cols-3 gap-3 rounded-panel border border-line bg-surface px-4 py-3 text-sm">
          <div>
            <dt className="text-ink-soft">{t("summary.in")}</dt>
            <dd className="mt-0.5 text-base font-medium"><Money value={totalIn} {...money} tone="income" /></dd>
          </div>
          <div>
            <dt className="text-ink-soft">{t("summary.out")}</dt>
            <dd className="mt-0.5 text-base font-medium"><Money value={totalOut} {...money} tone="expense" /></dd>
          </div>
          <div className="text-right">
            <dt className="text-ink-soft">{t("summary.month")}</dt>
            <dd className="mt-0.5 text-base font-medium"><Money value={totalIn - totalOut} {...money} tone="signed" /></dd>
          </div>
        </dl>
      ) : null}

      {shown.length ? (
        <Ledger transactions={shown} today={prefs.today} headingLevel="h2" {...money} />
      ) : (
        <EmptyState
          icon={ArrowLeftRight}
          title={
            filter === "all"
              ? t("tx.empty", { month: monthName })
              : t("tx.emptyFilter", { kind: filterLabels[filter].toLowerCase(), month: monthName })
          }
        >
          <p className="text-sm text-ink-soft">{t("tx.emptyHint")}</p>
        </EmptyState>
      )}
    </div>
  );
}
