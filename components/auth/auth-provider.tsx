'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Tables } from '@/lib/types/supabase'
import { useToast } from '@/hooks/use-toast'

type Profile = Tables<'profiles'>

interface AuthContextType {
  user: SupabaseUser | null
  session: Session | null
  profile: Profile | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithApple: () => Promise<void>
  logout: () => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { showError, showSuccess, showInfo } = useToast()

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return
      }
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    let subscription: { unsubscribe?: () => void } | null = null
    let isMounted = true

    const getInitialSession = async () => {
      try {
        // Agregar timeout para evitar que se quede colgado
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Session check timeout')), 3000)
        })

        const result = await Promise.race([sessionPromise, timeoutPromise])
        const { data: { session }, error } = result as { data: { session: Session | null }, error: any }

        if (!isMounted) return

        if (error) {
          console.warn('Error getting session:', error)
          // Limpiar tokens inválidos del localStorage
          if (typeof window !== 'undefined') {
            try {
              const keys = Object.keys(localStorage)
              keys.forEach(key => {
                if (key.includes('supabase') || key.includes('auth')) {
                  localStorage.removeItem(key)
                }
              })
            } catch (e) {
              console.warn('Error clearing localStorage:', e)
            }
          }
          setSession(null)
          setUser(null)
          setIsLoading(false)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        // Si hay timeout o cualquier otro error, continuar sin sesión
        if (!isMounted) return
        console.warn('Session check failed:', error instanceof Error ? error.message : 'Unknown error')
        // Limpiar tokens inválidos
        if (typeof window !== 'undefined') {
          try {
            const keys = Object.keys(localStorage)
            keys.forEach(key => {
              if (key.includes('supabase') || key.includes('auth')) {
                localStorage.removeItem(key)
              }
            })
          } catch (e) {
            // Ignorar errores al limpiar
          }
        }
        setSession(null)
        setUser(null)
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        if (isMounted) setIsLoading(false)
      }
    }

    getInitialSession()

    try {
      const authStateChangeResult = supabase.auth.onAuthStateChange(
        async (event: any, session: any) => {
          if (!isMounted) return

          // Evitar actualizaciones innecesarias
          setSession((prevSession) => {
            if (prevSession?.access_token === session?.access_token) {
              return prevSession
            }
            return session
          })
          
          setUser((prevUser) => {
            if (prevUser?.id === session?.user?.id) {
              return prevUser
            }
            return session?.user ?? null
          })

          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }

          setIsLoading(false)
        }
      )
      
      // onAuthStateChange puede devolver directamente la suscripción o un objeto con data
      if (authStateChangeResult && typeof authStateChangeResult === 'object') {
        if ('subscription' in authStateChangeResult) {
          subscription = authStateChangeResult.subscription as { unsubscribe?: () => void }
        } else if ('data' in authStateChangeResult && authStateChangeResult.data) {
          subscription = authStateChangeResult.data as { unsubscribe?: () => void }
        } else if ('unsubscribe' in authStateChangeResult) {
          subscription = authStateChangeResult as { unsubscribe?: () => void }
        }
      }
    } catch (error) {
      console.warn('Error setting up auth state listener:', error)
      if (isMounted) setIsLoading(false)
    }

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
      if (subscription && typeof subscription.unsubscribe === 'function') {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.warn('Error unsubscribing from auth state change:', error)
        }
      }
    }
  }, [fetchProfile])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        showError('Error de autenticación', error.message)
        return
      }

      if (data.user && data.session) {
        setUser(data.user)
        setSession(data.session)
        showSuccess('Inicio de sesión exitoso', 'Bienvenido de vuelta')
        await fetchProfile(data.user.id)
      }
    } catch (error) {
      showError('Error de autenticación', 'No se pudo iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Google login failed:', error)
      showError('Error de Google Iniciar Sesión', 'No se pudo iniciar sesión con Google')
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithApple = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Apple login failed:', error)
      showError('Error de Apple Iniciar Sesión', 'No se pudo iniciar sesión con Apple')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isLoading) {
      console.warn('Logout already in progress')
      return
    }

    setIsLoading(true)
    
    try {
      // Limpiar el estado inmediatamente para mejor UX
      setUser(null)
      setSession(null)
      setProfile(null)
      
      // Limpiar el store y storage
      if (typeof window !== 'undefined') {
        try {
          // Limpiar localStorage
          localStorage.removeItem('unified-shopping-store')
          localStorage.removeItem('supabase-shopping-store')
          
          // Limpiar todos los tokens de Supabase
          const keys = Object.keys(localStorage)
          keys.forEach(key => {
            if (key.includes('supabase') || key.includes('sb-') || key.startsWith('supabase.auth.token')) {
              localStorage.removeItem(key)
            }
          })
          
          // Limpiar sessionStorage
          sessionStorage.clear()
        } catch (storageError) {
          console.warn('Error clearing storage:', storageError)
          // Continuar con el logout aunque falle la limpieza
        }
      }
      
      // Hacer logout con timeout para evitar que se cuelgue
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      })

      try {
        const result = await Promise.race([signOutPromise, timeoutPromise])
        const { error } = result as { error: any }
        
        if (error) {
          console.warn('Supabase signOut error:', error)
          // Continuar con el logout local aunque falle el servidor
        }
      } catch (raceError) {
        console.warn('Logout timeout or error:', raceError)
        // Continuar con el logout local aunque falle
      }
      
      // Redirigir inmediatamente sin esperar
      if (typeof window !== 'undefined') {
        // Usar replace para evitar que el usuario pueda volver atrás
        window.location.replace('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Aún así, redirigir al login
      if (typeof window !== 'undefined') {
        window.location.replace('/login')
      }
    } finally {
      // No establecer isLoading a false aquí porque estamos redirigiendo
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0]
          }
        }
      })
      if (error) throw error
      if (data.user) {
        showSuccess('Registro exitoso', '¡Bienvenido a Lo Que Falta!')
        await fetchProfile(data.user.id)
      }
    } catch (error) {
      console.error('Sign up failed:', error)
      showError('Error de registro', 'No se pudo crear la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
      showSuccess('Perfil actualizado', 'Tu perfil ha sido actualizado exitosamente')
      await fetchProfile(user.id)
    } catch (error) {
      console.error('Error updating profile:', error)
      showError('Error al actualizar perfil', 'No se pudo actualizar tu perfil')
    }
  }

  const resetPassword = async (email: string) => {
    try {
      // Verificar que el email sea válido
      if (!email || !email.includes('@')) {
        throw new Error('Por favor ingresa un email válido')
      }

      // Verificar que Supabase esté configurado
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('La configuración de autenticación no está disponible')
      }

      // Usar la ruta correcta basada en lo que existe en la app
      const redirectUrl = `${window.location.origin}/reset-password-simple`
      
      console.log('Enviando email de recuperación a:', email)
      console.log('URL de redirección:', redirectUrl)
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      // Agregar timeout para evitar que se quede colgado
      const resetPasswordPromise = supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      })
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('La solicitud tardó demasiado. Verifica tu conexión a internet.')), 15000)
      })

      let result
      try {
        result = await Promise.race([resetPasswordPromise, timeoutPromise]) as { data: any, error: any }
      } catch (raceError) {
        console.error('Error en Promise.race:', raceError)
        
        // Si es un error de timeout o de red
        if (raceError instanceof Error) {
          if (raceError.message.includes('timeout') || raceError.message.includes('tardó demasiado')) {
            throw new Error('La solicitud tardó demasiado. Verifica tu conexión a internet e intenta nuevamente.')
          } else if (raceError.message.includes('Failed to fetch') || raceError.message.includes('NetworkError') || raceError.message.includes('ERR_FAILED')) {
            // Diagnosticar el problema
            console.error('Error de red detectado. Verificando configuración...')
            console.error('Supabase URL configurada:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
            console.error('Supabase Key configurada:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
            
            // Verificar si hay service workers activos
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then((registrations) => {
                if (registrations.length > 0) {
                  console.warn(`⚠️ Hay ${registrations.length} service worker(s) activo(s) que podrían estar interceptando peticiones`)
                }
              })
            }
            
            throw new Error('Error de conexión. Verifica tu conexión a internet y que Supabase esté disponible. Si el problema persiste, verifica la configuración de Supabase en el dashboard.')
          }
        }
        throw raceError
      }

      const { data, error } = result

      console.log('Respuesta de resetPasswordForEmail:', { data, error })

      if (error) {
        console.error('Error de Supabase al enviar email:', error)
        console.error('Detalles del error:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        
        // Proporcionar mensajes de error más específicos
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          throw new Error('Demasiados intentos. Por favor espera unos minutos antes de intentar nuevamente.')
        } else if (error.message.includes('email') || error.message.includes('not found') || error.message.includes('does not exist')) {
          throw new Error('El email no está registrado en nuestro sistema.')
        } else if (error.message.includes('disabled') || error.message.includes('not enabled')) {
          throw new Error('El envío de emails está deshabilitado. Por favor contacta al administrador.')
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Error de conexión. Verifica tu conexión a internet y que Supabase esté disponible. Si el problema persiste, verifica la configuración de Supabase en el dashboard.')
        } else {
          throw new Error(error.message || 'No se pudo enviar el email de recuperación')
        }
      }

      // Si la respuesta es exitosa, el email se envió
      console.log('Email de recuperación enviado exitosamente')
      showSuccess(
        'Email enviado', 
        'Revisa tu bandeja de entrada (y la carpeta de spam) para restablecer tu contraseña'
      )
    } catch (error) {
      console.error('Error sending reset email:', error)
      
      let errorMessage = 'No se pudo enviar el email de recuperación'
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Manejar errores de red específicamente
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('ERR_FAILED')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet y que Supabase esté disponible. Si el problema persiste, verifica la configuración de Supabase en el dashboard.'
        } else if (error.message.includes('timeout') || error.message.includes('tardó demasiado')) {
          errorMessage = 'La solicitud tardó demasiado. Verifica tu conexión a internet e intenta nuevamente.'
        }
      }
      
      showError('Error', errorMessage)
      throw error
    }
  }

  const value = {
    user,
    session,
    profile,
    login,
    loginWithGoogle,
    loginWithApple,
    logout,
    signUp,
    updateProfile,
    resetPassword,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}