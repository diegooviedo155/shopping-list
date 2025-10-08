"use client"

import { useState, useEffect, useCallback } from 'react'
import { Category, CreateCategoryData, UpdateCategoryData } from '@/lib/types/category'

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
      
      const response = await fetch('/api/categories')
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
      
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

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
      
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

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
      
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })

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

      const response = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.isActive }),
      })

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
  }, [fetchCategories])

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
