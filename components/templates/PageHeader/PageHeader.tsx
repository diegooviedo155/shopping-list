import React from 'react'
import { Button, Icon } from '../../atoms'
import { ProgressBar } from '../../molecules'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  onBack?: () => void
  progress?: {
    current: number
    total: number
    label?: string
  }
  actions?: React.ReactNode
  className?: string
}

export const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({ 
    title, 
    subtitle, 
    showBackButton = false,
    onBack,
    progress,
    actions,
    className 
  }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'bg-card border-b border-border px-4 py-4 sticky top-0 z-10',
          className
        )}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              aria-label="Volver"
            >
              <Icon icon={ArrowLeft} size="sm" />
            </Button>
          )}
          
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
            
            {progress && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <span>{progress.current}/{progress.total} completados</span>
                  {progress.label && <span>• {progress.label}</span>}
                </div>
                <ProgressBar
                  value={progress.current}
                  max={progress.total}
                  size="sm"
                  className="max-w-24"
                />
              </div>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </header>
    )
  }
)

PageHeader.displayName = 'PageHeader'
