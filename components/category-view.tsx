"use client"

import { useState, useEffect, useMemo } from "react"
import { Loader2, ShoppingCart } from "lucide-react"
import { ITEM_STATUS } from "@/lib/constants/item-status"
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants/categories"
import { Checkbox } from "./ui/checkbox"
import { Badge } from "./ui/badge"
import { PageLayout, PageHeader } from "./templates"
import { LoadingOverlay } from "./loading-states"
import { FloatingActionButton } from "./atoms"
import { AddProductModal } from "./modals"
import type { ShoppingItem } from "@/lib/types/database"

export function CategoryView({ category, onBack }: { category: string; onBack: () => void }) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchItems = async () => {
      if (!category) {
        setError('No se ha especificado una categoría')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/items/by-category/${encodeURIComponent(category)}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Error al cargar los productos')
        }
        
        const data = await response.json()
        
        if (!Array.isArray(data)) {
          throw new Error('Formato de respuesta inválido')
        }
        
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar los productos')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [category])

  const toggleItemCompleted = async (itemId: string, currentStatus: boolean) => {
    try {
      setIsToggling(prev => ({ ...prev, [itemId]: true }))
      
      const response = await fetch(`/api/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !currentStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al actualizar el producto')
      }

      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, completed: !currentStatus } : item
        )
      )
    } catch (err) {
      setError('Error al actualizar el producto')
    } finally {
      setIsToggling(prev => ({ ...prev, [itemId]: false }))
    }
  }

  const handleAddItem = async (data: { name: string; category: string; status: string }) => {
    try {
      const response = await fetch('/api/shopping-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al agregar el producto')
      }

      // Refresh the items list
      const fetchItems = async () => {
        try {
          const response = await fetch(`/api/items/by-category/${encodeURIComponent(category)}`)
          if (response.ok) {
            const data = await response.json()
            if (Array.isArray(data)) {
              setItems(data)
            }
          }
        } catch (err) {
          console.error('Error refreshing items:', err)
        }
      }
      
      await fetchItems()
    } catch (err) {
      setError('Error al agregar el producto')
    }
  }

  const categoryItems = items.sort((a, b) => a.orderIndex - b.orderIndex)
  const thisMonthItems = categoryItems.filter((item) => item.status === ITEM_STATUS.THIS_MONTH)
  const nextMonthItems = categoryItems.filter((item) => item.status === ITEM_STATUS.NEXT_MONTH)

  const categoryName = (CATEGORY_CONFIG as any)[category]?.name || category
  const categoryColor = `var(--color-${category.toLowerCase()})`

  // Progress tracking for the category
  const progress = useMemo(() => {
    const completed = categoryItems.filter(item => item.completed).length
    const total = categoryItems.length
    return { current: completed, total }
  }, [categoryItems])

  const header = (
    <PageHeader
      title={categoryName}
      showBackButton
      onBack={onBack}
      progress={progress.total > 0 ? progress : undefined}
    />
  )

  if (loading && items.length === 0) {
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
            onClick={() => window.location.reload()}
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
                  {item.name}
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
      <LoadingOverlay isLoading={loading && categoryItems.length === 0}>
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
        isLoading={loading}
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
