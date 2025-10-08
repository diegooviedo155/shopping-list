"use client"

import { useEffect, useMemo, useState } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Plus, GripVertical, ShoppingCart, Trash2, Calendar, CalendarDays, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useShoppingItems } from "@/lib/hooks/use-shopping-items"
import type { Category, ItemStatus } from "@/lib/types/database"
import { ITEM_STATUS, ITEM_STATUS_LABELS } from "@/lib/constants/item-status"
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants/categories"

interface ShoppingListManagerProps {
  onBack: () => void
}

// Usamos CATEGORY_CONFIG importado

export function ShoppingListManager({ onBack }: ShoppingListManagerProps) {
  const { items, loading, error, addItem, toggleItemCompleted, deleteItem, moveItemToStatus, reorderItems } =
    useShoppingItems()

  const [newItemName, setNewItemName] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES.SUPERMARKET as Category)
  const [activeTab, setActiveTab] = useState<ItemStatus>(ITEM_STATUS.THIS_MONTH as ItemStatus)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddItem = async () => {
    if (!newItemName.trim() || isAdding) return

    try {
      setIsAdding(true)
      await addItem(newItemName, selectedCategory, activeTab)
      setNewItemName("")
    } catch (err) {
    } finally {
      setIsAdding(false)
    }
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index

    if (sourceIndex === destIndex) return

    await reorderItems(activeTab, sourceIndex, destIndex)
  }

  // Filtrar y ordenar los items
  const currentItems = useMemo(() => {
    const filtered = items
      .filter((item) => {
        const matches = item.status === activeTab
        return matches
      })
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
    
    return filtered
  }, [items, activeTab])

  const completedCount = currentItems.filter((item) => item.completed).length
  const totalCount = currentItems.length


  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando listas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-destructive mb-4">Error al cargar los productos: {error}</p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-4"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Listas de Compras</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount > 0 && `${completedCount}/${totalCount} completados`}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Month Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === ITEM_STATUS.THIS_MONTH ? "default" : "outline"}
            onClick={() => setActiveTab(ITEM_STATUS.THIS_MONTH as ItemStatus)}
            className="flex-1"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {ITEM_STATUS_LABELS[ITEM_STATUS.THIS_MONTH]}
          </Button>
          <Button
            variant={activeTab === ITEM_STATUS.NEXT_MONTH ? "default" : "outline"}
            onClick={() => setActiveTab(ITEM_STATUS.NEXT_MONTH as ItemStatus)}
            className="flex-1"
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            {ITEM_STATUS_LABELS[ITEM_STATUS.NEXT_MONTH]}
          </Button>
        </div>

        <Card className="p-4 mb-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Agregar producto..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
                className="flex-1"
                disabled={isAdding}
              />
              <Button onClick={handleAddItem} size="sm" disabled={isAdding || !newItemName.trim()}>
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              {(Object.values(CATEGORIES) as Category[]).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={cn("flex-1 text-xs", selectedCategory === category && CATEGORY_CONFIG[category].bgColor)}
                  disabled={isAdding}
                >
                  {CATEGORY_CONFIG[category].name}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="shopping-items">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {currentItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No hay productos para {activeTab === ITEM_STATUS.THIS_MONTH ? "este mes" : "el próximo mes"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Agrega algunos productos arriba</p>
                  </div>
                ) : (
                  currentItems.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "p-4 transition-all duration-200",
                            snapshot.isDragging && "shadow-lg rotate-2",
                            item.completed && "opacity-60",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>

                            <Checkbox checked={item.completed} onCheckedChange={() => toggleItemCompleted(item.id)} />

                            <div className="flex-1">
                              <p className={cn("font-medium", item.completed && "line-through text-muted-foreground")}>
                                {item.name}
                              </p>
                              <Badge
                                variant="secondary"
                                className="text-xs mt-1"
                                style={{
                                  backgroundColor: `${CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG].color}20`,
                                  color: CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG].color,
                                }}
                              >
                                {CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG].name}
                              </Badge>
                            </div>

                            <div className="flex gap-1">
                              {activeTab === ITEM_STATUS.THIS_MONTH ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveItemToStatus(item.id, ITEM_STATUS.NEXT_MONTH as ItemStatus)}
                                  className="text-xs px-2"
                                >
                                  {ITEM_STATUS_LABELS[ITEM_STATUS.NEXT_MONTH]}
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveItemToStatus(item.id, ITEM_STATUS.THIS_MONTH as ItemStatus)}
                                  className="text-xs px-2"
                                >
                                  {ITEM_STATUS_LABELS[ITEM_STATUS.THIS_MONTH]}
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteItem(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </main>
    </div>
  )
}
