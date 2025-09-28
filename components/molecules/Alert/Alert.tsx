import React from 'react'
import { Alert as ShadcnAlert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Icon } from '../../atoms'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

export interface AlertProps extends React.ComponentProps<typeof ShadcnAlert> {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
  title?: string
  description?: string
  showIcon?: boolean
  icon?: React.ReactNode
}

const variantConfig = {
  default: {
    icon: Info,
    className: 'border-border bg-background text-foreground'
  },
  destructive: {
    icon: AlertCircle,
    className: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive'
  },
  success: {
    icon: CheckCircle,
    className: 'border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600'
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600'
  },
  info: {
    icon: Info,
    className: 'border-blue-500/50 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-600'
  }
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ 
    variant = 'default',
    title,
    description,
    showIcon = true,
    icon,
    className,
    children,
    ...props 
  }, ref) => {
    const config = variantConfig[variant]
    const IconComponent = icon || config.icon

    return (
      <ShadcnAlert
        ref={ref}
        className={cn(
          config.className,
          className
        )}
        {...props}
      >
        {showIcon && (
          <IconComponent className="h-4 w-4" />
        )}
        
        <div className="flex-1">
          {title && (
            <AlertTitle className="mb-1">{title}</AlertTitle>
          )}
          
          {description && (
            <AlertDescription>{description}</AlertDescription>
          )}
          
          {children}
        </div>
      </ShadcnAlert>
    )
  }
)

Alert.displayName = 'Alert'
