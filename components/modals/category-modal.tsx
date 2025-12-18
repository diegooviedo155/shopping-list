'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Plus, Edit } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color: string
  icon: string
  isActive: boolean
  orderIndex: number
}

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (category: Omit<Category, 'id'>) => Promise<void>
  category?: Category | null
  isLoading?: boolean
}

const ICON_OPTIONS = [
  { value: 'shopping-cart', label: '🛒 Carrito de compras' },
  { value: 'apple', label: '🍎 Manzana' },
  { value: 'beef', label: '🥩 Carne' },
  { value: 'milk', label: '🥛 Leche' },
  { value: 'bread', label: '🍞 Pan' },
  { value: 'fish', label: '🐟 Pescado' },
  { value: 'chicken', label: '🐔 Pollo' },
  { value: 'cheese', label: '🧀 Queso' },
  { value: 'egg', label: '🥚 Huevo' },
  { value: 'pill', label: '💊 Medicamentos' },
  { value: 'book', label: '📚 Libros' },
  { value: 'laptop', label: '💻 Electrónicos' },
]

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Azul', color: 'bg-blue-500' },
  { value: 'green', label: 'Verde', color: 'bg-green-500' },
  { value: 'red', label: 'Rojo', color: 'bg-red-500' },
  { value: 'yellow', label: 'Amarillo', color: 'bg-yellow-500' },
  { value: 'purple', label: 'Morado', color: 'bg-purple-500' },
  { value: 'pink', label: 'Rosa', color: 'bg-pink-500' },
  { value: 'indigo', label: 'Índigo', color: 'bg-indigo-500' },
  { value: 'orange', label: 'Naranja', color: 'bg-orange-500' },
]

export function CategoryModal({ 
  isOpen, 
  onClose, 
  onSave, 
  category, 
  isLoading = false 
}: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: 'blue',
    icon: 'shopping-cart',
    isActive: true,
    orderIndex: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showSuccess, showError } = useToast()

  const isEditing = !!category

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        color: category.color,
        icon: category.icon,
        isActive: category.isActive,
        orderIndex: category.orderIndex
      })
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        color: 'blue',
        icon: 'shopping-cart',
        isActive: true,
        orderIndex: 0
      })
    }
  }, [category, isOpen])

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value.toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({
        ...prev,
        slug
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSave(formData)
      showSuccess(
        isEditing ? 'Categoría actualizada' : 'Categoría creada',
        isEditing 
          ? 'La categoría se ha actualizado correctamente'
          : 'La categoría se ha creado correctamente'
      )
      onClose()
    } catch (error) {
      showError(
        'Error',
        isEditing 
          ? 'No se pudo actualizar la categoría'
          : 'No se pudo crear la categoría'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit className="h-5 w-5" />
                Editar Categoría
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Nueva Categoría
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica los datos de la categoría'
              : 'Completa la información para crear una nueva categoría'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: Supermercado"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="supermercado"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descripción opcional de la categoría"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Icono</Label>
              <div className="grid grid-cols-3 gap-2">
                {ICON_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('icon', option.value)}
                    className={`p-2 rounded-md border-2 transition-colors ${
                      formData.icon === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                    disabled={isSubmitting}
                  >
                    <span className="text-lg">{option.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleInputChange('color', option.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === option.value
                        ? 'border-primary scale-110'
                        : 'border-border hover:scale-105'
                    } ${option.color}`}
                    disabled={isSubmitting}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="isActive">Categoría activa</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderIndex">Orden</Label>
              <Input
                id="orderIndex"
                type="number"
                value={formData.orderIndex}
                onChange={(e) => handleInputChange('orderIndex', parseInt(e.target.value) || 0)}
                className="w-20"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.slug}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
