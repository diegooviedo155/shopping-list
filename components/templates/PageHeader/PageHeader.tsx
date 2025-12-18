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
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
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
            
            <h1 className="flex-1 text-lg font-semibold text-foreground capitalize">{title}</h1>
            
            {progress && (
              <div className="flex items-center gap-1 flex-col">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{progress.current}/{progress.total} completados</span>
                  {progress.label && <span>• {progress.label}</span>}
                </div>
                <ProgressBar
                  value={progress.current}
                  max={progress.total}
                  size="sm"
                  className="w-20"
                />
              </div>
            )}
            
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
          
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>
      </header>
    )
  }
)

PageHeader.displayName = 'PageHeader'
