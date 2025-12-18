"use client"

import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { Loader2, ShoppingCart, Clock, X } from "lucide-react"
import { ITEM_STATUS } from "@/lib/constants/item-status"
import { getCategoryColor, getIconEmoji, categorySlugToDatabaseType } from "@/lib/constants/categories"
import { Checkbox } from "./ui/checkbox"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { SidebarLayout } from "./sidebar-layout"
import { LoadingOverlay } from "./loading-states"
import { LoadingSpinner } from "./loading-spinner"
import { FloatingActionButton, SearchInput } from "./atoms"
import { AddProductModal } from "./modals"
import { useUnifiedCategoryView, useUnifiedShopping } from "../hooks/use-unified-shopping"
import { useToast } from "../hooks/use-toast"
import { debounceWithCancel } from "@/lib/utils/debounce"
import type { ShoppingItem } from "@/lib/types/database"

export function CategoryView({ category, onBack }: { category: string; onBack: () => void }) {
  const { getCategoryStats, loading, error, clearError, setSearchQuery, clearSearch, searchQuery } = useUnifiedCategoryView()
  const { updateItemCompletedStatus, batchUpdateCompletedStatus, addItem } = useUnifiedShopping()
  const { showSuccess, showError } = useToast()
  
  // Estado local para actualizaciones optimistas
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, boolean>>({})
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set())
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Referencias para debouncing
  const debounceTimers = useRef<Map<string, { cancel: () => void }>>(new Map())
  
  // Manejar hidratación
  useEffect(() => {
    setIsHydrated(true)
    
    // Limpiar timers al desmontar
    return () => {
      debounceTimers.current.forEach(({ cancel }) => cancel())
      debounceTimers.current.clear()
    }
  }, [])
  
  // Obtener estadísticas de la categoría con búsqueda
  const categoryStats = getCategoryStats(categorySlugToDatabaseType(category), searchQuery)
  const items = categoryStats.items

  // Función para obtener el estado combinado (real + optimista)
  // Debe estar definida antes de los callbacks que la usan
  const getItemStatus = useCallback((item: any) => {
    if (optimisticUpdates.hasOwnProperty(item.id)) {
      return optimisticUpdates[item.id]
    }
    return item.completed
  }, [optimisticUpdates])


  

  // Función para actualización optimista inmediata con debouncing
  const handleOptimisticToggle = useCallback((itemId: string, item: any) => {
    // Obtener el estado actual (real o optimista)
    const currentStatus = optimisticUpdates.hasOwnProperty(itemId) 
      ? optimisticUpdates[itemId] 
      : item.completed
    const newStatus = !currentStatus
    
    // Actualización optimista inmediata
    setOptimisticUpdates(prev => ({
      ...prev,
      [itemId]: newStatus
    }))
    
    // Agregar a pendientes
    setPendingUpdates(prev => new Set([...prev, itemId]))
    
    // Cancelar debounce anterior para este item si existe
    const existingTimer = debounceTimers.current.get(itemId)
    if (existingTimer) {
      existingTimer.cancel()
    }
    
    // Crear nuevo debounce (300ms de delay - reducido para mejor UX)
    const { debounced, cancel } = debounceWithCancel(async () => {
      try {
        // Actualización al servidor después del debounce
        await updateItemCompletedStatus(itemId, newStatus)
        
        // Remover de pendientes y limpiar actualización optimista
        setPendingUpdates(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
        setOptimisticUpdates(prev => {
          const newUpdates = { ...prev }
          delete newUpdates[itemId]
          return newUpdates
        })
      } catch (err) {
        // Revertir cambio optimista en caso de error
        setOptimisticUpdates(prev => ({
          ...prev,
          [itemId]: currentStatus
        }))
        setPendingUpdates(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
        showError('Error', 'No se pudo actualizar el producto')
      } finally {
        debounceTimers.current.delete(itemId)
      }
    }, 300) // Reducido de 500ms a 300ms para mejor respuesta
    
    debounceTimers.current.set(itemId, { cancel })
    debounced()
  }, [optimisticUpdates, updateItemCompletedStatus, showError])

  const handleAddItem = async (data: { name: string; categoryId: string; status: string }) => {
    try {
      await addItem(data.name, data.categoryId, data.status)
      showSuccess('Producto agregado', `${data.name} se agregó a la categoría`)
    } catch (err) {
      showError('Error', 'No se pudo agregar el producto')
    }
  }

  // Función para desmarcar todos los elementos completados (con batching)
  const handleClearAllCompleted = useCallback(async () => {
    const completedItems = items.filter((item) => {
      if (optimisticUpdates.hasOwnProperty(item.id)) {
        return optimisticUpdates[item.id]
      }
      return item.completed
    })
    
    if (completedItems.length === 0) {
      return
    }

    // Actualización optimista para todos los items
    const optimisticUpdatesBatch: Record<string, boolean> = {}
    completedItems.forEach(item => {
      optimisticUpdatesBatch[item.id] = false
    })
    
    setOptimisticUpdates(prev => ({
      ...prev,
      ...optimisticUpdatesBatch
    }))
    
    // Agregar todos a pendientes
    setPendingUpdates(prev => new Set([...prev, ...completedItems.map(item => item.id)]))
    
    try {
      // Usar batch update en lugar de Promise.all para evitar saturación
      await batchUpdateCompletedStatus(
        completedItems.map(item => ({ id: item.id, completed: false }))
      )
      
      // Limpiar actualizaciones optimistas y pendientes
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev }
        completedItems.forEach(item => {
          delete newUpdates[item.id]
        })
        return newUpdates
      })
      
      setPendingUpdates(prev => {
        const newSet = new Set(prev)
        completedItems.forEach(item => {
          newSet.delete(item.id)
        })
        return newSet
      })
      
      showSuccess('Tildes limpiadas', `${completedItems.length} producto(s) desmarcado(s)`)
    } catch (err) {
      // Revertir cambios optimistas en caso de error
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev }
        completedItems.forEach(item => {
          delete newUpdates[item.id]
        })
        return newUpdates
      })
      
      setPendingUpdates(prev => {
        const newSet = new Set(prev)
        completedItems.forEach(item => {
          newSet.delete(item.id)
        })
        return newSet
      })
      
      showError('Error', 'No se pudieron desmarcar los productos')
    }
  }, [items, optimisticUpdates, batchUpdateCompletedStatus, showSuccess, showError])

  // Los items ya vienen ordenados desde el hook (completados al final)
  const categoryItems = items

  const categoryName = category.charAt(0).toUpperCase() + category.slice(1)
  const categoryColor = getCategoryColor(category)

  // Progress tracking for the category
  const progress = useMemo(() => {
    const completed = items.filter(item => getItemStatus(item)).length
    return {
      current: completed,
      total: items.length
    }
  }, [items, optimisticUpdates])

  if (categoryStats.isLoading) {
    return <LoadingSpinner title="Cargando productos..." />
  }

  if (error) {
    return (
      <SidebarLayout 
        title={categoryName}
        showBackButton
        onBack={onBack}
      >
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Error: {error}</p>
          <button 
            onClick={() => clearError()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      </SidebarLayout>
    )
  }

  const renderItemsList = (items: any[], title: string) => {
    // Durante SSR, no renderizar nada para evitar diferencias de hidratación
    // Solo renderizar después de la hidratación
    if (!isHydrated) {
      return null
    }
    
    if (items.length === 0) {
      return null
    }

    return (
      <div className="mb-6">
        <div className="space-y-2">
          {items.map((item) => {
            // Después de hidratación, usar getItemStatus que incluye actualizaciones optimistas
            const isCompleted = getItemStatus(item)
            const isPending = pendingUpdates.has(item.id)
              
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 bg-card rounded-lg border border-border transition-all duration-200 ${
                    isPending ? 'opacity-80 bg-muted/30' : 'hover:bg-muted/20'
                  }`}
                >
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={isCompleted}
                    onCheckedChange={() => handleOptimisticToggle(item.id, item)}
                    disabled={isPending}
                    aria-label={isCompleted ? 'Marcar como pendiente' : 'Marcar como completado'}
                    className="h-6 w-6 cursor-pointer"
                  />
                  <label
                    htmlFor={`item-${item.id}`}
                    className={`flex-1 text-sm capitalize cursor-pointer ${
                      isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {item.name}
                  </label>
                  
                  {isPending && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-full text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </div>
    )
  }

  // Calcular cantidad de items completados (solo en cliente después de hidratación)
  const completedCount = isHydrated 
    ? items.filter(item => getItemStatus(item)).length 
    : items.filter(item => item.completed).length

  return (
    <SidebarLayout 
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Categoría" }
      ]}
      title={categoryName}
      showBackButton
      onBack={onBack}
      headerActions={
        isHydrated && completedCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAllCompleted}
            disabled={pendingUpdates.size > 0}
          >
            <X className="h-4 w-4 mr-2" />
            Limpiar tildes ({completedCount})
          </Button>
        ) : undefined
      }
    >
      <LoadingOverlay isLoading={categoryStats.isLoading}>
        {/* Buscador */}
        <div className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={clearSearch}
            placeholder={`Buscar en ${categoryName}...`}
            className="w-full"
          />
        </div>

        {/* Renderizar siempre la lista para evitar diferencias de hidratación */}
        {/* Si no hay items, renderItemsList retornará null */}
        {renderItemsList(items, 'Este mes')}
        
        {/* Mostrar mensaje vacío solo si realmente no hay items y está hidratado */}
        {isHydrated && items.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? `No se encontraron productos que coincidan con "${searchQuery}"` : 'No hay productos en esta categoría'}
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
        )}
      </LoadingOverlay>
      
      {/* Floating Action Button with Modal */}
      <AddProductModal
        onAddItem={handleAddItem}
        isLoading={categoryStats.isLoading}
        trigger={
          <FloatingActionButton
            size="md"
            position="bottom-right"
          />
        }
      />
    </SidebarLayout>
  )
}
