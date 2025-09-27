import { ShoppingItem } from '../entities/ShoppingItem'
import { ItemName } from '../value-objects/ItemName'
import { ItemStatus } from '../value-objects/ItemStatus'
import { Category } from '../value-objects/Category'
import { IShoppingItemRepository } from '../repositories/IShoppingItemRepository'

export interface CreateItemCommand {
  name: string
  category: string
  status: string
}

export interface UpdateItemCommand {
  id: string
  name?: string
  category?: string
  status?: string
  completed?: boolean
}

export interface ReorderItemsCommand {
  status: string
  sourceIndex: number
  destIndex: number
}

export class ShoppingItemService {
  constructor(private repository: IShoppingItemRepository) {}

  async createItem(command: CreateItemCommand): Promise<ShoppingItem> {
    const name = new ItemName(command.name)
    const category = new Category(command.category)
    const status = new ItemStatus(command.status)

    const orderIndex = await this.repository.getNextOrderIndex(status)

    return this.repository.create({
      name: name.getValue(),
      category: category.getValue(),
      status: status.getValue(),
    })
  }

  async updateItem(command: UpdateItemCommand): Promise<ShoppingItem> {
    const existingItem = await this.repository.findById(command.id)
    if (!existingItem) {
      throw new Error('Item not found')
    }

    const updateData: any = {}

    if (command.name !== undefined) {
      updateData.name = new ItemName(command.name).getValue()
    }

    if (command.category !== undefined) {
      updateData.category = new Category(command.category).getValue()
    }

    if (command.status !== undefined) {
      updateData.status = new ItemStatus(command.status).getValue()
    }

    if (command.completed !== undefined) {
      updateData.completed = command.completed
    }

    return this.repository.update(command.id, updateData)
  }

  async deleteItem(id: string): Promise<void> {
    const existingItem = await this.repository.findById(id)
    if (!existingItem) {
      throw new Error('Item not found')
    }

    await this.repository.delete(id)
  }

  async toggleItemCompleted(id: string): Promise<ShoppingItem> {
    const item = await this.repository.findById(id)
    if (!item) {
      throw new Error('Item not found')
    }

    const newCompleted = !item.completed
    return this.repository.update(id, { completed: newCompleted })
  }

  async moveItemToStatus(id: string, newStatus: string): Promise<ShoppingItem> {
    const item = await this.repository.findById(id)
    if (!item) {
      throw new Error('Item not found')
    }

    const status = new ItemStatus(newStatus)
    const orderIndex = await this.repository.getNextOrderIndex(status)

    return this.repository.update(id, {
      status: status.getValue(),
      orderIndex,
    })
  }

  async reorderItems(command: ReorderItemsCommand): Promise<void> {
    const status = new ItemStatus(command.status)
    await this.repository.reorderItems(status, command.sourceIndex, command.destIndex)
  }

  async getItemsByStatus(status: string): Promise<ShoppingItem[]> {
    const itemStatus = new ItemStatus(status)
    return this.repository.findByStatus(itemStatus)
  }

  async getItemsByCategory(category: string): Promise<ShoppingItem[]> {
    const itemCategory = new Category(category)
    return this.repository.findByCategory(itemCategory)
  }

  async getAllItems(): Promise<ShoppingItem[]> {
    return this.repository.findAll()
  }
}
