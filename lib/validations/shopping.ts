import { z } from 'zod'
import { CATEGORIES } from '@/lib/constants/categories'
import { ITEM_STATUS } from '@/lib/constants/item-status'

// Esquema para crear un item
export const createItemSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  category: z
    .enum(Object.values(CATEGORIES) as [string, ...string[]], {
      errorMap: () => ({ message: 'Categoría inválida' })
    }),
  status: z
    .enum(Object.values(ITEM_STATUS) as [string, ...string[]], {
      errorMap: () => ({ message: 'Estado inválido' })
    }),
})

// Esquema para actualizar un item
export const updateItemSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim()
    .optional(),
  category: z
    .enum(Object.values(CATEGORIES) as [string, ...string[]], {
      errorMap: () => ({ message: 'Categoría inválida' })
    })
    .optional(),
  status: z
    .enum(Object.values(ITEM_STATUS) as [string, ...string[]], {
      errorMap: () => ({ message: 'Estado inválido' })
    })
    .optional(),
  completed: z.boolean().optional(),
  orderIndex: z.number().int().min(0).optional(),
})

// Esquema para reordenar items
export const reorderItemsSchema = z.object({
  status: z
    .enum(Object.values(ITEM_STATUS) as [string, ...string[]], {
      errorMap: () => ({ message: 'Estado inválido' })
    }),
  sourceIndex: z
    .number()
    .int()
    .min(0, 'Índice de origen inválido'),
  destIndex: z
    .number()
    .int()
    .min(0, 'Índice de destino inválido'),
})

// Esquema para búsqueda/filtros
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'La búsqueda no puede estar vacía')
    .max(50, 'La búsqueda no puede exceder 50 caracteres')
    .trim()
    .optional(),
  category: z
    .enum(Object.values(CATEGORIES) as [string, ...string[]])
    .optional(),
  status: z
    .enum(Object.values(ITEM_STATUS) as [string, ...string[]])
    .optional(),
  completed: z.boolean().optional(),
})

// Tipos derivados de los esquemas
export type CreateItemInput = z.infer<typeof createItemSchema>
export type UpdateItemInput = z.infer<typeof updateItemSchema>
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>
export type SearchInput = z.infer<typeof searchSchema>

// Funciones de validación
export function validateCreateItem(data: unknown) {
  return createItemSchema.safeParse(data)
}

export function validateUpdateItem(data: unknown) {
  return updateItemSchema.safeParse(data)
}

export function validateReorderItems(data: unknown) {
  return reorderItemsSchema.safeParse(data)
}

export function validateSearch(data: unknown) {
  return searchSchema.safeParse(data)
}
