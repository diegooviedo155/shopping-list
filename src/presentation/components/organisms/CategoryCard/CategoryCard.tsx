import React from 'react'
import { Card } from '@/components/ui/card'
import { Button, Icon } from '../../atoms'
import { ProgressBar } from '../../molecules'
import { cn } from '@/lib/utils'
import { ShoppingCart, Loader2 } from 'lucide-react'

export interface CategoryCardProps {
  category: {
    id: string
    name: string
    color: string
  }
  stats: {
    completed: number
    total: number
  }
  isLoading?: boolean
  onClick?: (categoryId: string) => void
  className?: string
}

export const CategoryCard = React.forwardRef<HTMLDivElement, CategoryCardProps>(
  ({ 
    category,
    stats,
    isLoading = false,
    onClick,
    className 
  }, ref) => {
    const { completed, total } = stats
    const progressPercentage = total > 0 ? (completed / total) * 100 : 0

    const handleClick = () => {
      onClick?.(category.id)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    }

    return (
      <Card
        ref={ref}
        className={cn(
          'p-4 text-center cursor-pointer hover:bg-accent/10 active:scale-95 transition-all',
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Ver productos de ${category.name}`}
      >
        <div
          className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg"
          style={{ 
            backgroundColor: category.color,
            boxShadow: `0 4px 12px ${category.color}40`
          }}
        >
          {isLoading ? (
            <Icon icon={Loader2} size="md" className="text-white animate-spin" />
          ) : (
            <Icon icon={ShoppingCart} size="md" className="text-white" />
          )}
        </div>
        
        <h3 className="text-sm font-medium text-foreground mb-2">
          {category.name}
        </h3>
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {isLoading ? '...' : total > 0 ? `${completed} de ${total}` : 'Sin ítems'}
          </p>
          
          {total > 0 && (
            <ProgressBar
              value={completed}
              max={total}
              size="sm"
              variant="default"
              className="w-full"
            />
          )}
        </div>
      </Card>
    )
  }
)

CategoryCard.displayName = 'CategoryCard'
