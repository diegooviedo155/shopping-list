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
  
  // Estado de inicialización
  hasInitialized: boolean
  lastFetch: number | null
  
  // Estado de loading para operaciones específicas
  movingItems: Set<string>
  
  // Acciones
  initialize: () => Promise<void>
  fetchItems: (force?: boolean) => Promise<void>
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
  shouldFetch: () => boolean
  getItemsByStatus: (status: ItemStatus) => SimpleShoppingItem[]
  getItemsByCategory: (category: Category) => SimpleShoppingItem[]
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

          const formattedItems: SimpleShoppingItem[] = data.map((item: any) => ({
            id: String(item.id || ''),
            name: String(item.name || 'Sin nombre'),
            category: String(item.category?.slug || item.categoryId || 'supermercado'),
            status: String(item.status || ITEM_STATUS.NEXT_MONTH),
            completed: Boolean(item.completed),
            orderIndex: Number(item.orderIndex || item.order_index || 0),
            createdAt: new Date(item.createdAt || item.created_at || new Date()),
            updatedAt: new Date(item.updatedAt || item.updated_at || new Date())
          }));

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
          
          set(state => ({
            items: state.items.map(item => 
              item.id === id 
                ? { 
                    ...item, 
                    ...updates, 
                    category: String(updatedItem.category?.slug || updatedItem.categoryId || item.category),
                    updatedAt: new Date() 
                  }
                : item
            )
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set({ error: errorMessage });
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
                ? { ...item, status: item.status === 'este-mes' ? 'proximo-mes' : 'este-mes', updatedAt: new Date() }
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

      clearError: () => {
        set({ error: null });
      },

      // Utilidades
      getItemsByStatus: (status: ItemStatus) => {
        return get().items
          .filter(item => item.status === status)
          .sort((a, b) => a.orderIndex - b.orderIndex);
      },

      getItemsByCategory: (category: Category) => {
        return get().items
          .filter(item => item.category === category)
          .sort((a, b) => a.orderIndex - b.orderIndex);
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
      }
    }),
    {
      name: 'unified-shopping-store',
      partialize: (state) => ({
        items: state.items,
        activeTab: state.activeTab,
        selectedCategory: state.selectedCategory,
        lastFetch: state.lastFetch,
        hasInitialized: state.hasInitialized
      })
    }
  )
);