import { PrismaClient } from '@prisma/client'
import { ShoppingItem } from '../../../domain/entities/ShoppingItem'
import { ItemName } from '../../../domain/value-objects/ItemName'
import { ItemStatus } from '../../../domain/value-objects/ItemStatus'
import { Category } from '../../../domain/value-objects/Category'
import { toDatabaseStatus, toFrontendStatus } from '@/lib/utils/status-conversion'

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

export class PrismaShoppingItemRepository implements IShoppingItemRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<ShoppingItem[]> {
    const items = await this.prisma.shoppingItem.findMany({
      orderBy: { orderIndex: 'asc' }
    })
    return items.map(item => this.mapToEntity(item))
  }

  async findById(id: string): Promise<ShoppingItem | null> {
    const item = await this.prisma.shoppingItem.findUnique({
      where: { id }
    })
    return item ? this.mapToEntity(item) : null
  }

  async findByStatus(status: string): Promise<ShoppingItem[]> {
    const dbStatus = toDatabaseStatus(status)
    const items = await this.prisma.shoppingItem.findMany({
      where: { status: dbStatus },
      orderBy: { orderIndex: 'asc' }
    })
    return items.map(item => this.mapToEntity(item))
  }

  async create(data: CreateItemData): Promise<ShoppingItem> {
    const dbStatus = toDatabaseStatus(data.status)
    const item = await this.prisma.shoppingItem.create({
      data: {
        name: data.name,
        category: data.category as any,
        status: dbStatus,
        completed: data.completed || false,
        orderIndex: data.orderIndex || 0
      }
    })
    return this.mapToEntity(item)
  }

  async update(id: string, data: UpdateItemData): Promise<ShoppingItem> {
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.category !== undefined) updateData.category = data.category as any
    if (data.status !== undefined) updateData.status = toDatabaseStatus(data.status)
    if (data.completed !== undefined) updateData.completed = data.completed
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex

    const item = await this.prisma.shoppingItem.update({
      where: { id },
      data: updateData
    })
    return this.mapToEntity(item)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.shoppingItem.delete({
      where: { id }
    })
  }

  async reorderItems(status: string, items: { id: string; orderIndex: number }[]): Promise<void> {
    const dbStatus = toDatabaseStatus(status)
    
    await this.prisma.$transaction(
      items.map(item => 
        this.prisma.shoppingItem.update({
          where: { id: item.id },
          data: { orderIndex: item.orderIndex }
        })
      )
    )
  }

  async getNextOrderIndex(status: string): Promise<number> {
    const dbStatus = toDatabaseStatus(status)
    const lastItem = await this.prisma.shoppingItem.findFirst({
      where: { status: dbStatus },
      orderBy: { orderIndex: 'desc' }
    })
    return lastItem ? lastItem.orderIndex + 1 : 0
  }

  private mapToEntity(item: any): ShoppingItem {
    return ShoppingItem.fromPersistence({
      id: item.id,
      name: ItemName.create(item.name),
      category: Category.create(item.category),
      status: ItemStatus.create(toFrontendStatus(item.status)),
      completed: item.completed,
      orderIndex: item.orderIndex,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })
  }
}
