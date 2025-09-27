import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LoadingIndicator, Icon } from '../../atoms'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export interface UpdateStatusProps {
  status: 'idle' | 'updating' | 'success' | 'error'
  message?: string
  className?: string
}

const statusConfig = {
  idle: {
    icon: null,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50'
  },
  updating: {
    icon: <LoadingIndicator isLoading={true} size="sm" variant="dots" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  success: {
    icon: <Icon icon={CheckCircle} size="sm" className="text-green-500" />,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  },
  error: {
    icon: <Icon icon={XCircle} size="sm" className="text-red-500" />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10'
  }
}

export const UpdateStatus = React.forwardRef<HTMLDivElement, UpdateStatusProps>(
  ({ status, message, className }, ref) => {
    const config = statusConfig[status]

    if (status === 'idle') return null

    return (
      <AnimatePresence>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
            config.color,
            config.bgColor,
            className
          )}
        >
          {config.icon}
          <span>{message || 'Actualizando...'}</span>
        </motion.div>
      </AnimatePresence>
    )
  }
)

UpdateStatus.displayName = 'UpdateStatus'
