import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatDay, monthRange } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Transaction } from "@/lib/types";

type Props = { month: string; transactions: Transaction[]; locale: string; currency: string; today: string };

/** Una barra por día del mes: verde hacia arriba si entró más, ladrillo hacia abajo si salió más. */
export async function DailyBars({ month, transactions, locale, currency, today }: Props) {
  const t = await getTranslations("summary");
  const { days } = monthRange(month);
  const net = new Array<number>(days).fill(0);
  for (const tx of transactions) {
    const d = Number(tx.occurred_on.slice(8, 10)) - 1;
    net[d] += tx.type === "income" ? tx.amount : -tx.amount;
  }
  let max = 0;
  for (const v of net) max = Math.max(max, Math.abs(v));
  const monthLabel = formatDay(`${month}-01`, locale, { month: "long" });

  return (
    <div>
      <ol aria-label={t("dailyLabel", { month: monthLabel })} className="flex h-36 items-stretch gap-[2px] sm:gap-1">
        {net.map((value, i) => {
          const day = `${month}-${String(i + 1).padStart(2, "0")}`;
          const pct = max ? Math.max((Math.abs(value) / max) * 100, value ? 4 : 0) : 0;
          const isToday = day === today;
          const isFuture = day > today;
          const label = t("dayBar", {
            day: formatDay(day, locale, { day: "numeric", month: "long" }),
            amount: formatMoney(value, locale, currency, true),
          });
          return (
            <li key={day} className="flex min-w-0 flex-1">
              <Link
                href={{ pathname: "/transactions", query: { m: month }, hash: `day-${day}` }}
                aria-label={label}
                title={label}
                className={`group relative flex flex-1 flex-col rounded-[3px] hover:bg-surface-2 ${isFuture ? "pointer-events-none" : ""}`}
                tabIndex={value ? 0 : -1}
              >
                <span className="flex flex-1 items-end">
                  {value > 0 ? <span className="w-full rounded-t-[2px] bg-income" style={{ height: `${pct}%` }} /> : null}
                </span>
                <span className={`h-px w-full ${isToday ? "bg-ink" : "bg-line"}`} />
                <span className="flex flex-1 items-start">
                  {value < 0 ? <span className="w-full rounded-b-[2px] bg-expense" style={{ height: `${pct}%` }} /> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="mt-2 flex justify-between text-xs text-ink-soft num" aria-hidden>
        <span>1</span>
        <span>{Math.ceil(days / 2)}</span>
        <span>{days}</span>
      </div>
    </div>
  );
}
