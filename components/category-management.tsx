"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CategoryModal } from '@/components/modals/category-modal'
import { FloatingActionButton } from '@/components/atoms'
import { getIconEmoji } from '@/lib/constants/categories'
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
import { LoadingSpinner } from '@/components/loading-spinner'
import { queuedFetch } from '@/lib/utils/request-queue'
import { getCachedAuthHeaders } from '@/lib/utils/auth-cache'

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const headers = await getCachedAuthHeaders().catch(() => ({}))
      const response = await queuedFetch('/api/categories', {
        method: 'GET',
        headers,
      }, 1) // Prioridad alta
      
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

  const handleOpenCreateModal = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  const handleSaveCategory = async (data: CreateCategoryData) => {
    if (editingCategory) {
      await handleUpdateCategory(data as UpdateCategoryData)
    } else {
      await handleCreateCategory(data)
    }
  }

  const handleCreateCategory = async (data: CreateCategoryData) => {
    try {
      setIsSubmitting(true)
      
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch('/api/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }, 0)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear la categoría')
      }

      const newCategory = await response.json()
      setCategories(prev => [...prev, newCategory])
      setIsModalOpen(false)
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
      
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch(`/api/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      }, 0)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar la categoría')
      }

      const updatedCategory = await response.json()
      setCategories(prev => 
        prev.map(cat => cat.id === editingCategory.id ? updatedCategory : cat)
      )
      setIsModalOpen(false)
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
      
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
        headers,
      }, 0)

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
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch(`/api/categories/${category.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isActive: !category.isActive }),
      }, 0)

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
    return <LoadingSpinner title="Cargando categorías..." />
  }

  if (error) {
    return (
      <div className="text-center p-12">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-6" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Error al cargar categorías</h3>
        <p className="text-destructive mb-6 text-lg">{error}</p>
        <Button onClick={fetchCategories} size="lg" className="bg-primary hover:bg-primary/90">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div key={category.id}>
            <Card className={`transition-all duration-200 hover:shadow-lg ${!category.isActive ? 'opacity-60 bg-muted/30' : 'bg-card border-border shadow-md'}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold flex items-center gap-3 text-foreground">
                      {category.icon && (
                        <span className="text-2xl">{getIconEmoji(category.icon)}</span>
                      )}
                      <span className={category.isActive ? 'text-foreground' : 'text-muted-foreground'}>
                        {category.name}
                      </span>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(category)}
                        className="hover:bg-primary/10 text-foreground hover:text-primary"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingCategory(category)}
                        className="hover:bg-destructive/10 text-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">Slug:</span>
                    <Badge variant="outline" className="bg-muted text-foreground border-border">
                      {category.slug}
                    </Badge>
                  </div>
                  
                  {category.color && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">Color:</span>
                      <div
                        className="w-8 h-8 rounded-lg border-2 border-border shadow-sm"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-xs text-muted-foreground font-mono">
                        {category.color}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">Items:</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {category._count?.items || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">Orden:</span>
                    <Badge variant="outline" className="bg-muted text-foreground border-border">
                      {category.orderIndex}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <Button
                      variant={category.isActive ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleCategoryStatus(category)}
                      className={`font-medium ${
                        category.isActive 
                          ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      }`}
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
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-16">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No hay categorías creadas</h3>
          <p className="text-muted-foreground mb-6 text-lg">Comienza creando tu primera categoría de productos</p>
          <Button onClick={handleOpenCreateModal} size="lg" className="bg-primary hover:bg-primary/90">
            <Plus className="w-5 h-5 mr-2" />
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

      {/* Modal para crear/editar categorías */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCategory}
        category={editingCategory}
        isLoading={isSubmitting}
      />

      {/* Botón flotante para nueva categoría */}
      <FloatingActionButton
        onClick={handleOpenCreateModal}
        size="md"
        position="bottom-right"
      />
    </div>
  )
}
