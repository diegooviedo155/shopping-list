import { ShoppingItem } from '../../domain/entities/ShoppingItem'
import { ShoppingItemService } from '../../domain/services/ShoppingItemService'
import { IValidator } from '../interfaces/IValidator'
import { CreateItemDto } from '../dto/CreateItemDto'

export interface CreateItemRequest {
  name: string
  category: string
  status: string
}

export interface CreateItemResponse {
  success: boolean
  data?: ShoppingItem
  error?: string
}

export class CreateItemUseCase {
  constructor(
    private shoppingItemService: ShoppingItemService,
    private validator: IValidator<CreateItemDto>
  ) {}

  async execute(request: CreateItemRequest): Promise<CreateItemResponse> {
    try {
      // Validate input
      const validationResult = this.validator.validate({
        name: request.name,
        category: request.category,
        status: request.status,
      })

      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.join(', '),
        }
      }

      // Execute business logic
      const item = await this.shoppingItemService.createItem({
        name: request.name,
        category: request.category,
        status: request.status,
      })

      return {
        success: true,
        data: item,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }
}
