"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, ItemStatus } from "@/lib/types/database";
import { ITEM_STATUS } from "@/lib/constants/item-status";
import { supabase } from "@/lib/supabase/client";
import { queuedFetch } from "@/lib/utils/request-queue";
import { getCachedAuthHeaders } from "@/lib/utils/auth-cache";
import { pendingOperationsQueue } from "@/lib/utils/pending-operations";
import { isNetworkError } from "@/lib/utils/is-network-error";
import { withServerRetry } from "@/lib/utils/retry";

// Tipos simplificados para evitar problemas con domain entities
interface SimpleShoppingItem {
  id: string;
  name: string;
  category: string;
  status: string;
  completed: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UnifiedShoppingState {
  // Estado principal
  items: SimpleShoppingItem[];
  categories: any[]; // Categorías de la base de datos
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;

  // Estado de UI
  activeTab: ItemStatus;
  selectedCategory: Category;
  searchQuery: string;

  // Estado de inicialización
  hasInitialized: boolean;
  lastFetch: number | null;

  // Estado de loading para operaciones específicas
  movingItems: string[];

  // Acciones
  initialize: () => Promise<void>;
  forceInitialize: () => Promise<void>;
  fetchItems: (force?: boolean) => Promise<void>;
  fetchCategories: () => Promise<void>;
  addItem: (name: string, category: string, status: string) => Promise<void>;
  updateItem: (
    id: string,
    updates: Partial<SimpleShoppingItem>
  ) => Promise<void>;
  updateItemName: (id: string, name: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleItemCompleted: (id: string) => Promise<void>;
  updateItemCompletedStatus: (id: string, completed: boolean) => Promise<void>;
  batchUpdateCompletedStatus: (
    updates: Array<{ id: string; completed: boolean }>
  ) => Promise<void>;
  moveItemToStatus: (id: string, newStatus: ItemStatus) => Promise<void>;
  reorderItems: (
    status: ItemStatus,
    sourceIndex: number,
    destIndex: number
  ) => Promise<void>;

  // Acciones de UI
  setActiveTab: (tab: ItemStatus) => void;
  setSelectedCategory: (category: Category) => void;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  clearError: () => void;

  // Utilidades
  shouldFetch: () => boolean;
  getItemsByStatus: (status: ItemStatus) => SimpleShoppingItem[];
  getItemsByCategory: (categorySlug: string) => SimpleShoppingItem[];
  getItemsByStatusAndSearch: (
    status: ItemStatus,
    searchQuery?: string
  ) => SimpleShoppingItem[];
  getItemsByCategoryAndSearch: (
    category: Category,
    searchQuery?: string
  ) => SimpleShoppingItem[];
  getCompletedCount: (status: ItemStatus) => number;
  getTotalCount: (status: ItemStatus) => number;
  isMovingItem: (id: string) => boolean;
  cleanupStuckMovingItems: () => void;
}

const API_BASE = "/api/shopping-items";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Helper function to get authorization headers (usando caché)
const getAuthHeaders = getCachedAuthHeaders;

export const useUnifiedShoppingStore = create<UnifiedShoppingState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      items: [],
      categories: [],
      loading: false,
      error: null,
      isRefreshing: false,
      activeTab: ITEM_STATUS.THIS_MONTH as ItemStatus,
      selectedCategory: "supermercado" as Category,
      searchQuery: "",
      hasInitialized: false,
      lastFetch: null,
      movingItems: [] as string[],

      // Verificar si debe hacer fetch
      shouldFetch: () => {
        const state = get();
        const now = Date.now();
        return (
          !state.hasInitialized ||
          !state.lastFetch ||
          now - state.lastFetch > CACHE_DURATION ||
          state.items.length === 0
        );
      },

      // Inicialización
      initialize: async () => {
        const state = get();

        // Verificar si hay sesión de Supabase antes de inicializar
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (!session || !session.user) {
            set({
              items: [],
              categories: [],
              hasInitialized: false,
              lastFetch: null,
              error: null,
              loading: false,
            });
            return;
          }
        } catch (error) {
          console.error("Store - Error checking session:", error);
          if (isNetworkError(error)) {
            // Error de red: no resetear hasInitialized — eso causaría un loop
            // infinito de re-inicialización. La app sigue con datos en caché.
            set({ loading: false, isRefreshing: false });
          } else {
            // Error de auth real: limpiar estado
            set({ items: [], categories: [], hasInitialized: false, lastFetch: null, error: null, loading: false });
          }
          return;
        }

        if (state.hasInitialized && !state.shouldFetch()) {
          return;
        }

        try {
          await Promise.all([state.fetchItems(false), state.fetchCategories()]);
        } catch (error) {
          console.error("Store - Initialization error:", error);
        }
        set({ hasInitialized: true });
      },

      // Forzar inicialización (para hidratación)
      forceInitialize: async () => {
        set({ hasInitialized: false });
        await get().initialize();
      },

      // Limpiar store (para logout)
      clearStore: () => {
        set({
          items: [],
          categories: [],
          hasInitialized: false,
          lastFetch: null,
          error: null,
          loading: false,
          isRefreshing: false,
          searchQuery: "",
          selectedCategory: "supermercado" as Category,
          movingItems: [],
        });
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
          isRefreshing: state.items.length > 0,
        });

        try {
          const headers = await getAuthHeaders();

          const response = await queuedFetch(
            API_BASE,
            {
              method: "GET",
              headers,
              ...(force ? { cache: "no-store" } : {}),
            },
            1
          ); // Prioridad alta para fetch inicial

          if (!response.ok) {
            const errorText = await response.text();
            console.error("fetchItems: Error response:", errorText);

            // Manejar errores específicos
            if (response.status === 401) {
              throw new Error(
                "Sesión expirada. Por favor, inicia sesión nuevamente."
              );
            } else if (response.status === 403) {
              throw new Error("No tienes permisos para acceder a estos datos.");
            } else if (response.status >= 500) {
              throw new Error(
                "Error del servidor. Intenta nuevamente en unos minutos."
              );
            } else {
              throw new Error(
                `Error ${response.status}: ${response.statusText}`
              );
            }
          }

          const data = await response.json();

          if (!Array.isArray(data)) {
            throw new Error("Invalid response format");
          }

          const formattedItems: SimpleShoppingItem[] = data.map((item: any) => {
            // Status is already in correct format (este_mes)
            const normalizedStatus = String(
              item.status || ITEM_STATUS.NEXT_MONTH
            );

            // Usar la información de la categoría si está disponible
            const categorySlug =
              item.categories?.slug || item.category?.slug || "supermercado";

            return {
              id: String(item.id || ""),
              name: String(item.name || "Sin nombre"),
              category: String(categorySlug),
              status: normalizedStatus,
              completed: Boolean(item.completed),
              orderIndex: Number(item.orderIndex || item.order_index || 0),
              createdAt: new Date(
                item.createdAt || item.created_at || new Date()
              ),
              updatedAt: new Date(
                item.updatedAt || item.updated_at || new Date()
              ),
            };
          });

          set({
            items: formattedItems,
            loading: false,
            lastFetch: Date.now(),
            isRefreshing: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Error desconocido";
          console.error("fetchItems: Error:", errorMessage);

          // Si es un error de autenticación, limpiar datos pero NO redirigir automáticamente
          // Dejar que los componentes manejen la redirección para evitar perder logs
          if (
            errorMessage.includes("Sesión expirada") ||
            errorMessage.includes("Usuario no autenticado")
          ) {
            set({
              items: [],
              categories: [],
              error: errorMessage,
              loading: false,
              isRefreshing: false,
              hasInitialized: false,
            });

            // NO redirigir automáticamente - dejar que el componente maneje esto
            // Los componentes pueden escuchar el error y redirigir si es necesario
            console.warn(
              "Error de autenticación detectado. El componente debe manejar la redirección."
            );
          } else {
            set({
              error: errorMessage,
              loading: false,
              isRefreshing: false,
            });
          }
        }
      },

      // Fetch de categorías
      fetchCategories: async () => {
        try {
          const headers = await getAuthHeaders();
          const response = await queuedFetch(
            "/api/categories",
            {
              method: "GET",
              headers,
            },
            1
          ); // Prioridad alta

          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (!Array.isArray(data)) {
            throw new Error("Invalid categories response format");
          }

          set({ categories: data });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Error al cargar categorías";
          console.error("Store - fetchCategories error:", errorMessage);
          set({ error: errorMessage });
        }
      },

      // Agregar item — actualización optimista: aparece en la UI al instante con ID temporal
      addItem: async (name: string, category: string, status: string) => {
        const state = get();
        const categoryObj = state.categories.find((cat) => cat.slug === category);
        const categoryId = categoryObj?.id || category;

        // Crear item temporal con ID local
        const tempId = `temp-${crypto.randomUUID()}`;
        const tempItem: SimpleShoppingItem = {
          id: tempId,
          name: name.trim(),
          category,
          status,
          completed: false,
          orderIndex: state.items.length,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Agregar a la UI inmediatamente
        set((s) => ({ items: [...s.items, tempItem] }));

        try {
          const newItem = await withServerRetry(async () => {
            const headers = await getAuthHeaders();
            const response = await queuedFetch(
              API_BASE,
              { method: "POST", headers, body: JSON.stringify({ name: name.trim(), category_id: categoryId, status }) },
              0
            );
            return response.json();
          });

          const formattedItem: SimpleShoppingItem = {
            id: String(newItem.id),
            name: String(newItem.name),
            category: String(newItem.categories?.slug || newItem.category?.slug || category),
            status: String(newItem.status),
            completed: Boolean(newItem.completed),
            orderIndex: Number(newItem.order_index || newItem.orderIndex || 0),
            createdAt: new Date(newItem.created_at || newItem.createdAt || new Date()),
            updatedAt: new Date(newItem.updated_at || newItem.updatedAt || new Date()),
          };

          // Reemplazar el item temporal por el definitivo del servidor
          set((s) => ({
            items: s.items.map((item) => (item.id === tempId ? formattedItem : item)),
          }));
        } catch (error) {
          if (isNetworkError(error)) {
            // Sin conexión: mantener item temporal en UI y encolar
            // El tempId se necesita para eliminarlo cuando se haga el sync real
            pendingOperationsQueue.add({
              itemId: tempId,
              type: 'add',
              payload: { name: name.trim(), category, status, tempId },
            });
            return;
          }

          // Error de servidor: rollback eliminando el item temporal
          set((s) => ({ items: s.items.filter((item) => item.id !== tempId) }));

          const errorMessage = error instanceof Error ? error.message : "Error desconocido";
          console.error("addItem: Error:", errorMessage);

          if (
            errorMessage.includes("Sesión expirada") ||
            errorMessage.includes("Usuario no autenticado")
          ) {
            set({ items: [], categories: [], error: errorMessage, hasInitialized: false });
          } else {
            set({ error: errorMessage });
          }
          throw error;
        }
      },

      // Actualizar item
      updateItem: async (id: string, updates: Partial<SimpleShoppingItem>) => {
        try {
          const headers = await getAuthHeaders();
          const response = await queuedFetch(
            `${API_BASE}/${id}`,
            {
              method: "PUT",
              headers,
              body: JSON.stringify(updates),
            },
            0
          ); // Prioridad normal para actualizaciones

          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          const updatedItem = await response.json();

          set((state) => {
            const updatedItems = state.items.map((item) =>
              item.id === id
                ? {
                    ...item,
                    ...updates,
                    category: String(
                      updatedItem.category?.slug ||
                        updatedItem.categoryId ||
                        item.category
                    ),
                    updatedAt: new Date(),
                  }
                : item
            );

            return { items: updatedItems };
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Error desconocido";
          set({ error: errorMessage });
        }
      },

      // Actualizar solo el nombre del item
      updateItemName: async (id: string, name: string) => {
        // Obtener el estado actual del item
        const currentItem = get().items.find((item) => item.id === id);
        if (!currentItem) return;

        const oldName = currentItem.name;

        // Actualización optimista - cambiar inmediatamente en el UI
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, name: name.trim(), updatedAt: new Date() }
              : item
          ),
        }));

        try {
          const response = await queuedFetch(
            `${API_BASE}/${id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ name: name.trim() }),
            },
            0
          );

          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          const updatedItem = await response.json();

          // Actualizar con los datos del servidor
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id
                ? {
                    ...item,
                    name: String(updatedItem.name),
                    updatedAt: new Date(),
                  }
                : item
            ),
          }));
        } catch (error) {
          // Si falla, revertir el cambio
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id
                ? { ...item, name: oldName, updatedAt: new Date() }
                : item
            ),
          }));
          const errorMessage =
            error instanceof Error ? error.message : "Error desconocido";
          set({ error: errorMessage });
          throw error;
        }
      },

      // Eliminar item — actualización optimista: elimina de la UI al instante, sincroniza en background
      deleteItem: async (id: string) => {
        const itemToDelete = get().items.find((item) => item.id === id);
        if (!itemToDelete) return;

        // Eliminar de la UI inmediatamente
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));

        try {
          await withServerRetry(async () => {
            const headers = await getAuthHeaders();
            return queuedFetch(`${API_BASE}/${id}`, { method: "DELETE", headers }, 0);
          });
        } catch (error) {
          if (isNetworkError(error)) {
            pendingOperationsQueue.add({
              itemId: id,
              type: 'delete',
              payload: {},
            });
            return;
          }
          // Error de servidor: restaurar el item en su posición original
          set((state) => {
            const restored = [...state.items, itemToDelete].sort(
              (a, b) => a.orderIndex - b.orderIndex
            );
            return { items: restored };
          });
          const errorMessage =
            error instanceof Error ? error.message : "Error desconocido";
          set({ error: errorMessage });
          throw error;
        }
      },

      // Toggle completado — actualización optimista: cambia la UI al instante, sincroniza en background
      toggleItemCompleted: async (id: string) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;

        const newCompleted = !item.completed;

        // Actualizar UI inmediatamente
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, completed: newCompleted, updatedAt: new Date() } : i
          ),
        }));

        try {
          const updated = await withServerRetry(async () => {
            const headers = await getAuthHeaders();
            const response = await queuedFetch(
              `${API_BASE}/${id}`,
              { method: "PATCH", headers, body: JSON.stringify({ completed: newCompleted }) },
              0
            );
            return response.json();
          });

          set((state) => ({
            items: state.items.map((i) =>
              i.id === id ? { ...i, completed: Boolean(updated.completed), updatedAt: new Date() } : i
            ),
          }));
        } catch (error) {
          if (isNetworkError(error)) {
            pendingOperationsQueue.add({
              itemId: id,
              type: 'toggle',
              payload: { completed: newCompleted },
            });
            return;
          }
          set((state) => ({
            items: state.items.map((i) =>
              i.id === id ? { ...i, completed: item.completed, updatedAt: new Date() } : i
            ),
          }));
          throw error;
        }
      },

      // Actualizar estado completado directamente — también optimista
      updateItemCompletedStatus: async (id: string, completed: boolean) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return;

        const previousCompleted = item.completed;

        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, completed, updatedAt: new Date() } : i
          ),
        }));

        try {
          const headers = await getAuthHeaders();
          await queuedFetch(
            `${API_BASE}/${id}`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify({ completed }),
            },
            0
          );
        } catch (error) {
          if (isNetworkError(error)) {
            pendingOperationsQueue.add({
              itemId: id,
              type: 'toggle',
              payload: { completed },
            });
            return;
          }
          set((state) => ({
            items: state.items.map((i) =>
              i.id === id ? { ...i, completed: previousCompleted, updatedAt: new Date() } : i
            ),
          }));
          throw error;
        }
      },

      // Batch update para múltiples items (usado en "limpiar tildes")
      // Optimizado para procesar todas las actualizaciones en paralelo usando la cola
      batchUpdateCompletedStatus: async (
        updates: Array<{ id: string; completed: boolean }>
      ) => {
        // Procesar todas las actualizaciones en paralelo
        // La cola de peticiones manejará la concurrencia automáticamente
        await Promise.all(
          updates.map(({ id, completed }) =>
            get().updateItem(id, { completed })
          )
        );
      },

      // Mover item a otro status con actualización optimista
      moveItemToStatus: async (id: string, newStatus: ItemStatus) => {
        // Obtener el estado actual del item
        const currentItem = get().items.find((item) => item.id === id);
        if (!currentItem) {
          // Si el item no existe, asegurar que no esté en movingItems
          set((state) => ({
            movingItems: state.movingItems.filter((itemId) => itemId !== id),
          }));
          return;
        }

        const oldStatus = currentItem.status;

        // Marcar como moviendo
        set((state) => ({
          movingItems: [...state.movingItems, id],
        }));

        // Actualización optimista - cambiar inmediatamente en el UI
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.id === id
              ? { ...item, status: newStatus, updatedAt: new Date() }
              : item
          );
          return { items: updatedItems };
        });

        // Luego hacer la petición a la API
        try {
          const headers = await getAuthHeaders();
          const response = await queuedFetch(
            `${API_BASE}/${id}`,
            {
              method: "PATCH",
              headers,
              body: JSON.stringify({ status: newStatus }),
            },
            0
          );

          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          const updatedItem = await response.json();

          // Actualizar con los datos del servidor
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: String(updatedItem.status),
                    updatedAt: new Date(),
                  }
                : item
            ),
          }));
        } catch (error) {
          if (isNetworkError(error)) {
            // Sin conexión: mantener el estado optimista y encolar
            pendingOperationsQueue.add({
              itemId: id,
              type: 'move',
              payload: { newStatus },
            });
          } else {
            console.error(`Error moving item ${id}:`, error);
            // Error de servidor: revertir el cambio
            set((state) => ({
              items: state.items.map((item) =>
                item.id === id
                  ? { ...item, status: oldStatus, updatedAt: new Date() }
                  : item
              ),
            }));
          }
        } finally {
          // Quitar de la lista de moviendo - SIEMPRE, incluso si hay error
          set((state) => ({
            movingItems: state.movingItems.filter((itemId) => itemId !== id),
          }));
        }
      },

      // Reordenar items
      reorderItems: async (
        status: ItemStatus,
        sourceIndex: number,
        destIndex: number
      ) => {
        // Implementación simplificada - solo actualizar orderIndex localmente
        set((state) => {
          const statusItems = state.items.filter(
            (item) => item.status === status
          );
          const [movedItem] = statusItems.splice(sourceIndex, 1);
          statusItems.splice(destIndex, 0, movedItem);

          const updatedItems = statusItems.map((item, index) => ({
            ...item,
            orderIndex: index,
          }));

          return {
            items: state.items.map((item) => {
              const updated = updatedItems.find(
                (updated) => updated.id === item.id
              );
              return updated || item;
            }),
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
        set({ searchQuery: "" });
      },

      clearError: () => {
        set({ error: null });
      },

      // Utilidades
      getItemsByStatus: (status: ItemStatus) => {
        const items = get().items;
        const filteredItems = items
          .filter((item) => item.status === status)
          .sort((a, b) => a.orderIndex - b.orderIndex);

        return filteredItems;
      },

      getItemsByCategory: (categorySlug: string) => {
        const items = get().items;
        const filteredItems = items
          .filter((item) => item.category === categorySlug)
          .sort((a, b) => a.orderIndex - b.orderIndex);

        return filteredItems;
      },

      getCompletedCount: (status: ItemStatus) => {
        return get().items.filter(
          (item) => item.status === status && item.completed
        ).length;
      },

      getTotalCount: (status: ItemStatus) => {
        return get().items.filter((item) => item.status === status).length;
      },

      // Verificar si un item está siendo movido
      isMovingItem: (id: string) => {
        return get().movingItems.includes(id);
      },

      // Limpiar items que quedaron en estado "moviendo" (limpieza automática)
      cleanupStuckMovingItems: () => {
        const state = get();
        if (state.movingItems.length > 0) {
          console.warn(`Limpiando ${state.movingItems.length} item(s) que quedaron en estado "moviendo"`);
          set({ movingItems: [] });
        }
      },

      // Funciones de búsqueda
      getItemsByStatusAndSearch: (status: ItemStatus, searchQuery?: string) => {
        const items = get().items;
        let filteredItems = items.filter((item) => item.status === status);

        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          filteredItems = filteredItems.filter((item) =>
            item.name.toLowerCase().includes(query)
          );
        }

        return filteredItems.sort((a, b) => a.orderIndex - b.orderIndex);
      },

      getItemsByCategoryAndSearch: (
        category: Category,
        searchQuery?: string
      ) => {
        const items = get().items;
        let filteredItems = items.filter((item) => item.category === category);

        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          filteredItems = filteredItems.filter((item) =>
            item.name.toLowerCase().includes(query)
          );
        }

        return filteredItems.sort((a, b) => a.orderIndex - b.orderIndex);
      },
    }),
    {
      name: "unified-shopping-store",
      partialize: (state) => ({
        items: state.items,
        categories: state.categories,
        activeTab: state.activeTab,
        selectedCategory: state.selectedCategory,
        lastFetch: state.lastFetch,
        // No persistir hasInitialized para evitar problemas de hidratación
      }),
    }
  )
);
