import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '../../atoms'
import { Icon } from '../../atoms'
import { cn } from '@/lib/utils'
import { AlertTriangle, Trash2, Info } from 'lucide-react'

export interface ConfirmationDialogProps {
  children: React.ReactNode
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  onConfirm: () => void
  onCancel?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const variantConfig = {
  default: {
    icon: Info,
    confirmVariant: 'default' as const,
    confirmClassName: ''
  },
  destructive: {
    icon: Trash2,
    confirmVariant: 'destructive' as const,
    confirmClassName: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  },
  warning: {
    icon: AlertTriangle,
    confirmVariant: 'default' as const,
    confirmClassName: 'bg-yellow-600 text-white hover:bg-yellow-700'
  }
}

export const ConfirmationDialog = React.forwardRef<HTMLDivElement, ConfirmationDialogProps>(
  ({ 
    children,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'default',
    onConfirm,
    onCancel,
    open,
    onOpenChange,
    ...props 
  }, ref) => {
    const config = variantConfig[variant]

    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>
          {children}
        </AlertDialogTrigger>
        
        <AlertDialogContent ref={ref} {...props}>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                'rounded-full p-2',
                variant === 'destructive' && 'bg-destructive/10',
                variant === 'warning' && 'bg-yellow-100',
                variant === 'default' && 'bg-blue-100'
              )}>
                <Icon 
                  icon={config.icon} 
                  size="md"
                  className={cn(
                    variant === 'destructive' && 'text-destructive',
                    variant === 'warning' && 'text-yellow-600',
                    variant === 'default' && 'text-blue-600'
                  )}
                />
              </div>
              <div>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  {description}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className={cn(
                config.confirmClassName
              )}
            >
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
)

ConfirmationDialog.displayName = 'ConfirmationDialog'
