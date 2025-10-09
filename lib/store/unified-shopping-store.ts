import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ITEM_STATUS, ItemStatusType } from '@/lib/constants/item-status';
import type { Category, ItemStatus, ShoppingItem } from '@/lib/types/database';
import { ShoppingItem as DomainShoppingItem } from '@/lib/domain/entities/ShoppingItem';
import { ItemName } from '@/lib/domain/value-objects/ItemName';
import { ItemStatus as DomainItemStatus } from '@/lib/domain/value-objects/ItemStatus';
import { Category as DomainCategory } from '@/lib/domain/value-objects/Category';

interface ShoppingStoreState {
  // Estado principal
  items: DomainShoppingItem[];
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  
  // Estado de UI
  activeTab: ItemStatus;
  selectedCategory: Category;
  
  // Flags de control
  hasInitialized: boolean;
  isRefreshing: boolean;
  
  // Acciones principales
  fetchItems: (force?: boolean) => Promise<void>;
  addItem: (name: string, category: Category, status: ItemStatus) => Promise<void>;
  updateItem: (id: string, updates: Partial<DomainShoppingItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleItemCompleted: (id: string) => Promise<void>;
  moveItemToStatus: (id: string, newStatus: ItemStatus) => Promise<void>;
  reorderItems: (status: ItemStatus, sourceIndex: number, destIndex: number) => Promise<void>;
  
  // Acciones de UI
  setActiveTab: (tab: ItemStatus) => void;
  setSelectedCategory: (category: Category) => void;
  clearError: () => void;
  
  // Getters optimizados
  getItemsByStatus: (status: ItemStatus) => DomainShoppingItem[];
  getItemsByCategory: (category: Category) => DomainShoppingItem[];
  getCompletedCount: (status: ItemStatus) => number;
  getTotalCount: (status: ItemStatus) => number;
  
  // Utilidades
  shouldFetch: () => boolean;
  initialize: () => Promise<void>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const API_BASE = '/api/shopping-items';

export const useUnifiedShoppingStore = create<ShoppingStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        items: [] as DomainShoppingItem[],
        loading: false,
        error: null,
        lastFetch: null,
        activeTab: ITEM_STATUS.THIS_MONTH as ItemStatus,
        selectedCategory: 'supermercado' as Category,
        hasInitialized: false,
        isRefreshing: false,

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

        // Inicialización inteligente
        initialize: async () => {
          const state = get();
          if (state.hasInitialized && !state.shouldFetch()) {
            return;
          }
          
          await state.fetchItems(false);
          set({ hasInitialized: true });
        },

        // Fetch optimizado con caché
        fetchItems: async (force = false) => {
          const state = get();
          
          // No hacer fetch si ya está cargando o si no es necesario
          if (state.loading && !force) return;
          if (!force && !state.shouldFetch()) return;

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
              // Solo usar cache si no es forzado
              ...(force ? { cache: 'no-store' } : {})
            });

            if (!response.ok) {
              throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!Array.isArray(data)) {
              throw new Error('Invalid response format');
            }

            const formattedItems: DomainShoppingItem[] = data.map((item: any) => 
              DomainShoppingItem.fromPersistence({
                id: String(item.id || ''),
                name: new ItemName(item.name || 'Sin nombre'),
                category: new DomainCategory(item.category?.slug || item.categoryId || 'supermercado'),
                status: new DomainItemStatus(
                  (item.status && Object.values(ITEM_STATUS).includes(item.status as ItemStatusType))
                    ? item.status
                    : ITEM_STATUS.NEXT_MONTH
                ),
                completed: Boolean(item.completed),
                orderIndex: Number(item.orderIndex || item.order_index || 0),
                createdAt: new Date(item.createdAt || item.created_at || new Date()),
                updatedAt: new Date(item.updatedAt || item.updated_at || new Date())
              })
            );

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

        // Crear item con actualización optimista
        addItem: async (name, category, status) => {
          const trimmedName = name.trim();
          if (!trimmedName) return;

          set({ loading: true, error: null });

          try {
            const response = await fetch(API_BASE, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: trimmedName, category, status }),
            });

            if (!response.ok) {
              throw new Error('Error al agregar el producto');
            }

            const newItem = await response.json();
            
            const formattedItem: DomainShoppingItem = DomainShoppingItem.fromPersistence({
              id: String(newItem.id),
              name: new ItemName(newItem.name),
              category: new DomainCategory(newItem.category?.slug || newItem.categoryId),
              status: new DomainItemStatus(newItem.status),
              completed: Boolean(newItem.completed),
              orderIndex: Number(newItem.orderIndex),
              createdAt: new Date(newItem.createdAt),
              updatedAt: new Date(newItem.updatedAt)
            });

            set((state) => ({
              items: [...state.items, formattedItem],
              loading: false,
              lastFetch: Date.now()
            }));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al agregar producto';
            set({ error: errorMessage, loading: false });
          }
        },

        // Actualizar item con actualización optimista
        updateItem: async (id, updates) => {
          const state = get();
          const originalItem = state.items.find(item => item.id === id);
          
          if (!originalItem) return;

        // Actualización optimista inmediata
        set((state) => ({
          items: state.items.map(item =>
            item.id === id ? 
              DomainShoppingItem.create({
                ...item.toPrimitives(),
                ...updates,
                updatedAt: new Date()
              }) : item
          )
        }));

          try {
            const response = await fetch(`${API_BASE}/${id}`, {
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
                item.id === id ? 
                  DomainShoppingItem.create({
                    ...item.toPrimitives(),
                    ...updates,
                    updatedAt: new Date(updatedItem.updatedAt || updatedItem.updated_at)
                  }) : item
              ),
              lastFetch: Date.now()
            }));
          } catch (error) {
            // Rollback en caso de error
            set((state) => ({
              items: state.items.map(item =>
                item.id === id ? originalItem : item
              ),
              error: error instanceof Error ? error.message : 'Error al actualizar producto'
            }));
          }
        },

        // Eliminar item con actualización optimista
        deleteItem: async (id) => {
          const state = get();
          const originalItems = [...state.items];

          // Actualización optimista
          set((state) => ({
            items: state.items.filter(item => item.id !== id)
          }));

          try {
            const response = await fetch(`${API_BASE}/${id}`, {
              method: 'DELETE',
            });

            if (!response.ok) {
              throw new Error('Error al eliminar el producto');
            }

            set({ lastFetch: Date.now() });
          } catch (error) {
            // Rollback en caso de error
            set({
              items: originalItems,
              error: error instanceof Error ? error.message : 'Error al eliminar producto'
            });
          }
        },

        // Toggle completado con lógica optimizada
        toggleItemCompleted: async (id) => {
          const item = get().items.find(item => item.id === id);
          if (!item) return;

          const newCompleted = !item.completed;
          const newStatus = newCompleted ? ITEM_STATUS.THIS_MONTH as ItemStatus : ITEM_STATUS.NEXT_MONTH as ItemStatus;

          await get().updateItem(id, {
            completed: newCompleted,
            status: new DomainItemStatus(newStatus)
          });
        },

        // Mover item a otro status
        moveItemToStatus: async (id, newStatus) => {
          const item = get().items.find(item => item.id === id);
          if (!item) return;

          const maxOrderItem = get().items
            .filter(item => item.status.getValue() === newStatus)
            .reduce((max, item) => (item.orderIndex > max ? item.orderIndex : max), -1);

          await get().updateItem(id, {
            status: new DomainItemStatus(newStatus),
            orderIndex: maxOrderItem + 1
          });
        },

        // Reordenar items
        reorderItems: async (status, sourceIndex, destIndex) => {
          if (sourceIndex === destIndex) return;

          const state = get();
          const originalItems = [...state.items];

          // Actualización optimista
          set((state) => {
            const itemsForStatus = state.items
              .filter(item => item.status.getValue() === status)
              .sort((a, b) => a.orderIndex - b.orderIndex);
            
            const [reorderedItem] = itemsForStatus.splice(sourceIndex, 1);
            itemsForStatus.splice(destIndex, 0, reorderedItem);

            const updatedItems = itemsForStatus.map((item, index) =>
              DomainShoppingItem.create({
                ...item.toPrimitives(),
                orderIndex: index
              })
            );

            const otherItems = state.items.filter(item => item.status.getValue() !== status);
            
            return {
              items: [...otherItems, ...updatedItems]
            };
          });

          try {
            const response = await fetch(`${API_BASE}/reorder`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status, sourceIndex, destIndex }),
            });

            if (!response.ok) {
              throw new Error('Error al reordenar productos');
            }

            set({ lastFetch: Date.now() });
          } catch (error) {
            // Rollback en caso de error
            set({
              items: originalItems,
              error: error instanceof Error ? error.message : 'Error al reordenar productos'
            });
          }
        },

        // Acciones de UI
        setActiveTab: (tab) => set({ activeTab: tab }),
        setSelectedCategory: (category) => set({ selectedCategory: category }),
        clearError: () => set({ error: null }),

        // Getters optimizados
        getItemsByStatus: (status) => {
          return get().items
            .filter(item => item.status.getValue() === status)
            .sort((a, b) => a.orderIndex - b.orderIndex);
        },

        getItemsByCategory: (category) => {
          const allItems = get().items;
          const filteredItems = allItems
            .filter(item => {
              try {
                const itemCategory = item.category.getValue();
                return itemCategory === category;
              } catch (error) {
                console.error('Error getting category value:', error, item);
                return false;
              }
            })
            .sort((a, b) => a.orderIndex - b.orderIndex);
          
          
          return filteredItems;
        },

        getCompletedCount: (status) => {
          return get().items
            .filter(item => item.status.getValue() === status && item.completed)
            .length;
        },

        getTotalCount: (status) => {
          return get().items
            .filter(item => item.status.getValue() === status)
            .length;
        },
      }),
      {
        name: 'unified-shopping-store',
        partialize: (state) => ({
          // Convertir entidades de dominio a objetos planos para persistencia
          items: state.items.map(item => {
            // Verificar si es una entidad de dominio válida
            if (item && typeof item.toPrimitives === 'function') {
              return item.toPrimitives();
            }
            // Si no es una entidad válida, devolver el objeto tal como está
            return item;
          }),
          activeTab: state.activeTab,
          selectedCategory: state.selectedCategory,
          lastFetch: state.lastFetch,
          hasInitialized: state.hasInitialized,
        }),
        // Configuración de persistencia
        version: 1,
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migración desde versión anterior si es necesario
            return persistedState;
          }
          return persistedState;
        },
        onRehydrateStorage: () => (state) => {
          // Convertir objetos planos de vuelta a entidades de dominio al rehidratar
          if (state && state.items && Array.isArray(state.items)) {
            try {
              state.items = state.items
                .filter((item: any) => {
                  // Filtrar items inválidos que tienen formato {props: {...}}
                  if (item && typeof item === 'object' && item.props) {
                    return false;
                  }
                  return item && typeof item === 'object';
                })
                .map((item: any) => {
                  // Verificar si ya es una entidad de dominio
                  if (item && typeof item.getValue === 'function') {
                    return item;
                  }
                  
                  // Verificar que el item tenga las propiedades mínimas necesarias
                  if (!item.id || !item.name) {
                    return null;
                  }
                  
                  // Convertir objeto plano a entidad de dominio
                  return DomainShoppingItem.fromPersistence({
                    id: String(item.id),
                    name: new ItemName(item.name),
                    category: new DomainCategory(item.category || 'supermercado'),
                    status: new DomainItemStatus(item.status || ITEM_STATUS.NEXT_MONTH),
                    completed: Boolean(item.completed),
                    orderIndex: Number(item.orderIndex || 0),
                    createdAt: new Date(item.createdAt || new Date()),
                    updatedAt: new Date(item.updatedAt || new Date())
                  });
                })
                .filter((item: any) => item !== null); // Filtrar items nulos
            } catch (error) {
              // En caso de error, limpiar el store
              state.items = [];
            }
          } else {
            // Si no hay items o no es un array, inicializar como array vacío
            state.items = [];
          }
        },
      }
    ),
    {
      name: 'unified-shopping-store',
    }
  )
);
