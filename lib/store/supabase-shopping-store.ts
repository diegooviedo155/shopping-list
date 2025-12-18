import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/types/supabase'

type ShoppingItem = Tables<'shopping_items'>
type Category = Tables<'categories'>

interface SupabaseShoppingStore {
  // State
  items: ShoppingItem[]
  categories: Category[]
  isLoading: boolean
  error: string | null
  searchQuery: string
         activeTab: 'este-mes' | 'proximo-mes'

  // Actions
  fetchItems: () => Promise<void>
  fetchCategories: () => Promise<void>
         addItem: (name: string, categoryId: string, status: 'este-mes' | 'proximo-mes') => Promise<void>
  updateItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleItemCompleted: (id: string) => Promise<void>
         moveItemToStatus: (id: string, newStatus: 'este-mes' | 'proximo-mes') => Promise<void>
  reorderItems: (items: ShoppingItem[]) => Promise<void>
  updateItemName: (id: string, name: string) => Promise<void>
  setSearchQuery: (query: string) => void
  clearSearch: () => void
         setActiveTab: (tab: 'este-mes' | 'proximo-mes') => void
  forceInitialize: () => Promise<void>
  clearData: () => void

  // Getters
         getItemsByStatus: (status: 'este-mes' | 'proximo-mes') => ShoppingItem[]
  getItemsByCategory: (categoryId: string) => ShoppingItem[]
         getItemsByStatusAndSearch: (status: 'este-mes' | 'proximo-mes') => ShoppingItem[]
  getItemsByCategoryAndSearch: (categoryId: string) => ShoppingItem[]
  getCategoryStats: (categoryId: string) => {
    total: number
    completed: number
    pending: number
    items: ShoppingItem[]
  }
  getTotalStats: () => {
    total: number
    completed: number
    pending: number
  }
}

export const useSupabaseShoppingStore = create<SupabaseShoppingStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      categories: [],
      isLoading: false,
      error: null,
      searchQuery: '',
      activeTab: 'este-mes',

      // Actions
      fetchItems: async () => {
        set({ isLoading: true, error: null })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            set({ items: [], isLoading: false })
            return
          }

          const { data, error } = await supabase
            .from('shopping_items')
            .select(`
              *,
              categories (
                id,
                name,
                slug,
                icon,
                color
              )
            `)
            .eq('user_id', user.id)
            .order('order_index', { ascending: true })

          if (error) throw error

          set({ items: data || [], isLoading: false })
        } catch (error) {
          console.error('Error fetching items:', error)
          set({ error: error instanceof Error ? error.message : 'Error fetching items', isLoading: false })
        }
      },

      fetchCategories: async () => {
        try {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true })

          if (error) throw error

          set({ categories: data || [] })
        } catch (error) {
          console.error('Error fetching categories:', error)
          set({ error: error instanceof Error ? error.message : 'Error fetching categories' })
        }
      },

      addItem: async (name: string, categoryId: string, status: 'este-mes' | 'proximo-mes') => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('User not authenticated')

          const { data, error } = await supabase
            .from('shopping_items')
            .insert({
              name,
              category_id: categoryId,
              status,
              user_id: user.id,
              order_index: get().items.length
            })
            .select(`
              *,
              categories (
                id,
                name,
                slug,
                icon,
                color
              )
            `)
            .single()

          if (error) throw error

          set(state => ({
            items: [...state.items, data]
          }))
        } catch (error) {
          console.error('Error adding item:', error)
          throw error
        }
      },

      updateItem: async (id: string, updates: Partial<ShoppingItem>) => {
        try {
          const { data, error } = await supabase
            .from('shopping_items')
            .update(updates)
            .eq('id', id)
            .select(`
              *,
              categories (
                id,
                name,
                slug,
                icon,
                color
              )
            `)
            .single()

          if (error) throw error

          set(state => ({
            items: state.items.map(item => item.id === id ? data : item)
          }))
        } catch (error) {
          console.error('Error updating item:', error)
          throw error
        }
      },

      deleteItem: async (id: string) => {
        try {
          const { error } = await supabase
            .from('shopping_items')
            .delete()
            .eq('id', id)

          if (error) throw error

          set(state => ({
            items: state.items.filter(item => item.id !== id)
          }))
        } catch (error) {
          console.error('Error deleting item:', error)
          throw error
        }
      },

      toggleItemCompleted: async (id: string) => {
        const item = get().items.find(item => item.id === id)
        if (!item) return

        try {
          await get().updateItem(id, { completed: !item.completed })
        } catch (error) {
          console.error('Error toggling item completion:', error)
          throw error
        }
      },

      moveItemToStatus: async (id: string, newStatus: 'este-mes' | 'proximo-mes') => {
        try {
          await get().updateItem(id, { status: newStatus })
        } catch (error) {
          console.error('Error moving item:', error)
          throw error
        }
      },

      reorderItems: async (reorderedItems: ShoppingItem[]) => {
        try {
          const updates = reorderedItems.map((item, index) => ({
            id: item.id,
            order_index: index
          }))

          for (const update of updates) {
            const { error } = await supabase
              .from('shopping_items')
              .update({ order_index: update.order_index })
              .eq('id', update.id)

            if (error) throw error
          }

          set({ items: reorderedItems })
        } catch (error) {
          console.error('Error reordering items:', error)
          throw error
        }
      },

      updateItemName: async (id: string, name: string) => {
        try {
          await get().updateItem(id, { name })
        } catch (error) {
          console.error('Error updating item name:', error)
          throw error
        }
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query })
      },

      clearSearch: () => {
        set({ searchQuery: '' })
      },

      setActiveTab: (tab: 'este-mes' | 'proximo-mes') => {
        set({ activeTab: tab })
      },

      forceInitialize: async () => {
        await Promise.all([
          get().fetchItems(),
          get().fetchCategories()
        ])
      },

      clearData: () => {
        set({
          items: [],
          categories: [],
          error: null,
          searchQuery: '',
          activeTab: 'este-mes'
        })
      },

      // Getters
      getItemsByStatus: (status: 'este-mes' | 'proximo-mes') => {
        return get().items.filter(item => item.status === status)
      },

      getItemsByCategory: (categoryId: string) => {
        return get().items.filter(item => item.category_id === categoryId)
      },

      getItemsByStatusAndSearch: (status: 'este-mes' | 'proximo-mes') => {
        const { searchQuery } = get()
        return get().items.filter(item => 
          item.status === status && 
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      },

      getItemsByCategoryAndSearch: (categoryId: string) => {
        const { searchQuery } = get()
        return get().items.filter(item => 
          item.category_id === categoryId && 
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      },

      getCategoryStats: (categoryId: string) => {
        const items = get().getItemsByCategory(categoryId)
        const completed = items.filter(item => item.completed).length
        const pending = items.length - completed

        return {
          total: items.length,
          completed,
          pending,
          items: items.sort((a, b) => {
            if (a.completed === b.completed) {
              return a.order_index - b.order_index
            }
            return a.completed ? 1 : -1
          })
        }
      },

      getTotalStats: () => {
        const items = get().items
        const completed = items.filter(item => item.completed).length
        const pending = items.length - completed

        return {
          total: items.length,
          completed,
          pending
        }
      }
    }),
    {
      name: 'supabase-shopping-store',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        activeTab: state.activeTab
      })
    }
  )
)
