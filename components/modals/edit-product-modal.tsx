"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, X, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { z } from 'zod'

const editItemSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
})

type EditItemInput = z.infer<typeof editItemSchema>

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: EditItemInput) => Promise<void>
  initialName: string
  isLoading?: boolean
}

export function EditProductModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialName, 
  isLoading = false 
}: EditProductModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<EditItemInput>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      name: initialName,
    },
  })

  // Actualizar el valor cuando cambie initialName
  useEffect(() => {
    setValue('name', initialName)
  }, [initialName, setValue])

  const onSubmit = async (data: EditItemInput) => {
    try {
      await onSave(data)
      onClose()
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const isFormValid = !isSubmitting && !isLoading

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="backdrop-blur-sm bg-black/60" />
        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-primary" />
              </div>
              Editar Producto
            </DialogTitle>
            <DialogDescription>
              Modifica el nombre del producto y guarda los cambios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nombre del producto */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre del producto
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="¿Qué necesitas comprar?"
                className={cn(
                  'h-11',
                  errors.name && 'border-destructive focus-visible:ring-destructive'
                )}
                disabled={isSubmitting || isLoading}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting || isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid}
                className="flex-1 gap-2"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
