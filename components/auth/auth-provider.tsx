'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loginWithGoogle: () => Promise<void>
  loginWithApple: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Aquí iría la llamada a tu API de autenticación
      // Por ahora simulamos un login exitoso
      const mockUser: User = {
        id: '1',
        name: 'Usuario Demo',
        email: email,
        avatar: undefined
      }
      
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      // Aquí iría la llamada a tu API de registro
      // Por ahora simulamos un registro exitoso
      const mockUser: User = {
        id: '1',
        name: name,
        email: email,
        avatar: undefined
      }
      
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
    } catch (error) {
      console.error('Register error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const loginWithGoogle = async () => {
    setIsLoading(true)
    try {
      // Aquí iría la integración con Google OAuth
      console.log('Google login not implemented yet')
      // Por ahora simulamos un login exitoso
      const mockUser: User = {
        id: '1',
        name: 'Usuario Google',
        email: 'user@gmail.com',
        avatar: undefined
      }
      
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
    } catch (error) {
      console.error('Google login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithApple = async () => {
    setIsLoading(true)
    try {
      // Aquí iría la integración con Apple Sign In
      console.log('Apple login not implemented yet')
      // Por ahora simulamos un login exitoso
      const mockUser: User = {
        id: '1',
        name: 'Usuario Apple',
        email: 'user@icloud.com',
        avatar: undefined
      }
      
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
    } catch (error) {
      console.error('Apple login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      loginWithGoogle,
      loginWithApple
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
