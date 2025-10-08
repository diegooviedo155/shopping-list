import { useState, useCallback, useRef, useEffect } from 'react'
import { ShoppingItem } from '../../core/domain/entities/ShoppingItem'

interface UseDebouncedReorderProps {
  onReorder: (status: string, sourceIndex: number, destIndex: number) => Promise<void>
  debounceMs?: number
}

interface UseDebouncedReorderReturn {
  items: ShoppingItem[]
  setItems: (items: ShoppingItem[]) => void
  handleReorder: (newItems: ShoppingItem[]) => void
  isPending: boolean
  hasChanges: boolean
  pendingCount: number
  forceSave: () => Promise<void>
}

export function useDebouncedReorder({
  onReorder,
  debounceMs = 30000 // 30 segundos por defecto
}: UseDebouncedReorderProps): UseDebouncedReorderReturn {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [isPending, setIsPending] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingChangesRef = useRef<{
    status: string
    sourceIndex: number
    destIndex: number
  }[]>([])
  const originalItemsRef = useRef<ShoppingItem[]>([])

  // Función para procesar los cambios pendientes
  const processPendingChanges = useCallback(async () => {
    if (pendingChangesRef.current.length === 0) return

    const changes = [...pendingChangesRef.current]
    pendingChangesRef.current = []
    setPendingCount(0)
    setHasChanges(false)
    setIsPending(true)

    try {
      // Procesar el último cambio de cada status
      const lastChangesByStatus = new Map<string, typeof changes[0]>()
      changes.forEach(change => {
        lastChangesByStatus.set(change.status, change)
      })

      // Ejecutar los cambios en paralelo
      await Promise.all(
        Array.from(lastChangesByStatus.values()).map(change =>
          onReorder(change.status, change.sourceIndex, change.destIndex)
        )
      )

    } catch (error) {
      // Revertir a los items originales en caso de error
      setItems(originalItemsRef.current)
    } finally {
      setIsPending(false)
    }
  }, [onReorder])

  // Función para manejar el reordenamiento
  const handleReorder = useCallback((newItems: ShoppingItem[]) => {
    // Actualizar el estado inmediatamente para feedback visual
    setItems(newItems)
    setHasChanges(true)
    setPendingCount(prev => prev + 1)

    // Guardar los items originales si es la primera vez
    if (originalItemsRef.current.length === 0) {
      originalItemsRef.current = [...items]
    }

    // Limpiar el timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Configurar nuevo timeout
    timeoutRef.current = setTimeout(() => {
      processPendingChanges()
    }, debounceMs)
  }, [items, debounceMs, processPendingChanges])

  // Función para forzar el guardado inmediato
  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    await processPendingChanges()
  }, [processPendingChanges])

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    items,
    setItems,
    handleReorder,
    isPending,
    hasChanges,
    pendingCount,
    forceSave
  }
}
