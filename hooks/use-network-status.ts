"use client"

import { useEffect, useState } from 'react'

/**
 * Detecta si el navegador tiene conexión a internet.
 * Escucha los eventos `online` y `offline` del navegador.
 * Retorna `true` cuando hay conexión, `false` cuando no.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Sincronizar estado inicial por si el componente montó offline
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
