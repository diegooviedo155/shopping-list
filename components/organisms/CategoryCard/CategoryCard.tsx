import React from 'react'
import { Card, Icon } from '../../atoms'
import { ProgressBar } from '../../molecules'
import { cn } from '@/lib/utils'
import { ShoppingCart, Loader2 } from 'lucide-react'

export interface CategoryCardProps {
  category: {
    id: string
    name: string
    color: string
    icon?: string
  }
  itemCount: number
  completedCount: number
  progress: number
  isLoading?: boolean
  onClick?: (categoryId: string) => void
  className?: string
}

export const CategoryCard = React.forwardRef<HTMLDivElement, CategoryCardProps>(
  ({ 
    category,
    itemCount,
    completedCount,
    progress,
    isLoading = false,
    onClick,
    className 
  }, ref) => {

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
          'p-3 text-center gap-1 cursor-pointer hover:bg-accent/10 active:scale-95 transition-all',
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Ver productos de ${category.name}`}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg"
          style={{ 
            backgroundColor: category.color,
            boxShadow: `0 4px 12px ${category.color}40`
          }}
        >
          {isLoading ? (
            <Icon icon={Loader2} size="lg" className="text-white animate-spin" />
          ) : category.icon ? (
            <span className="text-2xl">{category.icon}</span>
          ) : (
            <Icon icon={ShoppingCart} size="lg" className="text-white" />
          )}
        </div>
        
        <h3 className="text-md font-semibold text-foreground mb-2">
          {category.name}
        </h3>
        
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {isLoading ? '...' : itemCount > 0 ? `${completedCount} de ${itemCount}` : 'Sin ítems'}
          </p>
          
          {itemCount > 0 && (
            <ProgressBar
              value={progress}
              max={100}
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
