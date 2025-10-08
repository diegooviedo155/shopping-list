"use client"

import { useState, useCallback, useRef } from 'react'
import { ShoppingItem } from '../../core/domain/entities/ShoppingItem'

export interface UseOptimisticReorderProps {
  initialItems: ShoppingItem[]
  onReorder: (status: string, sourceIndex: number, destIndex: number) => Promise<void>
}

export function useOptimisticReorder({ 
  initialItems, 
  onReorder 
}: UseOptimisticReorderProps) {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems)
  const [isUpdating, setIsUpdating] = useState(false)
  const previousItemsRef = useRef<ShoppingItem[]>(initialItems)

  const reorderItems = useCallback(async (
    status: string, 
    sourceIndex: number, 
    destIndex: number
  ) => {
    // Guardar estado anterior para rollback
    previousItemsRef.current = [...items]
    
    // Actualización optimista inmediata - UI se actualiza al instante
    setItems((prev) => {
      const currentItems = prev
        .filter((item) => item.status.getValue() === status)
        .sort((a, b) => a.orderIndex - b.orderIndex)

      const [reorderedItem] = currentItems.splice(sourceIndex, 1)
      currentItems.splice(destIndex, 0, reorderedItem)

      const updatedItems = currentItems.map((item, index) =>
        ShoppingItem.create({ ...item.toPrimitives(), orderIndex: index, updatedAt: new Date() })
      )

      const otherItems = prev.filter((item) => item.status.getValue() !== status)
      return [...otherItems, ...updatedItems]
    })

    // Llamar API en background sin bloquear UI
    try {
      setIsUpdating(true)
      await onReorder(status, sourceIndex, destIndex)
    } catch (error) {
      // Rollback en caso de error
      setItems(previousItemsRef.current)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [items, onReorder])

  const updateItems = useCallback((newItems: ShoppingItem[]) => {
    setItems(newItems)
  }, [])

  return {
    items,
    isUpdating,
    reorderItems,
    updateItems
  }
}
