"use client"

import { useState, useCallback, useRef } from 'react'
import { Reorder } from 'framer-motion'

export interface UseFramerMotionProps<T> {
  initialItems: T[]
  onReorder: (items: T[]) => void | Promise<void>
  axis?: 'x' | 'y'
  layoutScroll?: boolean
  optimisticUpdate?: boolean
}

export function useFramerMotion<T>({
  initialItems,
  onReorder,
  axis = 'y',
  layoutScroll = false,
  optimisticUpdate = true
}: UseFramerMotionProps<T>) {
  const [items, setItems] = useState<T[]>(initialItems)
  const [isDragging, setIsDragging] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const previousItemsRef = useRef<T[]>(initialItems)

  const handleReorder = useCallback(async (newItems: T[]) => {
    // Guardar el estado anterior para rollback
    previousItemsRef.current = [...items]
    
    // Actualización optimista inmediata - UI se actualiza al instante
    if (optimisticUpdate) {
      setItems(newItems)
    }

    // Llamar onReorder en background sin bloquear UI
    if (onReorder) {
      try {
        setIsUpdating(true)
        // No esperar la respuesta - actualización optimista
        onReorder(newItems).catch((error) => {
          console.error('Error reordering items:', error)
          // Rollback en caso de error
          if (optimisticUpdate) {
            setItems(previousItemsRef.current)
          }
        })
      } finally {
        setIsUpdating(false)
      }
    }
  }, [onReorder, optimisticUpdate])

  const ReorderGroup = useCallback(({ children, className, ...props }: any) => (
    <Reorder.Group
      axis={axis}
      values={items}
      onReorder={handleReorder}
      layoutScroll={layoutScroll}
      className={className}
      {...props}
    >
      {children}
    </Reorder.Group>
  ), [items, handleReorder, axis, layoutScroll])

  const ReorderItem = useCallback(({ 
    value, 
    children, 
    className, 
    ...props 
  }: any) => (
    <Reorder.Item
      value={value}
      className={className}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        setIsDragging(false)
        // Forzar re-render para asegurar posición correcta
        setTimeout(() => {
          setIsDragging(false)
        }, 100)
      }}
      {...props}
    >
      {children}
    </Reorder.Item>
  ), [])

  return {
    items,
    setItems,
    isDragging,
    isUpdating,
    ReorderGroup,
    ReorderItem,
    handleReorder
  }
}
