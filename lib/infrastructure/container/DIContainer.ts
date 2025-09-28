import { PrismaClient } from '@prisma/client'
import { PrismaShoppingItemRepository } from '../database/repositories/PrismaShoppingItemRepository'
import { ShoppingItemService } from '../../domain/services/ShoppingItemService'
import { CreateItemUseCase } from '../../application/use-cases/CreateItemUseCase'
import { ShoppingItemValidator } from '../../shared/validators/ShoppingItemValidator'

// Singleton instances
let prismaClient: PrismaClient | null = null
let shoppingItemRepository: PrismaShoppingItemRepository | null = null
let shoppingItemService: ShoppingItemService | null = null
let createItemUseCase: CreateItemUseCase | null = null
let shoppingItemValidator: ShoppingItemValidator | null = null

export class DIContainer {
  static getPrismaClient(): PrismaClient {
    if (!prismaClient) {
      prismaClient = new PrismaClient()
    }
    return prismaClient
  }

  static getShoppingItemRepository(): PrismaShoppingItemRepository {
    if (!shoppingItemRepository) {
      shoppingItemRepository = new PrismaShoppingItemRepository(this.getPrismaClient())
    }
    return shoppingItemRepository
  }

  static getShoppingItemService(): ShoppingItemService {
    if (!shoppingItemService) {
      shoppingItemService = new ShoppingItemService(this.getShoppingItemRepository())
    }
    return shoppingItemService
  }

  static getCreateItemUseCase(): CreateItemUseCase {
    if (!createItemUseCase) {
      createItemUseCase = new CreateItemUseCase(
        this.getShoppingItemService(),
        this.getShoppingItemValidator()
      )
    }
    return createItemUseCase
  }

  static getShoppingItemValidator(): ShoppingItemValidator {
    if (!shoppingItemValidator) {
      shoppingItemValidator = new ShoppingItemValidator()
    }
    return shoppingItemValidator
  }
}
