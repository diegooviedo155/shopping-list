'use client'

import { CategoryManagement } from '@/components/category-management'
import { SidebarLayout } from '@/components/sidebar-layout'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/loading-spinner'

// Correo del administrador
const ADMIN_EMAIL = "diegooviedo155@gmail.com"

export default function CategoriesAdminPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Redirigir si no es admin
  useEffect(() => {
    if (!isLoading && user && user.email !== ADMIN_EMAIL) {
      router.push('/')
    }
  }, [user, isLoading, router])

  const handleBack = () => {
    router.push('/')
  }

  // Mostrar loading mientras se verifica
  if (isLoading) {
    return <LoadingSpinner title="Verificando permisos..." />
  }

  // Mostrar error si no es admin
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a esta página
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <SidebarLayout 
      title="Administración de Categorías"
      description="Gestiona las categorías de productos"
      showBackButton
      onBack={handleBack}
    >
      <CategoryManagement />
    </SidebarLayout>
  )
}
