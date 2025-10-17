'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import { useAuth } from '@/components/auth/auth-provider'

export default function ChangePasswordSimplePage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const { showError, showSuccess } = useToast()
  const { user, isLoading: authLoading } = useAuth()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    // Validaciones básicas
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.')
      showError('Error', 'Las contraseñas nuevas no coinciden.')
      setIsLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      showError('Error', 'La nueva contraseña debe tener al menos 6 caracteres.')
      setIsLoading(false)
      return
    }

    // Validación adicional: verificar que no sea una contraseña común
    const commonPasswords = ['demo123', 'password', '123456', 'admin', 'test', 'user']
    if (commonPasswords.includes(newPassword.toLowerCase())) {
      setError('Por seguridad, no uses contraseñas comunes. Elige una contraseña más segura.')
      showError('Contraseña insegura', 'Por seguridad, no uses contraseñas comunes. Elige una contraseña más segura.')
      setIsLoading(false)
      return
    }

    // Timeout de 8 segundos
    const timeoutId = setTimeout(() => {
      setError('La operación está tardando demasiado. Por favor, verifica tu conexión e intenta nuevamente.')
      showError('Timeout', 'La operación está tardando demasiado. Por favor, verifica tu conexión e intenta nuevamente.')
      setIsLoading(false)
    }, 8000)

    try {
      // Verificar que el usuario esté autenticado
      if (!user) {
        setError('No estás autenticado. Por favor, inicia sesión nuevamente.')
        showError('Error de autenticación', 'No estás autenticado. Por favor, inicia sesión nuevamente.')
        clearTimeout(timeoutId)
        setIsLoading(false)
        return
      }
      
      // Actualizar contraseña directamente
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        // Manejar error específico de contraseña igual
        if (updateError.message.includes('should be different from the old password') || 
            updateError.message.includes('same_password')) {
          setError('La nueva contraseña debe ser diferente a tu contraseña actual.')
          showError('Contraseña inválida', 'La nueva contraseña debe ser diferente a tu contraseña actual.')
        } else {
          setError(updateError.message)
          showError('Error al actualizar contraseña', updateError.message)
        }
        
        clearTimeout(timeoutId)
        setIsLoading(false)
        return
      }

      setSuccess('Tu contraseña ha sido actualizada exitosamente.')
      showSuccess('Contraseña actualizada', 'Tu contraseña ha sido cambiada correctamente.')
      
      // Clear form
      setNewPassword('')
      setConfirmPassword('')
      
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al cambiar la contraseña.')
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-lg flex items-center justify-center">
            <Image src="/logo-sin-fondo.png" alt="Logo" width={120} height={120} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Cambiar Contraseña
          </h1>
          <p className="text-gray-400">
            Actualiza tu contraseña de forma segura.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            La nueva contraseña debe ser diferente a tu contraseña actual.
          </p>
        </div>

        <Card className="bg-background border-none">
          <CardContent className="p-6">
            {success ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-white text-lg mb-4">{success}</p>
                <Button
                  onClick={() => router.push('/')}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Volver al Inicio
                </Button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-white">
                    Nueva Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ingresa tu nueva contraseña"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                    Confirmar Nueva Contraseña
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

                {error && (
                  <div className="space-y-2">
                    <div className="flex items-center text-red-500 text-sm">
                      <XCircle className="w-4 h-4 mr-2" />
                      {error}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setError(null)
                        setNewPassword('')
                        setConfirmPassword('')
                      }}
                      className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 text-sm"
                    >
                      Limpiar formulario
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al Inicio
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
