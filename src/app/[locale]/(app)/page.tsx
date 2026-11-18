import { ArrowLeftRight } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DailyBars } from "@/components/daily-bars";
import { Ledger } from "@/components/ledger";
import { Money } from "@/components/money";
import { MonthSwitcher } from "@/components/month-switcher";
import { EmptyState } from "@/components/states";
import { AddButtons } from "@/components/tx-sheet";
import { Link } from "@/i18n/navigation";
import { isMonthKey, monthOf } from "@/lib/dates";
import { getDebts, getMonthTransactions, getPrefs, getTotals } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("summary");
  return { title: t("title") };
}

export default async function SummaryPage({ searchParams }: PageProps<"/[locale]">) {
  const [{ m, password }, locale, prefs, t] = await Promise.all([
    searchParams,
    getLocale(),
    getPrefs(),
    getTranslations(),
  ]);
  const currentMonth = monthOf(prefs.today);
  const month = isMonthKey(m) && m <= currentMonth ? m : currentMonth;
  const isCurrentMonth = month === currentMonth;

  const [totals, transactions, debts] = await Promise.all([getTotals(), getMonthTransactions(month), getDebts()]);

  let monthIn = 0;
  let monthOut = 0;
  let todayNet = 0;
  for (const tx of transactions) {
    if (tx.type === "income") monthIn += tx.amount;
    else monthOut += tx.amount;
    if (tx.occurred_on === prefs.today) todayNet += tx.type === "income" ? tx.amount : -tx.amount;
  }

  let iOwe = 0;
  let owedToMe = 0;
  for (const d of debts) {
    if (d.direction === "i_owe") iOwe += d.remaining;
    else owedToMe += d.remaining;
  }

  const money = { locale, currency: prefs.currency };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-medium md:text-[1.75rem]">{t("summary.title")}</h1>
        <AddButtons className="hidden md:flex" />
      </header>

      {password === "updated" ? (
        <p role="status" className="rounded-field bg-income-tint px-3 py-2.5 text-sm text-income">
          {t("summary.passwordUpdated")}
        </p>
      ) : null}

      <section aria-labelledby="overall" className="rounded-panel border border-line bg-surface">
        <div className="px-5 pt-5 pb-6 md:px-7 md:pt-7">
          <h2 id="overall" className="text-base font-semibold text-ink-soft">
            {t("summary.overall")}
          </h2>
          <p className="mt-1 text-[2.5rem] leading-[1.1] font-semibold md:text-[3.25rem]">
            <Money value={totals.balance} {...money} className={totals.balance < 0 ? "text-expense" : ""} />
          </p>
          <p className="mt-2 text-sm text-ink-soft">{t("summary.overallHint")}</p>
        </div>

        <div className="grid border-t border-line sm:grid-cols-[1fr_2fr]">
          <div className="border-b border-line px-5 py-4 sm:border-r sm:border-b-0 md:px-7">
            <h3 className="text-sm font-semibold text-ink-soft">{t("summary.today")}</h3>
            <p className="mt-1 text-2xl font-medium">
              {isCurrentMonth ? <Money value={todayNet} {...money} tone="signed" /> : <span className="num text-ink-soft">—</span>}
            </p>
          </div>
          <div className="px-5 py-4 md:px-7">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink-soft">{t("summary.month")}</h3>
              <Money value={monthIn - monthOut} {...money} tone="signed" className="text-2xl font-medium" />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-ink-soft">{t("summary.in")}</dt>
                <dd className="mt-0.5 text-base font-medium">
                  <Money value={monthIn} {...money} tone="income" />
                </dd>
              </div>
              <div>
                <dt className="text-ink-soft">{t("summary.out")}</dt>
                <dd className="mt-0.5 text-base font-medium">
                  <Money value={monthOut} {...money} tone="expense" />
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section aria-labelledby="daily">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="daily" className="font-display text-lg font-medium">
            {t("summary.daily")}
          </h2>
          <MonthSwitcher month={month} currentMonth={currentMonth} locale={locale} basePath="/" />
        </div>
        <div className="rounded-panel border border-line bg-surface px-4 pt-4 pb-3">
          <DailyBars month={month} transactions={transactions} today={prefs.today} {...money} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="recent">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="recent" className="font-display text-lg font-medium">
              {t("summary.recent")}
            </h2>
            {transactions.length ? (
              <Link href={{ pathname: "/transactions", query: isCurrentMonth ? {} : { m: month } }} className="rounded-field px-2 py-2 font-semibold text-navy hover:underline">
                {t("summary.seeAll")}
              </Link>
            ) : null}
          </div>
          {transactions.length ? (
            <Ledger transactions={transactions.slice(0, 8)} today={prefs.today} {...money} />
          ) : (
            <EmptyState icon={ArrowLeftRight} title={t("tx.empty", { month: monthLabel(month, locale) })}>
              <p className="text-sm text-ink-soft">{t("tx.emptyHint")}</p>
            </EmptyState>
          )}
        </section>

        <section aria-labelledby="debts-summary">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="debts-summary" className="font-display text-lg font-medium">
              {t("summary.debts")}
            </h2>
            <Link href="/debts" className="rounded-field px-2 py-2 font-semibold text-navy hover:underline">
              {t("summary.seeDebts")}
            </Link>
          </div>
          <dl className="divide-y divide-line rounded-panel border border-line bg-surface">
            <div className="flex items-baseline justify-between gap-3 px-4 py-4">
              <dt className="font-semibold">{t("debts.iOwe")}</dt>
              <dd className="text-lg font-medium">
                <Money value={iOwe} {...money} className={iOwe ? "text-expense" : "text-ink-soft"} />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 px-4 py-4">
              <dt className="font-semibold">{t("debts.owedToMe")}</dt>
              <dd className="text-lg font-medium">
                <Money value={owedToMe} {...money} className={owedToMe ? "text-income" : "text-ink-soft"} />
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function monthLabel(month: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-CO" : "en-US", { month: "long", timeZone: "UTC" }).format(
    new Date(`${month}-01T12:00:00Z`),
  );
}
