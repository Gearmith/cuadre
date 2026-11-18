"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, type ReactNode } from "react";

/** Diálogo modal nativo: hoja inferior en celular, ventana centrada en escritorio. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const t = useTranslations("tx");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open ? (
        <div className="flex max-h-[92dvh] flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <h2 id={titleId} className="font-display text-xl font-bold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 flex size-11 cursor-pointer items-center justify-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
              aria-label={t("close")}
            >
              <X size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </header>
          <div className="overflow-y-auto px-5 pt-4 pb-6 pb-safe">{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}
