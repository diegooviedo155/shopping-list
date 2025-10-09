"use client"

import { useEffect, useMemo } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Calendar, CalendarDays, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUnifiedShopping } from "@/hooks/use-unified-shopping"
import { useDragDrop } from "@/lib/hooks/use-drag-drop"
import { useToast } from "@/lib/hooks/use-toast"
import { AddItemForm } from "@/components/forms/add-item-form"
import { ShoppingItemComponent } from "@/components/optimized/shopping-item"
import { EmptyState, LoadingOverlay } from "@/components/loading-states"
import { ErrorBoundary, ShoppingListErrorFallback } from "@/components/error-boundary"
import { ITEM_STATUS, ITEM_STATUS_LABELS } from "@/lib/constants/item-status"
import type { ItemStatus, CreateItemInput } from "@/lib/types/database"

interface ShoppingListManagerProps {
  onBack: () => void
}

export function ShoppingListManager({ onBack }: ShoppingListManagerProps) {
  const {
    currentItems,
    loading,
    error,
    activeTab,
    selectedCategory,
    completedCount,
    totalCount,
    addItem,
    toggleItemCompleted,
    deleteItem,
    moveItemToStatus,
    reorderItems,
    setActiveTab,
    setSelectedCategory,
    clearError,
  } = useUnifiedShopping()

  const { showSuccess, showError } = useToast()
  const dragDropProps = useDragDrop({ onReorderItems: reorderItems, activeTab })

  // Limpiar errores al cambiar de tab
  useEffect(() => {
    if (error) {
      clearError()
    }
  }, [activeTab, error, clearError])

  const handleAddItem = async (data: CreateItemInput) => {
    try {
      await addItem(data.name, data.category, data.status)
      showSuccess('Producto agregado', `${data.name} se agregó a la lista`)
    } catch (error) {
      showError('Error', 'No se pudo agregar el producto')
    }
  }

  const handleToggleCompleted = async (id: string) => {
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
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const item = currentItems.find(item => item.id === id)
      await deleteItem(id)
      if (item) {
        showSuccess('Producto eliminado', `${item.name} se eliminó de la lista`)
      }
    } catch (error) {
      showError('Error', 'No se pudo eliminar el producto')
    }
  }

  const handleMoveToStatus = async (id: string, newStatus: ItemStatus) => {
    try {
      await moveItemToStatus(id, newStatus)
      const item = currentItems.find(item => item.id === id)
      if (item) {
        showSuccess(
          'Producto movido',
          `${item.name} movido a ${ITEM_STATUS_LABELS[newStatus]}`
        )
      }
    } catch (error) {
      showError('Error', 'No se pudo mover el producto')
    }
  }

  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <ErrorBoundary fallback={ShoppingListErrorFallback}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              aria-label="Volver a la página principal"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-foreground">Listas de Compras</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{completedCount}/{totalCount} completados</span>
                {totalCount > 0 && (
                  <div className="flex-1 bg-muted rounded-full h-2 max-w-24">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6">
          {/* Month Tabs */}
          <div className="flex gap-2 mb-6" role="tablist">
            <Button
              variant={activeTab === ITEM_STATUS.THIS_MONTH ? "default" : "outline"}
              onClick={() => setActiveTab(ITEM_STATUS.THIS_MONTH as ItemStatus)}
              className="flex-1"
              role="tab"
              aria-selected={activeTab === ITEM_STATUS.THIS_MONTH}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {ITEM_STATUS_LABELS[ITEM_STATUS.THIS_MONTH]}
            </Button>
            <Button
              variant={activeTab === ITEM_STATUS.NEXT_MONTH ? "default" : "outline"}
              onClick={() => setActiveTab(ITEM_STATUS.NEXT_MONTH as ItemStatus)}
              className="flex-1"
              role="tab"
              aria-selected={activeTab === ITEM_STATUS.NEXT_MONTH}
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              {ITEM_STATUS_LABELS[ITEM_STATUS.NEXT_MONTH]}
            </Button>
          </div>

          {/* Add Item Form */}
          <AddItemForm
            onAddItem={handleAddItem}
            isLoading={loading}
            className="mb-6"
          />

          {/* Items List */}
          <LoadingOverlay isLoading={loading && currentItems.length === 0}>
            <DragDropContext {...dragDropProps}>
              <Droppable droppableId="shopping-items">
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef} 
                    className={cn(
                      "space-y-3 min-h-[200px]",
                      snapshot.isDraggingOver && "bg-accent/5 rounded-lg p-2"
                    )}
                    role="list"
                    aria-label={`Lista de productos para ${ITEM_STATUS_LABELS[activeTab]}`}
                  >
                    {currentItems.length === 0 ? (
                      <EmptyState
                        title={`No hay productos para ${ITEM_STATUS_LABELS[activeTab]}`}
                        description="Agrega algunos productos usando el formulario de arriba"
                      />
                    ) : (
                      currentItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <ShoppingItemComponent
                                item={item}
                                index={index}
                                activeTab={activeTab}
                                onToggleCompleted={handleToggleCompleted}
                                onMoveToStatus={handleMoveToStatus}
                                onDelete={handleDeleteItem}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </LoadingOverlay>
        </main>
      </div>
    </ErrorBoundary>
  )
}
