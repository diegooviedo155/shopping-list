"use client"

import { useMemo, useState, useEffect } from "react"
import { Loader2, ShoppingCart, Clock } from "lucide-react"
import { ITEM_STATUS } from "@/lib/constants/item-status"
import { getCategoryColor, getIconEmoji, categorySlugToDatabaseType } from "@/lib/constants/categories"
import { Checkbox } from "./ui/checkbox"
import { Badge } from "./ui/badge"
import { SidebarLayout } from "./sidebar-layout"
import { LoadingOverlay } from "./loading-states"
import { FloatingActionButton, SearchInput } from "./atoms"
import { AddProductModal } from "./modals"
import { useUnifiedCategoryView, useUnifiedShopping } from "../hooks/use-unified-shopping"
import { useToast } from "../hooks/use-toast"
import type { ShoppingItem } from "@/lib/types/database"

export function CategoryView({ category, onBack }: { category: string; onBack: () => void }) {
  const { getCategoryStats, loading, error, clearError, setSearchQuery, clearSearch, searchQuery } = useUnifiedCategoryView()
  const { updateItemCompletedStatus, addItem } = useUnifiedShopping()
  const { showSuccess, showError } = useToast()
  
  // Estado local para actualizaciones optimistas
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, boolean>>({})
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set())
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Manejar hidratación
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  // Obtener estadísticas de la categoría con búsqueda
  const categoryStats = getCategoryStats(categorySlugToDatabaseType(category), searchQuery)
  const items = categoryStats.items


  

  // Función para actualización optimista inmediata
  const handleOptimisticToggle = async (itemId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    
    // Actualización optimista inmediata
    setOptimisticUpdates(prev => ({
      ...prev,
      [itemId]: newStatus
    }))
    
    // Agregar a pendientes
    setPendingUpdates(prev => new Set([...prev, itemId]))
    
    try {
      // Actualización inmediata al servidor
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
      
      showSuccess(
        newStatus ? 'Producto completado' : 'Producto pendiente',
        `Producto marcado como ${newStatus ? 'completado' : 'pendiente'}`
      )
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
    }
  }

  const handleAddItem = async (data: { name: string; categoryId: string; status: string }) => {
    try {
      await addItem(data.name, data.categoryId, data.status)
      showSuccess('Producto agregado', `${data.name} se agregó a la categoría`)
    } catch (err) {
      showError('Error', 'No se pudo agregar el producto')
    }
  }

  // Función para obtener el estado combinado (real + optimista)
  const getItemStatus = (item: any) => {
    if (optimisticUpdates.hasOwnProperty(item.id)) {
      return optimisticUpdates[item.id]
    }
    return item.completed
  }

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
    return (
      <SidebarLayout 
        title={categoryName}
        showBackButton
        onBack={onBack}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        </div>
      </SidebarLayout>
    )
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
    if (!isHydrated) {
      return (
        <div className="mb-6">
          <div className="space-y-2">
            <div className="animate-pulse">
              <div className="h-12 bg-muted rounded-lg"></div>
              <div className="h-12 bg-muted rounded-lg"></div>
              <div className="h-12 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <>
        {items.length > 0 && (
          <div className="mb-6">
            <div className="space-y-2">
              {items.map((item) => {
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
                    onCheckedChange={() => handleOptimisticToggle(item.id, item.completed)}
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
      )}
    </>
    )
  }

  return (
    <SidebarLayout 
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Categoría" }
      ]}
      title={categoryName}
      showBackButton
      onBack={onBack}
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

        {items.length === 0 ? (
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
        ) : (
          <>
            {renderItemsList(items, 'Este mes')}
          </>
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
