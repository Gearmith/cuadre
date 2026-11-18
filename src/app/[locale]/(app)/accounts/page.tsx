import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AccountNote } from "@/components/account-note";
import { AccountSheetButton, StarterAccounts } from "@/components/account-sheet";
import { Link } from "@/i18n/navigation";
import { groupAccounts } from "@/lib/accounts";
import { formatMoney } from "@/lib/money";
import { getAccounts, getPrefs } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accounts");
  return { title: t("title") };
}

export default async function AccountsPage({ searchParams }: PageProps<"/[locale]/accounts">) {
  const [{ deleted }, locale, prefs, t, accounts] = await Promise.all([searchParams, getLocale(), getPrefs(), getTranslations(), getAccounts()]);
  const active = groupAccounts(accounts.filter((a) => !a.archived));
  const archived = accounts.filter((a) => a.archived && !a.parent_id);
  const money = { locale, currency: prefs.currency };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{t("accounts.title")}</h1>
        {active.length ? <AccountSheetButton variant="new" /> : null}
      </header>

      {deleted ? (
        <p role="status" className="rounded-field bg-surface-2 px-3 py-2.5 text-sm">
          {t("toast.accountDeleted")}
        </p>
      ) : null}

      {active.length ? (
        <ul className="grid gap-5 md:grid-cols-2">
          {active.map(({ account, pockets, total }) => (
            <li key={account.id} className="flex flex-col gap-2">
              <AccountNote account={account} total={total} pocketCount={pockets.length} {...money} />
              {pockets.length ? (
                <ul className="divide-y divide-line rounded-panel border border-line bg-surface">
                  {pockets.map((p) => (
                    <li key={p.id}>
                      <Link href={`/accounts/${p.id}`} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-surface-2">
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className={`note-${p.color} size-3 shrink-0 rounded-full bg-note-bg ring-2 ring-note-accent/60`} aria-hidden />
                          <span className="truncate font-semibold">{p.name}</span>
                        </span>
                        <span className="num text-lg font-bold">{formatMoney(p.balance, locale, prefs.currency)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
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

      {archived.length ? (
        <details className="rounded-panel border border-line bg-surface">
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-semibold text-ink-soft hover:text-ink">
            {t("accounts.archivedSection", { count: archived.length })}
          </summary>
          <ul className="divide-y divide-line border-t border-line">
            {archived.map((a) => (
              <li key={a.id}>
                <Link href={`/accounts/${a.id}`} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface-2">
                  <span className="truncate font-semibold">{a.name}</span>
                  <span className="num text-lg font-bold text-ink-soft">{formatMoney(a.balance, locale, prefs.currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
