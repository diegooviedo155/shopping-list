'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Apple, Mail, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register, loginWithGoogle, loginWithApple, isLoading } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register(formData.name, formData.email, formData.password)
      router.push('/')
    } catch (error) {
      console.error('Register failed:', error)
    }
  }

  const handleGoogleIniciarSesion = async () => {
    try {
      await loginWithGoogle()
      router.push('/')
    } catch (error) {
      console.error('Google login failed:', error)
    }
  }

  const handleAppleIniciarSesion = async () => {
    try {
      await loginWithApple()
      router.push('/')
    } catch (error) {
      console.error('Apple login failed:', error)
    }
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
            Crea tu cuenta en <span className="text-primary">Lo Que Falta</span>
          </h1>
        </div>

        {/* Register Form */}
        <Card className="bg-background border-none">
          <CardContent className="p-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  Nombre Completo
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="mail@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
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
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
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
                className="w-full bg-primary hover:bg-primary/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <Separator className="flex-1 bg-gray-700" />
              <span className="px-4 text-gray-400 text-sm">O</span>
              <Separator className="flex-1 bg-gray-700" />
            </div>

            {/* Iniciar Sesión Social */}
            <div className="space-y-3">
              <Button
                disabled
                onClick={handleAppleIniciarSesion}
                variant="outline"
                className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <Apple className="w-5 h-5 mr-2" />
                Continuar con Apple
              </Button>

              <Button
                disabled
                onClick={handleGoogleIniciarSesion}
                variant="outline"
                className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <div className="w-5 h-5 mr-2 bg-white rounded flex items-center justify-center">
                  <span className="text-blue-500 font-bold text-xs">G</span>
                </div>
                Continuar con Google
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          {/* <p>
            Al continuar, aceptas nuestros{' '}
            <Link href="/terms" className="text-blue-400 hover:underline">
              Términos de Servicio
            </Link>{' '}
            y{' '}
            <Link href="/privacy" className="text-blue-400 hover:underline">
              Política de Privacidad
            </Link>
          </p> */}
          <p className="text-gray-400">
            ¿Ya tenés una cuenta?{' '}
            <Link href="/login" className="text-blue-400 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
