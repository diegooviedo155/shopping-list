import React from 'react'
import { Card as ShadcnCard } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface CardProps extends React.ComponentProps<typeof ShadcnCard> {
  variant?: 'default' | 'outlined' | 'elevated' | 'flat'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    variant = 'default',
    padding = 'md',
    interactive = false,
    className,
    children,
    ...props 
  }, ref) => {
    return (
      <ShadcnCard
        ref={ref}
        className={cn(
          paddingClasses[padding],
          interactive && 'cursor-pointer hover:shadow-md transition-shadow',
          variant === 'outlined' && 'border-2',
          variant === 'elevated' && 'shadow-lg',
          variant === 'flat' && 'shadow-none border-0',
          className
        )}
        {...props}
      >
        {children}
      </ShadcnCard>
    )
  }
)

Card.displayName = 'Card'
