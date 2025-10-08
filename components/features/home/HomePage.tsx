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
import { LoadingSpinner } from '@/components/loading-states'
import { ErrorBoundary } from '@/components/error-boundary'
import { AddProductModal } from '@/components/modals'
import { cn } from '@/lib/utils'
import { Plus, ShoppingCart, Settings, ShoppingBasket } from 'lucide-react'

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
  const { items, loading, error, getItemsByCategory, createItem, refetch } = useShoppingItemsSimple()
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

  const handleAddItem = async (data: { name: string; category: string; status: string }) => {
    try {
      await createItem(data.name, data.category, data.status)
      showError('Producto agregado exitosamente', 'success')
      refetch() // Refrescar la lista
    } catch (error) {
      showError('Error al agregar el producto', 'error')
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
              variant="outline"
              size="lg"
              onClick={handleGoToLists}
              className="gap-2 h-16 text-white"
            >
              <Settings className="w-4 h-4" />
              Lista de productos
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/admin/categories')}
              className="gap-2 h-16 text-white"
            >
              <ShoppingBasket className="w-4 h-4" />
              Gestionar Categorías
            </Button>
              <AddProductModal
                onAddItem={handleAddItem}
                isLoading={loading}
                trigger={
                  <Button
                    size="lg"
                    className="h-16 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
                  >
                    <Plus size={20} />
                    Agregar Producto
                  </Button>
                }
              />
              
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