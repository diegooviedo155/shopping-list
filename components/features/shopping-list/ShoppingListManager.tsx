"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { Button, FloatingActionButton } from '../../atoms'
import { ButtonGroup } from '../../molecules'
import { PageHeader, PageLayout } from '../../templates'
import { AddProductModal } from '../../modals'
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal'
import { usePageTransitions } from '../../../hooks'
import { useUnifiedShopping } from '../../../hooks/use-unified-shopping'
import { useToast } from '../../../hooks/use-toast'
import { LoadingOverlay } from '@/components/loading-states'
import { ErrorBoundary, ShoppingListErrorFallback } from '@/components/error-boundary'
import { cn } from '@/lib/utils'
import { Calendar, CalendarDays, Trash2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ITEM_STATUS } from '@/lib/constants/item-status'
import { CATEGORIES, CATEGORY_CONFIG } from '@/lib/constants/categories'

interface ShoppingListManagerProps {
  onBack: () => void
}

const STATUS_OPTIONS = [
  { value: 'este-mes', label: 'Este mes', icon: <Calendar size={16} /> },
  { value: 'proximo-mes', label: 'Próximo mes', icon: <CalendarDays size={16} /> },
]

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todas', icon: null },
  ...Object.entries(CATEGORIES).map(([key, value]) => ({
    value: value,
    label: CATEGORY_CONFIG[value as keyof typeof CATEGORY_CONFIG]?.name || value,
    icon: null
  }))
]

export function ShoppingListManager({ onBack }: ShoppingListManagerProps) {
  const {
    items,
    loading,
    error,
    activeTab,
    currentItems,
    completedCount,
    totalCount,
    addItem,
    toggleItemCompleted,
    deleteItem,
    moveItemToStatus,
    setActiveTab,
    clearError,
    refetch,
    isMovingItem,
    store,
  } = useUnifiedShopping()

  // Estado para manejar hidratación
  const [isHydrated, setIsHydrated] = useState(false)

  // Manejar hidratación
  useEffect(() => {
    setIsHydrated(true)
  }, [])


  const { showSuccess, showError } = useToast()
  // Removed StaggerContainer and StaggerItem to prevent continuous animations
  
  // Estados para filtros y selección
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)

  // Limpiar errores al cambiar de tab
  useEffect(() => {
    if (error) {
      clearError()
    }
  }, [activeTab, error, clearError])

  // Limpiar selección al cambiar de tab
  useEffect(() => {
    setSelectedItems(new Set())
  }, [activeTab])

  // Marcar que ya se animó después de la primera carga
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAnimated(true)
    }, 1000) // Dar tiempo para que se complete la animación inicial

    return () => clearTimeout(timer)
  }, [])

  // Filtrar items por categoría (solo después de hidratación)
  const filteredItems = useMemo(() => {
    if (!isHydrated) {
      return []
    }
    if (selectedCategory === 'all') {
      return currentItems
    }
    return currentItems.filter(item => item.category === selectedCategory)
  }, [currentItems, selectedCategory, isHydrated])

  // Agrupar items por categoría para mostrar subtítulos
  const itemsByCategory = useMemo(() => {
    const grouped = filteredItems.reduce((acc, item) => {
      const category = item.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    }, {} as Record<string, typeof filteredItems>)

    // Ordenar las categorías según el orden definido en CATEGORIES
    const categoryOrder = Object.values(CATEGORIES)
    const result = Object.keys(grouped)
      .sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a as any)
        const bIndex = categoryOrder.indexOf(b as any)
        return aIndex - bIndex
      })
      .map(category => ({
        category,
        items: grouped[category]
      }))

    return result
  }, [filteredItems])

  // Manejar selección de items (memoizado para evitar re-renderizados)
  const handleItemSelect = useCallback((itemId: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev)
      if (selected) {
        newSelected.add(itemId)
      } else {
        newSelected.delete(itemId)
      }
      return newSelected
    })
  }, [])

  // Seleccionar/deseleccionar todos (memoizado)
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }, [filteredItems])

  const handleAddItem = async (data: { name: string; categoryId: string; status: string }) => {
    try {
      await addItem(data.name, data.categoryId, data.status)
      showSuccess('Producto agregado', `${data.name} se agregó a la lista`)
    } catch (error) {
      showError('Error', 'No se pudo agregar el producto')
    }
  }

  const handleToggleCompleted = useCallback(async (id: string) => {
    try {
      await toggleItemCompleted(id)
      const item = currentItems.find(item => item.id === id)
      if (item) {
        showSuccess(
          item.completed ? 'Producto completado' : 'Producto pendiente',
          `${item.name} marcado como ${item.completed ? 'completado' : 'pendiente'}`
        )
      }
    } catch (error) {
      showError('Error', 'No se pudo actualizar el producto')
    }
  }, [toggleItemCompleted, currentItems, showSuccess, showError])

  // Mostrar modal de confirmación para eliminar items seleccionados
  const handleDeleteSelected = useCallback(() => {
    if (selectedItems.size === 0) return
    setShowDeleteModal(true)
  }, [selectedItems.size])

  // Confirmar eliminación de items seleccionados
  const handleConfirmDelete = useCallback(async () => {
    if (selectedItems.size === 0) return

    try {
      const itemsToDelete = Array.from(selectedItems)
      const itemNames = itemsToDelete.map(id => {
        const item = currentItems.find(item => item.id === id)
        return item?.name || 'Producto'
      })

      // Eliminar todos los items seleccionados
      await Promise.all(itemsToDelete.map(id => deleteItem(id)))
      
      setSelectedItems(new Set())
      showSuccess(
        'Productos eliminados', 
        `${itemsToDelete.length} producto(s) eliminado(s): ${itemNames.join(', ')}`
      )
    } catch (error) {
      showError('Error', 'No se pudieron eliminar los productos')
    }
  }, [selectedItems, currentItems, deleteItem, showSuccess, showError])

  // Mover item al mes que viene (memoizado)
  const handleMoveToNextMonth = useCallback(async (id: string) => {
    try {
      const item = currentItems.find(item => item.id === id)
      await moveItemToStatus(id, ITEM_STATUS.NEXT_MONTH)
      if (item) {
        showSuccess('Producto movido', `${item.name} movido al próximo mes`)
      }
    } catch (error) {
      showError('Error', 'No se pudo mover el producto')
    }
  }, [currentItems, moveItemToStatus, showSuccess, showError])

  // Mover item a este mes (memoizado)
  const handleMoveToThisMonth = useCallback(async (id: string) => {
    try {
      const item = currentItems.find(item => item.id === id)
      await moveItemToStatus(id, ITEM_STATUS.THIS_MONTH)
      if (item) {
        showSuccess('Producto movido', `${item.name} movido a este mes`)
      }
    } catch (error) {
      showError('Error', 'No se pudo mover el producto')
    }
  }, [currentItems, moveItemToStatus, showSuccess, showError])

  const header = (
    <PageHeader
      title="Listas de Compras"
      showBackButton
      onBack={onBack}
    />
  )


  return (
    <ErrorBoundary fallback={ShoppingListErrorFallback}>
      <PageLayout header={header}>
        <div className="space-y-6">
          {/* Month Tabs */}
          <div className="mb-6">
              <ButtonGroup
                options={STATUS_OPTIONS}
                value={activeTab}
              onChange={(value) => setActiveTab(value as any)}
                variant="outline"
                size="sm"
              />
          </div>

          {/* Category Filters - Always Visible */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedCategory === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(option.value)}
                  className="flex items-center gap-2"
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Items List */}
          <LoadingOverlay isLoading={loading && filteredItems.length === 0}>
            <div className="space-y-4">
                {/* Select All with Delete Button */}
                {isHydrated && filteredItems.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium">
                        Seleccionar todos ({filteredItems.length})
                      </label>
                    </div>
                    
                    {/* Delete Selected Button */}
                    {selectedItems.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Eliminar ({selectedItems.size})
                      </Button>
                    )}
                  </div>
                )}

                {/* Items grouped by category */}
                {!isHydrated ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Cargando...</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        {selectedCategory === 'all' 
                          ? 'No hay productos en esta lista' 
                          : 'No hay productos en esta categoría'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {itemsByCategory.map(({ category, items }) => {
                      const categoryConfig = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]
                      const categoryName = categoryConfig?.name || category
                      const categoryColor = categoryConfig?.color || 'var(--color-supermarket)'
                      
                      return (
                        <div key={category} className="space-y-3">
                          {/* Category subtitle */}
                          <div 
                            className="flex items-center gap-2 py-2 px-3 rounded-lg"
                            style={{ 
                              backgroundColor: `${categoryColor}20`,
                              borderLeft: `4px solid ${categoryColor}`
                            }}
                          >
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: categoryColor }}
                            />
                            <h3 
                              className="text-sm font-semibold capitalize"
                              style={{ color: categoryColor }}
                            >
                              {categoryName}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                              ({items.length} {items.length === 1 ? 'producto' : 'productos'})
                            </span>
                          </div>

                          {/* Items in this category */}
                          <div className="space-y-2 ml-4">
                            {items.map((item) => {
                              const isSelected = selectedItems.has(item.id)
                              
                              // Verificar que el item tenga la estructura correcta
                              if (!item || !item.name) {
                                console.warn('Item with invalid structure in render:', item)
                                return null
                              }
                              
                              return (
                                <div
                                  key={item.id}
                                  className={cn(
                                    "flex items-center gap-3 p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors",
                                    item.completed && "opacity-60"
                                  )}
                                >
                                  {/* Checkbox for selection */}
                                  <Checkbox
                                    id={`item-${item.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                                  />

                                  {/* Item content */}
                                  <div className="flex-1 flex items-center gap-3 capitalize">
                                    <div className={cn(
                                      "flex-1 text-sm font-medium ",
                                      item.completed && "line-through text-muted-foreground opacity-60"
                                    )}>
                                      {item.name}
                                    </div>
                                  </div>

                                  {/* Move button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isMovingItem(item.id)}
                                    onClick={() => 
                                      activeTab === 'este-mes' 
                                        ? handleMoveToNextMonth(item.id)
                                        : handleMoveToThisMonth(item.id)
                                    }
                                    className="flex items-center gap-1"
                                  >
                                    {isMovingItem(item.id) ? (
                                      <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Moviendo...
                                      </>
                                    ) : activeTab === 'este-mes' ? (
                                      <>
                                        <ArrowRight size={18} />
                                        
                                      </>
                                    ) : (
                                      <>
                                        <ArrowLeft size={18} />
                                        
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
            </LoadingOverlay>
        </div>
        
        {/* Floating Action Button with Modal */}
        <AddProductModal
          onAddItem={handleAddItem}
          isLoading={loading}
          trigger={
            <FloatingActionButton
              size="md"
              position="bottom-right"
            />
          }
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          itemCount={selectedItems.size}
          itemNames={Array.from(selectedItems).map(id => {
            const item = currentItems.find(item => item.id === id)
            return item?.name || 'Producto'
          })}
          isLoading={loading}
        />
      </PageLayout>
    </ErrorBoundary>
  )
}