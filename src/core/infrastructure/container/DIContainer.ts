import { PrismaClient } from '@prisma/client'
import { PrismaShoppingItemRepository } from '../database/repositories/PrismaShoppingItemRepository'
import { ShoppingItemService } from '../../domain/services/ShoppingItemService'
import { CreateItemUseCase } from '../../application/use-cases/CreateItemUseCase'
import { ShoppingItemValidator } from '../../../shared/validators/ShoppingItemValidator'
import { IShoppingItemRepository } from '../../domain/repositories/IShoppingItemRepository'

export class DIContainer {
  private static instance: DIContainer
  private prisma: PrismaClient
  private shoppingItemRepository: IShoppingItemRepository
  private shoppingItemService: ShoppingItemService
  private createItemUseCase: CreateItemUseCase
  private shoppingItemValidator: ShoppingItemValidator

  private constructor() {
    this.prisma = new PrismaClient()
    this.shoppingItemRepository = new PrismaShoppingItemRepository(this.prisma)
    this.shoppingItemService = new ShoppingItemService(this.shoppingItemRepository)
    this.shoppingItemValidator = new ShoppingItemValidator()
    this.createItemUseCase = new CreateItemUseCase(
      this.shoppingItemService,
      this.shoppingItemValidator
    )
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer()
    }
    return DIContainer.instance
  }

  getShoppingItemService(): ShoppingItemService {
    return this.shoppingItemService
  }

  getCreateItemUseCase(): CreateItemUseCase {
    return this.createItemUseCase
  }

  getShoppingItemRepository(): IShoppingItemRepository {
    return this.shoppingItemRepository
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}
