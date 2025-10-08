"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CategoryForm } from '@/components/forms/category-form'
import { Category, CreateCategoryData, UpdateCategoryData } from '@/lib/types/category'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/categories')
      if (!response.ok) {
        throw new Error('Error al cargar las categorías')
      }
      
      const data = await response.json()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreateCategory = async (data: CreateCategoryData) => {
    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear la categoría')
      }

      const newCategory = await response.json()
      setCategories(prev => [...prev, newCategory])
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateCategory = async (data: UpdateCategoryData) => {
    if (!editingCategory) return

    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar la categoría')
      }

      const updatedCategory = await response.json()
      setCategories(prev => 
        prev.map(cat => cat.id === editingCategory.id ? updatedCategory : cat)
      )
      setEditingCategory(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return

    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar la categoría')
      }

      setCategories(prev => prev.filter(cat => cat.id !== deletingCategory.id))
      setDeletingCategory(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleCategoryStatus = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.isActive }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar la categoría')
      }

      const updatedCategory = await response.json()
      setCategories(prev => 
        prev.map(cat => cat.id === category.id ? updatedCategory : cat)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la categoría')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Cargando categorías...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchCategories}>Reintentar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Categorías</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {showForm && (
        <CategoryForm
          onSave={handleCreateCategory}
          onCancel={() => setShowForm(false)}
          isLoading={isSubmitting}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div key={category.id}>
            {editingCategory?.id === category.id ? (
              <Card className="border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    Editando: {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryForm
                    category={editingCategory}
                    onSave={handleUpdateCategory}
                    onCancel={() => setEditingCategory(null)}
                    isLoading={isSubmitting}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className={!category.isActive ? 'opacity-50' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {category.icon && (
                        <span className="text-lg">{category.icon}</span>
                      )}
                      {category.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingCategory(category)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Slug:</span>
                    <Badge variant="outline">{category.slug}</Badge>
                  </div>
                  
                  {category.color && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Color:</span>
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-mono">{category.color}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Items:</span>
                    <Badge variant="secondary">
                      {category._count?.items || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Orden:</span>
                    <Badge variant="outline">{category.orderIndex}</Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCategoryStatus(category)}
                    >
                      {category.isActive ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Desactivar
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Activar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay categorías creadas</p>
          <Button onClick={() => setShowForm(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Crear Primera Categoría
          </Button>
        </div>
      )}

      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar la categoría "{deletingCategory?.name}"?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
