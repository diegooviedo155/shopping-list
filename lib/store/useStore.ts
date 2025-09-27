import { create } from 'zustand';
import { ITEM_STATUS, ItemStatusType } from '@/lib/constants/item-status';

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  status: ItemStatusType;  // Use the exported type from item-status.ts
  completed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface StoreState {
  // Estado para los ítems por categoría
  categoryItems: Record<string, ShoppingItem[]>;
  loading: boolean;
  error: string | null;
  hasFetchedCategories: Record<string, boolean>;
  
  // Acciones
  fetchAllItems: () => Promise<void>;
  fetchCategoryItems: (category: string) => Promise<void>;
  updateItemStatus: (itemId: string, status: keyof typeof ITEM_STATUS) => Promise<void>;
  toggleItemCompleted: (itemId: string) => Promise<void>;
  getCategoryItems: (category: string) => ShoppingItem[];
}

export const useStore = create<StoreState>((set, get) => ({
  categoryItems: {},
  loading: false,
  error: null,
  hasFetchedCategories: {},
  
  // Obtener todos los ítems de todas las categorías
  fetchAllItems: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch('/api/items');
      
      if (!response.ok) {
        throw new Error('Error al cargar los ítems');
      }
      
      const items: Array<{
        id: string;
        name: string;
        category: string;
        status: string;
        completed: boolean;
        order_index: number;
        created_at: string;
        updated_at: string;
      }> = await response.json();
      
      // Agrupar ítems por categoría
      const groupedItems = items.reduce<Record<string, ShoppingItem[]>>((acc: Record<string, ShoppingItem[]>, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        
        // Asegurarse de que el estado sea uno de los valores permitidos
        let validStatus: ItemStatusType;
        
        if (Object.values(ITEM_STATUS).includes(item.status as ItemStatusType)) {
          validStatus = item.status as ItemStatusType;
        } else {
          // Si el estado no es válido, establecer un valor por defecto basado en completed
          validStatus = item.completed ? ITEM_STATUS.THIS_MONTH : ITEM_STATUS.NEXT_MONTH;
        }
          
        acc[item.category].push({
          ...item,
          status: validStatus,
          completed: validStatus === ITEM_STATUS.THIS_MONTH,
        });
        
        return acc;
      }, {});
      
      // Actualizar el estado con los items agrupados
      set({
        categoryItems: groupedItems,
        loading: false,
        hasFetchedCategories: Object.keys(groupedItems).reduce((acc, category) => ({
          ...acc,
          [category]: true
        }), {} as Record<string, boolean>)
      });
      
    } catch (error) {
      console.error('Error fetching all items:', error);
      set({ 
        error: 'Error al cargar los ítems. Intente nuevamente.',
        loading: false,
      });
    }
  },

  // Obtener ítems de una categoría (sin hacer fetch)
  getCategoryItems: (category) => {
    return get().categoryItems[category] || [];
  },

  fetchCategoryItems: async (category) => {
    const currentState = get();
    
    // Si ya hemos cargado esta categoría, no hacemos nada
    if (currentState.hasFetchedCategories[category]) {
      console.log(`Category ${category} already loaded, skipping fetch`);
      return;
    }

    console.log(`Fetching items for category: ${category}`);
    set({ loading: true, error: null });
    
    try {
      const url = `/api/categories/${encodeURIComponent(category)}`;
      console.log(`Making request to: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response: ${response.status} - ${errorText}`);
        throw new Error(`Error al cargar los ítems de la categoría: ${response.status}`);
      }
      
      const items = await response.json();
      console.log(`Received ${items.length} items for category ${category}:`, items);
      
      set((state) => ({
        categoryItems: {
          ...state.categoryItems,
          [category]: items,
        },
        hasFetchedCategories: {
          ...state.hasFetchedCategories,
          [category]: true,
        },
        loading: false,
      }));
      
    } catch (err) {
      console.error('Error fetching category items:', err);
      set({ 
        error: err instanceof Error ? err.message : 'Error desconocido',
        loading: false,
      });
    }
  },

  updateItemStatus: async (itemId, newStatus: ItemStatusType) => {
    const currentState = get();
    const category = Object.keys(currentState.categoryItems).find(cat => 
      currentState.categoryItems[cat].some(item => item.id === itemId)
    );

    if (!category) return;

    // Encontrar el ítem actual para obtener su estado actual
    const currentItem = currentState.categoryItems[category].find(item => item.id === itemId);
    if (!currentItem) return;

    // Actualización optimista
    set((state) => {
      const updatedItems = { ...state.categoryItems };
      const categoryItems = [...updatedItems[category]];
      const itemIndex = categoryItems.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
        categoryItems[itemIndex] = {
          ...categoryItems[itemIndex],
          status: newStatus,
          updated_at: new Date().toISOString(),
          // Actualizar el estado de completado según el estado
          completed: newStatus === ITEM_STATUS.THIS_MONTH,
        };
        
        updatedItems[category] = categoryItems;
      }
      
      return { categoryItems: updatedItems };
    });

    // Sincronizar con el servidor
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          completed: newStatus === ITEM_STATUS.THIS_MONTH,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado del ítem');
      }
    } catch (err) {
      console.error('Error updating item status:', err);
      // Revertir en caso de error
      set((state) => {
        const updatedItems = { ...state.categoryItems };
        const categoryItems = [...updatedItems[category]];
        const itemIndex = categoryItems.findIndex(item => item.id === itemId);
        
        if (itemIndex !== -1) {
          // Revertir al estado anterior
          categoryItems[itemIndex] = {
            ...categoryItems[itemIndex],
            status: currentItem.status,
            completed: currentItem.completed,
            updated_at: currentItem.updated_at,
          };
          
          updatedItems[category] = categoryItems;
        }
        
        return { 
          categoryItems: updatedItems,
          error: 'Error al actualizar el estado del ítem. Intente nuevamente.'
        };
      });
    }
  },

  toggleItemCompleted: async (itemId) => {
    const currentState = get();
    const category = Object.keys(currentState.categoryItems).find(cat => 
      currentState.categoryItems[cat].some(item => item.id === itemId)
    );

    if (!category) return;

    // Encontrar el ítem actual para obtener su estado
    const currentItem = currentState.categoryItems[category].find(item => item.id === itemId);
    if (!currentItem) return;

    const newCompleted = !currentItem.completed;
    // Usar los valores correctos del enum ITEM_STATUS
    const newStatus: ItemStatusType = newCompleted ? ITEM_STATUS.THIS_MONTH : ITEM_STATUS.NEXT_MONTH;

    // Actualización optimista
    set((state) => {
      const updatedItems = { ...state.categoryItems };
      const categoryItems = [...updatedItems[category]];
      const itemIndex = categoryItems.findIndex(item => item.id === itemId);
      
      if (itemIndex !== -1) {
        categoryItems[itemIndex] = {
          ...categoryItems[itemIndex],
          completed: newCompleted,
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
        
        updatedItems[category] = categoryItems;
      }
      
      return { categoryItems: updatedItems };
    });

    // Sincronizar con el servidor
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          completed: newCompleted,
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado del ítem');
      }
    } catch (err) {
      console.error('Error toggling item completed:', err);
      // Revertir en caso de error
      set((state) => {
        const updatedItems = { ...state.categoryItems };
        const categoryItems = [...updatedItems[category]];
        const itemIndex = categoryItems.findIndex(item => item.id === itemId);
        
        if (itemIndex !== -1) {
          // Revertir al estado anterior
          categoryItems[itemIndex] = {
            ...categoryItems[itemIndex],
            completed: currentItem.completed,
            status: currentItem.status,
            updated_at: currentItem.updated_at,
          };
          
          updatedItems[category] = categoryItems;
        }
        
        return { 
          categoryItems: updatedItems,
          error: 'Error al actualizar el ítem. Intente nuevamente.'
        };
      });
    }
  },
}));
