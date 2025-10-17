'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Apple, Mail, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function IniciarSesionPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, loginWithGoogle, loginWithApple, isLoading, user } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    console.log('Iniciar Sesión page - useEffect triggered:', { user: !!user, isLoading })
    if (user && !isLoading) {
      console.log('Iniciar Sesión page - Redirecting to home...')
      // Direct navigation to avoid middleware conflicts
      window.location.href = '/'
    }
  }, [user, isLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Iniciar Sesión page - handleLogin called')
    try {
      console.log('Iniciar Sesión page - Calling login function...')
      await login(email, password)
      console.log('Iniciar Sesión page - Login function completed')
      // The useEffect will handle the redirect when user state updates
    } catch (error) {
      console.error('Iniciar Sesión failed:', error)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
      // The useEffect will handle the redirect when user state updates
    } catch (error) {
      console.error('Google login failed:', error)
    }
  }

  const handleAppleLogin = async () => {
    try {
      await loginWithApple()
      // The useEffect will handle the redirect when user state updates
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
            Bienvenido a <span className="text-primary">Lo Que Falta</span>
          </h1>
              <p className="text-gray-400">
                No tienes una cuenta?{' '}
                <Link href="/register" className="text-blue-400 hover:underline">
                  Regístrate
                </Link>
              </p>
              <p className="text-gray-400 mt-2">
                ¿Olvidaste tu contraseña?{' '}
                <Link href="/forgot-password" className="text-blue-400 hover:underline">
                  Recuperar contraseña
                </Link>
              </p>
        </div>

        {/* Formulario de Iniciar Sesión */}
        <Card className="bg-background border-none">
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mail@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
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

              <Button
                type="submit"
                className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <Separator className="flex-1 bg-gray-700" />
              <span className="px-4 text-gray-400 text-sm">Or</span>
              <Separator className="flex-1 bg-gray-700" />
            </div>

            {/* Iniciar Sesión Social */}
            <div className="space-y-3">
              <Button
              disabled
                onClick={handleAppleLogin}
                variant="outline"
                className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
              >
                <Apple className="w-5 h-5 mr-2" />
                Continue con Apple
              </Button>

              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full bg-gray-800 cursor-pointer border-gray-700 text-white hover:bg-gray-700"
              >
                <div className="w-5 h-5 mr-2 bg-white rounded flex items-center justify-center">
                  <span className="text-blue-500 font-bold text-xs">G</span>
                </div>
                Continue with Google
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        {/* <div className="text-center mt-8 text-gray-400 text-sm">
          <p>
            By clicking continue, you agree to our{' '}
            <Link href="/terms" className="text-blue-400 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-400 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div> */}
      </div>
    </div>
  )
}
