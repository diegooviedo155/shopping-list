"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FloatingActionButtonProps {
  onClick?: () => void
  children?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  variant?: 'default' | 'destructive'
  disabled?: boolean
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-14 h-14',
  lg: 'w-16 h-16',
}

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
}

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
}

const variantClasses = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
}

export const FloatingActionButton = React.forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(({
  onClick,
  children,
  className,
  size = 'md',
  position = 'bottom-right',
  variant = 'default',
  disabled = false,
  ...props
}, ref) => {
  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'fixed z-50 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center',
        sizeClasses[size],
        positionClasses[position],
        variantClasses[variant],
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      {...props}
    >
      {children || (
        <Plus className={cn('text-current', iconSizes[size])} />
      )}
    </motion.button>
  )
})

FloatingActionButton.displayName = 'FloatingActionButton'
