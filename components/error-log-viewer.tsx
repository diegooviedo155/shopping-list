'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorLogs, clearErrorLogs, type ErrorLog } from '@/lib/utils/error-logger'
import { Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react'

export function ErrorLogViewer() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set())
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const loadLogs = () => {
      setLogs(getErrorLogs())
    }
    
    loadLogs()
    
    // Recargar logs cada 2 segundos
    const interval = setInterval(loadLogs, 2000)
    
    return () => clearInterval(interval)
  }, [])

  const toggleLog = (index: number) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedLogs(newExpanded)
  }

  const copyLog = (log: ErrorLog) => {
    const text = `Error: ${log.message}\n\nStack: ${log.stack || 'N/A'}\n\nComponent Stack: ${log.componentStack || 'N/A'}\n\nURL: ${log.url}\n\nTimestamp: ${log.timestamp}`
    navigator.clipboard.writeText(text)
  }

  const handleClear = () => {
    clearErrorLogs()
    setLogs([])
    setExpandedLogs(new Set())
  }

  if (logs.length === 0 && !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-2xl w-full max-h-[80vh] overflow-hidden">
      <Card className="bg-background border-2 border-destructive shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Error Logs ({logs.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(!isVisible)}
              >
                {isVisible ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
              {logs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {isVisible && (
          <CardContent className="overflow-y-auto max-h-[60vh] space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay errores registrados
              </p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="p-3 bg-muted rounded-md border border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      <div className="text-sm font-medium text-foreground break-words">
                        {log.message}
                      </div>
                      {log.url && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {log.url}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLog(log)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {(log.stack || log.componentStack) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLog(index)}
                          className="h-6 w-6 p-0"
                        >
                          {expandedLogs.has(index) ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  {expandedLogs.has(index) && (
                    <div className="mt-2 space-y-2">
                      {log.stack && (
                        <div>
                          <div className="text-xs font-semibold mb-1">Stack Trace:</div>
                          <pre className="text-xs font-mono bg-background p-2 rounded overflow-auto max-h-32">
                            {log.stack}
                          </pre>
                        </div>
                      )}
                      {log.componentStack && (
                        <div>
                          <div className="text-xs font-semibold mb-1">Component Stack:</div>
                          <pre className="text-xs font-mono bg-background p-2 rounded overflow-auto max-h-32">
                            {log.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

