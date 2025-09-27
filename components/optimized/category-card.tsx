"use client"

import { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_CONFIG } from '@/lib/constants/categories'
import type { Category } from '@/lib/types/database'

interface CategoryCardProps {
  category: Category
  completedCount: number
  totalCount: number
  isLoading: boolean
  onClick: (category: Category) => void
  className?: string
}

export const CategoryCard = memo(function CategoryCard({
  category,
  completedCount,
  totalCount,
  isLoading,
  onClick,
  className,
}: CategoryCardProps) {
  const handleClick = useCallback(() => {
    onClick(category)
  }, [category, onClick])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(category)
    }
  }, [category, onClick])

  const categoryConfig = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]

  return (
    <div
      className={cn(
        "bg-card shadow-md rounded-lg p-4 text-center border border-border cursor-pointer hover:bg-accent/10 active:scale-95 transition-all",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Ver productos de ${categoryConfig.name}`}
    >
      <div
        className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg"
        style={{ 
          backgroundColor: categoryConfig.color,
          boxShadow: `0 4px 12px ${categoryConfig.color}40`
        }}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        ) : (
          <ShoppingCart className="w-5 h-5 text-white" />
        )}
      </div>
      <p className="text-sm font-medium text-foreground">
        {categoryConfig.name}
      </p>
      <p className="text-xs text-muted-foreground">
        {isLoading ? '...' : totalCount > 0 ? `${completedCount} de ${totalCount}` : 'Sin ítems'}
      </p>
    </div>
  )
})
