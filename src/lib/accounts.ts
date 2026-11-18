import { Banknote, CreditCard, Landmark, PiggyBank, type LucideIcon } from "lucide-react";
import type { Account, AccountKind, NoteColor } from "./types";

export const ACCOUNT_KINDS: AccountKind[] = ["bank", "cash", "credit", "pocket"];
export const NOTE_COLORS: NoteColor[] = ["green", "blue", "purple", "red", "gold", "slate"];

export const KIND_ICONS: Record<AccountKind, LucideIcon> = {
  bank: Landmark,
  cash: Banknote,
  credit: CreditCard,
  pocket: PiggyBank,
};

export function isKind(v: unknown): v is AccountKind {
  return typeof v === "string" && (ACCOUNT_KINDS as string[]).includes(v);
}
export function isNoteColor(v: unknown): v is NoteColor {
  return typeof v === "string" && (NOTE_COLORS as string[]).includes(v);
}

/** Cuentas principales con sus bolsillos debajo, en orden estable. */
export function groupAccounts(accounts: Account[]) {
  const pockets = new Map<string, Account[]>();
  const roots: Account[] = [];
  for (const a of accounts) {
    if (a.parent_id) {
      const list = pockets.get(a.parent_id) ?? [];
      list.push(a);
      pockets.set(a.parent_id, list);
    } else roots.push(a);
  }
  return roots.map((root) => {
    const children = pockets.get(root.id) ?? [];
    const total = root.balance + children.reduce((s, c) => s + c.balance, 0);
    return { account: root, pockets: children, total };
  });
}

/** Nombre completo: "Nu · Cajita viaje". */
export function accountLabel(account: Account, byId: Map<string, Account>) {
  const parent = account.parent_id ? byId.get(account.parent_id) : undefined;
  return parent ? `${parent.name} › ${account.name}` : account.name;
}
