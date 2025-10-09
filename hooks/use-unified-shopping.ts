"use client"

import { useCallback, useEffect, useMemo } from 'react'
import { useUnifiedShoppingStore } from '@/lib/store/unified-shopping-store'
import type { Category, ItemStatus } from '@/lib/types/database'
// Tipos simplificados
interface SimpleShoppingItem {
  id: string
  name: string
  category: string
  status: string
  completed: boolean
  orderIndex: number
  createdAt: Date
  updatedAt: Date
}

interface UseUnifiedShoppingReturn {
  // Estado principal
  items: SimpleShoppingItem[]
  loading: boolean
  error: string | null
  isRefreshing: boolean
  
  // Estado de UI
  activeTab: ItemStatus
  selectedCategory: Category
  
  // Items filtrados (memoizados)
  currentItems: SimpleShoppingItem[]
  itemsByCategory: (category: Category) => SimpleShoppingItem[]
  itemsByStatus: (status: ItemStatus) => SimpleShoppingItem[]
  
  // Contadores (memoizados)
  completedCount: number
  totalCount: number
  
  // Acciones de items
  addItem: (name: string, category: string, status: string) => Promise<void>
  updateItem: (id: string, updates: Partial<SimpleShoppingItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleItemCompleted: (id: string) => Promise<void>
  moveItemToStatus: (id: string, newStatus: ItemStatus) => Promise<void>
  reorderItems: (status: ItemStatus, sourceIndex: number, destIndex: number) => Promise<void>
  
  // Acciones de UI
  setActiveTab: (tab: ItemStatus) => void
  setSelectedCategory: (category: Category) => void
  clearError: () => void
  
  // Utilidades
  refetch: (force?: boolean) => Promise<void>
  initialize: () => Promise<void>
  isMovingItem: (id: string) => boolean
  store: any
}

export function useUnifiedShopping(): UseUnifiedShoppingReturn {
  const store = useUnifiedShoppingStore()
  
  // Inicialización automática solo una vez
  useEffect(() => {
    if (!store.hasInitialized) {
      store.initialize().catch((error) => {
        // Error handling
      });
    }
  }, [store.hasInitialized])

  // Removed cleanAndUpdateItems useEffect - not needed with simplified store

  // Removed problematic force fetch useEffect to prevent infinite loops

  // Items filtrados memoizados
  const currentItems = useMemo(() => {
    return store.getItemsByStatus(store.activeTab)
  }, [store.items, store.activeTab])

  // Contadores memoizados
  const completedCount = useMemo(() => {
    return store.getCompletedCount(store.activeTab)
  }, [store.items, store.activeTab])

  const totalCount = useMemo(() => {
    return store.getTotalCount(store.activeTab)
  }, [store.items, store.activeTab])

  // Funciones wrapper memoizadas
  const itemsByCategory = useCallback((category: Category) => {
    return store.getItemsByCategory(category)
  }, [store.getItemsByCategory])

  const itemsByStatus = useCallback((status: ItemStatus) => {
    return store.getItemsByStatus(status)
  }, [store.getItemsByStatus])

  const refetch = useCallback((force = false) => {
    return store.fetchItems(force)
  }, [store.fetchItems])

  const initialize = useCallback(() => {
    return store.initialize()
  }, [store.initialize])

  return {
    // Estado principal
    items: store.items,
    loading: store.loading,
    error: store.error,
    isRefreshing: store.isRefreshing,
    
    // Estado de UI
    activeTab: store.activeTab,
    selectedCategory: store.selectedCategory,
    
    // Items filtrados
    currentItems,
    itemsByCategory,
    itemsByStatus,
    
    // Contadores
    completedCount,
    totalCount,
    
    // Acciones de items
    addItem: store.addItem,
    updateItem: store.updateItem,
    deleteItem: store.deleteItem,
    toggleItemCompleted: store.toggleItemCompleted,
    moveItemToStatus: store.moveItemToStatus,
    reorderItems: store.reorderItems,
    
    // Acciones de UI
    setActiveTab: store.setActiveTab,
    setSelectedCategory: store.setSelectedCategory,
    clearError: store.clearError,
    
    // Utilidades
    refetch,
    initialize,
    isMovingItem: store.isMovingItem,
    store,
  }
}

// Hook específico para vista de categorías
export function useUnifiedCategoryView() {
  const store = useUnifiedShoppingStore()
  
  // Inicialización automática
  useEffect(() => {
    if (!store.hasInitialized) {
      store.initialize()
    }
  }, [store.hasInitialized, store.initialize])

  const getCategoryStats = useCallback((category: Category) => {
    const categoryItems = store.getItemsByCategory(category)
    const completedCount = categoryItems.filter(item => item.completed).length
    const totalCount = categoryItems.length
    
    
    return {
      items: categoryItems,
      completedCount,
      totalCount,
      isLoading: store.loading && totalCount === 0,
    }
  }, [store.getItemsByCategory, store.loading, store.items, store.hasInitialized])

  return {
    items: store.items,
    loading: store.loading,
    error: store.error,
    getCategoryStats,
    clearError: store.clearError,
    refetch: () => store.fetchItems(true),
  }
}
