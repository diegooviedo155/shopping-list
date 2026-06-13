'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import { LoadingSpinner as LoadingSpinnerNew } from '@/components/loading-spinner'
import { useNetworkStatus } from '@/hooks/use-network-status'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const isOnline = useNetworkStatus()
  const router = useRouter()
  const [hasTimedOut, setHasTimedOut] = useState(false)

  // Timeout de seguridad: si después de 5 segundos sigue cargando, asumir que no hay sesión
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setHasTimedOut(true)
      }, 5000)

      return () => clearTimeout(timeout)
    } else {
      setHasTimedOut(false)
    }
  }, [isLoading])

  useEffect(() => {
    // Si está offline, no redirigir: el usuario puede tener datos en caché
    // y el token no puede refrescarse sin internet.
    if (!isOnline) return
    if ((!isLoading || hasTimedOut) && !user) {
      router.push('/login')
    }
  }, [user, isLoading, hasTimedOut, router, isOnline])

  if (isLoading && !hasTimedOut) {
    return <LoadingSpinnerNew title="Verificando autenticación..." />
  }

  // Offline sin sesión: mostrar contenido con datos del caché
  if (!user && !isOnline) {
    return <>{children}</>
  }

  if (!user) {
    return fallback || null
  }

  return <>{children}</>
}