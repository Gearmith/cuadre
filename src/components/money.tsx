import { formatMoney } from "@/lib/money";

type Props = {
  value: number;
  locale: string;
  currency: string;
  /** "signed": color y signo según sea positivo o negativo. "expense"/"income": fuerza el tono. */
  tone?: "plain" | "signed" | "expense" | "income";
  className?: string;
};

const TONES = {
  plain: "",
  income: "text-income",
  expense: "text-expense",
} as const;

export function Money({ value, locale, currency, tone = "plain", className = "" }: Props) {
  let text: string;
  let color: string;
  if (tone === "signed") {
    text = formatMoney(value, locale, currency, true);
    color = value > 0 ? TONES.income : value < 0 ? TONES.expense : "";
  } else if (tone === "expense") {
    text = formatMoney(-Math.abs(value), locale, currency, true);
    color = TONES.expense;
  } else if (tone === "income") {
    text = formatMoney(Math.abs(value), locale, currency, true);
    color = TONES.income;
  } else {
    text = formatMoney(value, locale, currency);
    color = "";
  }
  return <span className={`num whitespace-nowrap ${color} ${className}`}>{text}</span>;
}
