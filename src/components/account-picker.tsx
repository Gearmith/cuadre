"use client";

import { KIND_ICONS } from "@/lib/accounts";
import type { AccountLite } from "./prefs";

/** Nombre corto con su cuenta madre: "Nu › Viaje". */
export function liteLabel(a: AccountLite, all: AccountLite[]) {
  const parent = a.parent_id ? all.find((p) => p.id === a.parent_id) : undefined;
  return parent ? `${parent.name} › ${a.name}` : a.name;
}

/** Lista ordenada: cada cuenta seguida de sus bolsillos. Oculta las archivadas salvo `keepId`. */
export function orderedAccounts(all: AccountLite[], keepId?: string | null) {
  const visible = all.filter((a) => !a.archived || a.id === keepId);
  const roots = visible.filter((a) => !a.parent_id);
  return roots.flatMap((r) => [r, ...visible.filter((a) => a.parent_id === r.id)]);
}

/** Chips de cuentas con el color de su billete. */
export function AccountPicker({
  name,
  legend,
  value,
  onChange,
  accounts,
  error,
  disabledId,
}: {
  name: string;
  legend: string;
  value: string;
  onChange: (id: string) => void;
  accounts: AccountLite[];
  error?: string;
  disabledId?: string;
}) {
  const errId = `${name}-err`;
  return (
    <fieldset aria-describedby={error ? errId : undefined}>
      <legend className="mb-1.5 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {orderedAccounts(accounts, value).map((a) => {
          const Icon = KIND_ICONS[a.kind];
          const selected = value === a.id;
          const disabled = disabledId === a.id;
          return (
            <label
              key={a.id}
              className={`note-${a.color} flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${
                disabled
                  ? "cursor-not-allowed border-line text-ink-soft opacity-50"
                  : selected
                    ? "cursor-pointer border-transparent bg-note-bg text-note-ink"
                    : "cursor-pointer border-line bg-surface text-ink hover:bg-surface-2"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={a.id}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(a.id)}
                className="sr-only"
              />
              <span className={`flex size-5 items-center justify-center rounded-full ${selected ? "text-note-accent" : "bg-note-bg text-note-accent"}`} aria-hidden>
                <Icon size={13} strokeWidth={2} />
              </span>
              {liteLabel(a, accounts)}
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={errId} className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
