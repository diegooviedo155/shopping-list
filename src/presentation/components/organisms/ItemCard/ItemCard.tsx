import React from 'react'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button, Badge, Icon } from '../../atoms'
import { StatusIndicator } from '../../molecules'
import { cn } from '@/lib/utils'
import { GripVertical, Trash2, ArrowRight } from 'lucide-react'
import { ShoppingItem } from '../../../../core/domain/entities/ShoppingItem'

export interface ItemCardProps {
  item: ShoppingItem
  isDragging?: boolean
  showDragHandle?: boolean
  showStatus?: boolean
  showMoveButton?: boolean
  showDeleteButton?: boolean
  onToggleCompleted?: (id: string) => void
  onMoveToStatus?: (id: string, status: string) => void
  onDelete?: (id: string) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  className?: string
}

const CATEGORY_CONFIG = {
  supermercado: { name: 'Supermercado', color: '#10b981' },
  verduleria: { name: 'Verdulería', color: '#f59e0b' },
  carniceria: { name: 'Carnicería', color: '#0891b2' },
}

const STATUS_LABELS = {
  'este-mes': 'Este mes',
  'proximo-mes': 'Próximo mes',
}

export const ItemCard = React.forwardRef<HTMLDivElement, ItemCardProps>(
  ({ 
    item,
    isDragging = false,
    showDragHandle = true,
    showStatus = true,
    showMoveButton = true,
    showDeleteButton = true,
    onToggleCompleted,
    onMoveToStatus,
    onDelete,
    onDragStart,
    onDragEnd,
    className 
  }, ref) => {
    const categoryValue = item.category.getValue()
    const statusValue = item.status.getValue()
    const categoryConfig = CATEGORY_CONFIG[categoryValue as keyof typeof CATEGORY_CONFIG]
    const oppositeStatus = statusValue === 'este-mes' ? 'proximo-mes' : 'este-mes'

    const handleToggleCompleted = () => {
      onToggleCompleted?.(item.id)
    }

    const handleMoveToStatus = () => {
      onMoveToStatus?.(item.id, oppositeStatus)
    }

    const handleDelete = () => {
      onDelete?.(item.id)
    }

    return (
      <Card
        ref={ref}
        className={cn(
          'p-4 transition-all duration-200',
          isDragging && 'shadow-lg rotate-2',
          item.completed && 'opacity-60',
          className
        )}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex items-center gap-3">
          {showDragHandle && (
            <div className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
              <Icon icon={GripVertical} size="sm" />
            </div>
          )}

          <Checkbox 
            checked={item.completed} 
            onCheckedChange={handleToggleCompleted}
            aria-label={item.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
          />

          <div className="flex-1">
            <p className={cn(
              "font-medium",
              item.completed && "line-through text-muted-foreground"
            )}>
              {item.name.getValue()}
            </p>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="custom"
                backgroundColor={`${categoryConfig.color}15`}
                color={categoryConfig.color}
                borderColor={`${categoryConfig.color}30`}
                className="text-xs"
              >
                {categoryConfig.name}
              </Badge>
              
              {showStatus && (
                <StatusIndicator
                  status={item.completed ? 'completed' : 'pending'}
                  size="sm"
                />
              )}
            </div>
          </div>

          <div className="flex gap-1">
            {showMoveButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMoveToStatus}
                className="text-xs px-2"
                rightIcon={<Icon icon={ArrowRight} size="xs" />}
                aria-label={`Mover a ${STATUS_LABELS[oppositeStatus as keyof typeof STATUS_LABELS]}`}
              >
                {STATUS_LABELS[oppositeStatus as keyof typeof STATUS_LABELS]}
              </Button>
            )}

            {showDeleteButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
                aria-label="Eliminar producto"
                rightIcon={<Icon icon={Trash2} size="sm" />}
              />
            )}
          </div>
        </div>
      </Card>
    )
  }
)

ItemCard.displayName = 'ItemCard'
