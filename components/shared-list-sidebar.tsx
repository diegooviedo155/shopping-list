"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Menu, Home, ShoppingCart, User, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'

interface SharedListSidebarProps {
  listName?: string
  ownerName?: string
}

export function SharedListSidebar({ listName = "Lista Compartida", ownerName = "Usuario" }: SharedListSidebarProps) {
  const [open, setOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user, logout, isLoading } = useAuth()

  const handleLogout = async () => {
    if (isLoggingOut || isLoading) return // Prevenir múltiples clics
    setIsLoggingOut(true)
    try {
      await logout()
      // El logout ya maneja la redirección
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
              </SheetHeader>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 p-4 border-b">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <h2 className="font-semibold text-sm">Lista de {ownerName}</h2>
              <p className="text-xs text-muted-foreground truncate">{listName}</p>
            </div>
          </div>

          {/* Navegación */}
          <div className="flex-1 p-4">
            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Mi Lista Principal
                </Link>
              </Button>
            </nav>
          </div>

          {/* Footer con información del usuario */}
          {user && (
            <div className="p-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">Invitado</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
