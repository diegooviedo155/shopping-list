'use client'

import { CategoryManagement } from '@/components/category-management'
import { SidebarLayout } from '@/components/sidebar-layout'
import { useRouter } from 'next/navigation'

export default function CategoriesAdminPage() {
  const router = useRouter()

  const handleBack = () => {
    router.push('/')
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
