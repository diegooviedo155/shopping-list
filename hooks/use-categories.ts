"use client"

import { useState, useEffect, useCallback } from 'react'
import { Category, CreateCategoryData, UpdateCategoryData } from '@/lib/types/category'
import { queuedFetch } from '@/lib/utils/request-queue'
import { getCachedAuthHeaders } from '@/lib/utils/auth-cache'

interface UseCategoriesReturn {
  categories: Category[]
  loading: boolean
  error: string | null
  createCategory: (data: CreateCategoryData) => Promise<Category>
  updateCategory: (id: string, data: UpdateCategoryData) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>
  toggleCategoryStatus: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const headers = await getCachedAuthHeaders().catch(() => ({}))
      const response = await queuedFetch('/api/categories', {
        method: 'GET',
        headers,
      }, 1) // Prioridad alta
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al cargar las categorías')
      }
      
      const data = await response.json()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  const createCategory = useCallback(async (data: CreateCategoryData): Promise<Category> => {
    try {
      setError(null)
      
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch('/api/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }, 0)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al crear la categoría')
      }

      const newCategory = await response.json()
      setCategories(prev => [...prev, newCategory])
      return newCategory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear la categoría'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const updateCategory = useCallback(async (id: string, data: UpdateCategoryData): Promise<Category> => {
    try {
      setError(null)
      
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      }, 0)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al actualizar la categoría')
      }

      const updatedCategory = await response.json()
      setCategories(prev => 
        prev.map(cat => cat.id === id ? updatedCategory : cat)
      )
      return updatedCategory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la categoría'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null)
      
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers,
      }, 0)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al eliminar la categoría')
      }

      setCategories(prev => prev.filter(cat => cat.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la categoría'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  const toggleCategoryStatus = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null)
      
      const category = categories.find(cat => cat.id === id)
      if (!category) throw new Error('Categoría no encontrada')

      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isActive: !category.isActive }),
      }, 0)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al actualizar la categoría')
      }

      const updatedCategory = await response.json()
      setCategories(prev => 
        prev.map(cat => cat.id === id ? updatedCategory : cat)
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la categoría'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [categories])

  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo ejecutar una vez al montar

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    refetch: fetchCategories,
  }
}
