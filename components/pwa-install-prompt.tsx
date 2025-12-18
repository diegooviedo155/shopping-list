'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // DESHABILITADO: Desregistrar todos los service workers para evitar problemas con Supabase
    // El service worker está causando problemas al interceptar peticiones a Supabase
    if ('serviceWorker' in navigator) {
      // Desregistrar TODOS los service workers inmediatamente (producción y desarrollo)
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
          console.log(`Desregistrando ${registrations.length} service worker(s)...`)
          Promise.all(
            registrations.map((registration) => registration.unregister())
          ).then(() => {
            console.log('Todos los service workers han sido desregistrados')
            // Limpiar caches también
            if ('caches' in window) {
              caches.keys().then((cacheNames) => {
                return Promise.all(
                  cacheNames.map((cacheName) => caches.delete(cacheName))
                )
              }).then(() => {
                console.log('Todos los caches han sido limpiados')
              })
            }
          })
        }
      })
      
      // Solo registrar si realmente se necesita (PWA instalada o usuario lo solicita)
      // Por ahora, deshabilitamos el registro automático para evitar problemas
      // El service worker se puede registrar manualmente cuando sea necesario
      
      // Comentado temporalmente para evitar problemas con Supabase
      /*
      setTimeout(() => {
        navigator.serviceWorker
          .register('/sw.js', { updateViaCache: 'none' })
          .then((registration) => {
            console.log('Service Worker registrado:', registration.scope)
            // Forzar actualización del service worker
            registration.update()
            
            // Escuchar actualizaciones
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Nuevo service worker disponible, recargar
                    window.location.reload()
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.warn('Error al registrar Service Worker:', error)
          })
      }, 1000)
      */
    }

    // Verificar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Escuchar evento de instalación
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // Escuchar cuando se instala la app
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    if (process.env.NODE_ENV === 'production') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)
    }

    return () => {
      if (process.env.NODE_ENV === 'production') {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      // Usuario aceptó instalar la PWA
    } else {
      // Usuario rechazó instalar la PWA
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
  }

  if (process.env.NODE_ENV !== 'production' || isInstalled || !showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-lg shadow-lg p-4 mx-auto max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            Instalar App
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Instala esta app en tu dispositivo para un acceso más rápido
          </p>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex gap-2 mt-3">
        <Button
          onClick={handleInstallClick}
          size="sm"
          className="flex-1"
        >
          Instalar
        </Button>
        <Button
          onClick={handleDismiss}
          variant="outline"
          size="sm"
        >
          Ahora no
        </Button>
      </div>
    </div>
  )
}
