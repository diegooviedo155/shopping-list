export type Category = "supermercado" | "verduleria" | "carniceria"
export type ItemStatus = "este-mes" | "proximo-mes"

export interface ShoppingItem {
  id: string
  name: string
  category: Category
  status: ItemStatus
  completed: boolean
  orderIndex: number // Changed from order_index to match Prisma camelCase
  createdAt: Date // Changed from created_at to Date type
  updatedAt: Date // Changed from updated_at to Date type
}

export interface CreateShoppingItem {
  name: string
  category: Category
  status: ItemStatus
  completed?: boolean
  orderIndex: number
}

export interface UpdateShoppingItem {
  name?: string
  category?: Category
  status?: ItemStatus
  completed?: boolean
  orderIndex?: number
}
