'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const { showError, showSuccess } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay una sesión válida para restablecer contraseña
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsValidSession(true)
      } else {
        showError('Sesión inválida', 'El enlace de recuperación no es válido o ha expirado')
        setTimeout(() => {
          router.push('/forgot-password')
        }, 3000)
      }
    }

    checkSession()
  }, [router, showError])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      showError('Error', 'Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      showError('Error', 'La contraseña debe tener al menos 6 caracteres')
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        showError('Error', error.message)
        return
      }

      setIsSuccess(true)
      showSuccess('Contraseña actualizada', 'Tu contraseña ha sido restablecida exitosamente')
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      console.error('Error updating password:', error)
      showError('Error', 'No se pudo restablecer la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-background border-none">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <ArrowLeft className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Enlace Inválido
              </h2>
              <p className="text-gray-400 mb-6">
                El enlace de recuperación no es válido o ha expirado.
              </p>
              <Link href="/forgot-password">
                <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white">
                  Solicitar nuevo enlace
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isSuccess) {
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
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-xl font-semibold text-white mb-2">
                ¡Contraseña Actualizada!
              </h2>
              
              <p className="text-gray-400 mb-6">
                Tu contraseña ha sido restablecida exitosamente.
              </p>
              
              <p className="text-sm text-gray-500 mb-6">
                Serás redirigido al inicio de sesión en unos segundos...
              </p>

              <Link href="/login">
                <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white">
                  Ir al inicio de sesión
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
            Restablecer Contraseña
          </h1>
          <p className="text-gray-400">
            Ingresa tu nueva contraseña
          </p>
        </div>

        {/* Reset Password Form */}
        <Card className="bg-background border-none">
          <CardContent className="p-6">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Nueva Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu nueva contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  Confirmar Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirma tu nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Actualizando...' : 'Restablecer contraseña'}
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
  )
}
