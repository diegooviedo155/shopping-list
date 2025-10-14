"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Category, ItemStatus } from '@/lib/types/database'
import { ITEM_STATUS } from '@/lib/constants/item-status'

// Tipos simplificados para evitar problemas con domain entities
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

interface UnifiedShoppingState {
  // Estado principal
  items: SimpleShoppingItem[]
  loading: boolean
  error: string | null
  isRefreshing: boolean
  
  // Estado de UI
  activeTab: ItemStatus
  selectedCategory: Category
  searchQuery: string
  
  // Estado de inicialización
  hasInitialized: boolean
  lastFetch: number | null
  
  // Estado de loading para operaciones específicas
  movingItems: Set<string>
  
  // Acciones
  initialize: () => Promise<void>
  forceInitialize: () => Promise<void>
  fetchItems: (force?: boolean) => Promise<void>
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
  shouldFetch: () => boolean
  getItemsByStatus: (status: ItemStatus) => SimpleShoppingItem[]
  getItemsByCategory: (category: Category) => SimpleShoppingItem[]
  getItemsByStatusAndSearch: (status: ItemStatus, searchQuery?: string) => SimpleShoppingItem[]
  getItemsByCategoryAndSearch: (category: Category, searchQuery?: string) => SimpleShoppingItem[]
  getCompletedCount: (status: ItemStatus) => number
  getTotalCount: (status: ItemStatus) => number
  isMovingItem: (id: string) => boolean
}

const API_BASE = '/api/shopping-items'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export const useUnifiedShoppingStore = create<UnifiedShoppingState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      items: [],
      loading: false,
      error: null,
      isRefreshing: false,
      activeTab: ITEM_STATUS.THIS_MONTH as ItemStatus,
      selectedCategory: 'supermercado' as Category,
      searchQuery: '',
      hasInitialized: false,
      lastFetch: null,
      movingItems: new Set<string>(),

      // Verificar si debe hacer fetch
      shouldFetch: () => {
        const state = get();
        const now = Date.now();
        return (
          !state.hasInitialized ||
          !state.lastFetch ||
          (now - state.lastFetch) > CACHE_DURATION ||
          state.items.length === 0
        );
      },

      // Inicialización
      initialize: async () => {
        const state = get();
        
        if (state.hasInitialized && !state.shouldFetch()) {
          return;
        }
        
        try {
          await state.fetchItems(false);
        } catch (error) {
          // Error handling
        }
        set({ hasInitialized: true });
      },

      // Forzar inicialización (para hidratación)
      forceInitialize: async () => {
        set({ hasInitialized: false });
        await get().initialize();
      },

      // Fetch de items
      fetchItems: async (force = false) => {
        const state = get();
        
        if (state.loading && !force) {
          return;
        }
        if (!force && !state.shouldFetch()) {
          return;
        }

        set({ 
          loading: true, 
          error: null,
          isRefreshing: state.items.length > 0 
        });

        try {
          const response = await fetch(API_BASE, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            ...(force ? { cache: 'no-store' } : {})
          });

          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          if (!Array.isArray(data)) {
            throw new Error('Invalid response format');
          }

          const formattedItems: SimpleShoppingItem[] = data.map((item: any) => {
          // Status is already in correct format (este_mes)
          const normalizedStatus = String(item.status || ITEM_STATUS.NEXT_MONTH);
            
            return {
              id: String(item.id || ''),
              name: String(item.name || 'Sin nombre'),
              category: String(item.category?.slug || item.categoryId || 'supermercado'),
              status: normalizedStatus,
              completed: Boolean(item.completed),
              orderIndex: Number(item.orderIndex || item.order_index || 0),
              createdAt: new Date(item.createdAt || item.created_at || new Date()),
              updatedAt: new Date(item.updatedAt || item.updated_at || new Date())
            };
          });



          set({ 
            items: formattedItems, 
            loading: false,
            lastFetch: Date.now(),
            isRefreshing: false
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({ 
            error: errorMessage, 
            loading: false,
            isRefreshing: false
          });
        }
      },

      // Agregar item
      addItem: async (name: string, category: string, status: string) => {
        try {
          const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: name.trim(),
              categoryId: category,
              status: status
            })
          });

          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          const newItem = await response.json();
          
          const formattedItem: SimpleShoppingItem = {
            id: String(newItem.id),
            name: String(newItem.name),
            category: String(newItem.category?.slug || newItem.categoryId || category),
            status: String(newItem.status),
            completed: Boolean(newItem.completed),
            orderIndex: Number(newItem.orderIndex || 0),
            createdAt: new Date(newItem.createdAt || new Date()),
            updatedAt: new Date(newItem.updatedAt || new Date())
          };

          set(state => ({
            items: [...state.items, formattedItem]
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMessage });
        }
      },

      // Actualizar item
      updateItem: async (id: string, updates: Partial<SimpleShoppingItem>) => {
        try {
          const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates)
          });

          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          const updatedItem = await response.json();
          
          set(state => {
            const updatedItems = state.items.map(item => 
              item.id === id 
                ? { 
                    ...item, 
                    ...updates, 
                    category: String(updatedItem.category?.slug || updatedItem.categoryId || item.category),
                    updatedAt: new Date() 
                  }
                : item
            );
            
            
            return { items: updatedItems };
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMessage });
        }
      },

      // Actualizar solo el nombre del item
      updateItemName: async (id: string, name: string) => {
        // Actualización optimista
        const previousItems = get().items;
        
        set(state => ({
          items: state.items.map(item => 
            item.id === id 
              ? { ...item, name: name.trim() }
              : item
          )
        }));

        try {
          const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: name.trim() })
          });

          if (!response.ok) {
            // Revertir cambios si falla
            set({ items: previousItems });
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          const updatedItem = await response.json();
          
          // Actualizar con los datos del servidor
          set(state => ({
            items: state.items.map(item => 
              item.id === id 
                ? { 
                    ...item, 
                    name: String(updatedItem.name),
                    updatedAt: new Date() 
                  }
                : item
            )
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMessage });
          throw error;
        }
      },

      // Eliminar item
      deleteItem: async (id: string) => {
        try {
          const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          set(state => ({
            items: state.items.filter(item => item.id !== id)
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMessage });
        }
      },

      // Toggle completado
      toggleItemCompleted: async (id: string) => {
        const state = get();
        const item = state.items.find(item => item.id === id);
        if (!item) return;

        const newCompleted = !item.completed;
        await state.updateItem(id, { completed: newCompleted });
      },

      // Actualizar estado completado directamente (para debounce)
      updateItemCompletedStatus: async (id: string, completed: boolean) => {
        await get().updateItem(id, { completed });
      },

      // Mover item a otro status con actualización optimista
      moveItemToStatus: async (id: string, newStatus: ItemStatus) => {
        // Marcar como moviendo
        set(state => ({
          movingItems: new Set([...state.movingItems, id])
        }));
        
        // Actualización optimista - cambiar inmediatamente en el UI
        set(state => ({
          items: state.items.map(item => 
            item.id === id 
              ? { ...item, status: newStatus, updatedAt: new Date() }
              : item
          )
        }));
        
        // Luego hacer la petición a la API
        try {
          await get().updateItem(id, { status: newStatus });
        } catch (error) {
          // Si falla, revertir el cambio
          set(state => ({
            items: state.items.map(item => 
              item.id === id 
                ? { ...item, status: item.status === ITEM_STATUS.THIS_MONTH ? ITEM_STATUS.NEXT_MONTH : ITEM_STATUS.THIS_MONTH, updatedAt: new Date() }
                : item
            )
          }));
          throw error;
        } finally {
          // Quitar de la lista de moviendo
          set(state => ({
            movingItems: new Set([...state.movingItems].filter(itemId => itemId !== id))
          }));
        }
      },

      // Reordenar items
      reorderItems: async (status: ItemStatus, sourceIndex: number, destIndex: number) => {
        // Implementación simplificada - solo actualizar orderIndex localmente
        set(state => {
          const statusItems = state.items.filter(item => item.status === status);
          const [movedItem] = statusItems.splice(sourceIndex, 1);
          statusItems.splice(destIndex, 0, movedItem);
          
          const updatedItems = statusItems.map((item, index) => ({
            ...item,
            orderIndex: index
          }));

          return {
            items: state.items.map(item => {
              const updated = updatedItems.find(updated => updated.id === item.id);
              return updated || item;
            })
          };
        });
      },

      // Acciones de UI
      setActiveTab: (tab: ItemStatus) => {
        set({ activeTab: tab });
      },

      setSelectedCategory: (category: Category) => {
        set({ selectedCategory: category });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      clearSearch: () => {
        set({ searchQuery: '' });
      },

      clearError: () => {
        set({ error: null });
      },

      // Utilidades
      getItemsByStatus: (status: ItemStatus) => {
        const items = get().items
        const filteredItems = items
          .filter(item => item.status === status)
          .sort((a, b) => a.orderIndex - b.orderIndex);
        
        
        return filteredItems;
      },

      getItemsByCategory: (category: Category) => {
        const items = get().items
        const filteredItems = items
          .filter(item => item.category === category)
          .sort((a, b) => a.orderIndex - b.orderIndex);
        
        
        return filteredItems;
      },

      getCompletedCount: (status: ItemStatus) => {
        return get().items
          .filter(item => item.status === status && item.completed)
          .length;
      },

      getTotalCount: (status: ItemStatus) => {
        return get().items
          .filter(item => item.status === status)
          .length;
      },

      // Verificar si un item está siendo movido
      isMovingItem: (id: string) => {
        return get().movingItems.has(id);
      },

      // Funciones de búsqueda
      getItemsByStatusAndSearch: (status: ItemStatus, searchQuery?: string) => {
        const items = get().items
        let filteredItems = items.filter(item => item.status === status)
        
        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim()
          filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(query)
          )
        }
        
        return filteredItems.sort((a, b) => a.orderIndex - b.orderIndex)
      },

      getItemsByCategoryAndSearch: (category: Category, searchQuery?: string) => {
        const items = get().items
        let filteredItems = items.filter(item => item.category === category)
        
        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim()
          filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(query)
          )
        }
        
        return filteredItems.sort((a, b) => a.orderIndex - b.orderIndex)
      }
    }),
    {
      name: 'unified-shopping-store',
      partialize: (state) => ({
        items: state.items,
        activeTab: state.activeTab,
        selectedCategory: state.selectedCategory,
        lastFetch: state.lastFetch
        // No persistir hasInitialized para evitar problemas de hidratación
      })
    }
  )
);