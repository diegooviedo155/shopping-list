import React from 'react'
import { Card } from '../Card'
import { Skeleton } from '../Skeleton'

export interface CategoryCardSkeletonProps {
  className?: string
}

export const CategoryCardSkeleton = React.forwardRef<HTMLDivElement, CategoryCardSkeletonProps>(
  ({ className }, ref) => {
    return (
      <Card
        ref={ref}
        className={`p-3 h-48 text-center gap-1 ${className}`}
      >
        {/* Icon skeleton */}
        <Skeleton
          variant="circular"
          className="w-16 h-16 mx-auto mb-4"
        />
        
        {/* Title skeleton */}
        <Skeleton
          variant="text"
          className="h-6 w-24 mx-auto mb-2"
        />
        
        {/* Stats skeleton */}
        <div className="space-y-3">
          <Skeleton
            variant="text"
            className="h-4 w-16 mx-auto"
          />
          
          {/* Progress bar skeleton */}
          <Skeleton
            variant="default"
            className="h-2 w-full"
          />
        </div>
      </Card>
    )
  }
)

CategoryCardSkeleton.displayName = 'CategoryCardSkeleton'
