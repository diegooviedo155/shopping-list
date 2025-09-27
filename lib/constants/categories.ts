import type { Category } from "@/lib/types/database";

export const CATEGORIES = {
  SUPERMARKET: "supermercado",
  GREENGROCER: "verduleria",
  BUTCHER: "carniceria",
} as const;

type CategoryType = typeof CATEGORIES[keyof typeof CATEGORIES];

export const CATEGORY_CONFIG: Record<
  CategoryType,
  { name: string; color: string; bgColor: string }
> = {
  [CATEGORIES.SUPERMARKET]: {
    name: "Supermercado",
    color: "var(--color-supermarket)",
    bgColor: "bg-[var(--color-supermarket)]",
  },
  [CATEGORIES.GREENGROCER]: {
    name: "Verdulería",
    color: "var(--color-greengrocer)",
    bgColor: "bg-[var(--color-greengrocer)]",
  },
  [CATEGORIES.BUTCHER]: {
    name: "Carnicería",
    color: "var(--color-butcher)",
    bgColor: "bg-[var(--color-butcher)]",
  },
};
