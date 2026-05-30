"use client"

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePendingSync } from '@/hooks/use-pending-sync'

/**
 * Badge flotante que muestra el estado de la conexión y la sincronización.
 *
 * Estados:
 * - Oculto cuando todo está bien (online + sin pendientes)
 * - Naranja "Sin conexión (N pendientes)" cuando offline
 * - Azul "Sincronizando..." cuando está reproduciendo la cola
 * - Verde "Sincronizado" brevemente al terminar
 */
export function NetworkStatusIndicator() {
  const { isOnline, pendingCount, isSyncing, lastSyncedAt } = usePendingSync()
  const [showSynced, setShowSynced] = useState(false)

  // Mostrar el tick verde 2.5s después de sincronizar
  useEffect(() => {
    if (!lastSyncedAt) return
    setShowSynced(true)
    const t = setTimeout(() => setShowSynced(false), 2500)
    return () => clearTimeout(t)
  }, [lastSyncedAt])

  const isVisible = !isOnline || isSyncing || showSynced

  if (!isVisible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg',
        'transition-all duration-300 ease-in-out',
        !isOnline && 'bg-orange-500 text-white',
        isOnline && isSyncing && 'bg-blue-500 text-white',
        isOnline && showSynced && !isSyncing && 'bg-green-600 text-white',
      )}
    >
      {!isOnline && (
        <>
          <WifiOff className="w-4 h-4 shrink-0" aria-hidden />
          <span>
            Sin conexión
            {pendingCount > 0 && (
              <span className="ml-1 opacity-90">
                ({pendingCount} {pendingCount === 1 ? 'cambio' : 'cambios'} pendiente{pendingCount !== 1 ? 's' : ''})
              </span>
            )}
          </span>
        </>
      )}

      {isOnline && isSyncing && (
        <>
          <RefreshCw className="w-4 h-4 shrink-0 animate-spin" aria-hidden />
          <span>Sincronizando...</span>
        </>
      )}

      {isOnline && showSynced && !isSyncing && (
        <>
          <CheckCircle className="w-4 h-4 shrink-0" aria-hidden />
          <span>Sincronizado</span>
        </>
      )}
    </div>
  )
}
