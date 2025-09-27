import React from 'react'
import { Icon } from '../../atoms'
import { cn } from '@/lib/utils'
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'

export type StatusType = 'completed' | 'pending' | 'warning' | 'error'

export interface StatusIndicatorProps {
  status: StatusType
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    label: 'Completado'
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    label: 'Pendiente'
  },
  warning: {
    icon: AlertCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    label: 'Advertencia'
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    label: 'Error'
  }
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
}

export const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ 
    status, 
    label, 
    size = 'md',
    showLabel = false,
    className 
  }, ref) => {
    const config = statusConfig[status]
    const displayLabel = label || config.label

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2',
          className
        )}
      >
        <div className={cn(
          'rounded-full p-1',
          config.bgColor
        )}>
          <Icon
            icon={config.icon}
            size={size}
            className={config.color}
          />
        </div>
        
        {showLabel && (
          <span className="text-sm font-medium text-foreground">
            {displayLabel}
          </span>
        )}
      </div>
    )
  }
)

StatusIndicator.displayName = 'StatusIndicator'
