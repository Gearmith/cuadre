"use client";

import { useTranslations } from "next-intl";
import { useActionState, useEffect, useState } from "react";
import type { ActionState } from "@/lib/types";
import { buttonStyles } from "./styles";
import { FormAlert, SubmitButton } from "./ui";
import { useToast } from "./toast";

/** Botón de eliminar en dos pasos: primero pide confirmación en el mismo lugar. */
export function ConfirmDelete({
  action,
  fields,
  label,
  question,
  onDone,
  triggerClassName = `${buttonStyles.dangerQuiet} w-full`,
  confirmLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  label: string;
  question: string;
  onDone?: () => void;
  /** Estilo del botón inicial (por defecto: botón ancho en rojo suave). */
  triggerClassName?: string;
  /** Texto del botón de confirmar (por defecto "Sí, eliminar"). */
  confirmLabel?: string;
}) {
  const t = useTranslations();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [state, formAction] = useActionState(action, {});

  useEffect(() => {
    if (state.ok) {
      if (state.message) toast(t(state.message));
      onDone?.();
    }
  }, [state, toast, t, onDone]);

  if (!asking) {
    return (
      <button type="button" className={triggerClassName} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-field border border-danger/40 p-3">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <p className="text-sm text-ink">{question}</p>
      {state.error ? <FormAlert tone="error">{t(state.error)}</FormAlert> : null}
      <div className="flex gap-2">
        <button type="button" className={`${buttonStyles.secondary} flex-1`} onClick={() => setAsking(false)}>
          {t("tx.cancel")}
        </button>
        <SubmitButton variant={confirmLabel ? "primary" : "danger"} pendingLabel="…" className="flex-1">
          {confirmLabel ?? t("tx.confirm")}
        </SubmitButton>
      </div>
    </form>
  );
}
