"use client"

import { useState, useEffect, useCallback } from 'react'
import { ShoppingItem } from '../lib/domain/entities/ShoppingItem'
import { ItemName } from '../lib/domain/value-objects/ItemName'
import { ItemStatus } from '../lib/domain/value-objects/ItemStatus'
import { Category } from '../lib/domain/value-objects/Category'

interface UseShoppingItemsReturn {
  items: ShoppingItem[]
  loading: boolean
  error: string | null
  createItem: (name: string, category: string, status: string) => Promise<void>
  updateItem: (id: string, updates: Partial<{ name: string; category: string; status: string; completed: boolean }>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleItemCompleted: (id: string) => Promise<void>
  moveItemToStatus: (id: string, newStatus: string) => Promise<void>
  reorderItems: (status: string, sourceIndex: number, destIndex: number) => Promise<void>
  getItemsByStatus: (status: string) => ShoppingItem[]
  getItemsByCategory: (category: string) => ShoppingItem[]
  refetch: () => Promise<void>
}

export function useShoppingItems(): UseShoppingItemsReturn {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/shopping-items', {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!Array.isArray(data)) {
        throw new Error('Expected array but received: ' + typeof data)
      }

      // Convert API data to domain entities
      const domainItems = data.map((item: any) => 
        ShoppingItem.fromPersistence({
          id: item.id,
          name: new ItemName(item.name),
          category: new Category(item.category),
          status: new ItemStatus(item.status),
          completed: item.completed,
          orderIndex: item.orderIndex,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })
      )
      
      setItems(domainItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items')
    } finally {
      setLoading(false)
    }
  }, [])

  const createItem = useCallback(async (name: string, category: string, status: string) => {
    try {
      setError(null)
      
      const response = await fetch('/api/shopping-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, category, status }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const newItemData = await response.json()
      const newItem = ShoppingItem.fromPersistence({
        id: newItemData.id,
        name: new ItemName(newItemData.name),
        category: new Category(newItemData.category),
        status: new ItemStatus(newItemData.status),
        completed: newItemData.completed,
        orderIndex: newItemData.orderIndex,
        createdAt: new Date(newItemData.createdAt),
        updatedAt: new Date(newItemData.updatedAt),
      })
      
      setItems(prev => [...prev, newItem])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
      throw err
    }
  }, [])

  const updateItem = useCallback(async (id: string, updates: Partial<{ name: string; category: string; status: string; completed: boolean }>) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/shopping-items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const updatedItemData = await response.json()
      const updatedItem = ShoppingItem.fromPersistence({
        id: updatedItemData.id,
        name: new ItemName(updatedItemData.name),
        category: new Category(updatedItemData.category),
        status: new ItemStatus(updatedItemData.status),
        completed: updatedItemData.completed,
        orderIndex: updatedItemData.orderIndex,
        createdAt: new Date(updatedItemData.createdAt),
        updatedAt: new Date(updatedItemData.updatedAt),
      })
      
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item')
      throw err
    }
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/shopping-items/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      setItems(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item')
      throw err
    }
  }, [])

  const toggleItemCompleted = useCallback(async (id: string) => {
    const item = items.find(item => item.id === id)
    if (!item) throw new Error('Item not found')
    
    const newCompleted = !item.completed
    
    // Actualización optimista - cambiar solo el estado completed
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, completed: newCompleted }
        : item
    ))
    
    try {
      // Sincronizar con el servidor en background
      await updateItem(id, { completed: newCompleted })
    } catch (err) {
      // Rollback en caso de error
      setItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, completed: !newCompleted }
          : item
      ))
      setError(err instanceof Error ? err.message : 'Failed to toggle item')
      throw err
    }
  }, [items, updateItem])

  const moveItemToStatus = useCallback(async (id: string, newStatus: string) => {
    try {
      await updateItem(id, { status: newStatus })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move item')
      throw err
    }
  }, [updateItem])

  const reorderItems = useCallback(async (status: string, sourceIndex: number, destIndex: number) => {
    try {
      setError(null)
      
      const response = await fetch('/api/shopping-items/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, sourceIndex, destIndex }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      // Refetch items to get updated order
      await fetchItems()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder items'
      setError(errorMessage)
      throw err
    }
  }, [fetchItems])

  const getItemsByStatus = useCallback((status: string) => {
    return items?.filter(item => item.status.getValue() === status) || []
  }, [items])

  const getItemsByCategory = useCallback((category: string) => {
    return items?.filter(item => item.category.getValue() === category) || []
  }, [items])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    toggleItemCompleted,
    moveItemToStatus,
    reorderItems,
    getItemsByStatus,
    getItemsByCategory,
    refetch: fetchItems,
  }
}
