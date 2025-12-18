'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUnifiedShoppingStore } from '@/lib/store/unified-shopping-store'
import { useToast } from '@/hooks/use-toast'

/**
 * Componente que detecta errores de autenticación y redirige al login
 * sin recargar la página completa
 */
export function AuthErrorHandler() {
  const router = useRouter()
  const pathname = usePathname()
  const error = useUnifiedShoppingStore((state) => state.error)
  const clearError = useUnifiedShoppingStore((state) => state.clearError)
  const { showError } = useToast()
  const redirectingRef = useRef(false)

  useEffect(() => {
    if (!error || redirectingRef.current) return

    // Detectar errores de autenticación
    const isAuthError = 
      error.includes('Sesión expirada') ||
      error.includes('Usuario no autenticado') ||
      error.includes('401') ||
      error.includes('Unauthorized') ||
      error.includes('autenticación') ||
      error.includes('No se pudo obtener la sesión')

    if (isAuthError && pathname !== '/login' && pathname !== '/register') {
      // Marcar que ya estamos redirigiendo para evitar múltiples redirecciones
      redirectingRef.current = true

      // Mostrar mensaje al usuario
      showError(
        'Sesión Expirada',
        'Tu sesión ha expirado. Serás redirigido al login en unos segundos...'
      )

      // Redirigir después de un breve delay para que el usuario vea el mensaje
      const redirectTimer = setTimeout(() => {
        // Usar router.push en lugar de window.location.href para evitar recargar
        router.push('/login')
        // Limpiar el error después de redirigir
        clearError()
        // Resetear el flag después de un momento
        setTimeout(() => {
          redirectingRef.current = false
        }, 1000)
      }, 2000)

      return () => {
        clearTimeout(redirectTimer)
      }
    }
  }, [error, router, pathname, clearError, showError])

  // Resetear el flag cuando el error se limpia
  useEffect(() => {
    if (!error) {
      redirectingRef.current = false
    }
  }, [error])

  return null
}

