"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState, type ComponentProps, type ReactNode, type RefObject } from "react";
import { useFormStatus } from "react-dom";
import { buttonStyles, inputClass } from "./styles";


export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [error ? errId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error ? (
        <p id={errId} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordInput(props: ComponentProps<"input">) {
  const t = useTranslations("auth");
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${inputClass} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-field text-ink-soft hover:text-ink"
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={20} strokeWidth={1.75} aria-hidden /> : <Eye size={20} strokeWidth={1.75} aria-hidden />}
      </button>
    </div>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  pendingLabel: string;
  variant?: keyof typeof buttonStyles;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${buttonStyles[variant]} ${className}`} aria-busy={pending || undefined}>
      {pending ? (
        <>
          <LoaderCircle size={18} className="animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function FormAlert({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-field px-3 py-2.5 text-sm ${
        tone === "error" ? "bg-expense-tint text-danger" : "bg-income-tint text-income"
      }`}
    >
      {children}
    </p>
  );
}

/** Tras un envío con errores, lleva el foco al primer campo marcado como inválido. */
export function useFocusFirstError(form: RefObject<HTMLFormElement | null>, fieldErrors: Record<string, string> | undefined) {
  useEffect(() => {
    if (!fieldErrors || !Object.keys(fieldErrors).length) return;
    const first = form.current?.querySelector<HTMLElement>('[aria-invalid="true"], fieldset[aria-describedby] input');
    first?.focus();
  }, [form, fieldErrors]);
}
