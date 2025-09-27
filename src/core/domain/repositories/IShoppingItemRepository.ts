import { ShoppingItem } from '../entities/ShoppingItem'
import { ItemStatus } from '../value-objects/ItemStatus'
import { Category } from '../value-objects/Category'

export interface CreateItemData {
  name: string
  category: string
  status: string
}

export interface UpdateItemData {
  name?: string
  category?: string
  status?: string
  completed?: boolean
  orderIndex?: number
}

export interface ShoppingItemFilters {
  category?: string
  status?: string
  completed?: boolean
}

export interface IShoppingItemRepository {
  findById(id: string): Promise<ShoppingItem | null>
  findAll(filters?: ShoppingItemFilters): Promise<ShoppingItem[]>
  findByCategory(category: Category): Promise<ShoppingItem[]>
  findByStatus(status: ItemStatus): Promise<ShoppingItem[]>
  create(data: CreateItemData): Promise<ShoppingItem>
  update(id: string, data: UpdateItemData): Promise<ShoppingItem>
  delete(id: string): Promise<void>
  reorderItems(status: ItemStatus, sourceIndex: number, destIndex: number): Promise<void>
  getNextOrderIndex(status: ItemStatus): Promise<number>
}
