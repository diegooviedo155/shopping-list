"use client"

import { useState, useEffect } from "react"
import type { ShoppingItem, Category, ItemStatus } from "@/lib/types/database"
import { ITEM_STATUS } from "@/lib/constants/item-status"

export function useShoppingItems() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/shopping-items", {
        cache: 'no-store', // Evitar caché
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          const text = await response.text()
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (!Array.isArray(data)) {
        throw new Error('Se esperaba un array de items pero se recibió: ' + typeof data)
      }
      
      // Asegurarse de que los items tengan el formato correcto
      const formattedItems = data.map((item: any, index: number) => {
        if (!item || typeof item !== 'object') {
          return null
        }
        
        // Validar que el status sea uno de los permitidos
        const validStatus = item.status && Object.values(ITEM_STATUS).includes(item.status as ItemStatus)
          ? item.status as ItemStatus
          : ITEM_STATUS.NEXT_MONTH // Valor por defecto
          
        return {
          ...item,
          id: String(item.id || ''),
          name: String(item.name || 'Sin nombre'),
          category: String(item.category || 'supermercado') as Category,
          status: validStatus,
          completed: Boolean(item.completed),
          orderIndex: Number(item.orderIndex || item.order_index || 0),
          createdAt: item.createdAt || item.created_at || new Date().toISOString(),
          updatedAt: item.updatedAt || item.updated_at || new Date().toISOString()
        }
      })
      
      // Filtrar items nulos (si los hubiera)
      const validItems = formattedItems.filter((item): item is ShoppingItem => item !== null)
      
      setItems(validItems)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error fetching items"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (name: string, category: Category, status: ItemStatus) => {
    try {
      const response = await fetch("/api/shopping-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, status }),
      })

      if (!response.ok) throw new Error("Failed to add item")

      const newItem = await response.json()
      setItems((prev) => [...prev, newItem])
      return newItem
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding item")
      throw err
    }
  }

  const toggleItemCompleted = async (id: string) => {
    try {
      const item = items.find((item) => item.id === id)
      if (!item) return

      const newCompleted = !item.completed;
      const newStatus = newCompleted ? ITEM_STATUS.THIS_MONTH : ITEM_STATUS.NEXT_MONTH;

      const response = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          completed: newCompleted,
          status: newStatus 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update item");
      }

      const updatedItem = await response.json();

      setItems((prev) => 
        prev.map((item) => 
          item.id === id 
            ? { 
                ...item, 
                completed: newCompleted,
                status: newStatus,
                updated_at: new Date().toISOString()
              } 
            : item
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating item")
      throw err; // Re-lanzar el error para que pueda ser manejado por el componente
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/shopping-items/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete item")

      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting item")
    }
  }

  const moveItemToStatus = async (id: string, newStatus: ItemStatus) => {
    try {
      const maxOrderItem = items
        .filter((item) => item.status === newStatus)
        .reduce((max, item) => (item.orderIndex > max ? item.orderIndex : max), -1)

      const response = await fetch(`/api/shopping-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          orderIndex: maxOrderItem + 1,
        }),
      })

      if (!response.ok) throw new Error("Failed to move item")

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus, orderIndex: maxOrderItem + 1 } : item)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error moving item")
    }
  }

  const reorderItems = async (status: ItemStatus, sourceIndex: number, destIndex: number) => {
    try {
      const response = await fetch("/api/shopping-items/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, sourceIndex, destIndex }),
      })

      if (!response.ok) throw new Error("Failed to reorder items")

      // Optimistically update local state
      const currentItems = items
        .filter((item) => item.status === status)
        .sort((a, b) => a.orderIndex - b.orderIndex)
      
      const [reorderedItem] = currentItems.splice(sourceIndex, 1)
      currentItems.splice(destIndex, 0, reorderedItem)

      setItems((prev) => {
        const otherItems = prev.filter((item) => item.status !== status)
        const updatedItems = currentItems.map((item, index) => ({ 
          ...item, 
          orderIndex: index 
        }))
        return [...otherItems, ...updatedItems]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error reordering items")
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  return {
    items,
    loading,
    error,
    addItem,
    toggleItemCompleted,
    deleteItem,
    moveItemToStatus,
    reorderItems,
    refetch: fetchItems,
  }
}
