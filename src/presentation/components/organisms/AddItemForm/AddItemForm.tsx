import React, { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/card'
import { Button, Input } from '../../atoms'
import { ButtonGroup, FormField } from '../../molecules'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

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

export interface AddItemFormProps {
  onAddItem: (data: FormData) => Promise<void>
  isLoading?: boolean
  className?: string
}

const CATEGORIES = [
  { 
    value: 'supermercado', 
    label: 'Supermercado', 
    color: '#10b981',
    icon: '🛒'
  },
  { 
    value: 'verduleria', 
    label: 'Verdulería', 
    color: '#f59e0b',
    icon: '🥬'
  },
  { 
    value: 'carniceria', 
    label: 'Carnicería', 
    color: '#0891b2',
    icon: '🥩'
  },
] as const

const STATUSES = [
  { value: 'este-mes', label: 'Este mes' },
  { value: 'proximo-mes', label: 'Próximo mes' },
] as const

export const AddItemForm = React.forwardRef<HTMLFormElement, AddItemFormProps>(
  ({ onAddItem, isLoading = false, className }, ref) => {
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

    const categoryOptions = CATEGORIES.map(cat => ({
      value: cat.value,
      label: cat.label,
      icon: cat.icon,
    }))

    const statusOptions = STATUSES.map(status => ({
      value: status.value,
      label: status.label,
    }))

    return (
      <Card className={cn('p-4', className)}>
        <form ref={ref} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            {...register('name')}
            label="Producto"
            placeholder="Agregar producto..."
            error={errors.name?.message}
            disabled={isSubmitting || isLoading}
            required
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Categoría</label>
            <ButtonGroup
              options={categoryOptions}
              value={selectedCategory}
              onChange={(value) => setSelectedCategory(value as FormData['category'])}
              variant="outline"
              size="sm"
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Estado</label>
            <ButtonGroup
              options={statusOptions}
              value={selectedStatus}
              onChange={(value) => setSelectedStatus(value as FormData['status'])}
              variant="outline"
              size="sm"
              disabled={isSubmitting || isLoading}
            />
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={!isFormValid}
            fullWidth
            loading={isSubmitting || isLoading}
            leftIcon={<Plus />}
          >
            {isSubmitting || isLoading ? 'Agregando...' : 'Agregar Producto'}
          </Button>
        </form>
      </Card>
    )
  }
)

AddItemForm.displayName = 'AddItemForm'
