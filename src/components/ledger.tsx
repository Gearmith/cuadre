import { ArrowLeftRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { accountLabel } from "@/lib/accounts";
import { categoryIcon } from "@/lib/categories";
import { formatDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Account, Entry } from "@/lib/types";
import { Money } from "./money";
import { EditEntryButton } from "./tx-sheet";

type Props = {
  entries: Entry[];
  accounts: Account[];
  locale: string;
  currency: string;
  today: string;
  headingLevel?: "h2" | "h3";
  /** En la página de una cuenta: los movimientos entre cuentas se ven como + o − para esa cuenta. */
  focusAccountId?: string;
};

/** Efecto de una fila sobre el saldo (o sobre el día, en la vista general). */
function effect(entry: Entry, focusAccountId?: string) {
  if (entry.kind === "tx") return entry.type === "income" ? entry.amount : -entry.amount;
  if (!focusAccountId) return 0;
  return entry.to_account_id === focusAccountId ? entry.amount : -entry.amount;
}

function groupByDay(entries: Entry[], focusAccountId?: string) {
  const groups = new Map<string, { net: number; items: Entry[] }>();
  for (const e of entries) {
    let g = groups.get(e.occurred_on);
    if (!g) {
      g = { net: 0, items: [] };
      groups.set(e.occurred_on, g);
    }
    g.items.push(e);
    g.net += effect(e, focusAccountId);
  }
  return [...groups.entries()];
}

/** Lista de movimientos agrupada por día, como los renglones de una libreta. */
export async function Ledger({ entries, accounts, locale, currency, today, headingLevel: Heading = "h3", focusAccountId }: Props) {
  const t = await getTranslations();
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const name = (id: string | null) => {
    const a = id ? byId.get(id) : undefined;
    return a ? accountLabel(a, byId) : "";
  };

  /** Entre una cuenta y su propio bolsillo basta el nombre corto: "Bancolombia → Arriendo". */
  const routeNames = (fromId: string, toId: string) => {
    const from = byId.get(fromId);
    const to = byId.get(toId);
    const sameFamily = from && to && (to.parent_id === from.id || from.parent_id === to.id);
    return sameFamily ? { from: from.name, to: to.name } : { from: name(fromId), to: name(toId) };
  };

  return (
    <div className="flex flex-col gap-4">
      {groupByDay(entries, focusAccountId).map(([day, { net, items }]) => (
        <section key={day} id={`day-${day}`} aria-labelledby={`h-${day}`} className="scroll-mt-20 overflow-hidden rounded-panel border border-line bg-surface">
          <header className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2.5">
            <Heading id={`h-${day}`} className="font-display text-[0.9375rem] font-semibold">
              {day === today ? t("summary.today") : formatDay(day, locale)}
            </Heading>
            <span className="text-sm">
              <span className="sr-only">{t("tx.dayNet")}: </span>
              <Money value={net} locale={locale} currency={currency} tone="signed" className="font-semibold" />
            </span>
          </header>
          <ul className="divide-y divide-line">
            {items.map((entry) => {
              if (entry.kind === "transfer") {
                const route = t("tx.transferRow", routeNames(entry.from_account_id, entry.to_account_id));
                const signed = effect(entry, focusAccountId);
                return (
                  <li key={`tr-${entry.id}`}>
                    <EditEntryButton
                      entry={entry}
                      label={t("tx.editTransferRow", {
                        amount: formatMoney(entry.amount, locale, currency),
                        from: name(entry.from_account_id),
                        to: name(entry.to_account_id),
                      })}
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed border-line text-ink-soft" aria-hidden>
                        <ArrowLeftRight size={18} strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{route}</span>
                        <span className="block truncate text-sm text-ink-soft">{entry.note || t("tx.transfers")}</span>
                      </span>
                      <Money
                        value={signed || entry.amount}
                        locale={locale}
                        currency={currency}
                        tone={signed ? "signed" : "plain"}
                        className="text-lg font-semibold text-ink-soft"
                      />
                    </EditEntryButton>
                  </li>
                );
              }
              const Icon = categoryIcon(entry.category);
              const categoryLabel = t(`categories.${entry.type}.${entry.category}`);
              const isIncome = entry.type === "income";
              const sub = [entry.note, focusAccountId ? null : name(entry.account_id)].filter(Boolean).join(" · ");
              return (
                <li key={entry.id}>
                  <EditEntryButton
                    entry={entry}
                    label={t("tx.editRow", {
                      category: categoryLabel,
                      amount: formatMoney(isIncome ? entry.amount : -entry.amount, locale, currency, true),
                    })}
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                        isIncome ? "bg-income-tint text-income" : "bg-surface-2 text-ink"
                      }`}
                      aria-hidden
                    >
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{categoryLabel}</span>
                      {sub ? <span className="block truncate text-sm text-ink-soft">{sub}</span> : null}
                    </span>
                    <Money
                      value={entry.amount}
                      locale={locale}
                      currency={currency}
                      tone={isIncome ? "income" : "expense"}
                      className="text-lg font-semibold"
                    />
                  </EditEntryButton>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
