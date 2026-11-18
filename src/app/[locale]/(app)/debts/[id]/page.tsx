import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ConfirmDelete } from "@/components/confirm-delete";
import { DebtSheetButton, PaymentSheetButton } from "@/components/debt-sheet";
import { Money } from "@/components/money";
import { buttonStyles } from "@/components/styles";
import { Link } from "@/i18n/navigation";
import { deleteDebt, deletePayment } from "@/lib/actions/debts";
import { isUuid } from "@/lib/actions/helpers";
import { formatShortDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { getDebt, getPrefs } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("debts");
  return { title: t("title") };
}

export default async function DebtPage({ params }: PageProps<"/[locale]/debts/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [locale, prefs, t, result] = await Promise.all([getLocale(), getPrefs(), getTranslations(), getDebt(id)]);
  if (!result) notFound();

  const { debt, payments } = result;
  const money = { locale, currency: prefs.currency };
  const pct = Math.min(100, Math.round((debt.paid / debt.amount) * 100));
  const settled = debt.remaining <= 0;
  const overdue = !settled && debt.due_on !== null && debt.due_on < prefs.today;
  const iOwe = debt.direction === "i_owe";

  return (
    <div className="flex flex-col gap-6">
      <Link href={iOwe ? "/debts" : { pathname: "/debts", query: { view: "owed_to_me" } }} className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-field px-2 font-semibold text-gold hover:bg-surface-2">
        <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
        {t("debts.back")}
      </Link>

      <section className="rounded-panel border border-line bg-surface p-5 md:p-7">
        <p className="text-sm font-semibold text-ink-soft">{t(iOwe ? "debts.iOwe" : "debts.owedToMe")}</p>
        <h1 className="mt-0.5 font-display text-3xl font-bold break-words">{debt.person}</h1>
        {debt.description ? <p className="mt-1 text-ink-soft">{debt.description}</p> : null}

        <div className="mt-6">
          <p className="text-sm font-semibold text-ink-soft">{settled ? t("debts.settled") : t("debts.remaining")}</p>
          <p className="mt-0.5 text-[2.5rem] leading-[1.1] font-semibold">
            <Money value={debt.remaining} {...money} className={settled ? "text-ink-soft" : iOwe ? "text-expense" : "text-income"} />
          </p>
        </div>

        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("debts.progress", { percent: pct })}
        >
          <div className={`h-full rounded-full ${settled ? "bg-ink-soft" : iOwe ? "bg-expense" : "bg-income"}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-ink-soft">
          <span>{t("debts.paidOf", { paid: formatMoney(debt.paid, locale, prefs.currency), total: formatMoney(debt.amount, locale, prefs.currency) })}</span>
          {debt.due_on && !settled ? (
            <span className={overdue ? "font-semibold text-warn" : ""}>
              {t(overdue ? "debts.overdue" : "debts.dueOn", { date: formatShortDate(debt.due_on, locale) })}
            </span>
          ) : (
            <span>{t("debts.created", { date: formatShortDate(debt.created_at.slice(0, 10), locale) })}</span>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {!settled ? <PaymentSheetButton debtId={debt.id} suggested={debt.remaining} /> : null}
          <DebtSheetButton debt={debt} />
        </div>
      </section>

      <section aria-labelledby="payments">
        <h2 id="payments" className="mb-3 font-display text-xl font-bold">
          {t("debts.payments")}
        </h2>
        {payments.length ? (
          <ul className="divide-y divide-line rounded-panel border border-line bg-surface">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-col gap-1 px-4 pt-3 pb-1">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{formatShortDate(p.paid_on, locale)}</p>
                    {p.note ? <p className="truncate text-sm text-ink-soft">{p.note}</p> : null}
                  </div>
                  <Money value={p.amount} {...money} className="text-base font-medium" />
                </div>
                <ConfirmDelete
                  action={deletePayment}
                  fields={{ id: p.id }}
                  label={t("debts.deletePayment", { amount: formatMoney(p.amount, locale, prefs.currency) })}
                  question={t("debts.confirmDeletePayment")}
                  triggerClassName="-mx-2 inline-flex min-h-11 w-fit cursor-pointer items-center rounded-field px-2 text-sm font-semibold text-ink-soft hover:text-danger"
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-panel border border-dashed border-line px-4 py-8 text-center text-ink-soft">{t("debts.noPayments")}</p>
        )}
      </section>

      <section className="max-w-sm border-t border-line pt-4">
        <ConfirmDelete
          action={deleteDebt}
          fields={{ id: debt.id, locale }}
          label={t("debts.delete")}
          question={t("debts.confirmDelete")}
          triggerClassName={`${buttonStyles.dangerQuiet} -ml-4`}
        />
      </section>
    </div>
  );
}
