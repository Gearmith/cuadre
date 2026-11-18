"use client";

import { ArrowLeftRight, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  createContext, use, useActionState, useCallback, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { deleteTransaction, deleteTransfer, saveTransaction, saveTransfer } from "@/lib/actions/transactions";
import { CATEGORIES } from "@/lib/categories";
import { amountToInput, parseAmount } from "@/lib/money";
import type { Entry, Transaction, Transfer, TxType } from "@/lib/types";
import { AccountPicker, orderedAccounts } from "./account-picker";
import { ConfirmDelete } from "./confirm-delete";
import { usePrefs, useMoney } from "./prefs";
import { Sheet } from "./sheet";
import { buttonStyles, inputClass } from "./styles";
import { useToast } from "./toast";
import { Field, FormAlert, SubmitButton, useFocusFirstError } from "./ui";

type Mode = TxType | "transfer";

type SheetState = {
  session: number;
  mode: Mode;
  tx: Transaction | null;
  transfer: Transfer | null;
  accountId?: string;
} | null;

type TxSheetApi = {
  openNew: (mode?: Mode, accountId?: string) => void;
  openEdit: (entry: Entry) => void;
};

const TxSheetContext = createContext<TxSheetApi | null>(null);

export function useTxSheet() {
  const ctx = use(TxSheetContext);
  if (!ctx) throw new Error("useTxSheet must be used inside TxSheetProvider");
  return ctx;
}

const LAST_ACCOUNT_KEY = "cuadre:last-account";

function readLastAccount() {
  try {
    return localStorage.getItem(LAST_ACCOUNT_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function rememberAccount(id: string) {
  try {
    localStorage.setItem(LAST_ACCOUNT_KEY, id);
  } catch {
    // Sin almacenamiento (modo privado): no pasa nada.
  }
}

export function TxSheetProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("tx");
  const [state, setState] = useState<SheetState>(null);
  const [open, setOpen] = useState(false);

  const api = useMemo<TxSheetApi>(
    () => ({
      openNew: (mode = "expense", accountId) => {
        setState((s) => ({ session: (s?.session ?? 0) + 1, mode, tx: null, transfer: null, accountId }));
        setOpen(true);
      },
      openEdit: (entry) => {
        setState((s) =>
          entry.kind === "tx"
            ? { session: (s?.session ?? 0) + 1, mode: entry.type, tx: entry, transfer: null }
            : { session: (s?.session ?? 0) + 1, mode: "transfer", tx: null, transfer: entry },
        );
        setOpen(true);
      },
    }),
    [],
  );
  const close = useCallback(() => setOpen(false), []);

  const editing = state?.tx ?? state?.transfer;
  const mode = state?.mode ?? "expense";
  const titles: Record<Mode, [string, string]> = {
    expense: [t("addExpense"), t("editExpense")],
    income: [t("addIncome"), t("editIncome")],
    transfer: [t("addTransfer"), t("editTransfer")],
  };
  const title = titles[mode][editing ? 1 : 0];

  return (
    <TxSheetContext value={api}>
      {children}
      <Sheet open={open} onClose={close} title={title}>
        {state ? (
          <EntryForm
            key={state.session}
            state={state}
            onDone={close}
            onModeChange={(m) => setState((s) => (s && !s.tx && !s.transfer ? { ...s, mode: m } : s))}
          />
        ) : null}
      </Sheet>
    </TxSheetContext>
  );
}

function EntryForm({ state, onDone, onModeChange }: { state: NonNullable<SheetState>; onDone: () => void; onModeChange: (m: Mode) => void }) {
  const t = useTranslations();
  const { accounts, locale } = usePrefs();
  const [mode, setMode] = useState<Mode>(state.mode);
  const initialAmount = state.tx?.amount ?? state.transfer?.amount;
  const [amount, setAmount] = useState(initialAmount ? amountToInput(initialAmount, locale) : "");
  const editing = Boolean(state.tx || state.transfer);
  const active = orderedAccounts(accounts);

  if (!active.length) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p>{t("tx.needAccount")}</p>
        <Link href="/accounts" className={buttonStyles.primary} onClick={onDone}>
          {t("tx.goToAccounts")}
        </Link>
      </div>
    );
  }

  const change = (m: Mode) => {
    setMode(m);
    onModeChange(m);
  };

  return (
    <div className="flex flex-col gap-5">
      {!editing || state.tx ? (
        <fieldset>
          <legend className="sr-only">{t("tx.type")}</legend>
          <div className={`grid gap-1 rounded-field bg-surface-2 p-1 ${editing ? "grid-cols-2" : "grid-cols-3"}`}>
            {(editing ? (["expense", "income"] as const) : (["expense", "income", "transfer"] as const)).map((k) => (
              <label
                key={k}
                className={`flex min-h-10 cursor-pointer items-center justify-center rounded-[6px] text-base font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${
                  mode === k
                    ? `bg-surface shadow-sm ${k === "income" ? "text-income" : k === "expense" ? "text-expense" : "text-ink"}`
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <input type="radio" name="mode" value={k} checked={mode === k} onChange={() => change(k)} className="sr-only" />
                {t(k === "income" ? "tx.income" : k === "expense" ? "tx.expense" : "tx.transfer")}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {mode === "transfer" ? (
        <TransferForm transfer={state.transfer} defaultFrom={state.accountId} onDone={onDone} amount={amount} setAmount={setAmount} />
      ) : (
        <TxForm key={mode} type={mode} tx={state.tx} defaultAccount={state.accountId} onDone={onDone} amount={amount} setAmount={setAmount} />
      )}
    </div>
  );
}

function useSaved(state: { ok?: boolean; message?: string }, onDone: () => void) {
  const t = useTranslations();
  const toast = useToast();
  useEffect(() => {
    if (state.ok) {
      if (state.message) toast(t(state.message));
      onDone();
    }
  }, [state, toast, t, onDone]);
}

function AmountField({ value, onChange, error, tone, autoFocus }: { value: string; onChange: (v: string) => void; error?: string; tone: string; autoFocus: boolean }) {
  const t = useTranslations("tx");
  const { locale } = usePrefs();
  const money = useMoney();
  const parsed = parseAmount(value, locale);
  return (
    <Field label={t("amount")} error={error} hint={parsed && value ? t("amountPreview", { amount: money(parsed) }) : undefined}>
      {(p) => (
        <input
          {...p}
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className={`${inputClass} num min-h-16 text-4xl! font-bold ${tone}`}
        />
      )}
    </Field>
  );
}

type AmountProps = { amount: string; setAmount: (v: string) => void };

function TxForm({ type, tx, defaultAccount, onDone, amount, setAmount }: { type: TxType; tx: Transaction | null; defaultAccount?: string; onDone: () => void } & AmountProps) {
  const t = useTranslations();
  const { locale, today, accounts } = usePrefs();
  const active = orderedAccounts(accounts, tx?.account_id);
  const [category, setCategory] = useState(tx?.category ?? "");
  const [accountId, setAccountId] = useState(() => {
    if (tx?.account_id) return tx.account_id;
    const preferred = defaultAccount ?? readLastAccount();
    return active.some((a) => a.id === preferred) ? preferred! : active[0]?.id ?? "";
  });
  const [state, formAction] = useActionState(saveTransaction, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state.fieldErrors);
  useSaved(state, onDone);
  const err = (k: string) => (state.fieldErrors?.[k] ? t(state.fieldErrors[k]) : undefined);

  return (
    <div className="flex flex-col gap-5">
      <form
        ref={formRef}
        action={(fd) => {
          rememberAccount(accountId);
          return formAction(fd);
        }}
        className="flex flex-col gap-5"
        noValidate
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="type" value={type} />
        {tx ? <input type="hidden" name="id" value={tx.id} /> : null}

        <AmountField value={amount} onChange={setAmount} error={err("amount")} tone={type === "income" ? "text-income" : "text-expense"} autoFocus={!tx} />

        <AccountPicker name="account_id" legend={t("tx.account")} value={accountId} onChange={setAccountId} accounts={accounts} error={err("account_id")} />

        <fieldset className="flex flex-col gap-2" aria-describedby={err("category") ? "cat-err" : undefined}>
          <legend className="mb-1.5 text-sm font-semibold">{t("tx.category")}</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES[type].map(({ key, icon: Icon }) => {
              const selected = category === key;
              return (
                <label
                  key={key}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${
                    selected ? "border-primary bg-primary text-on-primary" : "border-line bg-surface text-ink hover:bg-surface-2"
                  }`}
                >
                  <input type="radio" name="category" value={key} checked={selected} onChange={() => setCategory(key)} className="sr-only" />
                  <Icon size={18} strokeWidth={1.75} aria-hidden />
                  {t(`categories.${type}.${key}`)}
                </label>
              );
            })}
          </div>
          {err("category") ? (
            <p id="cat-err" className="text-sm text-danger">
              {err("category")}
            </p>
          ) : null}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("tx.date")} error={err("occurred_on")}>
            {(p) => <input {...p} type="date" name="occurred_on" defaultValue={tx?.occurred_on ?? today} className={inputClass} required />}
          </Field>
          <Field label={t("tx.note")}>
            {(p) => <input {...p} name="note" maxLength={200} defaultValue={tx?.note ?? ""} placeholder={t("tx.notePlaceholder")} className={inputClass} />}
          </Field>
        </div>

        {state.error ? <FormAlert tone="error">{t(state.error)}</FormAlert> : null}

        <SubmitButton pendingLabel={t("tx.saving")} className="w-full">
          {t(type === "income" ? "tx.saveIncome" : "tx.saveExpense")}
        </SubmitButton>
      </form>

      {tx ? (
        <ConfirmDelete
          action={deleteTransaction}
          fields={{ id: tx.id, type: tx.type }}
          label={t(tx.type === "income" ? "tx.deleteIncome" : "tx.deleteExpense")}
          question={t("tx.confirmDelete")}
          onDone={onDone}
        />
      ) : null}
    </div>
  );
}

function TransferForm({ transfer, defaultFrom, onDone, amount, setAmount }: { transfer: Transfer | null; defaultFrom?: string; onDone: () => void } & AmountProps) {
  const t = useTranslations();
  const { locale, today, accounts } = usePrefs();
  const active = orderedAccounts(accounts);
  const [from, setFrom] = useState(transfer?.from_account_id ?? (active.some((a) => a.id === defaultFrom) ? defaultFrom! : active[0]?.id ?? ""));
  const [to, setTo] = useState(transfer?.to_account_id ?? "");
  const [state, formAction] = useActionState(saveTransfer, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state.fieldErrors);
  useSaved(state, onDone);
  const err = (k: string) => (state.fieldErrors?.[k] ? t(state.fieldErrors[k]) : undefined);

  return (
    <div className="flex flex-col gap-5">
      <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="locale" value={locale} />
        {transfer ? <input type="hidden" name="id" value={transfer.id} /> : null}

        <AmountField value={amount} onChange={setAmount} error={err("amount")} tone="text-ink" autoFocus={!transfer} />

        <AccountPicker
          name="from_account_id"
          legend={t("tx.fromAccount")}
          value={from}
          onChange={(id) => {
            setFrom(id);
            if (id === to) setTo("");
          }}
          accounts={accounts}
          error={err("from_account_id")}
        />
        <AccountPicker
          name="to_account_id"
          legend={t("tx.toAccount")}
          value={to}
          onChange={setTo}
          accounts={accounts}
          error={err("to_account_id")}
          disabledId={from}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("tx.date")} error={err("occurred_on")}>
            {(p) => <input {...p} type="date" name="occurred_on" defaultValue={transfer?.occurred_on ?? today} className={inputClass} required />}
          </Field>
          <Field label={t("tx.note")}>
            {(p) => <input {...p} name="note" maxLength={200} defaultValue={transfer?.note ?? ""} className={inputClass} />}
          </Field>
        </div>

        {state.error ? <FormAlert tone="error">{t(state.error)}</FormAlert> : null}

        <SubmitButton pendingLabel={t("tx.saving")} className="w-full">
          {t("tx.saveTransfer")}
        </SubmitButton>
      </form>

      {transfer ? (
        <ConfirmDelete action={deleteTransfer} fields={{ id: transfer.id }} label={t("tx.deleteTransfer")} question={t("tx.confirmDelete")} onDone={onDone} />
      ) : null}
    </div>
  );
}

/** Botón flotante (celular) para agregar un gasto. */
export function AddFab() {
  const t = useTranslations("nav");
  const { openNew } = useTxSheet();
  const pathname = usePathname();
  // En Deudas y Ajustes un "+" de gasto confundiría.
  if (pathname !== "/" && !pathname.startsWith("/transactions") && !pathname.startsWith("/accounts")) return null;
  const accountId = pathname.startsWith("/accounts/") ? pathname.split("/")[2] : undefined;
  return (
    <button
      type="button"
      onClick={() => openNew("expense", accountId)}
      aria-label={t("add")}
      className="fixed right-4 bottom-[calc(80px+env(safe-area-inset-bottom))] z-30 flex size-15 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary shadow-float transition-colors duration-150 hover:bg-primary-hover md:hidden"
    >
      <Plus size={28} strokeWidth={2.25} aria-hidden />
    </button>
  );
}

/** Botones de cabecera en pantallas grandes. */
export function AddButtons({ className = "", accountId }: { className?: string; accountId?: string }) {
  const t = useTranslations("tx");
  const { openNew } = useTxSheet();
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button type="button" className={buttonStyles.secondary} onClick={() => openNew("transfer", accountId)}>
        <ArrowLeftRight size={18} strokeWidth={1.75} aria-hidden />
        {t("addTransfer")}
      </button>
      <button type="button" className={buttonStyles.secondary} onClick={() => openNew("income", accountId)}>
        <Plus size={18} strokeWidth={1.75} aria-hidden className="text-income" />
        {t("addIncome")}
      </button>
      <button type="button" className={buttonStyles.primary} onClick={() => openNew("expense", accountId)}>
        <Plus size={18} strokeWidth={1.75} aria-hidden />
        {t("addExpense")}
      </button>
    </div>
  );
}

/** Acciones rápidas de una cuenta: tres botones iguales (en celular, ícono sobre texto). */
export function QuickActions({ accountId }: { accountId: string }) {
  const t = useTranslations("tx");
  const { openNew } = useTxSheet();
  const tile =
    "flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-field px-2 text-sm font-semibold transition-colors duration-150 sm:min-h-11 sm:flex-row sm:gap-2 sm:px-4 sm:text-base";
  return (
    <div className="grid grid-cols-3 gap-2 sm:flex">
      <button type="button" className={`${tile} bg-primary text-on-primary hover:bg-primary-hover`} onClick={() => openNew("expense", accountId)}>
        <Plus size={20} strokeWidth={1.75} aria-hidden />
        {t("expense")}
      </button>
      <button type="button" className={`${tile} border border-line bg-surface hover:bg-surface-2`} onClick={() => openNew("income", accountId)}>
        <Plus size={20} strokeWidth={1.75} aria-hidden className="text-income" />
        {t("income")}
      </button>
      <button type="button" className={`${tile} border border-line bg-surface hover:bg-surface-2`} onClick={() => openNew("transfer", accountId)}>
        <ArrowLeftRight size={20} strokeWidth={1.75} aria-hidden />
        {t("addTransfer")}
      </button>
    </div>
  );
}

/** Fila de la hoja de movimientos: al tocarla se abre para editar. */
export function EditEntryButton({ entry, label, children }: { entry: Entry; label: string; children: ReactNode }) {
  const { openEdit } = useTxSheet();
  return (
    <button
      type="button"
      onClick={() => openEdit(entry)}
      aria-label={label}
      className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:-outline-offset-2"
    >
      {children}
    </button>
  );
}
