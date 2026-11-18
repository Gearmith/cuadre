export const inputClass =
  "block w-full min-h-11 rounded-field border border-line bg-surface px-3 py-2 text-base text-ink placeholder:text-ink-soft/80 transition-colors duration-150 hover:border-ink-soft/60 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 aria-invalid:border-danger";

const BUTTON_BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-field px-4 text-base font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer";

export const buttonStyles = {
  primary: `${BUTTON_BASE} bg-primary text-on-primary hover:bg-primary-hover`,
  secondary: `${BUTTON_BASE} border border-line bg-surface text-ink hover:bg-surface-2`,
  quiet: `${BUTTON_BASE} text-gold hover:bg-surface-2`,
  danger: `${BUTTON_BASE} bg-danger text-surface hover:opacity-90`,
  dangerQuiet: `${BUTTON_BASE} text-danger hover:bg-expense-tint`,
} as const;

