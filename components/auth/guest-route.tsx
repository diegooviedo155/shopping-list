'use client'

import { useEffect, useRef } from 'react'
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

  useEffect(() => {
    if (redirectedRef.current) return
    if (!isLoading && user) {
      redirectedRef.current = true
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        router.replace('/')
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <LoadingSpinner title="Verificando autenticación..." />
  }

  if (user) {
    return null
  }

  return <>{children}</>
}


