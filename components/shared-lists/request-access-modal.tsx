"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  UserPlus, 
  AlertCircle, 
  Loader2, 
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth/auth-provider'
import { queuedFetch } from '@/lib/utils/request-queue'
import { getCachedAuthHeaders } from '@/lib/utils/auth-cache'

interface RequestAccessModalProps {
  isOpen: boolean
  onClose: () => void
  listOwnerId: string
  listName?: string
  ownerName?: string
}

export function RequestAccessModal({ 
  isOpen, 
  onClose, 
  listOwnerId, 
  listName = "Mi Lista Personal",
  ownerName = "Usuario"
}: RequestAccessModalProps) {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'success' | 'error'>('form')
  const [formData, setFormData] = useState({
    requesterName: user?.email?.split('@')[0] || '',
    message: `Hola, me gustaría colaborar en tu lista de compras "${listName}".`
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.requesterName.trim()) {
      showError('Error', 'Por favor ingresa tu nombre')
      return
    }

    setLoading(true)

    try {
      // Crear la solicitud en la base de datos
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch('/api/access-requests', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          list_owner_id: listOwnerId,
          requester_id: user?.id,
          requester_email: user?.email || '',
          requester_name: formData.requesterName.trim(),
          list_name: listName,
          message: formData.message.trim()
        })
      }, 0)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al enviar solicitud')
      }

      const { request: newRequest } = await response.json()

      setStep('success')
      showSuccess('Solicitud enviada', 'Tu solicitud de acceso ha sido enviada correctamente')
    } catch (error) {
      console.error('Error sending access request:', error)
      setStep('error')
      showError('Error', error instanceof Error ? error.message : 'Error al enviar solicitud')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('form')
    setFormData({
      requesterName: user?.email?.split('@')[0] || '',
      message: `Hola, me gustaría colaborar en tu lista de compras "${listName}".`
    })
    onClose()
  }

  const handleRetry = () => {
    setStep('form')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Solicitar Acceso
          </DialogTitle>
          <DialogDescription>
            Solicita acceso a la lista de compras de {ownerName}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requesterName">Tu nombre *</Label>
              <Input
                id="requesterName"
                type="text"
                placeholder="Ej: María García"
                value={formData.requesterName}
                onChange={(e) => setFormData(prev => ({ ...prev, requesterName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensaje (opcional)</Label>
              <Textarea
                id="message"
                placeholder="Escribe un mensaje para el propietario de la lista..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                El propietario de la lista revisará tu solicitud y decidirá si aprobarla.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Enviar Solicitud
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">¡Solicitud Enviada!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tu solicitud de acceso ha sido enviada a {ownerName}. 
              Te notificaremos cuando sea aprobada.
            </p>
            <Button onClick={handleClose} className="w-full">
              Cerrar
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-6">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error al Enviar</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No se pudo enviar tu solicitud. Inténtalo de nuevo.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cerrar
              </Button>
              <Button
                onClick={handleRetry}
                className="flex-1"
              >
                Reintentar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
