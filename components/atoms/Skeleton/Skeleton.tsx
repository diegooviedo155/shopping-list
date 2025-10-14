import React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
  variant?: 'default' | 'card' | 'text' | 'circular'
  width?: string | number
  height?: string | number
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', width, height, ...props }, ref) => {
    const baseClasses = 'animate-pulse bg-muted rounded'
    
    const variantClasses = {
      default: 'h-4 w-full',
      card: 'h-48 w-full rounded-lg',
      text: 'h-4 w-3/4',
      circular: 'h-16 w-16 rounded-full'
    }

    const style = {
      ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
      ...(height && { height: typeof height === 'number' ? `${height}px` : height })
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          className
        )}
        style={style}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'
