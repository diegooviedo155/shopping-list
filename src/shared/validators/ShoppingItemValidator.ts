import { z } from 'zod'
import { IValidator } from '../../core/application/interfaces/IValidator'
import { CreateItemDto } from '../../core/application/dto/CreateItemDto'

const createItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  category: z
    .enum(['supermercado', 'verduleria', 'carniceria'], {
      errorMap: () => ({ message: 'Invalid category' })
    }),
  status: z
    .enum(['este-mes', 'proximo-mes'], {
      errorMap: () => ({ message: 'Invalid status' })
    }),
})

export class ShoppingItemValidator implements IValidator<CreateItemDto> {
  validate(data: CreateItemDto) {
    try {
      createItemSchema.parse(data)
      return {
        isValid: true,
        errors: [],
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => e.message),
        }
      }
      
      return {
        isValid: false,
        errors: ['Validation error occurred'],
      }
    }
  }
}
