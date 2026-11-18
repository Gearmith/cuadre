"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  createContext, use, useActionState, useRef, useCallback, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { deleteTransaction, saveTransaction } from "@/lib/actions/transactions";
import { usePathname } from "@/i18n/navigation";
import { CATEGORIES } from "@/lib/categories";
import { amountToInput, parseAmount } from "@/lib/money";
import type { Transaction, TxType } from "@/lib/types";
import { ConfirmDelete } from "./confirm-delete";
import { usePrefs, useMoney } from "./prefs";
import { Sheet } from "./sheet";
import { useToast } from "./toast";
import { buttonStyles, inputClass } from "./styles";
import { Field, FormAlert, SubmitButton, useFocusFirstError } from "./ui";

type SheetState = { session: number; type: TxType; tx: Transaction | null } | null;

type TxSheetApi = {
  openNew: (type?: TxType) => void;
  openEdit: (tx: Transaction) => void;
};

const TxSheetContext = createContext<TxSheetApi | null>(null);

export function useTxSheet() {
  const ctx = use(TxSheetContext);
  if (!ctx) throw new Error("useTxSheet must be used inside TxSheetProvider");
  return ctx;
}

export function TxSheetProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("tx");
  const [state, setState] = useState<SheetState>(null);
  const [open, setOpen] = useState(false);

  const api = useMemo<TxSheetApi>(
    () => ({
      openNew: (type = "expense") => {
        setState((s) => ({ session: (s?.session ?? 0) + 1, type, tx: null }));
        setOpen(true);
      },
      openEdit: (tx) => {
        setState((s) => ({ session: (s?.session ?? 0) + 1, type: tx.type, tx }));
        setOpen(true);
      },
    }),
    [],
  );
  const close = useCallback(() => setOpen(false), []);

  const editing = state?.tx;
  const title = editing
    ? t(editing.type === "income" ? "editIncome" : "editExpense")
    : t(state?.type === "income" ? "addIncome" : "addExpense");

  return (
    <TxSheetContext value={api}>
      {children}
      <Sheet open={open} onClose={close} title={title}>
        {state ? (
          <TxForm
            key={state.session}
            initialType={state.type}
            tx={state.tx}
            onDone={close}
            onTypeChange={(type) => setState((s) => (s && !s.tx ? { ...s, type } : s))}
          />
        ) : null}
      </Sheet>
    </TxSheetContext>
  );
}

function TxForm({
  initialType,
  tx,
  onDone,
  onTypeChange,
}: {
  initialType: TxType;
  tx: Transaction | null;
  onDone: () => void;
  onTypeChange: (type: TxType) => void;
}) {
  const t = useTranslations();
  const { locale, today } = usePrefs();
  const money = useMoney();
  const toast = useToast();
  const [type, setType] = useState<TxType>(initialType);
  const [amount, setAmount] = useState(tx ? amountToInput(tx.amount, locale) : "");
  const [category, setCategory] = useState(tx?.category ?? "");
  const [state, formAction] = useActionState(saveTransaction, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state.fieldErrors);

  useEffect(() => {
    if (state.ok) {
      if (state.message) toast(t(state.message));
      onDone();
    }
  }, [state, toast, t, onDone]);

  const parsed = parseAmount(amount, locale);
  const err = (k: string) => (state.fieldErrors?.[k] ? t(state.fieldErrors[k]) : undefined);
  const categories = CATEGORIES[type];

  const switchType = (next: TxType) => {
    setType(next);
    onTypeChange(next);
    if (!CATEGORIES[next].some((c) => c.key === category)) setCategory("");
  };

  return (
    <div className="flex flex-col gap-5">
      <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="locale" value={locale} />
        {tx ? <input type="hidden" name="id" value={tx.id} /> : null}

        <fieldset>
          <legend className="sr-only">{t("tx.type")}</legend>
          <div className="grid grid-cols-2 gap-1 rounded-field bg-surface-2 p-1">
            {(["expense", "income"] as const).map((k) => (
              <label
                key={k}
                className={`flex min-h-10 cursor-pointer items-center justify-center rounded-[5px] text-base font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-navy ${
                  type === k
                    ? `bg-surface shadow-sm ${k === "income" ? "text-income" : "text-expense"}`
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={k}
                  checked={type === k}
                  onChange={() => switchType(k)}
                  className="sr-only"
                />
                {t(k === "income" ? "tx.income" : "tx.expense")}
              </label>
            ))}
          </div>
        </fieldset>

        <Field
          label={t("tx.amount")}
          error={err("amount")}
          hint={parsed && amount ? t("tx.amountPreview", { amount: money(parsed) }) : undefined}
        >
          {(p) => (
            <input
              {...p}
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              autoFocus={!tx}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className={`${inputClass} num min-h-14 text-3xl font-medium ${type === "income" ? "text-income" : "text-expense"}`}
            />
          )}
        </Field>

        <fieldset className="flex flex-col gap-2" aria-describedby={err("category") ? "cat-err" : undefined}>
          <legend className="mb-1.5 text-sm font-semibold">{t("tx.category")}</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map(({ key, icon: Icon }) => {
              const selected = category === key;
              return (
                <label
                  key={key}
                  className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy ${
                    selected
                      ? "border-navy bg-navy text-on-navy"
                      : "border-line bg-surface text-ink hover:bg-surface-2"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={key}
                    checked={selected}
                    onChange={() => setCategory(key)}
                    className="sr-only"
                  />
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

        <Field label={t("tx.date")} error={err("occurred_on")}>
          {(p) => (
            <input {...p} type="date" name="occurred_on" defaultValue={tx?.occurred_on ?? today} className={inputClass} required />
          )}
        </Field>

        <Field label={t("tx.note")}>
          {(p) => (
            <input
              {...p}
              name="note"
              maxLength={200}
              defaultValue={tx?.note ?? ""}
              placeholder={t("tx.notePlaceholder")}
              className={inputClass}
            />
          )}
        </Field>

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

/** Botón flotante (celular) para agregar un gasto. */
export function AddFab() {
  const t = useTranslations("nav");
  const { openNew } = useTxSheet();
  const pathname = usePathname();
  // En Deudas y Ajustes un "+" de gasto confundiría: sólo aparece donde se ven movimientos.
  if (pathname !== "/" && !pathname.startsWith("/transactions")) return null;
  return (
    <button
      type="button"
      onClick={() => openNew("expense")}
      aria-label={t("add")}
      className="fixed right-4 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 flex size-14 cursor-pointer items-center justify-center rounded-full bg-navy text-on-navy shadow-float transition-colors duration-150 hover:bg-navy-hover md:hidden"
    >
      <Plus size={26} strokeWidth={2} aria-hidden />
    </button>
  );
}

/** Botones "Agregar gasto" / "Agregar ingreso" para cabeceras en pantallas grandes. */
export function AddButtons({ className = "" }: { className?: string }) {
  const t = useTranslations("tx");
  const { openNew } = useTxSheet();
  return (
    <div className={`flex gap-2 ${className}`}>
      <button type="button" className={buttonStyles.secondary} onClick={() => openNew("income")}>
        <Plus size={18} strokeWidth={1.75} aria-hidden className="text-income" />
        {t("addIncome")}
      </button>
      <button type="button" className={buttonStyles.primary} onClick={() => openNew("expense")}>
        <Plus size={18} strokeWidth={1.75} aria-hidden />
        {t("addExpense")}
      </button>
    </div>
  );
}

/** Fila de la hoja de movimientos: al tocarla se abre para editar. */
export function EditTxButton({ tx, label, children }: { tx: Transaction; label: string; children: ReactNode }) {
  const { openEdit } = useTxSheet();
  return (
    <button
      type="button"
      onClick={() => openEdit(tx)}
      aria-label={label}
      className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:-outline-offset-2"
    >
      {children}
    </button>
  );
}
