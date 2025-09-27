import React from 'react'
import { Badge as RadixBadge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.ComponentProps<typeof RadixBadge> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'custom'
  color?: string
  backgroundColor?: string
  borderColor?: string
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    variant = 'default',
    color,
    backgroundColor,
    borderColor,
    className,
    style,
    ...props 
  }, ref) => {
    const customStyle = variant === 'custom' ? {
      backgroundColor,
      color,
      borderColor,
      ...style
    } : style

    return (
      <RadixBadge
        ref={ref}
        variant={variant === 'custom' ? 'secondary' : variant}
        className={cn(
          variant === 'custom' && 'border-0',
          className
        )}
        style={customStyle}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'
