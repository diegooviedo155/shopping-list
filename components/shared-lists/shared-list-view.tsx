"use client"

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Circle, ShoppingCart, Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useRealtimeSharedList, type SharedListItem } from '@/hooks/use-realtime-shared-list'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/loading-spinner'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { PullToRefreshIndicator } from '@/components/pull-to-refresh-indicator'
import { haptics } from '@/lib/utils/haptics'

interface SharedListViewProps {
  ownerId: string
  ownerName: string
}

interface CategoryGroup {
  categoryId: string | null
  categoryName: string
  color: string
  items: SharedListItem[]
}

const DEFAULT_COLOR = '#6366f1'

/**
 * Vista de lista compartida con soporte de tiempo real.
 *
 * Muestra los items del propietario agrupados por categoría.
 * Permite a los miembros tildar/destildar items.
 * Los cambios se propagan al instante a todos los colaboradores via Realtime Broadcast.
 */
export function SharedListView({ ownerId, ownerName }: SharedListViewProps) {
  const { items, loading, error, isConnected, toggleItem, refetch, lastUpdatedAt } =
    useRealtimeSharedList(ownerId)
  const { showError } = useToast()

  const { pullDistance, isRefreshing, wrapperProps: pullProps } = usePullToRefresh({
    onRefresh: async () => {
      haptics.light()
      await refetch()
    },
  })

  // Agrupar items por categoría
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const groups = new Map<string, CategoryGroup>()

    for (const item of items) {
      const key = item.category_id ?? 'sin-categoria'
      const cat = item.categories

      if (!groups.has(key)) {
        groups.set(key, {
          categoryId: item.category_id,
          categoryName: cat?.name ?? 'Sin categoría',
          color: cat?.color ?? DEFAULT_COLOR,
          items: [],
        })
      }
      groups.get(key)!.items.push(item)
    }

    // Ordenar items dentro de cada grupo: pendientes primero, completados al fondo
    for (const group of groups.values()) {
      group.items.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        return a.order_index - b.order_index
      })
    }

    return Array.from(groups.values())
  }, [items])

  const totalCount = items.length
  const completedCount = items.filter((i) => i.completed).length

  const handleToggle = async (itemId: string) => {
    haptics.light()
    try {
      await toggleItem(itemId)
    } catch {
      haptics.error()
      showError('Error', 'No se pudo actualizar el item. Inténtalo de nuevo.')
    }
  }

  if (loading) return <LoadingSpinner title="Cargando lista..." />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-destructive text-sm">{error}</p>
        <Button variant="outline" onClick={refetch} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6" {...pullProps}>
      {/* Pull-to-refresh indicator */}
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />

      {/* Header: progreso + estado de conexión */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Lista de {ownerName}</h2>
          <p className="text-sm text-muted-foreground">
            {completedCount} de {totalCount} productos completados
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Indicador de conexión Realtime */}
          <Badge
            variant="outline"
            className={cn(
              'gap-1.5 text-xs',
              isConnected ? 'border-green-500 text-green-600' : 'border-orange-400 text-orange-500'
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                En vivo
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                Reconectando
              </>
            )}
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            title="Actualizar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Barra de progreso */}
      {totalCount > 0 && (
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / totalCount) * 100}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
        </div>
      )}

      {/* Lista vacía */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <ShoppingCart className="w-10 h-10 opacity-40" />
          <p className="text-sm">La lista está vacía</p>
        </div>
      )}

      {/* Grupos por categoría */}
      <div className="space-y-6">
        {categoryGroups.map((group) => (
          <div key={group.categoryId ?? 'none'}>
            {/* Cabecera de categoría */}
            <div
              className="flex items-center gap-2 mb-3 py-1.5 px-3 rounded-lg"
              style={{
                backgroundColor: `${group.color}18`,
                borderLeft: `3px solid ${group.color}`,
              }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: group.color }}
              >
                {group.categoryName}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {group.items.filter((i) => i.completed).length}/{group.items.length}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-2 ml-2">
              <AnimatePresence initial={false}>
                {group.items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border bg-card',
                      'transition-colors cursor-pointer select-none',
                      'hover:bg-accent/50 active:scale-[0.98]',
                      item.completed && 'opacity-50'
                    )}
                    onClick={() => handleToggle(item.id)}
                  >
                    {/* Checkbox visual */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                        item.completed
                          ? 'border-green-500 bg-green-500'
                          : 'border-muted-foreground'
                      )}
                    >
                      {item.completed && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      )}
                    </div>

                    {/* Nombre */}
                    <span
                      className={cn(
                        'flex-1 text-sm font-medium capitalize',
                        item.completed && 'line-through text-muted-foreground'
                      )}
                    >
                      {item.name}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Última actualización */}
      {lastUpdatedAt && (
        <p className="text-center text-xs text-muted-foreground pt-4">
          Actualizado{' '}
          {lastUpdatedAt.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  )
}
