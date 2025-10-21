"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from 'framer-motion'
import { Button, CategoryCardSkeleton } from '../../atoms'
import { CategoryCard } from '../../organisms'
import { SidebarLayout } from '../../sidebar-layout'
import { ProtectedRoute } from '../../auth/protected-route'
import { useHybridShoppingSimple as useHybridShopping } from '../../../hooks/use-hybrid-shopping-simple'
import { useToast } from '../../../hooks/use-toast'
import { useAuth } from '../../auth/auth-provider'
import { LoadingSpinner } from '@/components/loading-states'
import { ErrorBoundary } from '@/components/error-boundary'
import { ErrorHandler } from '@/components/error-handler'
import { AddProductModal } from '@/components/modals'
import { cn } from '@/lib/utils'
import { ITEM_STATUS } from '@/lib/constants/item-status'
import { formatCategoryForUI } from '@/lib/constants/categories'
import { Plus, ShoppingCart, Settings, ShoppingBasket, Users } from 'lucide-react'
import { ShareListButton, AccessRequestsPanel } from '../../shared-lists'

export function HomePage() {
      const router = useRouter()
      const { 
        items, 
        categories, 
        loading, 
        error, 
        itemsByCategory, 
        addItem, 
        refetch, 
        clearError,
        activeSharedList,
        sharedListItems,
        sharedListLoading
      } = useHybridShopping()
      const { showError, showSuccess } = useToast()
      const [isHydrated, setIsHydrated] = useState(false)
      const { user, isLoading: authLoading } = useAuth()
      const [showAccessRequestsPanel, setShowAccessRequestsPanel] = useState(false)

  // Manejar hidratación
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Forzar inicialización si no hay categorías
  useEffect(() => {
    if (isHydrated && categories.length === 0 && !loading) {
      refetch(true)
    }
  }, [isHydrated, categories.length, loading, refetch])



  // Manejar errores
  useEffect(() => {
    if (error) {
      showError('Error', 'No se pudieron cargar los productos')
    }
  }, [error])

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/categories/${categoryId}`)
  }

  const handleGoToLists = () => {
    router.push('/lists')
  }

  const handleAddItem = async (data: { name: string; categoryId: string; status: string }) => {
    try {
      await addItem(data.name, data.categoryId, data.status)
      showSuccess('Producto agregado exitosamente', 'El producto se ha agregado a tu lista')
    } catch (error) {
      showError('Error al agregar el producto', 'No se pudo agregar el producto a la lista')
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando productos...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <ErrorHandler error={error} onClearError={clearError} />
        <SidebarLayout>
        <div>
          {/* Indicador de Lista Compartida */}
          {activeSharedList && (
            <motion.div
              className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Lista Compartida: {activeSharedList.name}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {activeSharedList.description || 'Colaborando en tiempo real'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Categories Grid */}
          <div>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
                    {loading ? (
                      // Mostrar skeletons mientras cargan las categorías
                      Array.from({ length: 6 }).map((_, index) => (
                        <motion.div
                          key={`skeleton-${index}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <CategoryCardSkeleton />
                        </motion.div>
                      ))
                    ) : categories.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No hay categorías disponibles</p>
                      </div>
                    ) : (
                      (() => {
                        const activeCategories = categories.filter(cat => cat.isActive !== false) // Show all categories if isActive is undefined
                        const sortedCategories = activeCategories.sort((a, b) => a.orderIndex - b.orderIndex)
                        return sortedCategories.map((category, index) => {
                  const formattedCategory = formatCategoryForUI(category)
                  // Calcular estadísticas de items por categoría (solo este mes)
                  const allCategoryItems = itemsByCategory(category.slug)
                  const categoryItems = allCategoryItems.filter(item => item.status === ITEM_STATUS.THIS_MONTH)
                  
                  const completedCount = categoryItems.filter(item => item.completed).length
                  const totalCount = categoryItems.length
                  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0





                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <CategoryCard
                        category={formattedCategory}
                        itemCount={totalCount}
                        completedCount={completedCount}
                        progress={progress}
                              isLoading={!isHydrated || loading}
                        onClick={() => handleCategoryClick(category.slug)}
                      />
                    </motion.div>
                  )
                })
                      })()
                    )}
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="outline"
                size="lg"
                onClick={handleGoToLists}
                className="cursor-pointer gap-2 h-16 text-white"
              >
                <ShoppingBasket className="w-4 h-4" />

                Gestionar productos
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/admin/categories')}
                className="cursor-pointer gap-2 h-16 text-white"
              >
                <Settings className="w-4 h-4" />
                Gestionar Categorías
              </Button>
              <ShareListButton 
                listName="Mi Lista Personal"
                className="cursor-pointer h-16"
              />
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowAccessRequestsPanel(true)}
                className="cursor-pointer gap-2 h-16 text-white"
              >
                <Users className="w-4 h-4" />
                Solicitudes de Acceso
              </Button>
              <AddProductModal
                onAddItem={handleAddItem}
                isLoading={loading}
                trigger={
                  <Button
                    size="lg"
                    className="cursor-pointer h-16 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
                  >
                    <Plus size={20} />
                    Agregar Producto
                  </Button>
                }
              />

            </motion.div>
          </div>

          {/* Stats */}
          <div>
            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {items.filter(item => item.status === ITEM_STATUS.THIS_MONTH).length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Este Mes
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-2xl font-bold text-green-500 mb-1">
                    {items.filter(item => item.status === ITEM_STATUS.THIS_MONTH && item.completed).length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Completados
                  </div>
                </div>

                      <div className="bg-card border border-border rounded-lg p-6">
                        <div className="text-2xl font-bold text-orange-500 mb-1">
                          {isHydrated ? categories.filter(cat => cat.isActive).length : 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Categorías
                        </div>
                      </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Panel de solicitudes de acceso */}
        <AccessRequestsPanel
          isOpen={showAccessRequestsPanel}
          onClose={() => setShowAccessRequestsPanel(false)}
        />
        </SidebarLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}