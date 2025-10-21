"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle, Copy, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth/auth-provider'

interface ShareListButtonProps {
  listName?: string
  className?: string
}

export function ShareListButton({ listName = "Mi Lista", className }: ShareListButtonProps) {
  const { showSuccess, showError } = useToast()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [shareMethod, setShareMethod] = useState<'whatsapp' | 'link'>('whatsapp')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  // Generar enlace de solicitud con el ID del usuario
  const shareLink = user ? 
    `${window.location.origin}/shared-list/${user.id}?list=${encodeURIComponent(listName)}` :
    `${window.location.origin}/request-access?list=${encodeURIComponent(listName)}`

  // Compartir por WhatsApp
  const shareViaWhatsApp = () => {
    const whatsappMessage = message || `¡Hola! Te invito a colaborar en mi lista de compras "${listName}". Haz clic en el enlace para ver y agregar productos: ${shareLink}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`
    window.open(whatsappUrl, '_blank')
    setOpen(false)
    showSuccess('Éxito', 'Enlace compartido por WhatsApp')
  }

  // Copiar enlace
  const copyLink = () => {
    // Obtener el input visible del DOM
    const inputElement = document.getElementById('share-link-input') as HTMLInputElement
    
    if (inputElement) {
      // Seleccionar el texto del input visible
      inputElement.focus()
      inputElement.select()
      inputElement.setSelectionRange(0, 99999) // Para móviles
      
      // Copiar
      let success = false
      try {
        success = document.execCommand('copy')
      } catch (err) {
        console.error('Error al copiar:', err)
      }
      
      // Mostrar resultado
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        showSuccess('Éxito', 'Enlace copiado al portapapeles')
      } else {
        showError('Error', 'No se pudo copiar. Selecciona el enlace y usa Ctrl+C.')
      }
    } else {
      showError('Error', 'No se encontró el campo del enlace')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className={className}>
          <MessageCircle className="w-4 h-4 mr-2" />
          Compartir Lista
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Compartir "{listName}"
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Métodos de compartir */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={shareMethod === 'whatsapp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShareMethod('whatsapp')}
              className="gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              variant={shareMethod === 'link' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShareMethod('link')}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              Enlace
            </Button>
          </div>

          {/* Formulario según el método */}
          {shareMethod === 'whatsapp' && (
            <div className="space-y-2">
              <Label>Mensaje personalizado (opcional)</Label>
              <Textarea
                placeholder="Agrega un mensaje personalizado..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {shareMethod === 'link' && (
            <div className="space-y-2">
              <Label>Enlace de solicitud</Label>
              <Input
                id="share-link-input"
                value={shareLink}
                readOnly
                className="bg-muted"
              />
            </div>
          )}

          {/* Botón de acción */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => {
                if (shareMethod === 'whatsapp') shareViaWhatsApp()
                else copyLink()
              }}
              disabled={loading}
              className="flex-1 gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {shareMethod === 'whatsapp' && <MessageCircle className="w-4 h-4" />}
                  {shareMethod === 'link' && <Copy className="w-4 h-4" />}
                </>
              )}
              {loading ? 'Enviando...' : (
                <>
                  {shareMethod === 'whatsapp' && 'Compartir por WhatsApp'}
                  {shareMethod === 'link' && 'Copiar Enlace'}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>

          {/* Información adicional */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p><strong>¿Cómo funciona?</strong></p>
            {shareMethod === 'whatsapp' && (
              <>
                <p>• El destinatario podrá ver tu lista de compras</p>
                <p>• Podrá agregar nuevos productos a tu lista</p>
                <p>• No podrá editar o eliminar productos existentes</p>
              </>
            )}
            {shareMethod === 'link' && (
              <>
                <p>• Copia el enlace y compártelo como quieras</p>
                <p>• El destinatario podrá ver tu lista al hacer clic</p>
                <p>• Podrá agregar productos pero no editarlos</p>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
