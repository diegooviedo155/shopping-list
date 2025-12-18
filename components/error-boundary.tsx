"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { saveErrorLog } from '@/lib/utils/error-logger'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Guardar error usando el logger
    saveErrorLog({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      type: 'boundary',
    })
    
    // También loguear en consola para desarrollo
    console.error('Error capturado por ErrorBoundary:', error)
    console.error('Error Info:', errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
      }

      return <ErrorDisplay error={this.state.error} onReset={this.resetError} />
    }

    return this.props.children
  }
}

// Componente funcional para mostrar el error con estado
function ErrorDisplay({ error, onReset }: { error?: Error; onReset: () => void }) {
  const [showDetails, setShowDetails] = React.useState(false)
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Alert className="max-w-2xl">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Algo salió mal</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-2">
            <p>{error?.message || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.'}</p>
            
            {showDetails && error && (
              <div className="mt-4 p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-64">
                <div className="mb-2 font-semibold">Stack Trace:</div>
                <pre className="whitespace-pre-wrap text-xs">
                  {error.stack || 'No stack trace disponible'}
                </pre>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="mt-2"
            >
              {showDetails ? 'Ocultar' : 'Mostrar'} detalles
            </Button>
          </div>
        </AlertDescription>
        <div className="mt-4 flex gap-2 flex-wrap">
          <Button onClick={onReset} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
          <Button 
            onClick={() => {
              // Copiar error a clipboard antes de recargar
              if (error) {
                navigator.clipboard.writeText(
                  `Error: ${error.message}\n\nStack:\n${error.stack || 'N/A'}`
                ).catch(() => {})
              }
              window.location.reload()
            }} 
            size="sm"
            variant="destructive"
          >
            Recargar página
          </Button>
        </div>
      </Alert>
    </div>
  )
}

// Componente de fallback personalizado
export function ShoppingListErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Error en la lista de compras
        </h2>
        <p className="text-muted-foreground mb-4">
          {error.message || 'No se pudo cargar la lista de compras. Verifica tu conexión e intenta nuevamente.'}
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={resetError} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
          <Button onClick={() => window.location.reload()}>
            Recargar página
          </Button>
        </div>
      </div>
    </div>
  )
}
