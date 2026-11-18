"use client";

import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonStyles } from "@/components/styles";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <WifiOff size={32} strokeWidth={1.5} className="text-ink-soft" aria-hidden />
      <h1 className="font-display text-xl font-medium">{t("loadTitle")}</h1>
      <p className="text-ink-soft">{t("loadBody")}</p>
      <button type="button" onClick={reset} className={`${buttonStyles.primary} mt-2`}>
        {t("retry")}
      </button>
    </div>
  );
}
