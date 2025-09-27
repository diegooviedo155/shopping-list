import React from 'react'
import { Button as ShadcnButton } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ComponentProps<typeof ShadcnButton> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    loading = false, 
    leftIcon, 
    rightIcon, 
    fullWidth = false,
    className,
    disabled,
    variant = 'default',
    size = 'default',
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <ShadcnButton
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </ShadcnButton>
    )
  }
)

Button.displayName = 'Button'