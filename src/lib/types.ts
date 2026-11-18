export type TxType = "expense" | "income";

export type Transaction = {
  id: string;
  type: TxType;
  account_id: string | null;
  amount: number;
  category: string;
  note: string | null;
  occurred_on: string; // YYYY-MM-DD
  created_at: string;
};

export type AccountKind = "bank" | "cash" | "credit" | "pocket";
export type NoteColor = "green" | "blue" | "purple" | "red" | "gold" | "slate";

export type Account = {
  id: string;
  name: string;
  kind: AccountKind;
  parent_id: string | null;
  color: NoteColor;
  initial_balance: number;
  archived: boolean;
  balance: number;
};

export type Transfer = {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  occurred_on: string;
  note: string | null;
  created_at: string;
};

/** Fila de la hoja: un gasto/ingreso o un movimiento entre cuentas. */
export type Entry =
  | ({ kind: "tx" } & Transaction)
  | ({ kind: "transfer" } & Transfer);

export type DebtDirection = "i_owe" | "owed_to_me";

export type DebtPayment = {
  id: string;
  debt_id: string;
  amount: number;
  paid_on: string;
  note: string | null;
};

export type Debt = {
  id: string;
  direction: DebtDirection;
  person: string;
  description: string | null;
  amount: number;
  due_on: string | null;
  created_at: string;
  paid: number;
  remaining: number;
};

/** Resultado de un Server Action usado con useActionState. */
export type ActionState = {
  ok?: boolean;
  /** Clave de mensaje i18n para un error general. */
  error?: string;
  /** Errores por campo: nombre del campo → clave i18n. */
  fieldErrors?: Record<string, string>;
  /** Clave i18n del aviso de éxito. */
  message?: string;
};
