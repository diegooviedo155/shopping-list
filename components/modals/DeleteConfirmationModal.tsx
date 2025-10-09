"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemCount: number
  itemNames: string[]
  isLoading?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemCount,
  itemNames,
  isLoading = false
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Error deleting items:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    if (!isDeleting) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleCancel}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-card border rounded-lg shadow-lg max-w-md w-full mx-4">
              {/* Header */}
              <div className="flex items-center gap-3 p-6 pb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Confirmar eliminación
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-4">
                <p className="text-sm text-foreground mb-4">
                  ¿Estás seguro de que quieres eliminar {itemCount} {itemCount === 1 ? 'producto' : 'productos'}?
                </p>
                
                {/* Items list */}
                <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Productos a eliminar:
                  </p>
                  <div className="space-y-1">
                    {itemNames.slice(0, 5).map((name, index) => (
                      <div key={index} className="text-sm text-foreground">
                        • {name}
                      </div>
                    ))}
                    {itemNames.length > 5 && (
                      <div className="text-sm text-muted-foreground">
                        ... y {itemNames.length - 5} más
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 p-6 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isDeleting || isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirm}
                  disabled={isDeleting || isLoading}
                  className="flex-1 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting || isLoading ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
