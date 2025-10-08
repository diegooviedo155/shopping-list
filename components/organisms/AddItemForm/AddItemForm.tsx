import React, { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, Button, Input } from '../../atoms'
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
    icon: '🛒',
    selectedBg: 'bg-gradient-to-r from-green-500 to-green-600',
    unselectedBg: 'bg-slate-700/50',
    selectedText: 'text-white',
    unselectedText: 'text-slate-300',
    selectedBorder: 'border-green-400',
    unselectedBorder: 'border-slate-600',
    shadow: 'shadow-green-500/25'
  },
  { 
    value: 'verduleria', 
    label: 'Verdulería', 
    icon: '🥬',
    selectedBg: 'bg-gradient-to-r from-orange-500 to-orange-600',
    unselectedBg: 'bg-slate-700/50',
    selectedText: 'text-white',
    unselectedText: 'text-slate-300',
    selectedBorder: 'border-orange-400',
    unselectedBorder: 'border-slate-600',
    shadow: 'shadow-orange-500/25'
  },
  { 
    value: 'carniceria', 
    label: 'Carnicería', 
    icon: '🥩',
    selectedBg: 'bg-gradient-to-r from-red-500 to-red-600',
    unselectedBg: 'bg-slate-700/50',
    selectedText: 'text-white',
    unselectedText: 'text-slate-300',
    selectedBorder: 'border-red-400',
    unselectedBorder: 'border-slate-600',
    shadow: 'shadow-red-500/25'
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
      <div className={cn('w-full', className)}>
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Agregar Producto</h3>
              <p className="text-sm text-slate-400">Completa los datos del producto</p>
            </div>
          </div>

          <form ref={ref} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Producto Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center gap-1">
                Producto
                <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Input
                  {...register('name')}
                  placeholder="¿Qué necesitas comprar?"
                  error={errors.name?.message}
                  disabled={isSubmitting || isLoading}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary focus:ring-primary/20 h-12 text-base"
                />
              </div>
            </div>

            {/* Categoría Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Categoría</label>
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 min-w-max">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setSelectedCategory(category.value as FormData['category'])}
                      disabled={isSubmitting || isLoading}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-300',
                        'hover:scale-105 active:scale-95 hover:shadow-lg',
                        'min-w-[140px] justify-center',
                        selectedCategory === category.value
                          ? `${category.selectedBg} ${category.selectedText} ${category.selectedBorder} ${category.shadow} shadow-lg`
                          : `${category.unselectedBg} ${category.unselectedText} ${category.unselectedBorder} hover:bg-slate-600/50`,
                        (isSubmitting || isLoading) && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className="text-xl">{category.icon}</span>
                      <span className="text-sm font-semibold whitespace-nowrap">
                        {category.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Estado Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Estado</label>
              <div className="grid grid-cols-2 gap-3">
                {STATUSES.map((status) => (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => setSelectedStatus(status.value as FormData['status'])}
                    disabled={isSubmitting || isLoading}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-300',
                      'hover:scale-105 active:scale-95',
                      selectedStatus === status.value
                        ? 'bg-gradient-to-r from-primary to-primary/80 text-white border-primary shadow-lg shadow-primary/25'
                        : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-600/50',
                      (isSubmitting || isLoading) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className="text-sm font-semibold">{status.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={!isFormValid}
              fullWidth
              loading={isSubmitting || isLoading}
              className="h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Agregando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Agregar Producto
                </div>
              )}
            </Button>
          </form>
        </div>
      </div>
    )
  }
)

AddItemForm.displayName = 'AddItemForm'
