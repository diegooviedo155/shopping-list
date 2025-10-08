"use client"

import React, { useState, useCallback } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface OptimisticCheckboxProps {
  checked: boolean
  onToggle: (id: string) => Promise<void>
  itemId: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function OptimisticCheckbox({
  checked,
  onToggle,
  itemId,
  disabled = false,
  className,
  'aria-label': ariaLabel
}: OptimisticCheckboxProps) {
  const [isOptimistic, setIsOptimistic] = useState(false)
  const [optimisticChecked, setOptimisticChecked] = useState(checked)
  const [hasError, setHasError] = useState(false)

  // Actualizar estado optimista cuando cambie el prop
  React.useEffect(() => {
    setOptimisticChecked(checked)
    setHasError(false)
  }, [checked])

  const handleToggle = useCallback(async () => {
    if (disabled || isOptimistic) return

    const newChecked = !optimisticChecked
    
    // Actualización optimista inmediata
    setIsOptimistic(true)
    setOptimisticChecked(newChecked)
    setHasError(false)

    try {
      // Llamar a la función de toggle en background
      await onToggle(itemId)
    } catch (error) {
      // Rollback en caso de error
      setOptimisticChecked(checked)
      setHasError(true)
      
      // Mostrar error temporalmente
      setTimeout(() => setHasError(false), 2000)
    } finally {
      setIsOptimistic(false)
    }
  }, [checked, optimisticChecked, onToggle, itemId, disabled, isOptimistic])

  return (
    <div className="relative">
      <Checkbox
        checked={optimisticChecked}
        onCheckedChange={handleToggle}
        disabled={disabled || isOptimistic}
        className={cn(
          "transition-all duration-200",
          hasError && "border-destructive bg-destructive/10",
          isOptimistic && "opacity-75",
          className
        )}
        aria-label={ariaLabel}
      />
      
      {/* Indicador de estado optimista */}
      {isOptimistic && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
      )}
      
      {/* Indicador de error */}
      {hasError && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
      )}
    </div>
  )
}
