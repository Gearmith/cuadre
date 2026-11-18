import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatShortDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Debt } from "@/lib/types";
import { Money } from "./money";

export async function DebtRow({ debt, locale, currency, today }: { debt: Debt; locale: string; currency: string; today: string }) {
  const t = await getTranslations("debts");
  const pct = Math.min(100, Math.round((debt.paid / debt.amount) * 100));
  const settled = debt.remaining <= 0;
  const overdue = !settled && debt.due_on !== null && debt.due_on < today;
  const tone = debt.direction === "i_owe" ? "bg-expense" : "bg-income";

  return (
    <Link href={`/debts/${debt.id}`} className="flex items-center gap-3 px-4 py-4 transition-colors duration-150 hover:bg-surface-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate font-semibold">{debt.person}</span>
          {settled ? (
            <span className="shrink-0 text-sm font-semibold text-ink-soft">{t("settled")}</span>
          ) : (
            <span className="shrink-0 text-right">
              <span className="sr-only">{t("remaining")}: </span>
              <Money value={debt.remaining} locale={locale} currency={currency} className="text-base font-medium" />
            </span>
          )}
        </div>
        {debt.description ? <p className="truncate text-sm text-ink-soft">{debt.description}</p> : null}
        <div
          className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("progress", { percent: pct })}
        >
          <div className={`h-full rounded-full ${settled ? "bg-ink-soft" : tone}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-sm text-ink-soft">
          <span>
            {t("paidOf", {
              paid: formatMoney(debt.paid, locale, currency),
              total: formatMoney(debt.amount, locale, currency),
            })}
          </span>
          {debt.due_on && !settled ? (
            <span className={overdue ? "font-semibold text-warn" : ""}>
              {t(overdue ? "overdue" : "dueOn", { date: formatShortDate(debt.due_on, locale) })}
            </span>
          ) : null}
        </div>
      </div>
      <ChevronRight size={20} strokeWidth={1.75} className="shrink-0 text-ink-soft" aria-hidden />
    </Link>
  );
}
