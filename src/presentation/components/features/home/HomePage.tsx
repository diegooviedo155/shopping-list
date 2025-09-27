"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Icon } from '../../atoms'
import { CategoryCard } from '../../organisms'
import { PageLayout } from '../../templates'
import { useShoppingItems, usePageTransitions } from '../../../hooks'
import { useToast } from '../../../hooks/use-toast'
import { LoadingOverlay } from '@/components/loading-states'
import { ErrorBoundary } from '@/components/error-boundary'
import { cn } from '@/lib/utils'
import { Plus, ShoppingCart } from 'lucide-react'

type ViewState = "home" | { type: "category"; category: string }

const CATEGORIES = [
  {
    id: 'supermercado',
    name: 'Supermercado',
    color: '#10b981',
  },
  {
    id: 'verduleria',
    name: 'Verdulería',
    color: '#f59e0b',
  },
  {
    id: 'carniceria',
    name: 'Carnicería',
    color: '#0891b2',
  },
]

export function HomePage() {
  const router = useRouter()
  const [viewState, setViewState] = useState<ViewState>("home")
  const { items, loading, error, getItemsByCategory } = useShoppingItems()
  const { showError } = useToast()
  const { StaggerContainer, StaggerItem } = usePageTransitions()

  // Manejar errores
  useEffect(() => {
    if (error) {
      showError('Error', 'No se pudieron cargar los productos')
    }
  }, [error])

  // Manejar el botón de retroceso del navegador
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.location.pathname === '/') {
        setViewState("home")
      }
    }

    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  const handleCategoryClick = (categoryId: string) => {
    setViewState({ type: "category", category: categoryId })
  }

  const handleBackToHome = () => {
    setViewState("home")
  }

  const getCategoryStats = (categoryId: string) => {
    const categoryItems = getItemsByCategory(categoryId)
    const completedCount = categoryItems.filter(item => item.completed).length
    const totalCount = categoryItems.length
    
    return {
      completed: completedCount,
      total: totalCount,
      isLoading: loading && totalCount === 0,
    }
  }

  // Si estamos en la vista de categoría, mostramos los ítems
  if (typeof viewState === "object" && viewState.type === "category") {
    const category = CATEGORIES.find(cat => cat.id === viewState.category)
    const stats = getCategoryStats(viewState.category)
    
    return (
      <PageLayout>
        <motion.div 
          className="p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button 
            onClick={handleBackToHome}
            className="mb-4 text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors"
            aria-label="Volver a categorías"
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Volver a categorías
          </motion.button>
          
          <motion.h1 
            className="text-2xl font-bold mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {category?.name || 'Categoría'}
          </motion.h1>
          
          <LoadingOverlay isLoading={stats.isLoading}>
            <StaggerContainer>
              {stats.total === 0 ? (
                <StaggerItem>
                  <div className="text-center py-12">
                    <Icon icon={ShoppingCart} size="xl" className="text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No hay ítems en esta categoría</h3>
                    <p className="text-muted-foreground">Los productos aparecerán aquí cuando los agregues</p>
                  </div>
                </StaggerItem>
              ) : (
                <div className="space-y-2" role="list">
                  <AnimatePresence mode="popLayout">
                    {getItemsByCategory(viewState.category).map((item, index) => (
                      <StaggerItem key={item.id}>
                        <motion.div 
                          className="p-3 border rounded-lg flex items-center justify-between hover:bg-accent/10 transition-colors"
                          role="listitem"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className={`${item.completed ? 'line-through text-muted-foreground' : ''} flex-1`}>
                            {item.name.getValue()}
                          </span>
                          <div className="flex items-center space-x-2">
                            <motion.div
                              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                                item.completed 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                              aria-label={item.completed ? 'Completado' : 'Pendiente'}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {item.completed ? '✓' : '○'}
                            </motion.div>
                          </div>
                        </motion.div>
                      </StaggerItem>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </StaggerContainer>
          </LoadingOverlay>
        </motion.div>
      </PageLayout>
    )
  }

  // Vista principal de categorías
  return (
    <ErrorBoundary>
      <PageLayout>
        <motion.div 
          className="p-4 max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1 
            className="text-2xl font-bold mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Lista de Compras
          </motion.h1>
          
          <StaggerContainer>
            <StaggerItem>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {CATEGORIES.map((category, index) => {
                  const stats = getCategoryStats(category.id)
                  
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <CategoryCard
                        category={category}
                        stats={stats}
                        onClick={handleCategoryClick}
                      />
                    </motion.div>
                  )
                })}
              </div>
            </StaggerItem>

            <StaggerItem>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => router.push("/lists")}
                  className="w-full h-14 text-lg font-semibold cursor-pointer shadow-md bg-primary hover:bg-primary/90 mb-8 active:scale-95 transition-all"
                  size="lg"
                  leftIcon={<Icon icon={Plus} size="md" />}
                  aria-label="Gestionar listas de compras"
                >
                  Gestionar Listas
                </Button>
              </motion.div>
            </StaggerItem>

            {/* Características */}
            <StaggerItem>
              <div className="space-y-4">
                <motion.div 
                  className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border"
                  whileHover={{ scale: 1.02, x: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div 
                    className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon icon={ShoppingCart} size="md" className="text-accent" />
                  </motion.div>
                  <div>
                    <h3 className="font-medium text-foreground">Múltiples Categorías</h3>
                    <p className="text-sm text-muted-foreground">Organiza por tipo de tienda</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border"
                  whileHover={{ scale: 1.02, x: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <motion.div 
                    className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon icon={Plus} size="md" className="text-accent" />
                  </motion.div>
                  <div>
                    <h3 className="font-medium text-foreground">Planificación Mensual</h3>
                    <p className="text-sm text-muted-foreground">Este mes o el próximo</p>
                  </div>
                </motion.div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </motion.div>
      </PageLayout>
    </ErrorBoundary>
  )
}
