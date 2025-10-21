"use client"

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { HomePageContent } from '@/components/features/home/HomePageContent'
import { SidebarLayout } from '@/components/sidebar-layout'
import { RequestAccessModal } from '@/components/shared-lists/request-access-modal'
import { useAuth } from '@/components/auth/auth-provider'
import { goBack } from '@/lib/utils'

export default function SharedListPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const [authLoading, setAuthLoading] = useState(true)
  
  const [listName, setListName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [requestSent, setRequestSent] = useState(false)

  const userId = params.userId as string
  const listParam = searchParams.get('list')

  // Verificar estado de autenticación
  useEffect(() => {
    if (user !== null) {
      setAuthLoading(false)
    }
  }, [user])

  // Redirigir al login si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      const currentUrl = window.location.href
      const loginUrl = `/login?redirect=${encodeURIComponent(currentUrl)}`
      router.push(loginUrl)
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (listParam) {
      setListName(decodeURIComponent(listParam))
    }
  }, [listParam])

  // Verificar si el usuario tiene acceso a esta lista y si ya envió solicitud
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setCheckingAccess(false)
        return
      }

      try {
        // Verificar acceso
        const accessResponse = await fetch('/api/shared-lists/my-access', {
          credentials: 'include'
        })
        const accessData = await accessResponse.json()
        
        if (accessResponse.ok) {
          const hasAccessToList = accessData.sharedLists.some((list: any) => 
            list.list_owner_id === userId
          )
          setHasAccess(hasAccessToList)
        }

        // Verificar si ya se envió una solicitud (desde la API)
        const requestsResponse = await fetch('/api/access-requests?type=requester', {
          credentials: 'include'
        })
        const requestsData = await requestsResponse.json()
        
        if (requestsResponse.ok) {
          const hasRequested = requestsData.requests.some((req: any) => 
            req.list_owner_id === userId && req.status === 'pending'
          )
          setRequestSent(hasRequested)
        }
      } catch (error) {
        console.error('Error checking access:', error)
      } finally {
        setCheckingAccess(false)
      }
    }

    checkAccess()
  }, [user, userId])

  // Simular obtener información del propietario
  useEffect(() => {
    // En una implementación real, aquí harías una llamada a la API
    // para obtener el nombre del propietario basado en el userId
    setOwnerName('Usuario')
  }, [userId])

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada (ya se redirigió)
  if (!user) {
    return null
  }

  return (
    <SidebarLayout 
      title={`Lista de ${ownerName}`}
      showBackButton={true}
      onBack={() => window.location.href = '/'}
    >
      {/* Mostrar contenido según el acceso */}
      {checkingAccess ? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Verificando acceso...</p>
          </div>
        </div>
      ) : hasAccess ? (
        <HomePageContent ownerId={userId} isSharedView={true} />
      ) : requestSent ? (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Solicitud Enviada
                </CardTitle>
                <CardDescription>
                  Tu solicitud de acceso ha sido enviada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Has solicitado acceso a la lista de <strong>{ownerName}</strong>. 
                    Te notificaremos cuando sea aprobada.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowRequestModal(true)}
                      className="flex-1"
                    >
                      Ver Detalles
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => goBack(router)}
                      className="flex-1"
                    >
                      Volver
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Acceso Requerido
                </CardTitle>
                <CardDescription>
                  Necesitas solicitar acceso para ver esta lista de compras
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Esta lista pertenece a <strong>{ownerName}</strong> y es privada. 
                    Solicita acceso para poder ver y colaborar en ella.
                  </p>
                  <Button 
                    onClick={() => setShowRequestModal(true)}
                    className="w-full"
                  >
                    Solicitar Acceso
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Modal de solicitud de acceso */}
      <RequestAccessModal
        isOpen={showRequestModal}
        onClose={async () => {
          setShowRequestModal(false)
          // Verificar si se envió la solicitud
          try {
            const response = await fetch('/api/access-requests?type=requester', {
              credentials: 'include'
            })
            const data = await response.json()
            if (response.ok) {
              const hasRequested = data.requests.some((req: any) => 
                req.list_owner_id === userId && req.status === 'pending'
              )
              setRequestSent(hasRequested)
            }
          } catch (error) {
            console.error('Error checking request status:', error)
          }
        }}
        listOwnerId={userId}
        listName={listName}
        ownerName={ownerName}
      />
    </SidebarLayout>
  )
}
