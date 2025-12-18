'use client'

import { useEffect } from 'react'
import { initErrorInterceptor } from '@/lib/utils/error-logger'

export function ErrorLoggerInit() {
  useEffect(() => {
    // Inicializar el interceptor de errores global
    initErrorInterceptor()
  }, [])

  return null
}

