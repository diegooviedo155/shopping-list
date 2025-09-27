"use client"

import { useShoppingStore } from '@/lib/store/shopping-store';
import { useCallback, useEffect } from 'react';
import type { Category, ItemStatus, ShoppingItem } from '@/lib/types/database';

export function useShoppingItems() {
  const {
    items,
    loading,
    error,
    activeTab,
    selectedCategory,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    toggleItemCompleted,
    moveItemToStatus,
    reorderItems,
    setActiveTab,
    setSelectedCategory,
    clearError,
    getItemsByStatus,
    getItemsByCategory,
    getCompletedCount,
    getTotalCount,
  } = useShoppingStore();

  // Cargar items al montar el componente
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Funciones wrapper para mantener compatibilidad
  const refetch = useCallback(() => {
    return fetchItems();
  }, [fetchItems]);

  const getCurrentItems = useCallback(() => {
    return getItemsByStatus(activeTab);
  }, [getItemsByStatus, activeTab]);

  return {
    // Estado
    items,
    loading,
    error,
    activeTab,
    selectedCategory,
    
    // Items filtrados
    currentItems: getCurrentItems(),
    itemsByCategory: getItemsByCategory,
    itemsByStatus: getItemsByStatus,
    
    // Contadores
    completedCount: getCompletedCount(activeTab),
    totalCount: getTotalCount(activeTab),
    
    // Acciones de items
    addItem,
    updateItem,
    deleteItem,
    toggleItemCompleted,
    moveItemToStatus,
    reorderItems,
    refetch,
    
    // Acciones de UI
    setActiveTab,
    setSelectedCategory,
    clearError,
  };
}

// Hook específico para vista de categorías
export function useCategoryView() {
  const {
    items,
    loading,
    error,
    fetchItems,
    getItemsByCategory,
    getCompletedCount,
    getTotalCount,
    clearError,
  } = useShoppingStore();

  // Cargar todos los items al montar
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const getCategoryStats = useCallback((category: Category) => {
    const categoryItems = getItemsByCategory(category);
    const completedCount = categoryItems.filter(item => item.completed).length;
    const totalCount = categoryItems.length;
    
    return {
      items: categoryItems,
      completedCount,
      totalCount,
      isLoading: loading && totalCount === 0,
    };
  }, [getItemsByCategory, loading]);

  return {
    items,
    loading,
    error,
    getCategoryStats,
    clearError,
  };
}
