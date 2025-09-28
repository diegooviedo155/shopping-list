import React, { useState, useEffect, useCallback } from 'react'
import { IonicSwipeItem } from '../IonicSwipeItem'
import { LoadingIndicator } from '../../atoms'
import { UpdateStatus, PendingChangesIndicator } from '../../molecules'
import { EmptyState } from '@/components/loading-states'
import { useFramerMotion } from '../../../hooks/use-framer-motion'
import { cn } from '@/lib/utils'
import { ShoppingItem } from '../../../../core/domain/entities/ShoppingItem'

export interface ItemListProps {
  items: ShoppingItem[]
  activeTab: string
  isLoading?: boolean
  onToggleCompleted?: (id: string) => void
  onMoveToStatus?: (id: string, status: string) => void
  onDelete?: (id: string) => void
  onReorder?: (status: string, sourceIndex: number, destIndex: number) => void
  className?: string
}

export const ItemList = React.forwardRef<HTMLDivElement, ItemListProps>(
  ({ 
    items,
    activeTab,
    isLoading = false,
    onToggleCompleted,
    onMoveToStatus,
    onDelete,
    onReorder,
    className 
  }, ref) => {
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle')

    const handleReorder = useCallback(async (newItems: ShoppingItem[]) => {
      if (!onReorder) return
      
      // Encontrar el índice de los elementos que cambiaron
      const changedItems = newItems.map((item, newIndex) => {
        const oldIndex = items.findIndex(oldItem => oldItem.id === item.id)
        return { item, oldIndex, newIndex }
      }).filter(({ oldIndex, newIndex }) => oldIndex !== newIndex)

      // Si hay cambios, llamar al callback de reorder
      if (changedItems.length > 0) {
        const firstChange = changedItems[0]
        await onReorder(activeTab, firstChange.oldIndex, firstChange.newIndex)
      }
    }, [onReorder, activeTab, items])

    const { 
      items: localItems, 
      ReorderGroup, 
      ReorderItem, 
      isDragging, 
      isUpdating, 
      hasChanges, 
      pendingCount, 
      forceSave 
    } = useFramerMotion({
      initialItems: items,
      onReorder: handleReorder,
      axis: 'y', // Solo vertical
      layoutScroll: true,
      optimisticUpdate: true,
      debounceMs: 30000 // 30 segundos
    })

    return (
      <div ref={ref} className={cn('space-y-3 min-h-[200px]', className)}>
        {localItems.length === 0 ? (
          <EmptyState
            title={`No hay productos para ${activeTab}`}
            description="Agrega algunos productos usando el formulario de arriba"
          />
        ) : (
          <div className="relative">
            <ReorderGroup
              className={cn(
                'space-y-3',
                isDragging && 'bg-accent/5 rounded-lg p-2',
                isUpdating && 'opacity-75'
              )}
              role="list"
              aria-label={`Lista de productos para ${activeTab}`}
            >
              {localItems.map((item) => (
                <ReorderItem
                  key={item.id}
                  value={item}
                  className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                >
                  <IonicSwipeItem
                    item={item}
                    onToggleCompleted={onToggleCompleted}
                    onMoveToStatus={onMoveToStatus}
                    onDelete={onDelete}
                    onMoveToNextMonth={(id) => onMoveToStatus?.(id, 'proximo-mes')}
                  />
                </ReorderItem>
              ))}
            </ReorderGroup>
            
            <div className="absolute top-4 right-4 z-10">
              <UpdateStatus 
                status={updateStatus}
                message={
                  updateStatus === 'updating' ? 'Actualizando orden...' :
                  updateStatus === 'success' ? 'Orden actualizado' :
                  updateStatus === 'error' ? 'Error al actualizar' :
                  undefined
                }
                className="bg-background/80 backdrop-blur-sm"
              />
            </div>
          </div>
        )}
        
        {/* Indicador de cambios pendientes */}
        <PendingChangesIndicator
          hasChanges={hasChanges}
          pendingCount={pendingCount}
          isSaving={isUpdating}
          onForceSave={forceSave}
        />
      </div>
    )
  }
)

ItemList.displayName = 'ItemList'
