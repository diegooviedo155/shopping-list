"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { ArrowLeft, Loader2, ShoppingCart } from "lucide-react"
import { ITEM_STATUS } from "@/lib/constants/item-status"
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants/categories"
import { Checkbox } from "./ui/checkbox"
import { Badge } from "./ui/badge"
import { createClient } from "@/lib/supabase/client"
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
        
        const response = await fetch(`/api/categories/${encodeURIComponent(category)}`)
        
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
        console.error('Error fetching category items:', err)
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
      const supabase = createClient()
      
      const { error } = await supabase
        .from('shopping_items')
        .update({ completed: !currentStatus })
        .eq('id', itemId)

      if (error) throw error

      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, completed: !currentStatus } : item
        )
      )
    } catch (err) {
      console.error('Error toggling item:', err)
      setError('Error al actualizar el producto')
    } finally {
      setIsToggling(prev => ({ ...prev, [itemId]: false }))
    }
  }

  const categoryItems = items.sort((a, b) => a.order_index - b.order_index)
  const thisMonthItems = categoryItems.filter((item) => item.status === ITEM_STATUS.THIS_MONTH)
  const nextMonthItems = categoryItems.filter((item) => item.status === ITEM_STATUS.NEXT_MONTH)

  const categoryInfo = Object.entries(CATEGORIES).find(([_, value]) => value === category)
  const categoryName = categoryInfo ? CATEGORY_CONFIG[category as keyof typeof CATEGORIES]?.name : category
  const categoryColor = `var(--color-${category.toLowerCase()})`

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando productos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
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
                  id={`item-${item.id}`}
                  checked={item.completed}
                  onCheckedChange={() => toggleItemCompleted(item.id, item.completed)}
                  className="h-5 w-5 rounded-full"
                  disabled={isToggling[item.id]}
                />
                {isToggling[item.id] && (
                  <Loader2 className="w-4 h-4 animate-spin absolute inset-0 m-auto" />
                )}
                <label
                  htmlFor={`item-${item.id}`}
                  className={`flex-1 text-sm ${
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">{categoryName}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
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
      </main>
    </div>
  )
}
