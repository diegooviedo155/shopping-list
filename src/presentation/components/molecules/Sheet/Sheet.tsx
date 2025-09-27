import React from 'react'
import {
  Sheet as ShadcnSheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '../../atoms'
import { cn } from '@/lib/utils'

export interface SheetProps {
  children: React.ReactNode
  trigger?: React.ReactNode
  title?: string
  description?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
}

export const Sheet = React.forwardRef<HTMLDivElement, SheetProps>(
  ({ 
    children,
    trigger,
    title,
    description,
    side = 'right',
    size = 'md',
    className,
    open,
    onOpenChange,
    ...props 
  }, ref) => {
    return (
      <ShadcnSheet open={open} onOpenChange={onOpenChange}>
        {trigger && (
          <SheetTrigger asChild>
            {trigger}
          </SheetTrigger>
        )}
        
        <SheetContent
          ref={ref}
          side={side}
          className={cn(
            sizeClasses[size],
            className
          )}
          {...props}
        >
          {(title || description) && (
            <SheetHeader>
              {title && <SheetTitle>{title}</SheetTitle>}
              {description && <SheetDescription>{description}</SheetDescription>}
            </SheetHeader>
          )}
          
          <div className="mt-6">
            {children}
          </div>
        </SheetContent>
      </ShadcnSheet>
    )
  }
)

Sheet.displayName = 'Sheet'
