/** Fechas como texto "YYYY-MM-DD" para evitar líos de zona horaria. */

export const DEFAULT_TZ = "America/Bogota";

export function todayIn(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: DEFAULT_TZ }).format(new Date());
  }
}

export type MonthKey = `${number}-${string}`; // "2026-11"

export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { start: `${month}-01`, end: `${month}-${String(days).padStart(2, "0")}`, days };
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

function localeTag(locale: string) {
  return locale === "es" ? "es-CO" : "en-US";
}

function asUtc(isoDate: string) {
  return new Date(isoDate.length === 7 ? isoDate + "-01T12:00:00Z" : isoDate + "T12:00:00Z");
}

export function formatMonth(month: string, locale: string) {
  const s = new Intl.DateTimeFormat(localeTag(locale), { month: "long", year: "numeric", timeZone: "UTC" }).format(asUtc(month));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDay(isoDate: string, locale: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) {
  const s = new Intl.DateTimeFormat(localeTag(locale), { ...opts, timeZone: "UTC" }).format(asUtc(isoDate));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatShortDate(isoDate: string, locale: string) {
  return formatDay(isoDate, locale, { day: "numeric", month: "short", year: "numeric" });
}
