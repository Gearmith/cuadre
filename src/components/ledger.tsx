import { getTranslations } from "next-intl/server";
import { categoryIcon } from "@/lib/categories";
import { formatDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Transaction } from "@/lib/types";
import { Money } from "./money";
import { EditTxButton } from "./tx-sheet";

type Props = { transactions: Transaction[]; locale: string; currency: string; today: string; headingLevel?: "h2" | "h3" };

function groupByDay(txs: Transaction[]) {
  const groups = new Map<string, { net: number; items: Transaction[] }>();
  for (const tx of txs) {
    let g = groups.get(tx.occurred_on);
    if (!g) {
      g = { net: 0, items: [] };
      groups.set(tx.occurred_on, g);
    }
    g.items.push(tx);
    g.net += tx.type === "income" ? tx.amount : -tx.amount;
  }
  return [...groups.entries()];
}

/** Lista de movimientos agrupada por día, como las filas de una libreta. */
export async function Ledger({ transactions, locale, currency, today, headingLevel: Heading = "h3" }: Props) {
  const t = await getTranslations();
  return (
    <div className="flex flex-col gap-4">
      {groupByDay(transactions).map(([day, { net, items }]) => (
        <section key={day} id={`day-${day}`} aria-labelledby={`h-${day}`} className="scroll-mt-20 overflow-hidden rounded-panel border border-line bg-surface">
          <header className="flex items-baseline justify-between gap-3 border-b border-line bg-surface-2/50 px-4 py-2">
            <Heading id={`h-${day}`} className="text-sm font-semibold text-ink-soft">
              {day === today ? t("summary.today") : formatDay(day, locale)}
            </Heading>
            <span className="text-sm text-ink-soft">
              <span className="sr-only">{t("tx.dayNet")}: </span>
              <Money value={net} locale={locale} currency={currency} tone="signed" />
            </span>
          </header>
          <ul className="divide-y divide-line">
            {items.map((tx) => {
              const Icon = categoryIcon(tx.category);
              const categoryLabel = t(`categories.${tx.type}.${tx.category}`);
              const isIncome = tx.type === "income";
              return (
                <li key={tx.id}>
                  <EditTxButton
                    tx={tx}
                    label={t("tx.editRow", {
                      category: categoryLabel,
                      amount: formatMoney(isIncome ? tx.amount : -tx.amount, locale, currency, true),
                    })}
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                        isIncome ? "bg-income-tint text-income" : "bg-surface-2 text-ink-soft"
                      }`}
                      aria-hidden
                    >
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{categoryLabel}</span>
                      {tx.note ? <span className="block truncate text-sm text-ink-soft">{tx.note}</span> : null}
                    </span>
                    <Money
                      value={tx.amount}
                      locale={locale}
                      currency={currency}
                      tone={isIncome ? "income" : "expense"}
                      className="text-base font-medium"
                    />
                  </EditTxButton>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
