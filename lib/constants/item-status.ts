export const ITEM_STATUS = {
  THIS_MONTH: "este-mes",
  NEXT_MONTH: "proximo-mes",
} as const;

export type ItemStatusType = typeof ITEM_STATUS[keyof typeof ITEM_STATUS];

export const ITEM_STATUS_LABELS: Record<ItemStatusType, string> = {
  [ITEM_STATUS.THIS_MONTH]: "Este mes",
  [ITEM_STATUS.NEXT_MONTH]: "Próximo mes",
};
