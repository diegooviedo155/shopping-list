'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function AuthCallback() {
  const router = useRouter()
  const { showError, showSuccess } = useToast()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Procesando autenticación...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setMessage('Verificando sesión...')
        
        // Wait a bit for the session to be established
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Handle OAuth callback with hash
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setStatus('error')
          setMessage('Error de autenticación')
          setTimeout(() => {
            window.location.href = '/login?error=auth_error'
          }, 2000)
          return
        }

        if (data.session && data.session.user) {
          setMessage('Creando perfil de usuario...')
          
          try {
            // Check if profile exists, if not create it
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single()

            if (profileError && profileError.code === 'PGRST116') {
              // Profile doesn't exist, create it
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: data.session.user.id,
                  email: data.session.user.email!,
                  full_name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'Usuario',
                  avatar_url: data.session.user.user_metadata?.avatar_url || null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })

              if (insertError) {
                console.error('Error creating profile:', insertError)
                // Don't fail the login if profile creation fails
                console.warn('Profile creation failed, but continuing with login')
              }
            }
          } catch (profileError) {
            console.error('Profile check/creation error:', profileError)
            // Don't fail the login if profile operations fail
          }

          setStatus('success')
          setMessage('¡Autenticación exitosa!')
          
          // Redirect to home immediately
          setTimeout(() => {
            window.location.href = '/'
          }, 1000)
        } else {
          setStatus('error')
          setMessage('No se encontró sesión')
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage('Error inesperado')
        setTimeout(() => {
          window.location.href = '/login?error=unexpected_error'
        }, 2000)
      }
    }

    handleAuthCallback()
  }, [])

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        )
      case 'success':
        return (
          <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-white'
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {getStatusIcon()}
        <h2 className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
          {status === 'loading' && 'Procesando...'}
          {status === 'success' && '¡Éxito!'}
          {status === 'error' && 'Error'}
        </h2>
        <p className="text-gray-400 mb-6">
          {message}
        </p>
        
        {status === 'loading' && (
          <div className="text-sm text-gray-500">
            Esto puede tomar unos segundos...
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-sm text-gray-500">
            Serás redirigido al login en unos segundos...
          </div>
        )}
      </div>
    </div>
  )
}
