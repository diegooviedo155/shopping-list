"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Category, CreateCategoryData, UpdateCategoryData } from "@/lib/types/category"
import { queuedFetch } from "@/lib/utils/request-queue"
import { getCachedAuthHeaders } from "@/lib/utils/auth-cache"

export const CATEGORIES_QUERY_KEY = ["categories"] as const

async function fetchCategories(): Promise<Category[]> {
  const headers = await getCachedAuthHeaders().catch(() => ({}))
  const response = await queuedFetch("/api/categories", { method: "GET", headers }, 1)
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || "Error al cargar las categorías")
  }
  return response.json()
}

export function useCategories() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategories,
  })

  const createMutation = useMutation({
    mutationFn: async (data: CreateCategoryData): Promise<Category> => {
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch("/api/categories", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      }, 0)
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Error al crear la categoría")
      }
      return response.json()
    },
    onSuccess: (newCategory) => {
      queryClient.setQueryData<Category[]>(CATEGORIES_QUERY_KEY, (prev = []) => [
        ...prev,
        newCategory,
      ])
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryData }): Promise<Category> => {
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      }, 0)
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Error al actualizar la categoría")
      }
      return response.json()
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Category[]>(CATEGORIES_QUERY_KEY, (prev = []) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers,
      }, 0)
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Error al eliminar la categoría")
      }
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<Category[]>(CATEGORIES_QUERY_KEY, (prev = []) =>
        prev.filter((c) => c.id !== id)
      )
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async (category: Category): Promise<Category> => {
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isActive: !category.isActive }),
      }, 0)
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Error al actualizar la categoría")
      }
      return response.json()
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Category[]>(CATEGORIES_QUERY_KEY, (prev = []) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      )
    },
  })

  return {
    categories: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY }),
    createCategory: createMutation.mutateAsync,
    updateCategory: (id: string, data: UpdateCategoryData) =>
      updateMutation.mutateAsync({ id, data }),
    deleteCategory: deleteMutation.mutateAsync,
    toggleCategoryStatus: toggleStatusMutation.mutateAsync,
    isSubmitting:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      toggleStatusMutation.isPending,
  }
}
