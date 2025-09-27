import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface LoadingIndicatorProps {
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export const LoadingIndicator = React.forwardRef<HTMLDivElement, LoadingIndicatorProps>(
  ({ 
    isLoading = false,
    size = 'md',
    variant = 'spinner',
    className 
  }, ref) => {
    if (!isLoading) return null

    const spinnerVariants = {
      animate: {
        rotate: 360,
        transition: {
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }
      }
    }

    const dotsVariants = {
      animate: {
        scale: [1, 1.2, 1],
        transition: {
          duration: 0.6,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      }
    }

    const pulseVariants = {
      animate: {
        scale: [1, 1.1, 1],
        opacity: [0.7, 1, 0.7],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }
      }
    }

    if (variant === 'spinner') {
      return (
        <motion.div
          ref={ref}
          className={cn(
            'border-2 border-primary border-t-transparent rounded-full',
            sizeClasses[size],
            className
          )}
          variants={spinnerVariants}
          animate="animate"
        />
      )
    }

    if (variant === 'dots') {
      return (
        <div ref={ref} className={cn('flex space-x-1', className)}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                'bg-primary rounded-full',
                size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
              )}
              variants={dotsVariants}
              animate="animate"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      )
    }

    if (variant === 'pulse') {
      return (
        <motion.div
          ref={ref}
          className={cn(
            'bg-primary rounded-full',
            sizeClasses[size],
            className
          )}
          variants={pulseVariants}
          animate="animate"
        />
      )
    }

    return null
  }
)

LoadingIndicator.displayName = 'LoadingIndicator'
