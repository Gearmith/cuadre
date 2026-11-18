"use client";

import { Check, Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { createStarterAccounts, saveAccount } from "@/lib/actions/accounts";
import { NOTE_COLORS } from "@/lib/accounts";
import { amountToInput } from "@/lib/money";
import type { Account, AccountKind, NoteColor } from "@/lib/types";
import { usePrefs } from "./prefs";
import { Sheet } from "./sheet";
import { buttonStyles, inputClass } from "./styles";
import { useToast } from "./toast";
import { Field, FormAlert, SubmitButton, useFocusFirstError } from "./ui";

function useSaved(state: { ok?: boolean; message?: string }, onDone?: () => void) {
  const t = useTranslations();
  const toast = useToast();
  useEffect(() => {
    if (state.ok) {
      if (state.message) toast(t(state.message));
      onDone?.();
    }
  }, [state, toast, t, onDone]);
}

type Variant = "new" | "pocket" | "edit";

/** Botón + diálogo para crear una cuenta, un bolsillo o editar una cuenta. */
export function AccountSheetButton({
  variant,
  account,
  parentId,
  parentColor,
  className = "",
}: {
  variant: Variant;
  account?: Account;
  parentId?: string;
  parentColor?: NoteColor;
  className?: string;
}) {
  const t = useTranslations("accounts");
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  const isPocket = variant === "pocket" || account?.kind === "pocket";
  const label = variant === "edit" ? t(isPocket ? "editPocket" : "edit") : t(variant === "pocket" ? "addPocket" : "add");
  const Icon = variant === "edit" ? Pencil : Plus;
  return (
    <>
      <button
        type="button"
        className={`${variant === "new" ? buttonStyles.primary : buttonStyles.secondary} ${className}`}
        onClick={() => {
          setSession((s) => s + 1);
          setOpen(true);
        }}
      >
        <Icon size={18} strokeWidth={1.75} aria-hidden />
        {label}
      </button>
      <Sheet open={open} onClose={close} title={label}>
        <AccountForm key={session} account={account} pocketParent={variant === "pocket" ? parentId : undefined} parentColor={parentColor} onDone={close} />
      </Sheet>
    </>
  );
}

function AccountForm({
  account,
  pocketParent,
  parentColor,
  onDone,
}: {
  account?: Account;
  pocketParent?: string;
  parentColor?: NoteColor;
  onDone: () => void;
}) {
  const t = useTranslations();
  const { locale } = usePrefs();
  const [kind, setKind] = useState<AccountKind>(account?.kind ?? (pocketParent ? "pocket" : "bank"));
  const [color, setColor] = useState<NoteColor>(account?.color ?? parentColor ?? "green");
  const [state, formAction] = useActionState(saveAccount, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state.fieldErrors);
  useSaved(state, onDone);
  const err = (k: string) => (state.fieldErrors?.[k] ? t(state.fieldErrors[k]) : undefined);
  const isPocket = kind === "pocket";
  const initial = account ? (account.kind === "credit" ? Math.abs(account.initial_balance) : account.initial_balance) : null;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {account ? <input type="hidden" name="id" value={account.id} /> : null}
      <input type="hidden" name="kind" value={kind} />
      {isPocket ? <input type="hidden" name="parent_id" value={account?.parent_id ?? pocketParent ?? ""} /> : null}

      {!isPocket && !account ? (
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">{t("accounts.kind")}</legend>
          <div className="grid grid-cols-3 gap-1 rounded-field bg-surface-2 p-1">
            {(["bank", "cash", "credit"] as const).map((k) => (
              <label
                key={k}
                className={`flex min-h-11 cursor-pointer items-center justify-center rounded-[6px] px-2 text-center text-sm leading-tight font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${
                  kind === k ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
                }`}
              >
                <input type="radio" name="kind_pick" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
                {t(`accounts.kinds.${k}`)}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <Field label={t("accounts.name")} error={err("name")}>
        {(p) => (
          <input
            {...p}
            name="name"
            maxLength={40}
            autoComplete="off"
            autoFocus={!account}
            defaultValue={account?.name ?? ""}
            placeholder={t(isPocket ? "accounts.pocketPlaceholder" : "accounts.namePlaceholder")}
            className={inputClass}
          />
        )}
      </Field>

      <Field
        label={t(kind === "credit" ? "accounts.initialCredit" : "accounts.initial")}
        hint={t(kind === "credit" ? "accounts.initialCreditHint" : "accounts.initialHint")}
        error={err("initial_balance")}
      >
        {(p) => (
          <input
            {...p}
            name="initial_balance"
            inputMode="decimal"
            autoComplete="off"
            defaultValue={initial !== null ? amountToInput(initial, locale) : ""}
            placeholder="0"
            className={`${inputClass} num min-h-14 text-3xl! font-bold`}
          />
        )}
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t("accounts.color")}</legend>
        <div className="flex flex-wrap gap-3">
          {NOTE_COLORS.map((c) => (
            <label
              key={c}
              className={`note-${c} relative flex size-11 cursor-pointer items-center justify-center rounded-full bg-note-bg text-note-accent ring-offset-2 ring-offset-surface has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-gold ${
                color === c ? "ring-2 ring-ink" : ""
              }`}
            >
              <input type="radio" name="color" value={c} checked={color === c} onChange={() => setColor(c)} className="sr-only" />
              <span className="sr-only">{t(`accounts.colors.${c}`)}</span>
              {color === c ? <Check size={18} strokeWidth={2.5} aria-hidden /> : null}
            </label>
          ))}
        </div>
      </fieldset>

      {state.error ? <FormAlert tone="error">{t(state.error)}</FormAlert> : null}
      <SubmitButton pendingLabel={t("accounts.saving")} className="w-full">
        {t("accounts.save")}
      </SubmitButton>
    </form>
  );
}

const STARTERS = [
  { key: "bancolombia", label: "starterBancolombia", color: "gold" },
  { key: "nu", label: "starterNu", color: "purple" },
  { key: "cash", label: "starterCash", color: "green" },
  { key: "credit", label: "starterCredit", color: "slate" },
] as const;

/** Bienvenida: crea de una vez las cuentas más comunes. */
export function StarterAccounts() {
  const t = useTranslations();
  const [picked, setPicked] = useState<Set<string>>(() => new Set(STARTERS.map((s) => s.key)));
  const [state, formAction] = useActionState(createStarterAccounts, {});
  useSaved(state);

  if (state.ok) return <FormAlert tone="success">{t("accounts.setBalances")}</FormAlert>;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="cash_name" value={t("accounts.starterCash")} />
      <input type="hidden" name="credit_name" value={t("accounts.starterCredit")} />
      <fieldset>
        <legend className="sr-only">{t("accounts.emptyTitle")}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STARTERS.map((s) => {
            const on = picked.has(s.key);
            return (
              <label
                key={s.key}
                className={`note-${s.color} flex min-h-14 cursor-pointer items-center gap-2.5 rounded-field border-2 px-3 font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${
                  on ? "border-transparent bg-note-bg text-note-ink" : "border-line bg-surface text-ink-soft"
                }`}
              >
                <input
                  type="checkbox"
                  name="starter"
                  value={s.key}
                  checked={on}
                  onChange={() =>
                    setPicked((prev) => {
                      const next = new Set(prev);
                      if (next.has(s.key)) next.delete(s.key);
                      else next.add(s.key);
                      return next;
                    })
                  }
                  className="sr-only"
                />
                <span className={`flex size-5 shrink-0 items-center justify-center rounded-[5px] border ${on ? "border-note-accent bg-note-accent text-note-bg" : "border-line"}`} aria-hidden>
                  {on ? <Check size={14} strokeWidth={3} /> : null}
                </span>
                {t(`accounts.${s.label}`)}
              </label>
            );
          })}
        </div>
      </fieldset>
      {state.error ? <FormAlert tone="error">{t(state.error)}</FormAlert> : null}
      <SubmitButton pendingLabel={t("accounts.creating")} className="w-full sm:w-fit">
        {t("accounts.createStarters")}
      </SubmitButton>
    </form>
  );
}
