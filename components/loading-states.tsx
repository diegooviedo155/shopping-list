"use client"

import { Loader2, ShoppingCart, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)} 
    />
  )
}

interface LoadingCardProps {
  className?: string
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn('p-4 border rounded-lg animate-pulse', className)}>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-muted rounded" />
        <div className="w-4 h-4 bg-muted rounded" />
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="w-8 h-8 bg-muted rounded" />
      </div>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      {icon || <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />}
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  message?: string
}

export function LoadingOverlay({ isLoading, children, message = 'Cargando...' }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className="h-4 bg-muted rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

interface CategoryLoadingCardProps {
  className?: string
}

export function CategoryLoadingCard({ className }: CategoryLoadingCardProps) {
  return (
    <div className={cn('bg-card shadow-md rounded-lg p-4 text-center border border-border', className)}>
      <div className="w-10 h-10 rounded-full mx-auto mb-2 bg-muted animate-pulse" />
      <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-1 animate-pulse" />
      <div className="h-3 bg-muted rounded w-1/2 mx-auto animate-pulse" />
    </div>
  )
}
