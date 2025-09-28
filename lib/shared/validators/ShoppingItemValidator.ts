import { z } from 'zod'
import { CreateItemDto } from '../../application/dto/CreateItemDto'
import { IValidator, ValidationResult } from '../../application/interfaces/IValidator'

const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  category: z.string().min(1, 'Category is required'),
  status: z.string().min(1, 'Status is required'),
  completed: z.boolean().optional()
})

export class ShoppingItemValidator implements IValidator<CreateItemDto> {
  validate(data: CreateItemDto): ValidationResult {
    try {
      createItemSchema.parse(data)
      return { isValid: true, errors: [] }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        }
      }
      return {
        isValid: false,
        errors: ['Unknown validation error']
      }
    }
  }
}
