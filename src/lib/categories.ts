import {
  Briefcase, Bus, Car, CircleEllipsis, GraduationCap, Gift, HeartPulse,
  House, Laptop, PiggyBank, Popcorn, ReceiptText, ShoppingBag,
  ShoppingBasket, TrendingUp, Utensils, type LucideIcon,
} from "lucide-react";
import type { TxType } from "./types";

type Category = { key: string; icon: LucideIcon };

export const CATEGORIES: Record<TxType, Category[]> = {
  expense: [
    { key: "groceries", icon: ShoppingBasket },
    { key: "food", icon: Utensils },
    { key: "transport", icon: Bus },
    { key: "home", icon: House },
    { key: "bills", icon: ReceiptText },
    { key: "health", icon: HeartPulse },
    { key: "shopping", icon: ShoppingBag },
    { key: "fun", icon: Popcorn },
    { key: "education", icon: GraduationCap },
    { key: "car", icon: Car },
    { key: "other", icon: CircleEllipsis },
  ],
  income: [
    { key: "salary", icon: Briefcase },
    { key: "freelance", icon: Laptop },
    { key: "investment", icon: TrendingUp },
    { key: "savings", icon: PiggyBank },
    { key: "gift", icon: Gift },
    { key: "other", icon: CircleEllipsis },
  ],
};

const ICONS = new Map<string, LucideIcon>(
  [...CATEGORIES.expense, ...CATEGORIES.income].map((c) => [c.key, c.icon]),
);

export function categoryIcon(key: string): LucideIcon {
  return ICONS.get(key) ?? CircleEllipsis;
}

export function isValidCategory(type: TxType, key: string) {
  return CATEGORIES[type].some((c) => c.key === key);
}
