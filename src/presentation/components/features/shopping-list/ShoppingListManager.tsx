"use client"

import { useState, useEffect, useMemo } from "react"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, CalendarDays, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useShoppingItems } from "../../hooks/use-shopping-items"
import { useDragDrop } from "../../hooks/use-drag-drop"
import { useToast } from "../../hooks/use-toast"
import { AddItemForm } from "../forms/AddItemForm"
import { ShoppingItemComponent } from "./ShoppingItemComponent"
import { EmptyState, LoadingOverlay } from "@/components/loading-states"
import { ErrorBoundary, ShoppingListErrorFallback } from "@/components/error-boundary"

interface ShoppingListManagerProps {
  onBack: () => void
}

const STATUS_LABELS = {
  'este-mes': 'Este mes',
  'proximo-mes': 'Próximo mes',
}

export function ShoppingListManager({ onBack }: ShoppingListManagerProps) {
  const {
    items,
    loading,
    error,
    createItem,
    toggleItemCompleted,
    deleteItem,
    moveItemToStatus,
    reorderItems,
    getItemsByStatus,
  } = useShoppingItems()

  const { showSuccess, showError } = useToast()
  const [activeTab, setActiveTab] = useState<'este-mes' | 'proximo-mes'>('este-mes')
  const dragDropProps = useDragDrop({ onReorderItems: reorderItems, activeTab })

  // Limpiar errores al cambiar de tab
  useEffect(() => {
    if (error) {
      // Clear error logic here if needed
    }
  }, [activeTab, error])

  const handleAddItem = async (data: { name: string; category: string; status: string }) => {
    try {
      await createItem(data.name, data.category, data.status)
      showSuccess('Producto agregado', `${data.name} se agregó a la lista`)
    } catch (error) {
      showError('Error', 'No se pudo agregar el producto')
    }
  }

  const handleToggleCompleted = async (id: string) => {
    try {
      await toggleItemCompleted(id)
      const item = items.find(item => item.id === id)
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
      const item = items.find(item => item.id === id)
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
      const item = items.find(item => item.id === id)
      await moveItemToStatus(id, newStatus)
      if (item) {
        showSuccess(
          'Producto movido',
          `${item.name.getValue()} movido a ${STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS]}`
        )
      }
    } catch (error) {
      showError('Error', 'No se pudo mover el producto')
    }
  }

  const currentItems = useMemo(() => {
    return getItemsByStatus(activeTab)
  }, [getItemsByStatus, activeTab])

  const progressPercentage = currentItems.length > 0 
    ? (currentItems.filter(item => item.completed).length / currentItems.length) * 100 
    : 0

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
                <span>
                  {currentItems.filter(item => item.completed).length}/{currentItems.length} completados
                </span>
                {currentItems.length > 0 && (
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
              variant={activeTab === 'este-mes' ? "default" : "outline"}
              onClick={() => setActiveTab('este-mes')}
              className="flex-1"
              role="tab"
              aria-selected={activeTab === 'este-mes'}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {STATUS_LABELS['este-mes']}
            </Button>
            <Button
              variant={activeTab === 'proximo-mes' ? "default" : "outline"}
              onClick={() => setActiveTab('proximo-mes')}
              className="flex-1"
              role="tab"
              aria-selected={activeTab === 'proximo-mes'}
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              {STATUS_LABELS['proximo-mes']}
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
                    aria-label={`Lista de productos para ${STATUS_LABELS[activeTab]}`}
                  >
                    {currentItems.length === 0 ? (
                      <EmptyState
                        title={`No hay productos para ${STATUS_LABELS[activeTab]}`}
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
