export const CURRENCIES = ["COP", "USD", "EUR", "MXN", "ARS", "CLP", "PEN", "GTQ", "DOP", "BOB", "UYU", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = "COP";

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string, currency: string, signed: boolean) {
  const key = `${locale}|${currency}|${signed}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale === "es" ? "es-CO" : "en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      signDisplay: signed ? "exceptZero" : "auto",
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
    formatters.set(key, f);
  }
  return f;
}

/** Formatea una cifra. Con `signed`, añade + / − (el signo menos es tipográfico). */
export function formatMoney(value: number, locale: string, currency: string, signed = false) {
  return getFormatter(locale, currency, signed).format(value).replace("-", "−");
}

/** Separador decimal del idioma ("," en español, "." en inglés). */
export function decimalSeparator(locale: string) {
  return locale === "es" ? "," : ".";
}

/**
 * Convierte lo que escribe la persona ("84.500", "84500,50", "1,200.75") a número.
 * Devuelve null si no es un número positivo válido.
 */
export function parseAmount(raw: string, locale: string): number | null {
  const dec = decimalSeparator(locale);
  const group = dec === "," ? "." : ",";
  let s = raw.replace(/[^\d.,]/g, "");
  if (!s) return null;
  s = s.split(group).join("");
  s = s.replace(dec, ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 && n < 1e12 ? n : null;
}

/** Valor para rellenar un campo de monto al editar. */
export function amountToInput(value: number, locale: string) {
  const fixed = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return fixed.replace(".", decimalSeparator(locale));
}
