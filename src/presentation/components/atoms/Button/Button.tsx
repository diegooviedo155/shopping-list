import React from 'react'
import { Button as RadixButton } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ComponentProps<typeof RadixButton> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
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
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <RadixButton
        ref={ref}
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
      </RadixButton>
    )
  }
)

Button.displayName = 'Button'
