export const CATEGORIES = {
  SUPERMARKET: 'supermercado',
  GREENGROCER: 'verduleria',
  BUTCHER: 'carniceria',
} as const

export const ITEM_STATUS = {
  THIS_MONTH: 'este-mes',
  NEXT_MONTH: 'proximo-mes',
} as const

export const CATEGORY_CONFIG = {
  [CATEGORIES.SUPERMARKET]: {
    name: 'Supermercado',
    color: '#10b981',
    bgColor: 'bg-[#10b981]',
  },
  [CATEGORIES.GREENGROCER]: {
    name: 'Verdulería',
    color: '#f59e0b',
    bgColor: 'bg-[#f59e0b]',
  },
  [CATEGORIES.BUTCHER]: {
    name: 'Carnicería',
    color: '#0891b2',
    bgColor: 'bg-[#0891b2]',
  },
} as const

export const STATUS_LABELS = {
  [ITEM_STATUS.THIS_MONTH]: 'Este mes',
  [ITEM_STATUS.NEXT_MONTH]: 'Próximo mes',
} as const

export type CategoryType = typeof CATEGORIES[keyof typeof CATEGORIES]
export type ItemStatusType = typeof ITEM_STATUS[keyof typeof ITEM_STATUS]
