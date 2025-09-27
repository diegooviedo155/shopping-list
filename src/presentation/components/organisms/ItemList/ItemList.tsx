import React from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { ItemCard } from '../ItemCard'
import { EmptyState } from '@/components/loading-states'
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
    const handleDragEnd = (result: any) => {
      if (!result.destination || !onReorder) return

      const sourceIndex = result.source.index
      const destIndex = result.destination.index

      if (sourceIndex === destIndex) return

      onReorder(activeTab, sourceIndex, destIndex)
    }

    const dragDropProps = onReorder ? { onDragEnd: handleDragEnd } : {}

    return (
      <div ref={ref} className={cn('space-y-3 min-h-[200px]', className)}>
        <DragDropContext {...dragDropProps}>
          <Droppable droppableId="shopping-items">
            {(provided, snapshot) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef} 
                className={cn(
                  'space-y-3',
                  snapshot.isDraggingOver && 'bg-accent/5 rounded-lg p-2'
                )}
                role="list"
                aria-label={`Lista de productos para ${activeTab}`}
              >
                {items.length === 0 ? (
                  <EmptyState
                    title={`No hay productos para ${activeTab}`}
                    description="Agrega algunos productos usando el formulario de arriba"
                  />
                ) : (
                  items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <ItemCard
                            item={item}
                            isDragging={snapshot.isDragging}
                            showDragHandle={!!onReorder}
                            onToggleCompleted={onToggleCompleted}
                            onMoveToStatus={onMoveToStatus}
                            onDelete={onDelete}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    )
  }
)

ItemList.displayName = 'ItemList'
