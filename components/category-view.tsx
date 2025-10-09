"use client"

import { useMemo } from "react"
import { Loader2, ShoppingCart } from "lucide-react"
import { ITEM_STATUS } from "@/lib/constants/item-status"
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants/categories"
import { Checkbox } from "./ui/checkbox"
import { Badge } from "./ui/badge"
import { PageLayout, PageHeader } from "./templates"
import { LoadingOverlay } from "./loading-states"
import { FloatingActionButton } from "./atoms"
import { AddProductModal } from "./modals"
import { useUnifiedCategoryView } from "../hooks/use-unified-shopping"
import { useToast } from "../hooks/use-toast"
import type { ShoppingItem } from "@/lib/types/database"

export function CategoryView({ category, onBack }: { category: string; onBack: () => void }) {
  const { getCategoryStats, loading, error, clearError } = useUnifiedCategoryView()
  const { showSuccess, showError } = useToast()
  
  // Obtener estadísticas de la categoría
  const categoryStats = getCategoryStats(category as any)
  const items = categoryStats.items
  

  const toggleItemCompleted = async (itemId: string, currentStatus: boolean) => {
    try {
      // Importar dinámicamente para evitar problemas de hooks
      const { useUnifiedShopping } = await import('../hooks/use-unified-shopping')
      const { toggleItemCompleted: toggleItem } = useUnifiedShopping()
      
      await toggleItem(itemId)
      showSuccess(
        currentStatus ? 'Producto pendiente' : 'Producto completado',
        `Producto marcado como ${currentStatus ? 'pendiente' : 'completado'}`
      )
    } catch (err) {
      showError('Error', 'No se pudo actualizar el producto')
    }
  }

  const handleAddItem = async (data: { name: string; category: string; status: string }) => {
    try {
      // Importar dinámicamente para evitar problemas de hooks
      const { useUnifiedShopping } = await import('../hooks/use-unified-shopping')
      const { addItem } = useUnifiedShopping()
      
      await addItem(data.name, data.category as any, data.status as any)
      showSuccess('Producto agregado', `${data.name} se agregó a la categoría`)
    } catch (err) {
      showError('Error', 'No se pudo agregar el producto')
    }
  }

  const categoryItems = items.sort((a, b) => a.orderIndex - b.orderIndex)
  const thisMonthItems = categoryItems.filter((item) => item.status.getValue() === ITEM_STATUS.THIS_MONTH)
  const nextMonthItems = categoryItems.filter((item) => item.status.getValue() === ITEM_STATUS.NEXT_MONTH)

  const categoryName = (CATEGORY_CONFIG as any)[category]?.name || category
  const categoryColor = `var(--color-${category.toLowerCase()})`

  // Progress tracking for the category - usar los datos del store
  const progress = useMemo(() => {
    return {
      current: categoryStats.completedCount,
      total: categoryStats.totalCount
    }
  }, [categoryStats.completedCount, categoryStats.totalCount])

  const header = (
    <PageHeader
      title={categoryName}
      showBackButton
      onBack={onBack}
      progress={progress.total > 0 ? progress : undefined}
    />
  )

  if (categoryStats.isLoading) {
    return (
      <PageLayout header={header}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando productos...</p>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout header={header}>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Error: {error}</p>
          <button 
            onClick={() => clearError()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      </PageLayout>
    )
  }

  const renderItemsList = (items: typeof categoryItems, title: string) => (
    <>
      {items.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <span className="w-2 h-5 rounded-full mr-2" style={{ backgroundColor: categoryColor }} />
            {title}
            <Badge variant="outline" className="ml-2">
              {items.length}
            </Badge>
          </h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => toggleItemCompleted(item.id, item.completed)}
                  aria-label={item.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                  className="h-5 w-5"
                />
                <label
                  htmlFor={`item-${item.id}`}
                  className={`flex-1 text-sm capitalize ${
                    item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {item.name.getValue()}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )

  return (
    <PageLayout header={header}>
      <LoadingOverlay isLoading={categoryStats.isLoading}>
        {categoryItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay productos en esta categoría</p>
          </div>
        ) : (
          <>
            {renderItemsList(thisMonthItems, 'Este mes')}
            {renderItemsList(nextMonthItems, 'Próximo mes')}
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
    </PageLayout>
  )
}
