"use client"

import { useEffect, useRef, useState } from 'react'
import { useNetworkStatus } from './use-network-status'
import { pendingOperationsQueue, type PendingOperation } from '@/lib/utils/pending-operations'
import { useUnifiedShoppingStore } from '@/lib/store/unified-shopping-store'

export interface PendingSyncState {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  lastSyncedAt: Date | null
}

/**
 * Maneja la cola de operaciones pendientes y las reproduce cuando vuelve la conexión.
 *
 * Flujo:
 * 1. Usuario hace mutación sin conexión → operación queda en cola
 * 2. Conexión se restablece → este hook detecta el evento `online`
 * 3. Se reproducen todas las operaciones en orden FIFO
 * 4. Se hace refetch para sincronizar el estado con el servidor
 */
export function usePendingSync(): PendingSyncState {
  const isOnline = useNetworkStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const isSyncingRef = useRef(false)
  const store = useUnifiedShoppingStore()

  // Sincronizar el contador de pendientes con localStorage
  const refreshCount = () => {
    setPendingCount(pendingOperationsQueue.count())
  }

  // Actualizar contador al montar y cuando cambia online
  useEffect(() => {
    refreshCount()
  }, [isOnline])

  // Cuando vuelve la conexión, reproducir la cola
  useEffect(() => {
    if (!isOnline || isSyncingRef.current) return

    const pending = pendingOperationsQueue.getAll()
    if (pending.length === 0) return

    const replay = async () => {
      isSyncingRef.current = true
      setIsSyncing(true)
      refreshCount()

      for (const op of pending) {
        try {
          await replayOperation(op, store)
          pendingOperationsQueue.remove(op.id)
          refreshCount()
        } catch {
          // Si una operación falla durante el sync (ej: item ya no existe en el servidor),
          // la eliminamos de la cola para no quedar en un loop infinito.
          // Los datos frescos del refetch resolverán el estado final.
          pendingOperationsQueue.remove(op.id)
          refreshCount()
        }
      }

      // Refetch para sincronizar el estado local con el servidor
      try {
        await Promise.all([store.fetchItems(true), store.fetchCategories()])
      } catch {
        // Si el refetch falla, no es crítico — la cola ya se procesó
      }

      setLastSyncedAt(new Date())
      isSyncingRef.current = false
      setIsSyncing(false)
    }

    replay()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  return { isOnline, pendingCount, isSyncing, lastSyncedAt }
}

async function replayOperation(
  op: PendingOperation,
  store: ReturnType<typeof useUnifiedShoppingStore.getState>
): Promise<void> {
  switch (op.type) {
    case 'toggle': {
      const item = store.items.find((i) => i.id === op.itemId)
      if (!item) return
      await store.toggleItemCompleted(op.itemId)
      break
    }
    case 'delete': {
      // El item ya fue eliminado de la UI; confirmar con el servidor.
      // Si ya no existe en la UI, intentar delete de todas formas (el servidor lo ignorará).
      const { getCachedAuthHeaders } = await import('@/lib/utils/auth-cache')
      const { queuedFetch } = await import('@/lib/utils/request-queue')
      const headers = await getCachedAuthHeaders()
      await queuedFetch(`/api/shopping-items/${op.itemId}`, {
        method: 'DELETE',
        headers,
      }, 0)
      break
    }
    case 'add': {
      const { name, category, status, tempId } = op.payload as {
        name: string
        category: string
        status: string
        tempId: string
      }
      // Crear el item en el servidor (addItem agrega uno nuevo con ID real)
      await store.addItem(name, category, status)
      // Eliminar el item temporal que quedó de la operación offline
      useUnifiedShoppingStore.setState((state) => ({
        items: state.items.filter((i) => i.id !== tempId),
      }))
      break
    }
    case 'move': {
      const { newStatus } = op.payload as { newStatus: string }
      await store.moveItemToStatus(op.itemId, newStatus as any)
      break
    }
    case 'update-name': {
      const { name } = op.payload as { name: string }
      await store.updateItemName(op.itemId, name)
      break
    }
  }
}
