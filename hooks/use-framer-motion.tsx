"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { Reorder } from 'framer-motion'

export interface UseFramerMotionProps<T> {
  initialItems: T[]
  onReorder: (items: T[]) => void | Promise<void>
  axis?: 'x' | 'y'
  layoutScroll?: boolean
  optimisticUpdate?: boolean
  debounceMs?: number
}

export function useFramerMotion<T>({
  initialItems,
  onReorder,
  axis = 'y',
  layoutScroll = false,
  optimisticUpdate = true,
  debounceMs = 30000
}: UseFramerMotionProps<T>) {
  const [items, setItems] = useState<T[]>(initialItems)
  const [isDragging, setIsDragging] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const previousItemsRef = useRef<T[]>(initialItems)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Función para procesar los cambios pendientes
  const processPendingChanges = useCallback(async () => {
    if (!onReorder) return

    setIsUpdating(true)
    setHasChanges(false)
    setPendingCount(0)

    try {
      await onReorder(items)
      console.log('[useFramerMotion] Changes saved successfully')
    } catch (error) {
      console.error('[useFramerMotion] Error saving changes:', error)
      // Revertir a los items originales en caso de error
      setItems(previousItemsRef.current)
    } finally {
      setIsUpdating(false)
    }
  }, [onReorder, items])

  const handleReorder = useCallback(async (newItems: T[]) => {
    // Guardar el estado anterior para rollback
    previousItemsRef.current = [...items]
    
    // Actualización optimista inmediata - UI se actualiza al instante
    if (optimisticUpdate) {
      setItems(newItems)
    }

    // Configurar debounce para la actualización de la API
    setHasChanges(true)
    setPendingCount(prev => prev + 1)

    // Limpiar el timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Configurar nuevo timeout
    timeoutRef.current = setTimeout(() => {
      processPendingChanges()
    }, debounceMs)

    console.log(`[useFramerMotion] Reorder queued, will save in ${debounceMs}ms`)
  }, [items, onReorder, optimisticUpdate, debounceMs, processPendingChanges])

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

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
      drag="y" // Solo permitir arrastre vertical
      dragConstraints={{ top: 0, bottom: 0 }} // Restringir movimiento vertical
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
    hasChanges,
    pendingCount,
    ReorderGroup,
    ReorderItem,
    handleReorder,
    forceSave: processPendingChanges
  }
}
