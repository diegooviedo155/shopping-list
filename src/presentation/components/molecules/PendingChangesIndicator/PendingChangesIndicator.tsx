import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../atoms'
import { cn } from '@/lib/utils'
import { Save, Clock, CheckCircle } from 'lucide-react'

export interface PendingChangesIndicatorProps {
  hasChanges: boolean
  pendingCount: number
  isSaving: boolean
  onForceSave?: () => void
  className?: string
}

export function PendingChangesIndicator({
  hasChanges,
  pendingCount,
  isSaving,
  onForceSave,
  className
}: PendingChangesIndicatorProps) {
  if (!hasChanges && !isSaving) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "fixed bottom-4 right-4 z-50",
          className
        )}
      >
        <div className="bg-background border border-border rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-center gap-3">
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Guardando cambios...</p>
                  <p className="text-xs text-muted-foreground">Por favor espera</p>
                </div>
              </>
            ) : hasChanges ? (
              <>
                <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                  <Clock size={12} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {pendingCount} cambio{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Se guardará automáticamente en 30 segundos
                  </p>
                </div>
                {onForceSave && (
                  <Button
                    size="sm"
                    onClick={onForceSave}
                    className="h-8 px-3 text-xs"
                  >
                    <Save size={12} className="mr-1" />
                    Guardar
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle size={12} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Cambios guardados</p>
                  <p className="text-xs text-muted-foreground">Todo actualizado</p>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
