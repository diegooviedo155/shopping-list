'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { SidebarLayout } from '@/components/sidebar-layout'
import { useAuth } from '@/components/auth/auth-provider'
import { goBack } from '@/lib/utils'

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const router = useRouter()
  const { showError, showSuccess } = useToast()
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Load user data
  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
    }
    if (profile) {
      setFullName(profile.full_name || '')
    }
  }, [user, profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    // Validaciones
    if (!fullName.trim()) {
      setError('El nombre no puede estar vacío.')
      showError('Error', 'El nombre no puede estar vacío.')
      setIsLoading(false)
      return
    }

    if (fullName.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.')
      showError('Error', 'El nombre debe tener al menos 2 caracteres.')
      setIsLoading(false)
      return
    }

    try {
      await updateProfile({ full_name: fullName.trim() })
      setSuccess('Tu perfil ha sido actualizado exitosamente.')
      showSuccess('Perfil actualizado', 'Tus cambios han sido guardados.')
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al actualizar el perfil.')
      showError('Error', err.message || 'Ocurrió un error al actualizar el perfil.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <SidebarLayout 
      title="Mi Perfil"
      description="Administra tu información personal"
    >
      <div className="max-w-md mx-auto">
        <Card className="bg-background border-none">
          <CardContent className="p-6">
            {success ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-white text-lg mb-4">{success}</p>
                <Button
                  onClick={() => goBack(router)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Volver
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500">
                    El correo electrónico no se puede cambiar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-white">
                    Nombre Completo
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Ingresa tu nombre completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center text-red-500 text-sm">
                    <XCircle className="w-4 h-4 mr-2" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goBack(router)}
                    className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  )
}

