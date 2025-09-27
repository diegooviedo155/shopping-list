import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Checkbox } from '../../atoms'
import { FormField, Alert } from '../../molecules'
import { Card } from '../../atoms'
import { cn } from '@/lib/utils'

export interface FormPatternProps<T extends z.ZodType> {
  schema: T
  defaultValues?: z.infer<T>
  onSubmit: (data: z.infer<T>) => void | Promise<void>
  submitText?: string
  loading?: boolean
  children: (form: {
    register: any
    formState: any
    control: any
    watch: any
    setValue: any
    reset: any
  }) => React.ReactNode
  className?: string
}

export function FormPattern<T extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
  submitText = 'Enviar',
  loading = false,
  children,
  className
}: FormPatternProps<T>) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
    setValue,
    reset
  } = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  })

  const handleFormSubmit = async (data: z.infer<T>) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Card className={cn('p-6', className)}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {Object.keys(errors).length > 0 && (
          <Alert variant="destructive" title="Errores de validación">
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>
                  {error?.message || 'Error de validación'}
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {children({
          register,
          formState: { errors, isSubmitting },
          control,
          watch,
          setValue,
          reset
        })}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={isSubmitting || loading}
          >
            Limpiar
          </Button>
          <Button
            type="submit"
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading}
          >
            {submitText}
          </Button>
        </div>
      </form>
    </Card>
  )
}
