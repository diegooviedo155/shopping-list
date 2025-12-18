"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, ItemStatus } from "@/lib/types/database";
import { ITEM_STATUS } from "@/lib/constants/item-status";
import { supabase } from "@/lib/supabase/client";
import { queuedFetch } from "@/lib/utils/request-queue";

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
  movingItems: Set<string>;

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
}

const API_BASE = "/api/shopping-items";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Helper function to get authorization headers
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error("No se pudo obtener la sesión de autenticación");
    }

    if (session?.access_token) {
      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      };
    } else {
      throw new Error("Usuario no autenticado");
    }
  } catch (error) {
    throw error;
  }
};

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
      movingItems: new Set<string>(),

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
          movingItems: new Set(),
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

      // Agregar item
      addItem: async (name: string, category: string, status: string) => {
        try {
          // Buscar el ID de la categoría por su slug
          const state = get();
          const categoryObj = state.categories.find(
            (cat) => cat.slug === category
          );
          const categoryId = categoryObj?.id || category; // Fallback al slug si no se encuentra

          const headers = await getAuthHeaders();
          const response = await queuedFetch(
            API_BASE,
            {
              method: "POST",
              headers,
              body: JSON.stringify({
                name: name.trim(),
                category_id: categoryId,
                status: status,
              }),
            },
            0
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error("addItem: Error response:", errorText);

            // Manejar errores específicos
            if (response.status === 401) {
              throw new Error(
                "Sesión expirada. Por favor, inicia sesión nuevamente."
              );
            } else if (response.status === 403) {
              throw new Error("No tienes permisos para agregar items.");
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

          const newItem = await response.json();

          const formattedItem: SimpleShoppingItem = {
            id: String(newItem.id),
            name: String(newItem.name),
            category: String(
              newItem.categories?.slug || newItem.category?.slug || category
            ),
            status: String(newItem.status),
            completed: Boolean(newItem.completed),
            orderIndex: Number(newItem.orderIndex || 0),
            createdAt: new Date(newItem.createdAt || new Date()),
            updatedAt: new Date(newItem.updatedAt || new Date()),
          };

          set((state) => ({
            items: [...state.items, formattedItem],
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Error desconocido";
          console.error("addItem: Error:", errorMessage);

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
              hasInitialized: false,
            });

            // NO redirigir automáticamente - dejar que el componente maneje esto
            console.warn(
              "Error de autenticación detectado. El componente debe manejar la redirección."
            );
          } else {
            set({ error: errorMessage });
          }
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

      // Eliminar item
      deleteItem: async (id: string) => {
        try {
          const headers = await getAuthHeaders();
          const response = await queuedFetch(
            `${API_BASE}/${id}`,
            {
              method: "DELETE",
              headers,
            },
            0
          );

          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Error desconocido";
          set({ error: errorMessage });
        }
      },

      // Toggle completado
      toggleItemCompleted: async (id: string) => {
        const state = get();
        const item = state.items.find((item) => item.id === id);
        if (!item) return;

        const newCompleted = !item.completed;
        await state.updateItem(id, { completed: newCompleted });
      },

      // Actualizar estado completado directamente (para debounce)
      updateItemCompletedStatus: async (id: string, completed: boolean) => {
        await get().updateItem(id, { completed });
      },

      // Batch update para múltiples items (usado en "limpiar tildes")
      batchUpdateCompletedStatus: async (
        updates: Array<{ id: string; completed: boolean }>
      ) => {
        // Procesar en lotes de 5 para no saturar
        const batchSize = 5;
        for (let i = 0; i < updates.length; i += batchSize) {
          const batch = updates.slice(i, i + batchSize);
          await Promise.all(
            batch.map(({ id, completed }) =>
              get().updateItem(id, { completed })
            )
          );
        }
      },

      // Mover item a otro status con actualización optimista
      moveItemToStatus: async (id: string, newStatus: ItemStatus) => {
        // Obtener el estado actual del item
        const currentItem = get().items.find((item) => item.id === id);
        if (!currentItem) return;

        const oldStatus = currentItem.status;

        // Marcar como moviendo
        set((state) => ({
          movingItems: new Set([...state.movingItems, id]),
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
          const response = await fetch(`${API_BASE}/${id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status: newStatus }),
          });

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
          // Si falla, revertir el cambio
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id
                ? { ...item, status: oldStatus, updatedAt: new Date() }
                : item
            ),
          }));
          throw error;
        } finally {
          // Quitar de la lista de moviendo
          set((state) => ({
            movingItems: new Set(
              [...state.movingItems].filter((itemId) => itemId !== id)
            ),
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
        return get().movingItems.has(id);
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
