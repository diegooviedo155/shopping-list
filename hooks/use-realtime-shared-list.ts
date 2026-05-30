"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface SharedListItem {
  id: string
  name: string
  category_id: string | null
  status: string
  completed: boolean
  order_index: number
  created_at: string
  updated_at: string
  // Unido desde categorías (puede estar presente si el servidor hace join)
  categories?: { id: string; name: string; slug: string; color: string; icon: string } | null
}

export interface UseRealtimeSharedListReturn {
  items: SharedListItem[]
  loading: boolean
  error: string | null
  isConnected: boolean
  toggleItem: (itemId: string) => Promise<void>
  refetch: () => Promise<void>
  lastUpdatedAt: Date | null
}

const POLL_INTERVAL_MS = 20_000 // Polling cada 20s como fallback

/**
 * Carga los items de una lista compartida y mantiene los datos en tiempo real
 * usando Supabase Realtime Broadcast.
 *
 * Estrategia dual:
 * 1. Supabase Realtime Broadcast para cambios iniciados por miembros (instantáneo)
 * 2. Polling cada 20s para capturar cambios del propietario
 *
 * Realtime Broadcast no requiere cambios de RLS porque opera en modo pub/sub,
 * no con postgres_changes (que sí está sujeto a RLS).
 */
export function useRealtimeSharedList(ownerId: string): UseRealtimeSharedListReturn {
  const [items, setItems] = useState<SharedListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ownerIdRef = useRef(ownerId)
  ownerIdRef.current = ownerId

  // ── Fetch de items ─────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/shared-lists/${ownerIdRef.current}/items`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Error al cargar la lista')
      }
      const data: SharedListItem[] = await response.json()
      setItems(data)
      setError(null)
      setLastUpdatedAt(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Polling fallback ───────────────────────────────────────────────────────
  const schedulePoll = useCallback(() => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    pollTimerRef.current = setTimeout(async () => {
      await fetchItems()
      schedulePoll()
    }, POLL_INTERVAL_MS)
  }, [fetchItems])

  // ── Toggle de item (optimista + broadcast) ─────────────────────────────────
  const toggleItem = useCallback(async (itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    const newCompleted = !item.completed

    // Actualización optimista local
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, completed: newCompleted, updated_at: new Date().toISOString() }
          : i
      )
    )

    try {
      const response = await fetch(
        `/api/shared-lists/${ownerIdRef.current}/items/${itemId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: newCompleted }),
        }
      )

      if (!response.ok) {
        throw new Error('Error al actualizar el item')
      }

      const updatedItem: SharedListItem = await response.json()

      // Confirmar con datos del servidor
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? updatedItem : i))
      )

      // Broadcast para que otros colaboradores vean el cambio al instante
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'item:toggled',
          payload: { itemId, completed: newCompleted, updatedAt: updatedItem.updated_at },
        })
      }
    } catch (err) {
      // Rollback
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, completed: item.completed } : i
        )
      )
      throw err
    }
  }, [items])

  // ── Supabase Realtime Broadcast ────────────────────────────────────────────
  useEffect(() => {
    if (!ownerId) return

    // Fetch inicial
    fetchItems()

    // Canal de broadcast compartido entre todos los colaboradores
    const channelName = `shared-list:${ownerId}`
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'item:toggled' }, ({ payload }) => {
        const { itemId, completed, updatedAt } = payload as {
          itemId: string
          completed: boolean
          updatedAt: string
        }
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? { ...i, completed, updated_at: updatedAt }
              : i
          )
        )
        setLastUpdatedAt(new Date())
      })
      .on('broadcast', { event: 'list:refreshed' }, () => {
        // El propietario avisa que actualizó la lista (nuevo item, eliminación, etc.)
        fetchItems()
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    // Iniciar polling como fallback
    schedulePoll()

    // Refrescar al volver a la pestaña (visibilidad)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchItems()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [ownerId, fetchItems, schedulePoll])

  return {
    items,
    loading,
    error,
    isConnected,
    toggleItem,
    refetch: fetchItems,
    lastUpdatedAt,
  }
}
