"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from 'framer-motion'
import { Button, FloatingActionButton, SearchInput } from '../../atoms'
import { ButtonGroup } from '../../molecules'
import { PageHeader } from '../../templates'
import { SidebarLayout } from '../../sidebar-layout'
import { AddProductModal, EditProductModal } from '../../modals'
import { DeleteConfirmationModal } from '../../modals/DeleteConfirmationModal'
import { useUnifiedShopping } from '../../../hooks/use-unified-shopping'
import { useToast } from '../../../hooks/use-toast'
import { LoadingOverlay } from '@/components/loading-states'
import { ErrorBoundary, ShoppingListErrorFallback } from '@/components/error-boundary'
import { cn } from '@/lib/utils'
import { Calendar, CalendarDays, Trash2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { ITEM_STATUS } from '@/lib/constants/item-status'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { getCategoryColor, getIconEmoji } from '@/lib/constants/categories'

interface ShoppingListManagerProps {
  onBack: () => void
}

const STATUS_OPTIONS = [
  { value: 'este_mes', label: 'Este mes', icon: <Calendar size={16} /> },
  { value: 'proximo_mes', label: 'Próximo mes', icon: <CalendarDays size={16} /> },
]

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todas', icon: null },
  { value: 'supermercado', label: 'Supermercado', icon: null },
  { value: 'verduleria', label: 'Verdulería', icon: null },
  { value: 'carniceria', label: 'Carnicería', icon: null },
  { value: 'farmacia', label: 'Farmacia', icon: null },
  { value: 'libreria', label: 'Librería', icon: null },
  { value: 'electrodomesticos', label: 'Electrodomésticos', icon: null },
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
    updateItemName,
    toggleItemCompleted,
    deleteItem,
    moveItemToStatus,
    setActiveTab,
    clearError,
    refetch,
    forceInitialize,
    isMovingItem,
    store,
    // Funciones de búsqueda
    itemsByStatusAndSearch,
    setSearchQuery,
    clearSearch,
    searchQuery,
  } = useUnifiedShopping()

  // Estado para manejar hidratación
  const [isHydrated, setIsHydrated] = useState(false)

  // Manejar hidratación
  useEffect(() => {
    const initializeStore = async () => {
      // Forzar inicialización para asegurar que los datos estén actualizados
      await forceInitialize()
      // Pequeño delay para asegurar que el estado se actualice
      setTimeout(() => {
        setIsHydrated(true)
      }, 100)
    }
    
    initializeStore()
  }, [forceInitialize])


  const { showSuccess, showError } = useToast()
  // Removed StaggerContainer and StaggerItem to prevent continuous animations
  
  // Estados para filtros y selección
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Estados para edición
  const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Estado para efecto de presión larga
  const [pressedItemId, setPressedItemId] = useState<string | null>(null)
  
  // Estado para forzar re-render
  const [forceUpdate, setForceUpdate] = useState(0)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)

  // Limpiar errores al cambiar de tab
  useEffect(() => {
    if (error) {
      clearError()
    }
  }, [activeTab, error, clearError])

  // Forzar re-render cuando cambien los items
  useEffect(() => {
    setForceUpdate(prev => prev + 1)
  }, [currentItems])

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

  // Filtrar items por categoría y búsqueda (solo después de hidratación)
  const filteredItems = useMemo(() => {
    if (!isHydrated) {
      return []
    }

    // Obtener items con búsqueda aplicada
    const searchedItems = itemsByStatusAndSearch(activeTab, searchQuery)

    if (selectedCategory === 'all') {
      return searchedItems
    }
    return searchedItems.filter(item => item.category === selectedCategory)
  }, [itemsByStatusAndSearch, activeTab, searchQuery, selectedCategory, isHydrated, forceUpdate])

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

    // Ordenar las categorías según un orden predefinido
    const categoryOrder = ['supermercado', 'verduleria', 'carniceria', 'farmacia', 'libreria', 'electrodomesticos']
    const result = Object.keys(grouped)
      .sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a)
        const bIndex = categoryOrder.indexOf(b)
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

  // Manejar edición de item
  const handleEditItem = useCallback((item: { id: string; name: string }) => {
    setEditingItem(item)
    setIsEditModalOpen(true)
  }, [])

  // Guardar cambios de edición
  const handleSaveEdit = useCallback(async (data: { name: string }) => {
    if (!editingItem) return

    try {
      await updateItemName(editingItem.id, data.name)
      showSuccess('Producto actualizado', 'El nombre del producto se ha actualizado correctamente')
    } catch (error) {
      showError('Error', 'No se pudo actualizar el producto')
    }
  }, [editingItem, updateItemName, showSuccess, showError])

  // Cerrar modal de edición
  const handleCloseEdit = useCallback(() => {
    setIsEditModalOpen(false)
    setEditingItem(null)
  }, [])

  // Mover items seleccionados al próximo mes
  const handleMoveSelectedToNextMonth = useCallback(async () => {
    if (selectedItems.size === 0) return

    try {
      const itemsToMove = Array.from(selectedItems)
      const itemNames = itemsToMove.map(id => {
        const item = currentItems.find(item => item.id === id)
        return item?.name || 'Producto'
      })

      // Mover todos los items seleccionados
      await Promise.all(itemsToMove.map(id => moveItemToStatus(id, ITEM_STATUS.NEXT_MONTH)))
      
      // Forzar re-render manual
      setForceUpdate(prev => prev + 1)
      
      setSelectedItems(new Set())
      showSuccess(
        'Productos movidos',
        `${itemNames.length} producto(s) movido(s) al próximo mes`
      )
    } catch (error) {
      showError('Error', 'No se pudieron mover los productos')
    }
  }, [selectedItems, currentItems, moveItemToStatus, showSuccess, showError])

  // Mover items seleccionados a este mes
  const handleMoveSelectedToThisMonth = useCallback(async () => {
    if (selectedItems.size === 0) return

    try {
      const itemsToMove = Array.from(selectedItems)
      const itemNames = itemsToMove.map(id => {
        const item = currentItems.find(item => item.id === id)
        return item?.name || 'Producto'
      })

      // Mover todos los items seleccionados
      await Promise.all(itemsToMove.map(id => moveItemToStatus(id, ITEM_STATUS.THIS_MONTH)))
      
      // Forzar re-render manual
      setForceUpdate(prev => prev + 1)
      
      setSelectedItems(new Set())
      showSuccess(
        'Productos movidos',
        `${itemNames.length} producto(s) movido(s) a este mes`
      )
    } catch (error) {
      showError('Error', 'No se pudieron mover los productos')
    }
  }, [selectedItems, currentItems, moveItemToStatus, showSuccess, showError])

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

  return (
    <ErrorBoundary fallback={ShoppingListErrorFallback}>
      <SidebarLayout 
        title="Lista de Compras"
        description="Gestiona tus productos por mes"
        showBackButton
        onBack={onBack}
      >
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

          {/* Search Input */}
          <div className="mb-6">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={clearSearch}
              placeholder="Buscar productos..."
              className="w-full"
            />
          </div>

          {/* Items List */}
          <LoadingOverlay isLoading={loading && filteredItems.length === 0}>
            <div className="space-y-4">
                {/* Select All */}
                {isHydrated && filteredItems.length > 0 && (
                  <div className="flex items-center p-3 bg-muted/50 rounded-lg">
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
                        {searchQuery ? (
                          `No se encontraron productos que coincidan con "${searchQuery}"`
                        ) : selectedCategory === 'all' 
                          ? 'No hay productos en esta lista' 
                          : 'No hay productos en esta categoría'
                        }
                      </p>
                      {searchQuery && (
                        <button
                          onClick={clearSearch}
                          className="mt-2 text-sm text-primary hover:underline"
                        >
                          Limpiar búsqueda
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {itemsByCategory.map(({ category, items }) => {
                      const categoryName = category.charAt(0).toUpperCase() + category.slice(1)
                      const categoryColor = getCategoryColor(category)
                      
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
                                  onMouseDown={(e) => {
                                    // Activar efecto visual de presión
                                    setPressedItemId(item.id)
                                    
                                    // Iniciar temporizador para presión larga
                                    const timeout = setTimeout(() => {
                                      handleEditItem({ id: item.id, name: item.name })
                                      setPressedItemId(null) // Limpiar estado al abrir modal
                                    }, 2000)
                                    
                                    // Guardar referencia para poder cancelar
                                    const element = e.currentTarget
                                    element.dataset.timeout = timeout.toString()
                                  }}
                                  onMouseUp={(e) => {
                                    // Cancelar temporizador si se suelta antes de 2 segundos
                                    const element = e.currentTarget
                                    const timeout = element.dataset.timeout
                                    if (timeout) {
                                      clearTimeout(parseInt(timeout))
                                      delete element.dataset.timeout
                                    }
                                    // Limpiar efecto visual
                                    setPressedItemId(null)
                                  }}
                                  onMouseLeave={(e) => {
                                    // Cancelar temporizador si el mouse sale del elemento
                                    const element = e.currentTarget
                                    const timeout = element.dataset.timeout
                                    if (timeout) {
                                      clearTimeout(parseInt(timeout))
                                      delete element.dataset.timeout
                                    }
                                    // Limpiar efecto visual
                                    setPressedItemId(null)
                                  }}
                                  onTouchStart={(e) => {
                                    // Activar efecto visual de presión
                                    setPressedItemId(item.id)
                                    
                                    // Iniciar temporizador para presión larga en touch
                                    const timeout = setTimeout(() => {
                                      handleEditItem({ id: item.id, name: item.name })
                                      setPressedItemId(null) // Limpiar estado al abrir modal
                                    }, 2000)
                                    
                                    // Guardar referencia para poder cancelar
                                    const element = e.currentTarget
                                    element.dataset.timeout = timeout.toString()
                                  }}
                                  onTouchEnd={(e) => {
                                    // Cancelar temporizador si se suelta antes de 2 segundos
                                    const element = e.currentTarget
                                    const timeout = element.dataset.timeout
                                    if (timeout) {
                                      clearTimeout(parseInt(timeout))
                                      delete element.dataset.timeout
                                    }
                                    // Limpiar efecto visual
                                    setPressedItemId(null)
                                  }}
                                  className={cn(
                                    "flex items-center gap-3 p-4 bg-card border rounded-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer",
                                    item.completed && "opacity-60",
                                    pressedItemId === item.id && "scale-95 shadow-inner bg-accent/30 border-accent"
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
                                      activeTab === 'este_mes' 
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
                                    ) : activeTab === 'este_mes' ? (
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
        
        {/* Floating Action Buttons for Selected Items */}
        {selectedItems.size > 0 && (
          <>
            {/* Move to Next Month Button */}
            {activeTab === ITEM_STATUS.THIS_MONTH && (
              <FloatingActionButton
                size="sm"
                position="bottom-right"
                variant="default"
                onClick={() => handleMoveSelectedToNextMonth()}
                className="mb-36 mr-1.5"
              >
                <ArrowRight size={16} />
              </FloatingActionButton>
            )}

            {/* Move to This Month Button */}
            {activeTab === ITEM_STATUS.NEXT_MONTH && (
              <FloatingActionButton
                size="sm"
                position="bottom-right"
                variant="default"
                onClick={() => handleMoveSelectedToThisMonth()}
                className="mb-36 mr-1.5"
              >
                <ArrowLeft size={16} />
              </FloatingActionButton>
            )}

            {/* Delete Button */}
            <FloatingActionButton
              size="sm"
              position="bottom-right"
              variant="destructive"
              onClick={handleDeleteSelected}
              className="mb-20 mr-1.5"
            >
              <Trash2 size={16} />
            </FloatingActionButton>
          </>
        )}

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

        {/* Edit Product Modal */}
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
          initialName={editingItem?.name || ''}
          isLoading={loading}
        />
      </SidebarLayout>
    </ErrorBoundary>
  )
}