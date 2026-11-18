import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { KIND_ICONS } from "@/lib/accounts";
import { formatMoney } from "@/lib/money";
import type { Account } from "@/lib/types";
import { Banknote, NoteLabel } from "./banknote";

/** Billete de una cuenta (con sus bolsillos sumados). Enlaza a su detalle. */
export async function AccountNote({
  account,
  total,
  pocketCount,
  locale,
  currency,
}: {
  account: Account;
  total: number;
  pocketCount: number;
  locale: string;
  currency: string;
}) {
  const t = await getTranslations("accounts");
  const Icon = KIND_ICONS[account.kind];
  const negative = total < 0;
  return (
    <Link
      href={`/accounts/${account.id}`}
      className="group block rounded-note transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-offset-4"
    >
      <Banknote color={account.color} className="h-full">
        <div className="flex min-h-36 flex-col justify-between gap-4 p-4 sm:p-5">
          <div className="pr-10">
            <NoteLabel>{account.name}</NoteLabel>
          </div>
          <div>
            <p className={`num text-[1.75rem] leading-none font-bold sm:text-[2rem] ${negative ? "text-note-accent" : ""}`}>
              {formatMoney(total, locale, currency)}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm opacity-85">
              <Icon size={15} strokeWidth={1.75} className="shrink-0 text-note-accent" aria-hidden />
              {t(`kinds.${account.kind}`)}
              {account.kind !== "pocket" && pocketCount ? ` · ${t("pockets", { count: pocketCount })}` : ""}
            </p>
          </div>
        </div>
      </Banknote>
    </Link>
  );
}
