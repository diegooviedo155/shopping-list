"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from 'framer-motion'
import { Button } from '../../atoms'
import { CategoryCard } from '../../organisms'
import { PageLayout } from '../../templates'
import { usePageTransitions } from '../../../hooks'
import { useShoppingItemsSimple } from '../../../hooks'
import { useToast } from '../../../hooks/use-toast'
import { LoadingOverlay } from '@/components/loading-states'
import { ErrorBoundary } from '@/components/error-boundary'
import { cn } from '@/lib/utils'
import { Plus, ShoppingCart } from 'lucide-react'

const CATEGORIES = [
  {
    id: 'supermercado',
    name: 'Supermercado',
    color: '#10b981',
    icon: '🛒',
  },
  {
    id: 'verduleria',
    name: 'Verdulería',
    color: '#f59e0b',
    icon: '🥬',
  },
  {
    id: 'carniceria',
    name: 'Carnicería',
    color: '#0891b2',
    icon: '🥩',
  },
  {
    id: 'panaderia',
    name: 'Panadería',
    color: '#8b5cf6',
    icon: '🍞',
  },
  {
    id: 'farmacia',
    name: 'Farmacia',
    color: '#10b981',
    icon: '💊',
  },
  {
    id: 'otro',
    name: 'Otro',
    color: '#6b7280',
    icon: '📦',
  },
]

export function HomePage() {
  const router = useRouter()
  const { items, loading, error, getItemsByCategory } = useShoppingItemsSimple()
  const { showError } = useToast()
  const { StaggerContainer, StaggerItem } = usePageTransitions()

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

  if (loading) {
    return <LoadingOverlay isLoading={true}>Cargando productos...</LoadingOverlay>
  }

  return (
    <ErrorBoundary>
      <PageLayout>
        <StaggerContainer>
          {/* Header */}
          <StaggerItem>
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Listas de Compras
              </h1>
              <p className="text-muted-foreground text-lg">
                Organiza tus compras por categoría
              </p>
            </motion.div>
          </StaggerItem>

          {/* Categories Grid */}
          <StaggerItem>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {CATEGORIES.map((category, index) => {
                const categoryItems = getItemsByCategory(category.id)
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
                      category={category}
                      itemCount={totalCount}
                      completedCount={completedCount}
                      progress={progress}
                      onClick={() => handleCategoryClick(category.id)}
                    />
                  </motion.div>
                )
              })}
            </motion.div>
          </StaggerItem>

          {/* Action Buttons */}
          <StaggerItem>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={handleGoToLists}
                size="lg"
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <ShoppingCart size={20} />
                Ver Todas las Listas
              </Button>
              
              <Button
                onClick={handleGoToLists}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Plus size={20} />
                Agregar Producto
              </Button>
            </motion.div>
          </StaggerItem>

          {/* Stats */}
          <StaggerItem>
            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {items.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Productos
                  </div>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-2xl font-bold text-green-500 mb-1">
                    {items.filter(item => item.completed).length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Completados
                  </div>
                </div>
                
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-2xl font-bold text-orange-500 mb-1">
                    {CATEGORIES.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Categorías
                  </div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>
      </PageLayout>
    </ErrorBoundary>
  )
}