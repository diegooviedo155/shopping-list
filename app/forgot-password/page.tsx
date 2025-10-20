'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { GuestRoute } from '@/components/auth/guest-route'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const { showError, showSuccess, showInfo, user } = useAuth()
  const router = useRouter()

  // Se maneja con GuestRoute

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // En lugar de enviar email de recuperación, mostrar mensaje informativo
      showInfo('Función no disponible', 'El envío de emails de recuperación está deshabilitado. Por favor, contacta al administrador o usa la opción "Cambiar Contraseña" si ya estás logueado.')
      setIsEmailSent(true)
    } catch (error) {
      // Error ya manejado
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
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

          {/* Success Message */}
          <Card className="bg-background border-none">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-xl font-semibold text-white mb-2">
                Email Enviado
              </h2>
              
              <p className="text-gray-400 mb-6">
                El envío de emails de recuperación está deshabilitado. Si necesitas cambiar tu contraseña, por favor inicia sesión y usa la opción "Cambiar Contraseña" en el menú lateral.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => setIsEmailSent(false)}
                  variant="outline"
                  className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  Enviar otro email
                </Button>
                
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="w-full text-gray-400 hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al inicio de sesión
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <GuestRoute>
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-lg flex items-center justify-center">
            <Image src="/logo-sin-fondo.png" alt="Logo" width={120} height={120} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Recuperar Contraseña
          </h1>
          <p className="text-gray-400">
            Ingresa tu email para recibir un enlace de recuperación
          </p>
        </div>

        {/* Reset Password Form */}
        <Card className="bg-background border-none">
          <CardContent className="p-6">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </GuestRoute>
  )
}
