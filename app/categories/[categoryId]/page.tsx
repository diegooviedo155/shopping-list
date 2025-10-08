"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Icon } from '@/components/atoms'
import { IonicSwipeItem } from '@/components/organisms'
import { PageHeader, PageLayout } from '@/components/templates'
import { useFramerMotion, usePageTransitions } from '@/hooks'
import { useShoppingItemsSimple } from '@/hooks'
import { useToast } from '@/hooks/use-toast'
import { LoadingOverlay } from '@/components/loading-states'
import { ErrorBoundary } from '@/components/error-boundary'
import { cn } from '@/lib/utils'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { ShoppingItem } from '@/lib/domain/entities/ShoppingItem'

// Mapeo de categorías con colores y nombres
const CATEGORY_INFO = {
  verduleria: { name: 'Verdulería', color: '#f59e0b' },
  carniceria: { name: 'Carnicería', color: '#0891b2' },
  panaderia: { name: 'Panadería', color: '#8b5cf6' },
  farmacia: { name: 'Farmacia', color: '#10b981' },
  supermercado: { name: 'Supermercado', color: '#ef4444' },
  otro: { name: 'Otro', color: '#6b7280' },
}

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.categoryId as string
  
  const { items, loading, error, getItemsByCategory, toggleItemCompleted, deleteItem, moveItemToStatus } = useShoppingItemsSimple()
  const { showError, showSuccess } = useToast()
  const { StaggerContainer, StaggerItem } = usePageTransitions()

  const [categoryItems, setCategoryItems] = useState<ShoppingItem[]>([])

  // Obtener información de la categoría
  const categoryInfo = CATEGORY_INFO[categoryId as keyof typeof CATEGORY_INFO] || { 
    name: 'Categoría', 
    color: '#6b7280' 
  }

  // Cargar items de la categoría
  useEffect(() => {
    if (items.length > 0) {
      const filteredItems = getItemsByCategory(categoryId)
      setCategoryItems(filteredItems)
    }
  }, [items, categoryId, getItemsByCategory])

  // Manejar errores
  useEffect(() => {
    if (error) {
      showError('Error', 'No se pudieron cargar los productos de esta categoría')
    }
  }, [error, showError])

  const handleBack = () => {
    router.push('/')
  }

  const handleToggleCompleted = async (id: string) => {
    try {
      await toggleItemCompleted(id)
      showSuccess('Éxito', 'Estado actualizado')
    } catch (error) {
      showError('Error', 'No se pudo actualizar el estado')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id)
      showSuccess('Éxito', 'Producto eliminado')
    } catch (error) {
      showError('Error', 'No se pudo eliminar el producto')
    }
  }

  const handleMoveToNextMonth = async (id: string) => {
    try {
      await moveItemToStatus(id, 'proximo-mes')
      showSuccess('Éxito', 'Producto movido al próximo mes')
    } catch (error) {
      showError('Error', 'No se pudo mover el producto')
    }
  }

  const { ReorderGroup, ReorderItem, handleReorder, hasChanges, pendingCount, forceSave } = useFramerMotion(
    categoryItems,
    async (reorderedItems) => {
      // Aquí podrías implementar reordenamiento si es necesario
    },
    { debounceMs: 30000 }
  )

  const header = (
    <PageHeader
      title={categoryInfo.name}
      subtitle={`${categoryItems.length} productos`}
      showBackButton
      onBack={handleBack}
      actions={
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: categoryInfo.color }}
          />
          <ShoppingCart size={20} className="text-muted-foreground" />
        </div>
      }
    />
  )

  if (loading) {
    return <LoadingOverlay isLoading={true}>Cargando productos de la categoría...</LoadingOverlay>
  }

  return (
    <ErrorBoundary>
      <PageLayout header={header}>
        <StaggerContainer>
          <StaggerItem>
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {categoryItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No hay productos en esta categoría
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Agrega productos para verlos aquí
                  </p>
                  <Button onClick={() => router.push('/lists')}>
                    Ir a Listas
                  </Button>
                </div>
              ) : (
                <ReorderGroup axis="y" values={categoryItems} onReorder={handleReorder}>
                  <AnimatePresence mode="popLayout">
                    {categoryItems.map((item) => (
                      <ReorderItem key={item.id} value={item}>
                        <StaggerItem>
                          <IonicSwipeItem
                            item={item}
                            onToggleCompleted={handleToggleCompleted}
                            onDelete={handleDelete}
                            onMoveToNextMonth={handleMoveToNextMonth}
                            className="mb-2"
                          />
                        </StaggerItem>
                      </ReorderItem>
                    ))}
                  </AnimatePresence>
                </ReorderGroup>
              )}
            </motion.div>
          </StaggerItem>
        </StaggerContainer>
      </PageLayout>
    </ErrorBoundary>
  )
}
