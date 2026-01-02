'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { useAuth } from './auth-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LogoutButton() {
  const { user, logout, isLoading } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!user) return null

  const handleLogout = async () => {
    if (isLoggingOut || isLoading) return // Prevenir múltiples clics
    setIsLoggingOut(true)
    try {
      await logout()
      // El logout ya maneja la redirección
    } catch (error) {
      console.error('Error en logout:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
          <User className="w-4 h-4 mr-2" />
          {user.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="text-red-600"
          disabled={isLoggingOut || isLoading}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isLoggingOut ? 'Cerrando...' : 'Logout'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
