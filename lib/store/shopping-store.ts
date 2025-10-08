import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ITEM_STATUS, ItemStatusType } from '@/lib/constants/item-status';
import type { Category, ItemStatus, ShoppingItem } from '@/lib/types/database';

interface ShoppingStoreState {
  items: ShoppingItem[];
  loading: boolean;
  error: string | null;
  activeTab: ItemStatus;
  selectedCategory: Category;
  
  fetchItems: () => Promise<void>;
  addItem: (name: string, category: Category, status: ItemStatus) => Promise<void>;
  updateItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleItemCompleted: (id: string) => Promise<void>;
  moveItemToStatus: (id: string, newStatus: ItemStatus) => Promise<void>;
  reorderItems: (status: ItemStatus, sourceIndex: number, destIndex: number) => Promise<void>;
  
  setActiveTab: (tab: ItemStatus) => void;
  setSelectedCategory: (category: Category) => void;
  clearError: () => void;
  
  getItemsByStatus: (status: ItemStatus) => ShoppingItem[];
  getItemsByCategory: (category: Category) => ShoppingItem[];
  getCompletedCount: (status: ItemStatus) => number;
  getTotalCount: (status: ItemStatus) => number;
}

export const useShoppingStore = create<ShoppingStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        loading: false,
        error: null,
        activeTab: ITEM_STATUS.THIS_MONTH as ItemStatus,
        selectedCategory: 'supermercado' as Category,
        fetchItems: async () => {
          set({ loading: true, error: null });
          
          try {
            const response = await fetch('/api/shopping-items', {
              cache: 'no-store',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });

            if (!response.ok) {
              throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!Array.isArray(data)) {
              throw new Error('Invalid response format');
            }

            const formattedItems: ShoppingItem[] = data.map((item: any) => ({
              id: String(item.id || ''),
              name: String(item.name || 'Sin nombre'),
              category: String(item.category || 'supermercado') as Category,
              status: (item.status && Object.values(ITEM_STATUS).includes(item.status as ItemStatusType))
                ? item.status as ItemStatus
                : ITEM_STATUS.NEXT_MONTH as ItemStatus,
              completed: Boolean(item.completed),
              orderIndex: Number(item.orderIndex || item.order_index || 0),
              createdAt: new Date(item.createdAt || item.created_at || new Date()),
              updatedAt: new Date(item.updatedAt || item.updated_at || new Date())
            }));

            set({ items: formattedItems, loading: false });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            set({ error: errorMessage, loading: false });
          }
        },

        addItem: async (name, category, status) => {
          const trimmedName = name.trim();
          if (!trimmedName) return;

          set({ loading: true, error: null });

          try {
            const response = await fetch('/api/shopping-items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: trimmedName, category, status }),
            });

            if (!response.ok) {
              throw new Error('Error al agregar el producto');
            }

            const newItem = await response.json();
            
            const formattedItem: ShoppingItem = {
              id: String(newItem.id),
              name: String(newItem.name),
              category: newItem.category as Category,
              status: newItem.status as ItemStatus,
              completed: Boolean(newItem.completed),
              orderIndex: Number(newItem.orderIndex),
              createdAt: new Date(newItem.createdAt),
              updatedAt: new Date(newItem.updatedAt)
            };

            set((state) => ({
              items: [...state.items, formattedItem],
              loading: false
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al agregar producto';
            set({ error: errorMessage, loading: false });
          }
        },

        updateItem: async (id, updates) => {
          set({ loading: true, error: null });

          set((state) => ({
            items: state.items.map(item =>
              item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
            )
          }));

          try {
            const response = await fetch(`/api/shopping-items/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });

            if (!response.ok) {
              throw new Error('Error al actualizar el producto');
            }

            const updatedItem = await response.json();
            
            set((state) => ({
              items: state.items.map(item =>
                item.id === id ? {
                  ...item,
                  ...updates,
                  updatedAt: new Date(updatedItem.updatedAt || updatedItem.updated_at)
                } : item
              ),
              loading: false
            }));
          } catch (error) {
            set((state) => ({
              items: state.items.map(item =>
                item.id === id ? { ...item, ...updates } : item
              ),
              error: error instanceof Error ? error.message : 'Error al actualizar producto',
              loading: false
            }));
          }
        },

        deleteItem: async (id) => {
          set({ loading: true, error: null });

          set((state) => ({
            items: state.items.filter(item => item.id !== id)
          }));

          try {
            const response = await fetch(`/api/shopping-items/${id}`, {
              method: 'DELETE',
            });

            if (!response.ok) {
              throw new Error('Error al eliminar el producto');
            }

            set({ loading: false });
          } catch (error) {
            set((state) => ({
              items: [...state.items], // Restaurar items
              error: error instanceof Error ? error.message : 'Error al eliminar producto',
              loading: false
            }));
          }
        },

        toggleItemCompleted: async (id) => {
          const item = get().items.find(item => item.id === id);
          if (!item) return;

          const newCompleted = !item.completed;
          const newStatus = newCompleted ? ITEM_STATUS.THIS_MONTH as ItemStatus : ITEM_STATUS.NEXT_MONTH as ItemStatus;

          await get().updateItem(id, {
            completed: newCompleted,
            status: newStatus
          });
        },

        moveItemToStatus: async (id, newStatus) => {
          const item = get().items.find(item => item.id === id);
          if (!item) return;

          const maxOrderItem = get().items
            .filter(item => item.status === newStatus)
            .reduce((max, item) => (item.orderIndex > max ? item.orderIndex : max), -1);

          await get().updateItem(id, {
            status: newStatus,
            orderIndex: maxOrderItem + 1
          });
        },

        reorderItems: async (status, sourceIndex, destIndex) => {
          if (sourceIndex === destIndex) return;

          set({ loading: true, error: null });

          try {
            const response = await fetch('/api/shopping-items/reorder', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status, sourceIndex, destIndex }),
            });

            if (!response.ok) {
              throw new Error('Error al reordenar productos');
            }

            set((state) => {
              const itemsForStatus = state.items
                .filter(item => item.status === status)
                .sort((a, b) => a.orderIndex - b.orderIndex);
              
              const [reorderedItem] = itemsForStatus.splice(sourceIndex, 1);
              itemsForStatus.splice(destIndex, 0, reorderedItem);

              const updatedItems = itemsForStatus.map((item, index) => ({
                ...item,
                orderIndex: index
              }));

              const otherItems = state.items.filter(item => item.status !== status);
              
              return {
                items: [...otherItems, ...updatedItems],
                loading: false
              };
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al reordenar productos';
            set({ error: errorMessage, loading: false });
          }
        },

        setActiveTab: (tab) => set({ activeTab: tab }),
        setSelectedCategory: (category) => set({ selectedCategory: category }),
        clearError: () => set({ error: null }),

        getItemsByStatus: (status) => {
          return get().items
            .filter(item => item.status === status)
            .sort((a, b) => a.orderIndex - b.orderIndex);
        },

        getItemsByCategory: (category) => {
          return get().items
            .filter(item => item.category === category)
            .sort((a, b) => a.orderIndex - b.orderIndex);
        },

        getCompletedCount: (status) => {
          return get().items
            .filter(item => item.status === status && item.completed)
            .length;
        },

        getTotalCount: (status) => {
          return get().items
            .filter(item => item.status === status)
            .length;
        },
      }),
      {
        name: 'shopping-store',
        partialize: (state) => ({
          activeTab: state.activeTab,
          selectedCategory: state.selectedCategory,
        }),
      }
    ),
    {
      name: 'shopping-store',
    }
  )
);
