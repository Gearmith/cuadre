"use client";

import { createContext, use, type ReactNode } from "react";
import { formatMoney } from "@/lib/money";

type Prefs = { locale: string; currency: string; today: string };

const PrefsContext = createContext<Prefs | null>(null);

export function PrefsProvider({ value, children }: { value: Prefs; children: ReactNode }) {
  return <PrefsContext value={value}>{children}</PrefsContext>;
}

export function usePrefs() {
  const ctx = use(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}

export function useMoney() {
  const { locale, currency } = usePrefs();
  return (value: number, signed = false) => formatMoney(value, locale, currency, signed);
}
