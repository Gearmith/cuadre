"use client";

import { Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useRef, useCallback, useEffect, useState } from "react";
import { savePayment, saveDebt } from "@/lib/actions/debts";
import { amountToInput } from "@/lib/money";
import type { Debt, DebtDirection } from "@/lib/types";
import { usePrefs } from "./prefs";
import { Sheet } from "./sheet";
import { buttonStyles, inputClass } from "./styles";
import { useToast } from "./toast";
import { Field, FormAlert, SubmitButton, useFocusFirstError } from "./ui";

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

/** Botón + diálogo para crear o editar una deuda. */
export function DebtSheetButton({ debt, defaultDirection = "i_owe", className = "" }: { debt?: Debt; defaultDirection?: DebtDirection; className?: string }) {
  const t = useTranslations("debts");
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        className={`${debt ? buttonStyles.secondary : buttonStyles.primary} ${className}`}
        onClick={() => {
          setSession((s) => s + 1);
          setOpen(true);
        }}
      >
        {debt ? <Pencil size={18} strokeWidth={1.75} aria-hidden /> : <Plus size={18} strokeWidth={1.75} aria-hidden />}
        {debt ? t("edit") : t("add")}
      </button>
      <Sheet open={open} onClose={close} title={debt ? t("edit") : t("add")}>
        <DebtForm key={session} debt={debt} defaultDirection={defaultDirection} onDone={close} />
      </Sheet>
    </>
  );
}

function DebtForm({ debt, defaultDirection, onDone }: { debt?: Debt; defaultDirection: DebtDirection; onDone: () => void }) {
  const t = useTranslations();
  const { locale } = usePrefs();
  const [direction, setDirection] = useState<DebtDirection>(debt?.direction ?? defaultDirection);
  const [state, formAction] = useActionState(saveDebt, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state.fieldErrors);
  useSaved(state, onDone);
  const err = (k: string) => (state.fieldErrors?.[k] ? t(state.fieldErrors[k]) : undefined);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {debt ? <input type="hidden" name="id" value={debt.id} /> : null}

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">{t("debts.direction")}</legend>
        <div className="grid grid-cols-2 gap-1 rounded-field bg-surface-2 p-1">
          {(["i_owe", "owed_to_me"] as const).map((k) => (
            <label
              key={k}
              className={`flex min-h-10 cursor-pointer items-center justify-center rounded-[5px] text-base font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-navy ${
                direction === k ? `bg-surface shadow-sm ${k === "i_owe" ? "text-expense" : "text-income"}` : "text-ink-soft hover:text-ink"
              }`}
            >
              <input type="radio" name="direction" value={k} checked={direction === k} onChange={() => setDirection(k)} className="sr-only" />
              {t(k === "i_owe" ? "debts.iOwe" : "debts.owedToMe")}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={t(direction === "i_owe" ? "debts.personIOwe" : "debts.personOwed")} error={err("person")}>
        {(p) => (
          <input {...p} name="person" maxLength={80} defaultValue={debt?.person ?? ""} placeholder={t("debts.personPlaceholder")} className={inputClass} autoComplete="off" />
        )}
      </Field>

      <Field label={t("debts.amount")} error={err("amount")}>
        {(p) => (
          <input
            {...p}
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            defaultValue={debt ? amountToInput(debt.amount, locale) : ""}
            placeholder="0"
            className={`${inputClass} num min-h-14 text-3xl font-medium`}
          />
        )}
      </Field>

      <Field label={t("debts.description")}>
        {(p) => (
          <input {...p} name="description" maxLength={200} defaultValue={debt?.description ?? ""} placeholder={t("debts.descriptionPlaceholder")} className={inputClass} />
        )}
      </Field>

      <Field label={t("debts.due")} error={err("due_on")}>
        {(p) => <input {...p} type="date" name="due_on" defaultValue={debt?.due_on ?? ""} className={inputClass} />}
      </Field>

      {state.error ? <FormAlert tone="error">{t(state.error)}</FormAlert> : null}
      <SubmitButton pendingLabel={t("debts.saving")} className="w-full">
        {t("debts.save")}
      </SubmitButton>
    </form>
  );
}

/** Botón + diálogo para registrar un abono. */
export function PaymentSheetButton({ debtId, suggested }: { debtId: string; suggested: number }) {
  const t = useTranslations();
  const { locale, today } = usePrefs();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        className={buttonStyles.primary}
        onClick={() => {
          setSession((s) => s + 1);
          setOpen(true);
        }}
      >
        <Plus size={18} strokeWidth={1.75} aria-hidden />
        {t("debts.registerPayment")}
      </button>
      <Sheet open={open} onClose={close} title={t("debts.registerPayment")}>
        <PaymentForm key={session} debtId={debtId} suggested={suggested} locale={locale} today={today} onDone={close} />
      </Sheet>
    </>
  );
}

function PaymentForm({ debtId, suggested, locale, today, onDone }: { debtId: string; suggested: number; locale: string; today: string; onDone: () => void }) {
  const t = useTranslations();
  const [state, formAction] = useActionState(savePayment, {});
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state.fieldErrors);
  useSaved(state, onDone);
  const err = (k: string) => (state.fieldErrors?.[k] ? t(state.fieldErrors[k]) : undefined);
  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="debt_id" value={debtId} />
      <Field label={t("debts.paymentAmount")} error={err("amount")}>
        {(p) => (
          <input
            {...p}
            name="amount"
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            placeholder={suggested > 0 ? amountToInput(suggested, locale) : "0"}
            className={`${inputClass} num min-h-14 text-3xl font-medium`}
          />
        )}
      </Field>
      <Field label={t("debts.paymentDate")} error={err("paid_on")}>
        {(p) => <input {...p} type="date" name="paid_on" defaultValue={today} className={inputClass} />}
      </Field>
      <Field label={t("debts.paymentNote")}>
        {(p) => <input {...p} name="note" maxLength={200} className={inputClass} />}
      </Field>
      {state.error ? <FormAlert tone="error">{t(state.error)}</FormAlert> : null}
      <SubmitButton pendingLabel={t("debts.saving")} className="w-full">
        {t("debts.savePayment")}
      </SubmitButton>
    </form>
  );
}
