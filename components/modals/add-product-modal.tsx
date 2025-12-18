"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, X, ShoppingCart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createItemSchema, type CreateItemInput } from '@/lib/validations/shopping'
import { useHybridShoppingSimple as useHybridShopping } from '@/hooks/use-hybrid-shopping-simple'
import { ITEM_STATUS, ITEM_STATUS_LABELS } from '@/lib/constants/item-status'
import { getIconEmoji, formatCategoryForUI } from '@/lib/constants/categories'


interface AddProductModalProps {
  onAddItem: (data: CreateItemInput) => Promise<void>
  isLoading?: boolean
  trigger?: React.ReactNode
}

export function AddProductModal({ onAddItem, isLoading = false, trigger }: AddProductModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<'este_mes' | 'proximo_mes'>('este_mes')
  
  const { categories, loading: categoriesLoading, activeSharedList } = useHybridShopping()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: '',
      categoryId: 'supermercado',
      status: 'este_mes',
    },
  })

  const watchedName = watch('name')

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].slug)
      setValue('categoryId', categories[0].slug)
    }
  }, [categories, selectedCategory, setValue])

  const onSubmit = async (data: CreateItemInput) => {
    try {
      await onAddItem({
        ...data,
        categoryId: selectedCategory,
        status: selectedStatus,
      })
      reset()
      setOpen(false)
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  const isFormValid = watchedName?.trim().length >= 2 && selectedCategory && !isSubmitting && !isLoading

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setValue('categoryId', categoryId)
  }

  const handleStatusChange = (status: 'este_mes' | 'proximo_mes') => {
    setSelectedStatus(status)
    setValue('status', status)
  }

  const defaultTrigger = (
    <Button className="gap-2">
      <Plus className="w-4 h-4" />
      Agregar Producto
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm bg-black/60" />
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-primary" />
            </div>
            Agregar Producto
          </DialogTitle>
          <DialogDescription>
            {activeSharedList ? (
              <div>
                Agregando a la lista compartida: <span className="font-semibold text-blue-600 dark:text-blue-400">{activeSharedList.name}</span>
              </div>
            ) : (
              'Completa los datos del producto que quieres agregar a tu lista.'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nombre del producto */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nombre del producto
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="¿Qué necesitas comprar?"
              className={cn(
                'h-11',
                errors.name && 'border-destructive focus-visible:ring-destructive'
              )}
              disabled={isSubmitting || isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Categoría</Label>
            <Select
              value={selectedCategory}
              onValueChange={handleCategoryChange}
              disabled={isSubmitting || isLoading || categoriesLoading}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getIconEmoji(category.icon)}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">¿Cuándo lo necesitas?</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={selectedStatus === 'este_mes' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('este_mes')}
                disabled={isSubmitting || isLoading}
                className="h-11"
              >
                Este mes
              </Button>
              <Button
                type="button"
                variant={selectedStatus === 'proximo_mes' ? 'default' : 'outline'}
                onClick={() => handleStatusChange('proximo_mes')}
                disabled={isSubmitting || isLoading}
                className="h-11"
              >
                Próximo mes
              </Button>
            </div>
          </div>

          {/* Resumen */}
          {watchedName && selectedCategory && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-muted/50 rounded-lg space-y-2"
            >
              <p className="text-sm font-medium text-muted-foreground">Resumen:</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  {getIconEmoji(categories.find(c => c.slug === selectedCategory)?.icon)}
                  {categories.find(c => c.slug === selectedCategory)?.name}
                </Badge>
                <Badge variant="outline">
                  {selectedStatus === 'este_mes' ? 'Este mes' : 'Próximo mes'}
                </Badge>
              </div>
            </motion.div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting || isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid}
              className="flex-1 gap-2"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Agregar
                </>
              )}
            </Button>
          </div>
        </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
