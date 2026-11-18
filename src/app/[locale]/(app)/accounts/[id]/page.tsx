import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AccountNote } from "@/components/account-note";
import { AccountSheetButton } from "@/components/account-sheet";
import { Banknote, NoteLabel } from "@/components/banknote";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Ledger } from "@/components/ledger";
import { MonthSwitcher } from "@/components/month-switcher";
import { EmptyState } from "@/components/states";
import { buttonStyles } from "@/components/styles";
import { QuickActions } from "@/components/tx-sheet";
import { Link } from "@/i18n/navigation";
import { archiveAccount, deleteAccount } from "@/lib/actions/accounts";
import { isUuid } from "@/lib/actions/helpers";
import { KIND_ICONS } from "@/lib/accounts";
import { formatDay, isMonthKey, monthOf } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getAccounts, getMonthEntries, getPrefs } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/[locale]/accounts/[id]">): Promise<Metadata> {
  const { id } = await params;
  const accounts = isUuid(id) ? await getAccounts() : [];
  return { title: accounts.find((a) => a.id === id)?.name ?? "" };
}

export default async function AccountPage({ params, searchParams }: PageProps<"/[locale]/accounts/[id]">) {
  const [{ id }, { m }] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const [locale, prefs, t, accounts] = await Promise.all([getLocale(), getPrefs(), getTranslations(), getAccounts()]);
  const account = accounts.find((a) => a.id === id);
  if (!account) notFound();

  const currentMonth = monthOf(prefs.today);
  const month = isMonthKey(m) && m <= currentMonth ? m : currentMonth;
  const entries = await getMonthEntries(month, id);

  const parent = account.parent_id ? accounts.find((a) => a.id === account.parent_id) : undefined;
  const pockets = accounts.filter((a) => a.parent_id === id && !a.archived);
  const inPockets = pockets.reduce((s, p) => s + p.balance, 0);
  const total = account.balance + inPockets;
  const money = { locale, currency: prefs.currency };
  const fmt = (v: number) => formatMoney(v, locale, prefs.currency);
  const Icon = KIND_ICONS[account.kind];
  const monthName = formatDay(`${month}-01`, locale, { month: "long" }).toLowerCase();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={parent ? `/accounts/${parent.id}` : "/accounts"}
        className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-field px-2 font-semibold text-gold hover:bg-surface-2"
      >
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
        {parent ? parent.name : t("accounts.back")}
      </Link>

      <Banknote color={account.color}>
        <div className="px-5 pt-6 pb-5 md:px-8 md:pt-8">
          <div className="flex items-start justify-between gap-3">
            <h1>
              <NoteLabel>{account.name}</NoteLabel>
            </h1>
            <span className="flex items-center gap-1.5 text-sm opacity-85">
              <Icon size={16} strokeWidth={1.75} className="text-note-accent" aria-hidden />
              {t(`accounts.kinds.${account.kind}`)}
            </span>
          </div>
          <p className="num mt-2 text-[3rem] leading-[0.95] font-extrabold md:text-[4.5rem]">{fmt(total)}</p>
          {account.archived ? <p className="mt-2 text-sm opacity-85">{t("accounts.archivedNote")}</p> : null}
        </div>
        {pockets.length ? (
          <dl className="grid grid-cols-2 gap-px border-t border-note-accent/30 bg-note-accent/30">
            <div className="bg-note-bg px-5 py-4 md:px-8">
              <dt className="text-sm opacity-80">{t("accounts.available")}</dt>
              <dd className="num mt-0.5 text-xl font-bold">{fmt(account.balance)}</dd>
            </div>
            <div className="bg-note-bg px-5 py-4 md:px-8">
              <dt className="text-sm opacity-80">{t("accounts.inPockets")}</dt>
              <dd className="num mt-0.5 text-xl font-bold text-note-accent">{fmt(inPockets)}</dd>
            </div>
          </dl>
        ) : null}
      </Banknote>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {!account.archived ? <QuickActions accountId={account.id} /> : null}
        <AccountSheetButton variant="edit" account={account} className="sm:ml-auto" />
      </div>

      {account.kind !== "pocket" && account.kind !== "credit" && !account.archived ? (
        <section aria-labelledby="pockets">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="pockets" className="font-display text-xl font-bold">
              {t("accounts.pocketsOf")}
            </h2>
            <AccountSheetButton variant="pocket" parentId={account.id} parentColor={account.color} />
          </div>
          {pockets.length ? (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {pockets.map((p) => (
                <li key={p.id}>
                  <AccountNote account={p} total={p.balance} pocketCount={0} {...money} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-panel border border-dashed border-line px-4 py-6 text-center text-ink-soft">{t("accounts.noPockets")}</p>
          )}
        </section>
      ) : null}

      <section aria-labelledby="movements">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="movements" className="font-display text-xl font-bold">
            {t("accounts.movements", { month: locale === "es" ? monthName : formatDay(`${month}-01`, locale, { month: "long" }) })}
          </h2>
          <MonthSwitcher month={month} currentMonth={currentMonth} locale={locale} basePath={`/accounts/${id}`} />
        </div>
        {entries.length ? (
          <Ledger entries={entries} accounts={accounts} today={prefs.today} focusAccountId={id} {...money} />
        ) : (
          <EmptyState icon={ArrowLeftRight} title={t("accounts.noMovements", { month: monthName })} />
        )}
      </section>

      <section className="flex max-w-md flex-col gap-2 border-t border-line pt-4">
        <ConfirmDelete
          action={archiveAccount}
          fields={{ id: account.id, archived: account.archived ? "false" : "true" }}
          label={t(account.archived ? "accounts.restore" : "accounts.archive")}
          question={t("accounts.confirmArchive")}
          confirmLabel={t(account.archived ? "accounts.restore" : "accounts.archive")}
          triggerClassName={`${buttonStyles.quiet} -ml-4 w-fit`}
        />
        <ConfirmDelete
          action={deleteAccount}
          fields={{ id: account.id, locale }}
          label={t("accounts.delete")}
          question={t("accounts.confirmDelete")}
          triggerClassName={`${buttonStyles.dangerQuiet} -ml-4 w-fit`}
        />
      </section>
    </div>
  );
}
