import { CategoryManagement } from '@/components/category-management'
import { AdminNav } from '@/components/admin-nav'

export default function CategoriesAdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="container mx-auto py-8 px-4">
        <CategoryManagement />
      </div>
    </div>
  )
}
