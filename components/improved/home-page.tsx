"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, ShoppingCart, Loader2 } from "lucide-react"
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants/categories"
import { useRouter } from "next/navigation"
import { useCategoryView } from "@/lib/hooks/use-shopping-store"
import { useToast } from "@/lib/hooks/use-toast"
import { CategoryCard } from "@/components/optimized/category-card"
import { EmptyState, LoadingOverlay } from "@/components/loading-states"
import { ErrorBoundary } from "@/components/error-boundary"
import type { Category } from "@/lib/types/database"

type ViewState = "home" | { type: "category"; category: Category }

export function HomePage() {
  const router = useRouter()
  const [viewState, setViewState] = useState<ViewState>("home")
  const { loading, error, getCategoryStats, clearError } = useCategoryView()
  const { showError } = useToast()

  // Manejar errores
  useEffect(() => {
    if (error) {
      showError('Error', 'No se pudieron cargar los productos')
      clearError()
    }
  }, [error, showError, clearError])

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

  const handleCategoryClick = (category: Category) => {
    setViewState({ type: "category", category })
  }

  const handleBackToHome = () => {
    setViewState("home")
  }

  // Si estamos en la vista de categoría, mostramos los ítems
  if (typeof viewState === "object" && viewState.type === "category") {
    const categoryKey = Object.entries(CATEGORIES).find(([_, value]) => value === viewState.category)?.[0];
    const categoryConfig = categoryKey ? CATEGORY_CONFIG[viewState.category as keyof typeof CATEGORY_CONFIG] : null;
    const { items, completedCount, totalCount, isLoading } = getCategoryStats(viewState.category);
    
    return (
      <div className="p-4">
        <button 
          onClick={handleBackToHome}
          className="mb-4 text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors"
          aria-label="Volver a categorías"
        >
          ← Volver a categorías
        </button>
        
        <h1 className="text-2xl font-bold mb-6">
          {categoryConfig?.name || 'Categoría'}
        </h1>
        
        <LoadingOverlay isLoading={isLoading}>
          <div className="space-y-2" role="list">
            {items.length === 0 ? (
              <EmptyState
                title="No hay ítems en esta categoría"
                description="Los productos aparecerán aquí cuando los agregues"
              />
            ) : (
              items.map((item) => (
                <div 
                  key={item.id}
                  className="p-3 border rounded-lg flex items-center justify-between hover:bg-accent/10 transition-colors"
                  role="listitem"
                >
                  <span className={`${item.completed ? 'line-through text-muted-foreground' : ''} flex-1`}>
                    {item.name}
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
    )
  }

  // Vista principal de categorías
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Lista de Compras</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        {Object.entries(CATEGORIES).map(([key, value]) => {
          const { completedCount, totalCount, isLoading } = getCategoryStats(value as Category);
          
          return (
            <CategoryCard
              key={key}
              category={value as Category}
              completedCount={completedCount}
              totalCount={totalCount}
              isLoading={isLoading}
              onClick={handleCategoryClick}
            />
          )
        })}
      </div>

      <Button
        onClick={() => router.push("/lists")}
        className="w-full h-14 text-lg font-semibold cursor-pointer shadow-md bg-primary hover:bg-primary/90 mb-8 active:scale-95 transition-all"
        size="lg"
        aria-label="Gestionar listas de compras"
      >
        <Plus className="w-5 h-5 mr-2" />
        Gestionar Listas
      </Button>

      {/* Características */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Múltiples Categorías</h3>
            <p className="text-sm text-muted-foreground">Organiza por tipo de tienda</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
            <Plus className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Planificación Mensual</h3>
            <p className="text-sm text-muted-foreground">Este mes o el próximo</p>
          </div>
        </div>
      </div>
    </div>
  )
}
