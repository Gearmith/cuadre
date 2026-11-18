import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatMonth, shiftMonth } from "@/lib/dates";

type Props = { month: string; currentMonth: string; locale: string; basePath: string; query?: Record<string, string> };

export async function MonthSwitcher({ month, currentMonth, locale, basePath, query = {} }: Props) {
  const t = await getTranslations("month");
  const prev = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const canGoNext = next <= currentMonth;
  const href = (m: string) => ({ pathname: basePath, query: { ...query, ...(m === currentMonth ? {} : { m }) } });
  const arrow =
    "flex size-11 items-center justify-center rounded-full text-ink transition-colors duration-150 hover:bg-surface-2";

  return (
    <nav aria-label={formatMonth(month, locale)} className="flex items-center gap-1">
      <Link href={href(prev)} className={arrow} aria-label={t("prev")}>
        <ChevronLeft size={22} strokeWidth={1.75} aria-hidden />
      </Link>
      <span className="min-w-36 text-center font-display text-xl font-bold" aria-current="date">
        {formatMonth(month, locale)}
      </span>
      {canGoNext ? (
        <Link href={href(next)} className={arrow} aria-label={t("next")}>
          <ChevronRight size={22} strokeWidth={1.75} aria-hidden />
        </Link>
      ) : (
        <span className={`${arrow} pointer-events-none opacity-30`} aria-hidden>
          <ChevronRight size={22} strokeWidth={1.75} />
        </span>
      )}
    </nav>
  );
}
