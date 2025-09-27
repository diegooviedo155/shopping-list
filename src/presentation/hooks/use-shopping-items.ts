"use client"

import { useState, useEffect, useCallback } from 'react'
import { DIContainer } from '../../core/infrastructure/container/DIContainer'
import { ShoppingItem } from '../../core/domain/entities/ShoppingItem'
import { ItemStatus } from '../../core/domain/value-objects/ItemStatus'
import { Category } from '../../core/domain/value-objects/Category'

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

  const container = DIContainer.getInstance()
  const shoppingItemService = container.getShoppingItemService()

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const allItems = await shoppingItemService.getAllItems()
      setItems(allItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items')
    } finally {
      setLoading(false)
    }
  }, [shoppingItemService])

  const createItem = useCallback(async (name: string, category: string, status: string) => {
    try {
      setError(null)
      const newItem = await shoppingItemService.createItem({ name, category, status })
      setItems(prev => [...prev, newItem])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item')
      throw err
    }
  }, [shoppingItemService])

  const updateItem = useCallback(async (id: string, updates: Partial<{ name: string; category: string; status: string; completed: boolean }>) => {
    try {
      setError(null)
      const updatedItem = await shoppingItemService.updateItem({ id, ...updates })
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item')
      throw err
    }
  }, [shoppingItemService])

  const deleteItem = useCallback(async (id: string) => {
    try {
      setError(null)
      await shoppingItemService.deleteItem(id)
      setItems(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item')
      throw err
    }
  }, [shoppingItemService])

  const toggleItemCompleted = useCallback(async (id: string) => {
    try {
      setError(null)
      const updatedItem = await shoppingItemService.toggleItemCompleted(id)
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle item')
      throw err
    }
  }, [shoppingItemService])

  const moveItemToStatus = useCallback(async (id: string, newStatus: string) => {
    try {
      setError(null)
      const updatedItem = await shoppingItemService.moveItemToStatus(id, newStatus)
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move item')
      throw err
    }
  }, [shoppingItemService])

  const reorderItems = useCallback(async (status: string, sourceIndex: number, destIndex: number) => {
    try {
      setError(null)
      await shoppingItemService.reorderItems({ status, sourceIndex, destIndex })
      await fetchItems() // Refetch to get updated order
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder items')
      throw err
    }
  }, [shoppingItemService, fetchItems])

  const getItemsByStatus = useCallback((status: string) => {
    return items.filter(item => item.status.getValue() === status)
  }, [items])

  const getItemsByCategory = useCallback((category: string) => {
    return items.filter(item => item.category.getValue() === category)
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
