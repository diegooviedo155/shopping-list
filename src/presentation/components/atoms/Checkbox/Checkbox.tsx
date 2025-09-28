import React from 'react'
import { Checkbox as ShadcnCheckbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useStableId } from '../../../hooks/use-stable-id'

export interface CheckboxProps extends React.ComponentProps<typeof ShadcnCheckbox> {
  label?: string
  description?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

const variantClasses = {
  default: '',
  success: 'data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600',
  warning: 'data-[state=checked]:bg-yellow-600 data-[state=checked]:border-yellow-600',
  error: 'data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600',
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ 
    label,
    description,
    error,
    size = 'md',
    variant = 'default',
    className,
    id,
    ...props 
  }, ref) => {
    const generatedId = useStableId('checkbox')
    const checkboxId = id || generatedId

    if (label || description) {
      return (
        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <ShadcnCheckbox
              ref={ref}
              id={checkboxId}
              className={cn(
                sizeClasses[size],
                variantClasses[variant],
                error && 'border-destructive',
                className
              )}
              {...props}
            />
            <div className="space-y-1">
              {label && (
                <label
                  htmlFor={checkboxId}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {label}
                </label>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      )
    }

    return (
      <ShadcnCheckbox
        ref={ref}
        className={cn(
          sizeClasses[size],
          variantClasses[variant],
          error && 'border-destructive',
          className
        )}
        {...props}
      />
    )
  }
)

Checkbox.displayName = 'Checkbox'
