"use client"

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { useUnifiedShoppingStore } from '@/lib/store/unified-shopping-store'
import type { Category, ItemStatus } from '@/lib/types/database'
import { ITEM_STATUS } from '@/lib/constants/item-status'
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
  searchQuery: string
  
  // Items filtrados (memoizados)
  currentItems: SimpleShoppingItem[]
  itemsByCategory: (category: Category) => SimpleShoppingItem[]
  itemsByStatus: (status: ItemStatus) => SimpleShoppingItem[]
  itemsByStatusAndSearch: (status: ItemStatus, searchQuery?: string) => SimpleShoppingItem[]
  itemsByCategoryAndSearch: (category: Category, searchQuery?: string) => SimpleShoppingItem[]
  
  // Contadores (memoizados)
  completedCount: number
  totalCount: number
  
  // Acciones de items
  addItem: (name: string, category: string, status: string) => Promise<void>
  updateItem: (id: string, updates: Partial<SimpleShoppingItem>) => Promise<void>
  updateItemName: (id: string, name: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleItemCompleted: (id: string) => Promise<void>
  updateItemCompletedStatus: (id: string, completed: boolean) => Promise<void>
  moveItemToStatus: (id: string, newStatus: ItemStatus) => Promise<void>
  reorderItems: (status: ItemStatus, sourceIndex: number, destIndex: number) => Promise<void>
  
  // Acciones de UI
  setActiveTab: (tab: ItemStatus) => void
  setSelectedCategory: (category: Category) => void
  setSearchQuery: (query: string) => void
  clearSearch: () => void
  clearError: () => void
  
  // Utilidades
  refetch: (force?: boolean) => Promise<void>
  initialize: () => Promise<void>
  forceInitialize: () => Promise<void>
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

  // Items filtrados memoizados - forzar re-render cuando cambien los items
  const currentItems = useMemo(() => {
    return store.getItemsByStatus(store.activeTab)
  }, [store.items, store.activeTab, store.getItemsByStatus])

  // Contadores memoizados
  const completedCount = useMemo(() => {
    return store.getCompletedCount(store.activeTab)
  }, [store.items, store.activeTab, store.getCompletedCount])

  const totalCount = useMemo(() => {
    return store.getTotalCount(store.activeTab)
  }, [store.items, store.activeTab, store.getTotalCount])

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

  const forceInitialize = useCallback(() => {
    return store.forceInitialize()
  }, [store.forceInitialize])

  // Funciones de búsqueda
  const itemsByStatusAndSearch = useCallback((status: ItemStatus, searchQuery?: string) => {
    return store.getItemsByStatusAndSearch(status, searchQuery)
  }, [store.getItemsByStatusAndSearch])

  const itemsByCategoryAndSearch = useCallback((category: Category, searchQuery?: string) => {
    return store.getItemsByCategoryAndSearch(category, searchQuery)
  }, [store.getItemsByCategoryAndSearch])

  const setSearchQuery = useCallback((query: string) => {
    store.setSearchQuery(query)
  }, [store.setSearchQuery])

  const clearSearch = useCallback(() => {
    store.clearSearch()
  }, [store.clearSearch])

  return {
    // Estado principal
    items: store.items,
    loading: store.loading,
    error: store.error,
    isRefreshing: store.isRefreshing,
    
    // Estado de UI
    activeTab: store.activeTab,
    selectedCategory: store.selectedCategory,
    searchQuery: store.searchQuery,
    
    // Items filtrados
    currentItems,
    itemsByCategory,
    itemsByStatus,
    itemsByStatusAndSearch,
    itemsByCategoryAndSearch,
    
    // Contadores
    completedCount,
    totalCount,
    
  // Acciones de items
  addItem: store.addItem,
  updateItem: store.updateItem,
  updateItemName: store.updateItemName,
  deleteItem: store.deleteItem,
    toggleItemCompleted: store.toggleItemCompleted,
    updateItemCompletedStatus: store.updateItemCompletedStatus,
    moveItemToStatus: store.moveItemToStatus,
    reorderItems: store.reorderItems,
    
    // Acciones de UI
    setActiveTab: store.setActiveTab,
    setSelectedCategory: store.setSelectedCategory,
    setSearchQuery,
    clearSearch,
    clearError: store.clearError,
    
    // Utilidades
    refetch,
    initialize,
    forceInitialize,
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

  const getCategoryStats = useCallback((category: Category, searchQuery?: string) => {
    // Solo obtener items de "este_mes" para la vista de categoría
    const allCategoryItems = store.getItemsByCategory(category)
    let categoryItems = allCategoryItems
      .filter(item => item.status === ITEM_STATUS.THIS_MONTH)
    
    // Aplicar filtro de búsqueda si se proporciona
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      categoryItems = categoryItems.filter(item => 
        item.name.toLowerCase().includes(query)
      )
    }
    
    // Ordenar: primero no completados, luego completados
    categoryItems = categoryItems.sort((a, b) => {
      if (a.completed === b.completed) {
        return a.orderIndex - b.orderIndex
      }
      return a.completed ? 1 : -1
    })
    
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
    // Funciones de búsqueda
    setSearchQuery: store.setSearchQuery,
    clearSearch: store.clearSearch,
    searchQuery: store.searchQuery,
  }
}
