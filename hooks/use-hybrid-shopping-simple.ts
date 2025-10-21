"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUnifiedShopping } from './use-unified-shopping'
import { useAuth } from '@/components/auth/auth-provider'
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

interface UseHybridShoppingReturn {
  // Estado principal
  items: SimpleShoppingItem[]
  categories: any[]
  loading: boolean
  error: string | null
  isRefreshing: boolean
  
  // Estado de UI
  activeTab: ItemStatus
  selectedCategory: Category
  searchQuery: string
  
  // Items filtrados (memoizados)
  currentItems: SimpleShoppingItem[]
  itemsByCategory: (categorySlug: string) => SimpleShoppingItem[]
  itemsByStatus: (status: ItemStatus) => SimpleShoppingItem[]
  itemsByStatusAndSearch: (status: ItemStatus, searchQuery?: string) => SimpleShoppingItem[]
  itemsByCategoryAndSearch: (category: Category, searchQuery?: string) => SimpleShoppingItem[]
  
  // Contadores (memoizados)
  completedCount: number
  totalCount: number
  
  // Estado de listas compartidas (deshabilitado temporalmente)
  sharedLists: any[]
  activeSharedList: any | null
  sharedListItems: any[]
  sharedListLoading: boolean
  
  // Acciones de items
  addItem: (name: string, category: string, status: string) => Promise<void>
  updateItem: (id: string, updates: Partial<SimpleShoppingItem>) => Promise<void>
  updateItemName: (id: string, name: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleItemCompleted: (id: string) => Promise<void>
  updateItemCompletedStatus: (id: string, completed: boolean) => Promise<void>
  moveItemToStatus: (id: string, newStatus: ItemStatus) => Promise<void>
  
  // Acciones de listas compartidas (deshabilitado temporalmente)
  setActiveSharedList: (list: any | null) => void
  addSharedListItem: (name: string, category: string, status: string) => Promise<void>
  
  // Utilidades
  refetch: (force?: boolean) => Promise<void>
  clearError: () => void
}

export function useHybridShoppingSimple(): UseHybridShoppingReturn {
  const { user } = useAuth()
  const unifiedShopping = useUnifiedShopping()
  
  // Estado de listas compartidas (deshabilitado temporalmente)
  const [sharedListItems, setSharedListItems] = useState<any[]>([])
  const [sharedListLoading, setSharedListLoading] = useState(false)

  // Convertir items unificados al formato simplificado
  const items = useMemo(() => {
    return unifiedShopping.items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      status: item.status,
      completed: item.completed,
      orderIndex: item.orderIndex,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
  }, [unifiedShopping.items])

  // Estado de UI
  const activeTab = unifiedShopping.activeTab
  const selectedCategory = unifiedShopping.selectedCategory
  const searchQuery = unifiedShopping.searchQuery

  // Items filtrados (memoizados)
  const currentItems = useMemo(() => {
    return unifiedShopping.currentItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      status: item.status,
      completed: item.completed,
      orderIndex: item.orderIndex,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
  }, [unifiedShopping.currentItems])

  // Funciones de filtrado
  const itemsByCategory = useCallback((categorySlug: string) => {
    return unifiedShopping.itemsByCategory(categorySlug).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      status: item.status,
      completed: item.completed,
      orderIndex: item.orderIndex,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
  }, [unifiedShopping.itemsByCategory])

  const itemsByStatus = useCallback((status: ItemStatus) => {
    return unifiedShopping.itemsByStatus(status).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      status: item.status,
      completed: item.completed,
      orderIndex: item.orderIndex,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
  }, [unifiedShopping.itemsByStatus])

  const itemsByStatusAndSearch = useCallback((status: ItemStatus, searchQuery?: string) => {
    return unifiedShopping.itemsByStatusAndSearch(status, searchQuery).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      status: item.status,
      completed: item.completed,
      orderIndex: item.orderIndex,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
  }, [unifiedShopping.itemsByStatusAndSearch])

  const itemsByCategoryAndSearch = useCallback((category: Category, searchQuery?: string) => {
    return unifiedShopping.itemsByCategoryAndSearch(category, searchQuery).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      status: item.status,
      completed: item.completed,
      orderIndex: item.orderIndex,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
  }, [unifiedShopping.itemsByCategoryAndSearch])

  // Contadores
  const completedCount = unifiedShopping.completedCount
  const totalCount = unifiedShopping.totalCount

  // Acciones de items (simplificadas)
  const addItem = useCallback(async (name: string, category: string, status: string) => {
    await unifiedShopping.addItem(name, category, status)
  }, [unifiedShopping.addItem])

  const updateItem = useCallback(async (id: string, updates: Partial<SimpleShoppingItem>) => {
    await unifiedShopping.updateItem(id, updates)
  }, [unifiedShopping.updateItem])

  const updateItemName = useCallback(async (id: string, name: string) => {
    await unifiedShopping.updateItemName(id, name)
  }, [unifiedShopping.updateItemName])

  const deleteItem = useCallback(async (id: string) => {
    await unifiedShopping.deleteItem(id)
  }, [unifiedShopping.deleteItem])

  const toggleItemCompleted = useCallback(async (id: string) => {
    await unifiedShopping.toggleItemCompleted(id)
  }, [unifiedShopping.toggleItemCompleted])

  const updateItemCompletedStatus = useCallback(async (id: string, completed: boolean) => {
    await unifiedShopping.updateItemCompletedStatus(id, completed)
  }, [unifiedShopping.updateItemCompletedStatus])

  const moveItemToStatus = useCallback(async (id: string, newStatus: ItemStatus) => {
    await unifiedShopping.moveItemToStatus(id, newStatus)
  }, [unifiedShopping.moveItemToStatus])

  // Funciones de listas compartidas (deshabilitadas temporalmente)
  const setActiveSharedList = useCallback(() => {
    // No hacer nada por ahora
  }, [])

  const addSharedListItem = useCallback(async () => {
    // No hacer nada por ahora
  }, [])

  return {
    // Estado principal
    items,
    categories: unifiedShopping.categories,
    loading: unifiedShopping.loading,
    error: unifiedShopping.error,
    isRefreshing: unifiedShopping.isRefreshing,
    
    // Estado de UI
    activeTab,
    selectedCategory,
    searchQuery,
    
    // Items filtrados
    currentItems,
    itemsByCategory,
    itemsByStatus,
    itemsByStatusAndSearch,
    itemsByCategoryAndSearch,
    
    // Contadores
    completedCount,
    totalCount,
    
    // Estado de listas compartidas (deshabilitado temporalmente)
    sharedLists: [],
    activeSharedList: null,
    sharedListItems,
    sharedListLoading,
    
    // Acciones de items
    addItem,
    updateItem,
    updateItemName,
    deleteItem,
    toggleItemCompleted,
    updateItemCompletedStatus,
    moveItemToStatus,
    
    // Acciones de listas compartidas (deshabilitado temporalmente)
    setActiveSharedList,
    addSharedListItem,
    
    // Utilidades
    refetch: unifiedShopping.refetch,
    clearError: unifiedShopping.clearError
  }
}
