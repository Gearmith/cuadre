import { ArrowLeftRight } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountNote } from "@/components/account-note";
import { AccountSheetButton, StarterAccounts } from "@/components/account-sheet";
import { Banknote, NoteLabel } from "@/components/banknote";
import { DailyBars } from "@/components/daily-bars";
import { Ledger } from "@/components/ledger";
import { Money } from "@/components/money";
import { MonthSwitcher } from "@/components/month-switcher";
import { EmptyState } from "@/components/states";
import { AddButtons } from "@/components/tx-sheet";
import { Link } from "@/i18n/navigation";
import { groupAccounts } from "@/lib/accounts";
import { formatDay, isMonthKey, monthOf } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getAccounts, getDebts, getMonthEntries, getPrefs, getTotals } from "@/lib/data";
import type { Transaction } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("summary");
  return { title: t("title") };
}

export default async function SummaryPage({ searchParams }: PageProps<"/[locale]">) {
  const [{ m, password }, locale, prefs, t] = await Promise.all([searchParams, getLocale(), getPrefs(), getTranslations()]);
  const currentMonth = monthOf(prefs.today);
  const month = isMonthKey(m) && m <= currentMonth ? m : currentMonth;
  const isCurrentMonth = month === currentMonth;

  const [totals, entries, debts, accounts] = await Promise.all([getTotals(), getMonthEntries(month), getDebts(), getAccounts()]);

  const txs: Transaction[] = [];
  let monthIn = 0;
  let monthOut = 0;
  let todayNet = 0;
  for (const e of entries) {
    if (e.kind !== "tx") continue;
    txs.push(e);
    if (e.type === "income") monthIn += e.amount;
    else monthOut += e.amount;
    if (e.occurred_on === prefs.today) todayNet += e.type === "income" ? e.amount : -e.amount;
  }

  let iOwe = 0;
  let owedToMe = 0;
  for (const d of debts) {
    if (d.direction === "i_owe") iOwe += d.remaining;
    else owedToMe += d.remaining;
  }

  const groups = groupAccounts(accounts.filter((a) => !a.archived));
  const money = { locale, currency: prefs.currency };
  const fmt = (v: number, signed = false) => formatMoney(v, locale, prefs.currency, signed);
  const monthName = formatDay(`${month}-01`, locale, { month: "long" }).toLowerCase();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{t("summary.title")}</h1>
        <AddButtons className="hidden md:flex" />
      </header>

      {password === "updated" ? (
        <p role="status" className="rounded-field bg-income-tint px-3 py-2.5 text-sm text-income">
          {t("summary.passwordUpdated")}
        </p>
      ) : null}

      <section aria-labelledby="total">
        <Banknote color="green">
          <div className="px-5 pt-6 pb-5 md:px-8 md:pt-8">
            <h2 id="total">
              <NoteLabel>{t("summary.total")}</NoteLabel>
            </h2>
            <p className="num mt-2 text-[3rem] leading-[0.95] font-extrabold md:text-[4.5rem]">{fmt(totals.balance)}</p>
            <p className="mt-3 max-w-md text-sm opacity-80">{t("summary.totalHint")}</p>
          </div>
          <dl className="grid grid-cols-2 gap-px border-t border-note-accent/30 bg-note-accent/30 sm:grid-cols-4">
            {[
              { label: t("summary.today"), value: isCurrentMonth ? fmt(todayNet, true) : "—", accent: false },
              { label: t("summary.month"), value: fmt(monthIn - monthOut, true), accent: false },
              { label: t("summary.in"), value: fmt(monthIn), accent: true },
              { label: t("summary.out"), value: fmt(monthOut), accent: false },
            ].map((cell) => (
              <div key={cell.label} className="bg-note-bg px-5 py-4 md:px-8">
                <dt className="text-sm opacity-80">{cell.label}</dt>
                <dd className={`num mt-0.5 text-xl font-bold ${cell.accent ? "text-note-accent" : ""}`}>{cell.value}</dd>
              </div>
            ))}
          </dl>
        </Banknote>
      </section>

      <section aria-labelledby="accounts">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 id="accounts" className="font-display text-xl font-bold">
            {t("summary.accounts")}
          </h2>
          {groups.length ? (
            <Link href="/accounts" className="rounded-field px-2 py-2 font-semibold text-gold hover:underline">
              {t("summary.manageAccounts")}
            </Link>
          ) : null}
        </div>
        {groups.length ? (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {groups.map(({ account, pockets, total }) => (
              <li key={account.id}>
                <AccountNote account={account} total={total} pocketCount={pockets.length} {...money} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-panel border-2 border-dashed border-line bg-surface p-5">
            <p className="font-display text-lg font-bold">{t("accounts.emptyTitle")}</p>
            <p className="mt-1 mb-4 text-ink-soft">{t("accounts.emptyBody")}</p>
            <StarterAccounts />
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4 text-sm text-ink-soft">
              {t("accounts.orCustom")}
              <AccountSheetButton variant="new" />
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="daily">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="daily" className="font-display text-xl font-bold">
            {t("summary.daily")}
          </h2>
          <MonthSwitcher month={month} currentMonth={currentMonth} locale={locale} basePath="/" />
        </div>
        <div className="rounded-panel border border-line bg-surface px-4 pt-4 pb-3">
          <DailyBars month={month} transactions={txs} today={prefs.today} {...money} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <section aria-labelledby="recent">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="recent" className="font-display text-xl font-bold">
              {t("summary.recent")}
            </h2>
            {entries.length ? (
              <Link href={{ pathname: "/transactions", query: isCurrentMonth ? {} : { m: month } }} className="rounded-field px-2 py-2 font-semibold text-gold hover:underline">
                {t("summary.seeAll")}
              </Link>
            ) : null}
          </div>
          {entries.length ? (
            <Ledger entries={entries.slice(0, 8)} accounts={accounts} today={prefs.today} {...money} />
          ) : (
            <EmptyState icon={ArrowLeftRight} title={t("tx.empty", { month: monthName })}>
              <p className="text-sm text-ink-soft">{t("tx.emptyHint")}</p>
            </EmptyState>
          )}
        </section>

        <section aria-labelledby="debts-summary">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="debts-summary" className="font-display text-xl font-bold">
              {t("summary.debts")}
            </h2>
            <Link href="/debts" className="rounded-field px-2 py-2 font-semibold text-gold hover:underline">
              {t("summary.seeDebts")}
            </Link>
          </div>
          <dl className="divide-y divide-line rounded-panel border border-line bg-surface">
            <div className="flex items-baseline justify-between gap-3 px-4 py-4">
              <dt className="font-semibold">{t("debts.iOwe")}</dt>
              <dd className="text-xl font-bold">
                <Money value={iOwe} {...money} className={iOwe ? "text-expense" : "text-ink-soft"} />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 px-4 py-4">
              <dt className="font-semibold">{t("debts.owedToMe")}</dt>
              <dd className="text-xl font-bold">
                <Money value={owedToMe} {...money} className={owedToMe ? "text-income" : "text-ink-soft"} />
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
