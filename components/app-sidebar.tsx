"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  Home,
  List,
  ShoppingCart,
  LogOut,
  Plus,
  Key,
  Users,
  UserPlus,
  ExternalLink,
  User
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Inicio",
      url: "/",
      icon: Home,
    },
    {
      title: "Lista de Compras",
      url: "/lists",
      icon: List,
    },
    {
      title: "Listas Compartidas",
      url: "/shared-lists",
      icon: Users,
    },
    {
      title: "Categorías",
      url: "/admin/categories",
      icon: ShoppingCart,
    },
  ],
  navConfig: [
    {
      title: "Editar Perfil",
      url: "/profile",
      icon: User,
    },
    {
      title: "Cambiar Contraseña",
      url: "/change-password-simple",
      icon: Key,
    },
  ],
}

interface SharedList {
  id: string
  list_owner_id: string
  list_name: string
  owner_email: string
  owner_name: string
  granted_at: string
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, profile, logout } = useAuth()
  const router = useRouter()
  const [sharedLists, setSharedLists] = useState<SharedList[]>([])
  const [loadingSharedLists, setLoadingSharedLists] = useState(false)

  // Cargar listas compartidas
  useEffect(() => {
    const loadSharedLists = async () => {
      if (!user) return
      
      setLoadingSharedLists(true)
      try {
        const response = await fetch('/api/shared-lists/my-access', {
          credentials: 'include'
        })
        const data = await response.json()
        
        if (response.ok) {
          setSharedLists(data.sharedLists || [])
        }
      } catch (error) {
        console.error('Error loading shared lists:', error)
      } finally {
        setLoadingSharedLists(false)
      }
    }

    loadSharedLists()
  }, [user])

  const handleLogout = async () => {
    await logout()
    // El logout ya maneja la redirección
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ShoppingCart className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Lo Que Falta</span>
            <span className="truncate text-xs">Lista de Compras</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>


            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Acciones</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/lists">
                    <Plus className="size-4" />
                    <span>Agregar Producto</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sección de Listas Compartidas */}
        {sharedLists.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Listas Compartidas</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sharedLists.map((sharedList) => (
                  <SidebarMenuItem key={sharedList.id}>
                    <SidebarMenuButton asChild>
                      <Link 
                        href={`/shared-list/${sharedList.list_owner_id}?list=${encodeURIComponent(sharedList.list_name)}`}
                        className="flex items-center justify-between w-full"
                      >
                        <div className="flex items-center gap-2">
                          <UserPlus className="size-4" />
                          <span className="truncate">
                            Lista de {sharedList.owner_name}
                          </span>
                        </div>
                        <ExternalLink className="size-3 opacity-50" />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Configuración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navConfig.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter>
        {/* Información del usuario - Solo en web (al final) */}
        <div className="px-2 py-4 border-b border-sidebar-border">
          <div className="text-sm font-semibold text-white">
            {profile?.full_name || user?.email?.split('@')[0] || 'Usuario'}
          </div>
          <div className="text-xs text-white/70 truncate">
            {user?.email || 'usuario@ejemplo.com'}
          </div>
        </div>
        
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="size-4" />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
