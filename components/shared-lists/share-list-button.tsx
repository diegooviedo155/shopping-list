"use client"

import { useState, useMemo, useCallback } from 'react'
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
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [shareMethod, setShareMethod] = useState<'whatsapp' | 'link'>('whatsapp')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Obtener nombre del dueño
  const ownerName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario'

  // Función para obtener la URL base correcta
  const getBaseUrl = useCallback(() => {
    if (typeof window === 'undefined') return ''
    
    // Prioridad 1: Variable de entorno (si está configurada) - SIEMPRE usar esta si está disponible
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL.trim()
    }
    
    // Prioridad 2: Si estamos en producción (no localhost), usar el dominio actual
    // pero advertir si es Vercel
    const hostname = window.location.hostname
    const origin = window.location.origin
    
    if (hostname.includes('vercel.app')) {
      console.warn(
        '⚠️ Usando URL de Vercel para compartir. ' +
        'Para usar tu dominio de producción, configura NEXT_PUBLIC_APP_URL en las variables de entorno de Vercel.'
      )
    }
    
    // Prioridad 3: Usar window.location.origin como fallback
    return origin
  }, [])

  // Generar enlace de solicitud con el ID del usuario
  // Usar useMemo para calcular solo en el cliente
  const shareLink = useMemo(() => {
    if (typeof window === 'undefined') return ''
    
    const baseUrl = getBaseUrl()
    
    return user ? 
      `${baseUrl}/shared-list/${user.id}?list=${encodeURIComponent(listName)}` :
      `${baseUrl}/request-access?list=${encodeURIComponent(listName)}`
  }, [user, listName, getBaseUrl])

  // Compartir por WhatsApp
  const shareViaWhatsApp = () => {
    const defaultMessage = `¡Hola! 👋\n\n${ownerName} te invita a colaborar en su lista de compras "${listName}" en Lo Que Falta.\n\n🔗 Haz clic en el enlace para ver y agregar productos:\n${shareLink}\n\n✨ Podrás agregar productos pero no editarlos.`
    const whatsappMessage = message || defaultMessage
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`
    window.open(whatsappUrl, '_blank')
    setOpen(false)
    showSuccess('Éxito', 'Enlace compartido por WhatsApp')
  }

  // Copiar enlace
  const copyLink = async () => {
    try {
      // Usar la API moderna de clipboard si está disponible
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        showSuccess('Éxito', 'Enlace copiado al portapapeles')
      } else {
        // Fallback para navegadores antiguos
        const inputElement = document.getElementById('share-link-input') as HTMLInputElement
        if (inputElement) {
          inputElement.focus()
          inputElement.select()
          inputElement.setSelectionRange(0, 99999)
          
          const success = document.execCommand('copy')
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
    } catch (err) {
      console.error('Error al copiar:', err)
      showError('Error', 'No se pudo copiar. Selecciona el enlace y usa Ctrl+C.')
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
