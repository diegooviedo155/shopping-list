"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button, Icon } from '../../atoms'
import { CategoryCard } from '../../organisms'
import { PageLayout } from '../../templates'
import { useShoppingItems } from '../../../hooks/use-shopping-items'
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

  // Manejar errores
  useEffect(() => {
    if (error) {
      showError('Error', 'No se pudieron cargar los productos')
    }
  }, [error, showError])

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
        <div className="p-4">
          <button 
            onClick={handleBackToHome}
            className="mb-4 text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors"
            aria-label="Volver a categorías"
          >
            ← Volver a categorías
          </button>
          
          <h1 className="text-2xl font-bold mb-6">
            {category?.name || 'Categoría'}
          </h1>
          
          <LoadingOverlay isLoading={stats.isLoading}>
            <div className="space-y-2" role="list">
              {stats.total === 0 ? (
                <div className="text-center py-12">
                  <Icon icon={ShoppingCart} size="xl" className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay ítems en esta categoría</h3>
                  <p className="text-muted-foreground">Los productos aparecerán aquí cuando los agregues</p>
                </div>
              ) : (
                getItemsByCategory(viewState.category).map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 border rounded-lg flex items-center justify-between hover:bg-accent/10 transition-colors"
                    role="listitem"
                  >
                    <span className={`${item.completed ? 'line-through text-muted-foreground' : ''} flex-1`}>
                      {item.name.getValue()}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                          item.completed 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}
                        aria-label={item.completed ? 'Completado' : 'Pendiente'}
                      >
                        {item.completed ? '✓' : '○'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </LoadingOverlay>
        </div>
      </PageLayout>
    )
  }

  // Vista principal de categorías
  return (
    <ErrorBoundary>
      <PageLayout>
        <div className="p-4 max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">Lista de Compras</h1>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            {CATEGORIES.map((category) => {
              const stats = getCategoryStats(category.id)
              
              return (
                <CategoryCard
                  key={category.id}
                  category={category}
                  stats={stats}
                  onClick={handleCategoryClick}
                />
              )
            })}
          </div>

          <Button
            onClick={() => router.push("/lists")}
            className="w-full h-14 text-lg font-semibold cursor-pointer shadow-md bg-primary hover:bg-primary/90 mb-8 active:scale-95 transition-all"
            size="lg"
            leftIcon={<Icon icon={Plus} size="md" />}
            aria-label="Gestionar listas de compras"
          >
            Gestionar Listas
          </Button>

          {/* Características */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                <Icon icon={ShoppingCart} size="md" className="text-accent" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Múltiples Categorías</h3>
                <p className="text-sm text-muted-foreground">Organiza por tipo de tienda</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                <Icon icon={Plus} size="md" className="text-accent" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Planificación Mensual</h3>
                <p className="text-sm text-muted-foreground">Este mes o el próximo</p>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </ErrorBoundary>
  )
}
