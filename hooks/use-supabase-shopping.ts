import { useSupabaseShoppingStore } from '@/lib/store/supabase-shopping-store'
import { useAuth } from '@/components/auth/auth-provider'
import { useEffect } from 'react'

export function useSupabaseShopping() {
  const { user } = useAuth()
  const store = useSupabaseShoppingStore()

  // Initialize data when user changes
  useEffect(() => {
    if (user) {
      store.forceInitialize()
    } else {
      // Clear data when user logs out
      store.clearData()
    }
  }, [user]) // Removed store from dependencies to avoid infinite loop

  // Computed values
  const currentItems = store.getItemsByStatusAndSearch(store.activeTab)
  const completedCount = store.getTotalStats().completed
  const totalCount = store.getTotalStats().total

  return {
    // State
    items: store.items,
    categories: store.categories,
    isLoading: store.isLoading,
    error: store.error,
    searchQuery: store.searchQuery,
    activeTab: store.activeTab,
    currentItems,
    completedCount,
    totalCount,

    // Actions
    fetchItems: store.fetchItems,
    fetchCategories: store.fetchCategories,
    addItem: store.addItem,
    updateItem: store.updateItem,
    deleteItem: store.deleteItem,
    toggleItemCompleted: store.toggleItemCompleted,
    moveItemToStatus: store.moveItemToStatus,
    reorderItems: store.reorderItems,
    updateItemName: store.updateItemName,
    setSearchQuery: store.setSearchQuery,
    clearSearch: store.clearSearch,
    setActiveTab: store.setActiveTab,
    forceInitialize: store.forceInitialize,

    // Getters
    getItemsByStatus: store.getItemsByStatus,
    getItemsByCategory: store.getItemsByCategory,
    getItemsByStatusAndSearch: store.getItemsByStatusAndSearch,
    getItemsByCategoryAndSearch: store.getItemsByCategoryAndSearch,
    getCategoryStats: store.getCategoryStats,
    getTotalStats: store.getTotalStats
  }
}
