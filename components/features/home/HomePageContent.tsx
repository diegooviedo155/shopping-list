"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from 'framer-motion'
import { Button, CategoryCardSkeleton } from '../../atoms'
import { CategoryCard } from '../../organisms'
import { useHybridShoppingSimple as useHybridShopping } from '../../../hooks/use-hybrid-shopping-simple'
import { useToast } from '../../../hooks/use-toast'
import { useAuth } from '../../auth/auth-provider'
import { LoadingSpinner } from '@/components/loading-states'
import { ErrorBoundary } from '@/components/error-boundary'
import { ErrorHandler } from '@/components/error-handler'
import { AddProductModal } from '@/components/modals'
import { cn } from '@/lib/utils'
import { ITEM_STATUS, ITEM_STATUS_LABELS, ItemStatusType } from '@/lib/constants/item-status'
import { formatCategoryForUI } from '@/lib/constants/categories'
import { Plus, ShoppingCart, Settings, ShoppingBasket, Users } from 'lucide-react'
import { ShareListButton, AccessRequestsPanel } from '../../shared-lists'

interface HomePageContentProps {
  ownerId?: string // ID del propietario de la lista compartida
  isSharedView?: boolean // Si es true, oculta botones de gestión
}

export function HomePageContent({ ownerId, isSharedView = false }: HomePageContentProps = {}) {
  const router = useRouter()
  const { user, profile } = useAuth()
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
  const [showAccessPanel, setShowAccessPanel] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Estados para lista compartida
  const [sharedItems, setSharedItems] = useState<any[]>([])
  const [sharedCategories, setSharedCategories] = useState<any[]>([])
  const [sharedLoading, setSharedLoading] = useState(false)
  const [sharedLoaded, setSharedLoaded] = useState(false)

  // Manejar hidratación
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Cargar items del propietario si es una lista compartida
  useEffect(() => {
    const loadSharedItems = async () => {
      if (!ownerId || !isSharedView || sharedLoaded) return

      setSharedLoading(true)
      try {
        // Cargar items del propietario usando el API de listas compartidas
        const itemsResponse = await fetch(`/api/shared-lists/${ownerId}/items`, {
          credentials: 'include'
        })

        // Cargar categorías
        const categoriesResponse = await fetch('/api/categories', {
          credentials: 'include'
        })

        if (!itemsResponse.ok) {
          throw new Error('Error al cargar items de la lista compartida')
        }

        const itemsData = await itemsResponse.json()
        const categoriesData = await categoriesResponse.json()

        setSharedItems(itemsData)
        setSharedCategories(categoriesData)
        setSharedLoaded(true)
      } catch (error) {
        console.error('Error loading shared list items:', error)
        showError('Error', 'No se pudieron cargar los items de la lista compartida')
      } finally {
        setSharedLoading(false)
      }
    }

    loadSharedItems()
  }, [ownerId, isSharedView, sharedLoaded])

  // Forzar inicialización si no hay categorías (solo en modo normal, no compartido)
  useEffect(() => {
    if (!isSharedView && isHydrated && categories.length === 0 && !loading) {
      refetch(true)
    }
  }, [isSharedView, isHydrated, categories.length, loading, refetch])

  // Mostrar loading mientras se hidrata
  if (!isHydrated || !user) {
    return <LoadingSpinner />
  }

  // Mostrar error si hay uno
  if (error) {
    return <ErrorHandler error={error} onClearError={() => clearError()} />
  }

  // Mostrar loading mientras cargan los datos
  if (loading || sharedLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Usar datos compartidos si estamos en modo vista compartida
  const displayItems = isSharedView ? sharedItems : items
  const displayCategories = isSharedView ? sharedCategories : categories

  // Calcular estadísticas
  const completedCount = displayItems.filter(item => item.status === 'completado').length
  const totalCount = displayItems.length

  // Función para manejar el clic en categoría
  const handleCategoryClick = (categorySlug: string) => {
    router.push(`/categories/${categorySlug}`)
  }

  // Función para manejar agregar producto
  const handleAddProduct = () => {
    // Esta función se puede personalizar según el contexto
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-6">
        {/* Grid de categorías */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {displayCategories.map((category) => {
            // Filtrar items por categoría
            const categoryItems = displayItems.filter(item => item.category_id === category.id)
            const completedInCategory = categoryItems.filter(item => item.status === 'completado').length

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <CategoryCard
                  category={formatCategoryForUI(category)}
                  itemCount={categoryItems.length}
                  completedCount={completedInCategory}
                  progress={categoryItems.length > 0 ? (completedInCategory / categoryItems.length) * 100 : 0}
                  onClick={isSharedView ? undefined : () => handleCategoryClick(category.slug)}
                />
              </motion.div>
            )
          })}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-4 mb-8">
          {!isSharedView && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push('/lists')}
                className="gap-2"
              >
                <ShoppingBasket className="w-4 h-4" />
                Gestionar productos
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/categories')}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Gestionar Categorías
              </Button>
              <ShareListButton
                listName={`Lista de ${profile?.full_name || user?.email?.split('@')[0] || 'Usuario'}`}
                className="cursor-pointer h-16"
              />
              <Button
                variant="outline"
                onClick={() => setShowAccessPanel(true)}
                className="gap-2"
              >
                <Users className="w-4 h-4" />
                Gestionar Acceso
              </Button>
              <Button
                onClick={handleAddProduct}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                Agregar Producto
              </Button>
            </>

          )}

        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card p-6 rounded-lg border">
            <div className="text-2xl font-bold text-orange-500">{totalCount}</div>
            <p className="text-sm text-muted-foreground">Este Mes</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="text-2xl font-bold text-green-500">{completedCount}</div>
            <p className="text-sm text-muted-foreground">Completados</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="text-2xl font-bold text-blue-500">{displayCategories.length}</div>
            <p className="text-sm text-muted-foreground">Categorías</p>
          </div>
        </div>

        {/* Lista de productos por estado */}
        <div className="space-y-6">
          {Object.values(ITEM_STATUS).map((status) => {
            const statusItems = items.filter(item => item.status === status)

            if (statusItems.length === 0) return null

            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-card p-6 rounded-lg border"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  {ITEM_STATUS_LABELS[status as ItemStatusType]}
                  <span className="text-sm text-muted-foreground">
                    ({statusItems.length} productos)
                  </span>
                </h3>
                <div className="space-y-2">
                  {statusItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className={cn(
                          "font-medium",
                          item.completed && "line-through text-muted-foreground"
                        )}>
                          {item.name}
                        </p>
                        {item.category && (
                          <p className="text-sm text-muted-foreground">
                            {categories.find(cat => cat.slug === item.category)?.name || item.category}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.completed ? 'Completado' : 'Pendiente'}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lista vacía</h3>
            <p className="text-muted-foreground mb-4">
              Comienza agregando algunos productos a tu lista de compras.
            </p>
            <Button onClick={handleAddProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Producto
            </Button>
          </div>
        )}
      </div>

      {/* Floating Action Button con Modal - Solo visible en la lista propia */}
      {!isSharedView && (
        <AddProductModal
          onAddItem={async (data) => {
            try {
              await addItem(data.name, data.categoryId, data.status)
              showSuccess('Producto agregado', `${data.name} se agregó a la lista`)
            } catch (err) {
              showError('Error', 'No se pudo agregar el producto')
            }
          }}
          isLoading={loading}
          trigger={
            <Button
              size="lg"
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
            >
              <Plus className="w-6 h-6" />
            </Button>
          }
        />
      )}

      {/* Panel de gestión de acceso */}
      <AccessRequestsPanel
        isOpen={showAccessPanel}
        onClose={() => setShowAccessPanel(false)}
      />
    </ErrorBoundary>
  )
}
