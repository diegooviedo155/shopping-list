import { ShoppingItem } from '../entities/ShoppingItem'

export interface CreateItemData {
  name: string
  category: string
  status: string
  completed?: boolean
  orderIndex?: number
}

export interface UpdateItemData {
  name?: string
  category?: string
  status?: string
  completed?: boolean
  orderIndex?: number
}

export interface ShoppingItemFilters {
  status?: string
  category?: string
  completed?: boolean
}

export interface IShoppingItemRepository {
  findAll(): Promise<ShoppingItem[]>
  findById(id: string): Promise<ShoppingItem | null>
  findByStatus(status: string): Promise<ShoppingItem[]>
  create(data: CreateItemData): Promise<ShoppingItem>
  update(id: string, data: UpdateItemData): Promise<ShoppingItem>
  delete(id: string): Promise<void>
  reorderItems(status: string, items: { id: string; orderIndex: number }[]): Promise<void>
  getNextOrderIndex(status: string): Promise<number>
}
