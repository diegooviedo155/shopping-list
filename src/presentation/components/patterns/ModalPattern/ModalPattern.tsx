import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '../../atoms'
import { cn } from '@/lib/utils'

export interface ModalPatternProps {
  children: React.ReactNode
  trigger?: React.ReactNode
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  variant?: 'default' | 'destructive'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

export const ModalPattern = React.forwardRef<HTMLDivElement, ModalPatternProps>(
  ({ 
    children,
    trigger,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    variant = 'default',
    open,
    onOpenChange,
    size = 'md',
    className
  }, ref) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && (
          <DialogTrigger asChild>
            {trigger}
          </DialogTrigger>
        )}
        
        <DialogContent
          ref={ref}
          className={cn(
            sizeClasses[size],
            className
          )}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          
          <div className="py-4">
            {children}
          </div>
          
          {(onConfirm || onCancel) && (
            <DialogFooter>
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                >
                  {cancelText}
                </Button>
              )}
              {onConfirm && (
                <Button
                  variant={variant === 'destructive' ? 'destructive' : 'default'}
                  onClick={onConfirm}
                >
                  {confirmText}
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    )
  }
)

ModalPattern.displayName = 'ModalPattern'
