'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/loading-spinner'

export default function ResetPasswordSimplePage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const router = useRouter()
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Wait a bit for Supabase to process the URL hash
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          showError('Error de sesión', 'No se pudo verificar la sesión.')
          router.push('/forgot-password')
          return
        }
        
        if (session && session.user) {
          setIsReady(true)
        } else {
          showError('Sesión inválida', 'El enlace de recuperación no es válido o ha expirado.')
          router.push('/forgot-password')
        }
      } catch (error) {
        console.error('Error in checkSession:', error)
        showError('Error', 'Ocurrió un error al verificar la sesión.')
        router.push('/forgot-password')
      }
    }

    checkSession()
  }, [router, showError])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      showError('Error', 'Las contraseñas no coinciden.')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      showError('Error', 'La contraseña debe tener al menos 6 caracteres.')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('Error updating password:', error)
        showError('Error al actualizar contraseña', error.message)
        return
      }

      setSuccess('Tu contraseña ha sido restablecida exitosamente.')
      showSuccess('Contraseña actualizada', 'Puedes iniciar sesión con tu nueva contraseña.')
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      console.error('Error resetting password:', err)
      setError(err.message || 'Ocurrió un error al restablecer la contraseña.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isReady && !success) {
    return <LoadingSpinner title="Verificando enlace de recuperación..." message="Esto puede tomar unos segundos..." />
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white flex items-center justify-center rounded-lg overflow-hidden">
            <Image src="/logo-gif.gif" alt="Logo" width={120} height={120} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Restablecer Contraseña
          </h1>
          <p className="text-gray-400">
            Ingresa tu nueva contraseña.
          </p>
        </div>

        <Card className="bg-background border-none">
          <CardContent className="p-6">
            {success ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-white text-lg mb-4">{success}</p>
                <Link href="/login">
                  <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white">
                    Ir a Iniciar Sesión
                  </Button>
                </Link>
              </div>
            ) : (
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

                {error && (
                  <div className="flex items-center text-red-500 text-sm">
                    <XCircle className="w-4 h-4 mr-2" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
