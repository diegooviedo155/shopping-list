'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import { LoadingSpinner } from '@/components/loading-spinner'

interface GuestRouteProps {
  children: React.ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const redirectedRef = useRef(false)
  const [hasTimedOut, setHasTimedOut] = useState(false)

  // Timeout de seguridad: si después de 5 segundos sigue cargando, continuar sin sesión
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
    if (redirectedRef.current) return
    if ((!isLoading || hasTimedOut) && user) {
      redirectedRef.current = true
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        router.replace('/')
      }
    }
  }, [user, isLoading, hasTimedOut, router])

  if (isLoading && !hasTimedOut) {
    return <LoadingSpinner title="Verificando autenticación..." />
  }

  if (user) {
    return null
  }

  return <>{children}</>
}


