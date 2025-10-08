"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createItemSchema, type CreateItemInput } from '@/lib/validations/shopping'
import { CATEGORIES, CATEGORY_CONFIG } from '@/lib/constants/categories'
import { ITEM_STATUS, ITEM_STATUS_LABELS } from '@/lib/constants/item-status'
import type { Category, ItemStatus } from '@/lib/types/database'

interface AddItemFormProps {
  onAddItem: (data: CreateItemInput) => Promise<void>
  isLoading?: boolean
  className?: string
}

export function AddItemForm({ onAddItem, isLoading = false, className }: AddItemFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('supermercado')
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus>('este-mes')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: '',
      category: 'supermercado',
      status: 'este-mes',
    },
  })

  const watchedName = watch('name')

  const onSubmit = async (data: CreateItemInput) => {
    try {
      await onAddItem({
        ...data,
        category: selectedCategory,
        status: selectedStatus,
      })
      reset()
    } catch (error) {
    }
  }

  const isFormValid = watchedName?.trim().length >= 2 && !isSubmitting && !isLoading

  return (
    <Card className={cn('p-4', className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Input de nombre */}
        <div className="space-y-2">
          <Input
            {...register('name')}
            placeholder="Agregar producto..."
            className={cn(
              'flex-1',
              errors.name && 'border-destructive focus-visible:ring-destructive'
            )}
            disabled={isSubmitting || isLoading}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Selector de categoría */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Categoría</p>
          <div className="flex gap-2">
            {(Object.values(CATEGORIES) as Category[]).map((category) => (
              <Button
                key={category}
                type="button"
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "flex-1 text-xs transition-all",
                  selectedCategory === category && CATEGORY_CONFIG[category].bgColor,
                  (isSubmitting || isLoading) && "opacity-50 cursor-not-allowed"
                )}
                disabled={isSubmitting || isLoading}
              >
                <Badge
                  variant="secondary"
                  className="text-xs mr-1 border-0"
                  style={{
                    backgroundColor: `${CATEGORY_CONFIG[category].color}15`,
                    color: CATEGORY_CONFIG[category].color,
                    border: `1px solid ${CATEGORY_CONFIG[category].color}30`,
                  }}
                >
                  {CATEGORY_CONFIG[category].name}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Selector de estado */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Estado</p>
          <div className="flex gap-2">
            {(Object.values(ITEM_STATUS) as ItemStatus[]).map((status) => (
              <Button
                key={status}
                type="button"
                variant={selectedStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  "flex-1 text-xs",
                  (isSubmitting || isLoading) && "opacity-50 cursor-not-allowed"
                )}
                disabled={isSubmitting || isLoading}
              >
                {ITEM_STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
        </div>

        {/* Botón de envío */}
        <Button
          type="submit"
          size="sm"
          disabled={!isFormValid}
          className="w-full"
        >
          {isSubmitting || isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {isSubmitting || isLoading ? 'Agregando...' : 'Agregar Producto'}
        </Button>
      </form>
    </Card>
  )
}
