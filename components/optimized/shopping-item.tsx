"use client"

import { memo, useCallback } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { GripVertical, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_CONFIG } from '@/lib/constants/categories'
import { ITEM_STATUS, ITEM_STATUS_LABELS } from '@/lib/constants/item-status'
import type { ShoppingItem, ItemStatus } from '@/lib/types/database'

interface ShoppingItemProps {
  item: ShoppingItem
  index: number
  activeTab: ItemStatus
  onToggleCompleted: (id: string) => void
  onMoveToStatus: (id: string, status: ItemStatus) => void
  onDelete: (id: string) => void
  isDragging?: boolean
}

export const ShoppingItemComponent = memo(function ShoppingItemComponent({
  item,
  index,
  activeTab,
  onToggleCompleted,
  onMoveToStatus,
  onDelete,
  isDragging = false,
}: ShoppingItemProps) {
  const handleToggleCompleted = useCallback(() => {
    onToggleCompleted(item.id)
  }, [item.id, onToggleCompleted])

  const handleMoveToStatus = useCallback(() => {
    const newStatus = activeTab === ITEM_STATUS.THIS_MONTH 
      ? ITEM_STATUS.NEXT_MONTH as ItemStatus
      : ITEM_STATUS.THIS_MONTH as ItemStatus
    onMoveToStatus(item.id, newStatus)
  }, [item.id, activeTab, onMoveToStatus])

  const handleDelete = useCallback(() => {
    onDelete(item.id)
  }, [item.id, onDelete])

  const categoryConfig = CATEGORY_CONFIG[item.category as keyof typeof CATEGORY_CONFIG]
  const oppositeStatus = activeTab === ITEM_STATUS.THIS_MONTH 
    ? ITEM_STATUS.NEXT_MONTH as ItemStatus
    : ITEM_STATUS.THIS_MONTH as ItemStatus

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
            {item.name}
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
            aria-label={`Mover a ${ITEM_STATUS_LABELS[oppositeStatus]}`}
          >
            {ITEM_STATUS_LABELS[oppositeStatus]}
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
