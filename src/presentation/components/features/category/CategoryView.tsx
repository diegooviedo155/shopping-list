"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Icon } from '../../atoms'
import { SwipeableItemCard } from '../../organisms'
import { PageHeader, PageLayout } from '../../templates'
import { useFramerMotion, usePageTransitions } from '../../../hooks'
import { useShoppingItems } from '../../../hooks/use-shopping-items-simple'
import { useToast } from '../../../hooks/use-toast'
import { LoadingOverlay } from '@/components/loading-states'
import { ErrorBoundary } from '@/components/error-boundary'
import { cn } from '@/lib/utils'
import { ArrowLeft, ShoppingCart } from 'lucide-react'
import { ShoppingItem } from '../../../../core/domain/entities/ShoppingItem'

interface CategoryViewProps {
  categoryId: string
  categoryName: string
  onBack: () => void
}

const CATEGORY_CONFIG = {
  supermercado: { name: 'Supermercado', color: '#10b981' },
  verduleria: { name: 'Verdulería', color: '#f59e0b' },
  carniceria: { name: 'Carnicería', color: '#0891b2' },
}

export function CategoryView({ categoryId, categoryName, onBack }: CategoryViewProps) {
  const { items, loading, error, getItemsByCategory, toggleItemCompleted, deleteItem, moveItemToStatus } = useShoppingItems()
  const { showError, showSuccess } = useToast()
  const { StaggerContainer, StaggerItem } = usePageTransitions()

  const [categoryItems, setCategoryItems] = useState<ShoppingItem[]>([])

  useEffect(() => {
    const items = getItemsByCategory(categoryId)
    setCategoryItems(items)
  }, [categoryId, items, getItemsByCategory])

  useEffect(() => {
    if (error) {
      showError('Error', 'No se pudieron cargar los productos')
    }
  }, [error])

  const handleReorder = async (newItems: ShoppingItem[]) => {
    setCategoryItems(newItems)
    // Here you would implement the reorder logic
    // For now, we just update the local state
  }

  const { ReorderGroup, ReorderItem, isDragging } = useFramerMotion({
    initialItems: categoryItems,
    onReorder: handleReorder,
    axis: 'y',
    layoutScroll: true
  })

  const handleToggleCompleted = async (id: string) => {
    try {
      await toggleItemCompleted(id)
      const item = categoryItems.find(item => item.id === id)
      if (item) {
        showSuccess(
          item.completed ? 'Producto completado' : 'Producto pendiente',
          `${item.name.getValue()} marcado como ${item.completed ? 'completado' : 'pendiente'}`
        )
      }
    } catch (error) {
      showError('Error', 'No se pudo actualizar el producto')
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const item = categoryItems.find(item => item.id === id)
      await deleteItem(id)
      if (item) {
        showSuccess('Producto eliminado', `${item.name.getValue()} se eliminó de la lista`)
      }
    } catch (error) {
      showError('Error', 'No se pudo eliminar el producto')
    }
  }

  const handleMoveToStatus = async (id: string, newStatus: string) => {
    try {
      const item = categoryItems.find(item => item.id === id)
      await moveItemToStatus(id, newStatus)
      if (item) {
        const statusLabels = { 'este-mes': 'Este mes', 'proximo-mes': 'Próximo mes' }
        showSuccess(
          'Producto movido',
          `${item.name.getValue()} movido a ${statusLabels[newStatus as keyof typeof statusLabels]}`
        )
      }
    } catch (error) {
      showError('Error', 'No se pudo mover el producto')
    }
  }

  const completedCount = categoryItems.filter(item => item.completed).length
  const totalCount = categoryItems.length

  const header = (
    <PageHeader
      title={categoryName}
      subtitle={`${completedCount}/${totalCount} completados`}
      showBackButton
      onBack={onBack}
      progress={totalCount > 0 ? { current: completedCount, total: totalCount, label: 'completados' } : undefined}
    />
  )

  return (
    <ErrorBoundary>
      <PageLayout header={header}>
        <LoadingOverlay isLoading={loading && categoryItems.length === 0}>
          <StaggerContainer>
            {categoryItems.length === 0 ? (
              <StaggerItem>
                <div className="text-center py-12">
                  <Icon icon={ShoppingCart} size="xl" className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay productos en esta categoría</h3>
                  <p className="text-muted-foreground">Los productos aparecerán aquí cuando los agregues</p>
                </div>
              </StaggerItem>
            ) : (
              <ReorderGroup
                className={cn(
                  'space-y-3',
                  isDragging && 'bg-accent/5 rounded-lg p-2'
                )}
                role="list"
                aria-label={`Lista de productos de ${categoryName}`}
              >
                <AnimatePresence mode="popLayout">
                  {categoryItems.map((item) => (
                    <ReorderItem
                      key={item.id}
                      value={item}
                      className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                    >
                      <StaggerItem>
                        <SwipeableItemCard
                          item={item}
                          isDragging={isDragging}
                          showDragHandle={true}
                          showStatus={true}
                          onToggleCompleted={handleToggleCompleted}
                          onMoveToStatus={handleMoveToStatus}
                          onDelete={handleDeleteItem}
                        />
                      </StaggerItem>
                    </ReorderItem>
                  ))}
                </AnimatePresence>
              </ReorderGroup>
            )}
          </StaggerContainer>
        </LoadingOverlay>
      </PageLayout>
    </ErrorBoundary>
  )
}
