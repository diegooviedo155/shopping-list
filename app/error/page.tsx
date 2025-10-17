'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

function ErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  useEffect(() => {
    // Si hay un access_token en la URL, redirigir al callback
    if (window.location.hash.includes('access_token')) {
      router.push('/auth/callback')
    }
  }, [router])

  const getErrorMessage = () => {
    switch (error) {
      case 'auth_error':
        return 'Error de autenticación. Por favor, intenta de nuevo.'
      case 'profile_error':
        return 'Error creando el perfil de usuario.'
      case 'unexpected_error':
        return 'Ocurrió un error inesperado.'
      default:
        return message || 'Ha ocurrido un error. Por favor, intenta de nuevo.'
    }
  }

  const handleRetry = () => {
    router.push('/login')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-lg flex items-center justify-center">
            <Image src="/logo-sin-fondo.png" alt="Logo" width={120} height={120} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            <span className="text-primary">Lo Que Falta</span>
          </h1>
        </div>

        {/* Error Card */}
        <Card className="bg-background border-none">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-white">
              Error
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <p className="text-gray-400">
              {getErrorMessage()}
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleRetry}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Intentar de nuevo
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir al inicio
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              Si el problema persiste, contacta al soporte técnico.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
