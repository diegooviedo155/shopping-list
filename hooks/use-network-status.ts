"use client"

import { useEffect, useRef, useState } from 'react'

// Tiempo mínimo offline antes de mostrar el indicador.
// Evita falsos positivos de navigator.onLine en Android/PWA que reportan
// false brevemente aunque haya señal 4G+.
const OFFLINE_DEBOUNCE_MS = 3000

/**
 * Detecta si el navegador tiene conexión a internet.
 * Usa un debounce de 3s antes de declarar que no hay red, para evitar
 * falsos positivos de navigator.onLine en dispositivos Android/PWA.
 */
export function useNetworkStatus(): boolean {
  // Comenzar siempre como "online" para no mostrar el badge en el arranque
  const [isOnline, setIsOnline] = useState(true)
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const markOnline = () => {
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current)
        offlineTimerRef.current = null
      }
      setIsOnline(true)
    }

    const markOffline = () => {
      // Esperar antes de declarar offline (evita falsos positivos)
      if (offlineTimerRef.current) return
      offlineTimerRef.current = setTimeout(() => {
        offlineTimerRef.current = null
        setIsOnline(false)
      }, OFFLINE_DEBOUNCE_MS)
    }

    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)

    // Verificar el estado inicial con debounce (no al instante)
    if (!navigator.onLine) {
      markOffline()
    }

    return () => {
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current)
    }
  }, [])

  return isOnline
}
