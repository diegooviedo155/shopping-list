"use client"

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  category: z.enum(['supermercado', 'verduleria', 'carniceria']),
  status: z.enum(['este-mes', 'proximo-mes']),
})

type FormData = z.infer<typeof formSchema>

interface AddItemFormProps {
  onAddItem: (data: FormData) => Promise<void>
  isLoading?: boolean
  className?: string
}

const CATEGORIES = [
  { value: 'supermercado', label: 'Supermercado', color: '#10b981' },
  { value: 'verduleria', label: 'Verdulería', color: '#f59e0b' },
  { value: 'carniceria', label: 'Carnicería', color: '#0891b2' },
] as const

const STATUSES = [
  { value: 'este-mes', label: 'Este mes' },
  { value: 'proximo-mes', label: 'Próximo mes' },
] as const

export function AddItemForm({ onAddItem, isLoading = false, className }: AddItemFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<FormData['category']>('supermercado')
  const [selectedStatus, setSelectedStatus] = useState<FormData['status']>('este-mes')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: 'supermercado',
      status: 'este-mes',
    },
  })

  const watchedName = watch('name')

  const onSubmit = useCallback(async (data: FormData) => {
    try {
      await onAddItem({
        ...data,
        category: selectedCategory,
        status: selectedStatus,
      })
      reset()
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }, [onAddItem, selectedCategory, selectedStatus, reset])

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
            {CATEGORIES.map((category) => (
              <Button
                key={category.value}
                type="button"
                variant={selectedCategory === category.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.value)}
                className={cn(
                  "flex-1 text-xs transition-all",
                  selectedCategory === category.value && "bg-primary text-primary-foreground",
                  (isSubmitting || isLoading) && "opacity-50 cursor-not-allowed"
                )}
                disabled={isSubmitting || isLoading}
              >
                <Badge
                  variant="secondary"
                  className="text-xs mr-1 border-0"
                  style={{
                    backgroundColor: `${category.color}15`,
                    color: category.color,
                    border: `1px solid ${category.color}30`,
                  }}
                >
                  {category.label}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Selector de estado */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Estado</p>
          <div className="flex gap-2">
            {STATUSES.map((status) => (
              <Button
                key={status.value}
                type="button"
                variant={selectedStatus === status.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(status.value)}
                className={cn(
                  "flex-1 text-xs",
                  (isSubmitting || isLoading) && "opacity-50 cursor-not-allowed"
                )}
                disabled={isSubmitting || isLoading}
              >
                {status.label}
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
