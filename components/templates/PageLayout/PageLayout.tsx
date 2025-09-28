import React from 'react'
import { cn } from '@/lib/utils'

export interface PageLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
}

export const PageLayout = React.forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ 
    children, 
    header, 
    footer, 
    className,
    maxWidth = 'md'
  }, ref) => {
    return (
      <div className="min-h-screen bg-background">
        {header}
        
        <main 
          ref={ref}
          className={cn(
            'mx-auto px-4 py-6',
            maxWidthClasses[maxWidth],
            className
          )}
        >
          {children}
        </main>
        
        {footer}
      </div>
    )
  }
)

PageLayout.displayName = 'PageLayout'
