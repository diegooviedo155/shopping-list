import { ShoppingItem } from '../../domain/entities/ShoppingItem'
import { ShoppingItemService } from '../../domain/services/ShoppingItemService'
import { CreateItemDto } from '../dto/CreateItemDto'
import { IValidator } from '../interfaces/IValidator'

export class CreateItemUseCase {
  constructor(
    private shoppingItemService: ShoppingItemService,
    private validator: IValidator<CreateItemDto>
  ) {}

  async execute(dto: CreateItemDto): Promise<ShoppingItem> {
    // Validate input
    const validationResult = this.validator.validate(dto)
    if (!validationResult.isValid) {
      throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`)
    }

    // Create item
    return this.shoppingItemService.createItem(dto)
  }
}
