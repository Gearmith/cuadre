export type TxType = "expense" | "income";

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  note: string | null;
  occurred_on: string; // YYYY-MM-DD
  created_at: string;
};

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
