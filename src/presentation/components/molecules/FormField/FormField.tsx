import React from 'react'
import { Input, InputProps } from '../../atoms'
import { cn } from '@/lib/utils'

export interface FormFieldProps extends Omit<InputProps, 'error'> {
  label: string
  error?: string
  required?: boolean
  helperText?: string
  className?: string
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    label, 
    error, 
    required = false,
    helperText,
    className,
    ...inputProps 
  }, ref) => {
    return (
      <div className={cn('space-y-2', className)}>
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        
        <Input
          ref={ref}
          error={error}
          helperText={helperText}
          {...inputProps}
        />
      </div>
    )
  }
)

FormField.displayName = 'FormField'
