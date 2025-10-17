'use client'

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ErrorHandlerProps {
  error: string | null
  onClearError: () => void
}

export function ErrorHandler({ error, onClearError }: ErrorHandlerProps) {
  const { showError } = useToast()

  useEffect(() => {
    if (error) {
      // Mostrar toast de error
      showError('Error', error)
      
      // Si es un error de autenticación, mostrar mensaje específico
      if (error.includes('Sesión expirada') || error.includes('Usuario no autenticado')) {
        showError('Sesión Expirada', 'Tu sesión ha expirado. Serás redirigido al login.')
      }
      
      // Limpiar el error después de mostrarlo
      setTimeout(() => {
        onClearError()
      }, 5000)
    }
  }, [error, showError, onClearError])

  return null
}
