import { ShoppingItem } from '../entities/ShoppingItem'
import { ItemName } from '../value-objects/ItemName'
import { ItemStatus } from '../value-objects/ItemStatus'
import { Category } from '../value-objects/Category'
import { IShoppingItemRepository, CreateItemData, UpdateItemData } from '../repositories/IShoppingItemRepository'

export class ShoppingItemService {
  constructor(private repository: IShoppingItemRepository) {}

  async getAllItems(): Promise<ShoppingItem[]> {
    return this.repository.findAll()
  }

  async getItemById(id: string): Promise<ShoppingItem | null> {
    return this.repository.findById(id)
  }

  async getItemsByStatus(status: string): Promise<ShoppingItem[]> {
    return this.repository.findByStatus(status)
  }

  async createItem(data: CreateItemData): Promise<ShoppingItem> {
    // Validate data
    ItemName.create(data.name)
    Category.create(data.category)
    ItemStatus.create(data.status)

    return this.repository.create(data)
  }

  async updateItem(id: string, data: UpdateItemData): Promise<ShoppingItem> {
    // Validate data if provided
    if (data.name) ItemName.create(data.name)
    if (data.category) Category.create(data.category)
    if (data.status) ItemStatus.create(data.status)

    return this.repository.update(id, data)
  }

  async deleteItem(id: string): Promise<void> {
    return this.repository.delete(id)
  }

  async toggleItemCompleted(id: string): Promise<ShoppingItem> {
    const item = await this.repository.findById(id)
    if (!item) {
      throw new Error('Item not found')
    }

    item.toggleCompleted()
    return this.repository.update(id, { completed: item.completed })
  }

  async moveItemToStatus(id: string, newStatus: string): Promise<ShoppingItem> {
    ItemStatus.create(newStatus) // Validate status
    
    const item = await this.repository.findById(id)
    if (!item) {
      throw new Error('Item not found')
    }

    // Get next order index for the new status
    const nextOrderIndex = await this.repository.getNextOrderIndex(newStatus)
    
    return this.repository.update(id, { 
      status: newStatus, 
      orderIndex: nextOrderIndex 
    })
  }

  async reorderItems(status: string, sourceIndex: number, destIndex: number): Promise<void> {
    const items = await this.repository.findByStatus(status)
    
    if (sourceIndex === destIndex) return

    const reorderedItems = [...items]
    const [movedItem] = reorderedItems.splice(sourceIndex, 1)
    reorderedItems.splice(destIndex, 0, movedItem)

    // Update order indices
    const itemsWithNewOrder = reorderedItems.map((item, index) => ({
      id: item.id,
      orderIndex: index
    }))

    return this.repository.reorderItems(status, itemsWithNewOrder)
  }
}
