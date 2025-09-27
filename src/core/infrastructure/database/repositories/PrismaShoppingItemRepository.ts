import { PrismaClient } from '@prisma/client'
import { ShoppingItem } from '../../../domain/entities/ShoppingItem'
import { ItemName } from '../../../domain/value-objects/ItemName'
import { ItemStatus } from '../../../domain/value-objects/ItemStatus'
import { Category } from '../../../domain/value-objects/Category'
import { IShoppingItemRepository, CreateItemData, UpdateItemData, ShoppingItemFilters } from '../../../domain/repositories/IShoppingItemRepository'
import { toDatabaseStatus, toFrontendStatus } from '../../../../lib/utils/status-conversion'

export class PrismaShoppingItemRepository implements IShoppingItemRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<ShoppingItem | null> {
    const item = await this.prisma.shoppingItem.findUnique({
      where: { id },
    })

    if (!item) return null

    return this.mapToEntity(item)
  }

  async findAll(filters?: ShoppingItemFilters): Promise<ShoppingItem[]> {
    const where: any = {}

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.completed !== undefined) {
      where.completed = filters.completed
    }

    const items = await this.prisma.shoppingItem.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    })

    return items.map(item => this.mapToEntity(item))
  }

  async findByCategory(category: Category): Promise<ShoppingItem[]> {
    const items = await this.prisma.shoppingItem.findMany({
      where: { category: category.getValue() },
      orderBy: { orderIndex: 'asc' },
    })

    return items.map(item => this.mapToEntity(item))
  }

  async findByStatus(status: ItemStatus): Promise<ShoppingItem[]> {
    // Convert frontend status format (este-mes) to database format (este_mes)
    const dbStatus = toDatabaseStatus(status.getValue())
    
    const items = await this.prisma.shoppingItem.findMany({
      where: { status: dbStatus },
      orderBy: { orderIndex: 'asc' },
    })

    return items.map(item => this.mapToEntity(item))
  }

  async create(data: CreateItemData): Promise<ShoppingItem> {
    const orderIndex = await this.getNextOrderIndex(new ItemStatus(data.status))
    
    // Convert frontend status format (este-mes) to database format (este_mes)
    const dbStatus = toDatabaseStatus(data.status)

    const item = await this.prisma.shoppingItem.create({
      data: {
        name: data.name,
        category: data.category,
        status: dbStatus,
        completed: false,
        orderIndex,
      },
    })

    return this.mapToEntity(item)
  }

  async update(id: string, data: UpdateItemData): Promise<ShoppingItem> {
    const updateData: any = {
      ...(data.name && { name: data.name }),
      ...(data.category && { category: data.category }),
      ...(data.completed !== undefined && { completed: data.completed }),
      ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
    }

    // Convert frontend status format (este-mes) to database format (este_mes) if status is provided
    if (data.status) {
      updateData.status = toDatabaseStatus(data.status)
    }

    const item = await this.prisma.shoppingItem.update({
      where: { id },
      data: updateData,
    })

    return this.mapToEntity(item)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.shoppingItem.delete({
      where: { id },
    })
  }

  async reorderItems(status: ItemStatus, sourceIndex: number, destIndex: number): Promise<void> {
    // Convert frontend status format (este-mes) to database format (este_mes)
    const dbStatus = toDatabaseStatus(status.getValue())
    
    const items = await this.prisma.shoppingItem.findMany({
      where: { status: dbStatus },
      orderBy: { orderIndex: 'asc' },
    })

    if (sourceIndex >= items.length || destIndex >= items.length) {
      throw new Error('Invalid indices for reordering')
    }

    // Reorder the items array
    const [reorderedItem] = items.splice(sourceIndex, 1)
    items.splice(destIndex, 0, reorderedItem)

    // Update all items with new order indices
    const updatePromises = items.map((item, index) =>
      this.prisma.shoppingItem.update({
        where: { id: item.id },
        data: { orderIndex: index },
      })
    )

    await Promise.all(updatePromises)
  }

  async getNextOrderIndex(status: ItemStatus): Promise<number> {
    // Convert frontend status format (este-mes) to database format (este_mes)
    const dbStatus = toDatabaseStatus(status.getValue())
    
    const maxItem = await this.prisma.shoppingItem.findFirst({
      where: { status: dbStatus },
      orderBy: { orderIndex: 'desc' },
    })

    return (maxItem?.orderIndex ?? -1) + 1
  }

  private mapToEntity(item: any): ShoppingItem {
    // Convert database status format (este_mes) to frontend format (este-mes)
    const frontendStatus = toFrontendStatus(item.status)
    
    return ShoppingItem.fromPersistence({
      id: item.id,
      name: new ItemName(item.name),
      category: new Category(item.category),
      status: new ItemStatus(frontendStatus),
      completed: item.completed,
      orderIndex: item.orderIndex,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    })
  }
}
