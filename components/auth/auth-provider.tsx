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
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      }

      setIsLoading(false)
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }

        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
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

      if (data.user) {
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
    setIsLoading(true)
    try {
      // Limpiar el store antes de hacer logout
      if (typeof window !== 'undefined') {
        // Limpiar localStorage
        localStorage.removeItem('unified-shopping-store')
        localStorage.removeItem('supabase-shopping-store')
        
        // Limpiar sessionStorage
        sessionStorage.clear()
      }
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setSession(null)
      setProfile(null)
      
      showSuccess('Sesión cerrada', 'Has cerrado sesión exitosamente')
      
      // Redirigir después de limpiar todo
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    } catch (error) {
      console.error('Logout failed:', error)
      showError('Error al cerrar sesión', 'No se pudo cerrar sesión')
    } finally {
      setIsLoading(false)
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      showSuccess('Email enviado', 'Revisa tu bandeja de entrada para restablecer tu contraseña')
    } catch (error) {
      console.error('Error sending reset email:', error)
      showError('Error', 'No se pudo enviar el email de recuperación')
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