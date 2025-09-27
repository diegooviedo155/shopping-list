import React from 'react'
import { Button } from '../../atoms'
import { cn } from '@/lib/utils'

export interface ButtonGroupOption {
  value: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface ButtonGroupProps {
  options: ButtonGroupOption[]
  value: string
  onChange: (value: string) => void
  variant?: 'default' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ 
    options, 
    value, 
    onChange, 
    variant = 'outline',
    size = 'sm',
    orientation = 'horizontal',
    className 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-2',
          orientation === 'vertical' && 'flex-col',
          className
        )}
        role="group"
        aria-label="Button group"
      >
        {options.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? 'default' : variant}
            size={size}
            onClick={() => onChange(option.value)}
            disabled={option.disabled}
            className="flex-1"
          >
            {option.icon && <span className="mr-2">{option.icon}</span>}
            {option.label}
          </Button>
        ))}
      </div>
    )
  }
)

ButtonGroup.displayName = 'ButtonGroup'
