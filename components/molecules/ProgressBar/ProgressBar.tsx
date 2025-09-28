import React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  label?: string
  className?: string
}

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
}

const variantClasses = {
  default: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ 
    value, 
    max = 100, 
    size = 'md',
    variant = 'default',
    showLabel = false,
    label,
    className 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const displayLabel = label || `${Math.round(percentage)}%`

    return (
      <div className={cn('space-y-1', className)}>
        {showLabel && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{displayLabel}</span>
            <span>{value}/{max}</span>
          </div>
        )}
        
        <div
          ref={ref}
          className={cn(
            'w-full bg-muted rounded-full overflow-hidden',
            sizeClasses[size]
          )}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Progress: ${percentage}%`}
        >
          <div
            className={cn(
              'h-full transition-all duration-300 ease-in-out',
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'
