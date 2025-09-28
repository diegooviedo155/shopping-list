"use client"

import { memo, useCallback } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { GripVertical, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ShoppingItem } from '../../../../core/domain/entities/ShoppingItem'
import { ItemStatus } from '../../../../core/domain/value-objects/ItemStatus'
import { Category } from '../../../../core/domain/value-objects/Category'

interface ShoppingItemComponentProps {
  item: ShoppingItem
  index: number
  activeTab: string
  onToggleCompleted: (id: string) => void
  onMoveToStatus: (id: string, status: string) => void
  onDelete: (id: string) => void
  isDragging?: boolean
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

export const ShoppingItemComponent = memo(function ShoppingItemComponent({
  item,
  index,
  activeTab,
  onToggleCompleted,
  onMoveToStatus,
  onDelete,
  isDragging = false,
}: ShoppingItemComponentProps) {
  const handleToggleCompleted = useCallback(() => {
    onToggleCompleted(item.id)
  }, [item.id, onToggleCompleted])

  const handleMoveToStatus = useCallback(() => {
    const newStatus = activeTab === 'este-mes' ? 'proximo-mes' : 'este-mes'
    onMoveToStatus(item.id, newStatus)
  }, [item.id, activeTab, onMoveToStatus])

  const handleDelete = useCallback(() => {
    onDelete(item.id)
  }, [item.id, onDelete])

  const categoryValue = item.category.getValue()
  const statusValue = item.status.getValue()
  const categoryConfig = CATEGORY_CONFIG[categoryValue as keyof typeof CATEGORY_CONFIG]
  const oppositeStatus = activeTab === 'este-mes' ? 'proximo-mes' : 'este-mes'

  return (
    <Card
      className={cn(
        "p-4 transition-all duration-200",
        isDragging && "shadow-lg rotate-2",
        item.completed && "opacity-60",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4" />
        </div>

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
          <Badge
            variant="secondary"
            className="text-xs mt-1 border-0"
            style={{
              backgroundColor: `${categoryConfig.color}15`,
              color: categoryConfig.color,
              border: `1px solid ${categoryConfig.color}30`,
            }}
          >
            {categoryConfig.name}
          </Badge>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMoveToStatus}
            className="text-xs px-2"
            aria-label={`Mover a ${STATUS_LABELS[oppositeStatus as keyof typeof STATUS_LABELS]}`}
          >
            {STATUS_LABELS[oppositeStatus as keyof typeof STATUS_LABELS]}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
            aria-label="Eliminar producto"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
})
