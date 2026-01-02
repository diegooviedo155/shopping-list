"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth/auth-provider'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { queuedFetch } from '@/lib/utils/request-queue'
import { getCachedAuthHeaders } from '@/lib/utils/auth-cache'

import type { AccessRequestWithOwner } from '@/lib/types/access-requests'

interface AccessRequestsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AccessRequestsPanel({ isOpen, onClose }: AccessRequestsPanelProps) {
  const { showSuccess, showError } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [accessRequests, setAccessRequests] = useState<AccessRequestWithOwner[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  // Cargar solicitudes desde la API
  useEffect(() => {
    const loadRequests = async () => {
      if (!user || !isOpen) return
      
      setLoadingRequests(true)
      try {
        const headers = await getCachedAuthHeaders().catch(() => ({}))
        const response = await queuedFetch('/api/access-requests', {
          method: 'GET',
          headers,
          credentials: 'include'
        }, 1) // Prioridad alta
        const data = await response.json()
        
        if (response.ok) {
          setAccessRequests(data.requests || [])
        } else {
          showError('Error', data.error || 'Error al cargar solicitudes')
        }
      } catch (error) {
        console.error('Error loading requests:', error)
        showError('Error', 'Error al cargar solicitudes')
      } finally {
        setLoadingRequests(false)
      }
    }

    loadRequests()
  }, [user, isOpen, showError])

  const handleApproveRequest = async (requestId: string) => {
    setLoading(true)
    try {
      // Actualizar el estado de la solicitud en la base de datos
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch(`/api/access-requests/${requestId}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          status: 'approved'
        }),
      }, 0)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al aprobar solicitud')
      }

      // Actualizar estado local
      setAccessRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'approved', approved_at: new Date().toISOString() }
            : req
        )
      )
      showSuccess('Solicitud aprobada', 'El usuario ahora puede acceder a tu lista')
    } catch (error) {
      console.error('Error approving request:', error)
      showError('Error', error instanceof Error ? error.message : 'No se pudo aprobar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setLoading(true)
    try {
      // Actualizar el estado de la solicitud en la base de datos
      const headers = await getCachedAuthHeaders()
      const response = await queuedFetch(`/api/access-requests/${requestId}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          status: 'rejected'
        }),
      }, 0)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al rechazar solicitud')
      }

      // Actualizar estado local
      setAccessRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rejected', rejected_at: new Date().toISOString() }
            : req
        )
      )
      showSuccess('Solicitud rechazada', 'El usuario no podrá acceder a tu lista')
    } catch (error) {
      console.error('Error rejecting request:', error)
      showError('Error', 'No se pudo rechazar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const pendingRequests = accessRequests.filter(req => req.status === 'pending')
  const approvedRequests = accessRequests.filter(req => req.status === 'approved')
  const rejectedRequests = accessRequests.filter(req => req.status === 'rejected')

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-96 sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gestionar Acceso a Mi Lista
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Cargando solicitudes...</span>
            </div>
          ) : (
            <>
              {/* Solicitudes pendientes */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Solicitudes Pendientes
                  {pendingRequests.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {pendingRequests.length}
                    </Badge>
                  )}
                </h3>
                
                {pendingRequests.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-4">
                        <UserPlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No hay solicitudes pendientes
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <Card key={request.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{request.requester_name}</CardTitle>
                              <CardDescription className="text-sm">{request.requester_email}</CardDescription>
                              {request.message && (
                                <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                                  "{request.message}"
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <Clock className="w-3 h-3" />
                              Pendiente
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveRequest(request.id)}
                              className="gap-1 flex-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectRequest(request.id)}
                              className="gap-1 flex-1"
                            >
                              <XCircle className="w-3 h-3" />
                              Rechazar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Solicitudes aprobadas */}
              {approvedRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Solicitudes Aprobadas
                  </h3>
                  <div className="space-y-3">
                    {approvedRequests.map((request) => (
                      <Card key={request.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{request.requester_name}</CardTitle>
                              <CardDescription className="text-sm">{request.requester_email}</CardDescription>
                            </div>
                            <Badge variant="default" className="flex items-center gap-1 text-xs">
                              <CheckCircle className="w-3 h-3" />
                              Aprobado
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Solicitudes rechazadas */}
              {rejectedRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Solicitudes Rechazadas
                  </h3>
                  <div className="space-y-3">
                    {rejectedRequests.map((request) => (
                      <Card key={request.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{request.requester_name}</CardTitle>
                              <CardDescription className="text-sm">{request.requester_email}</CardDescription>
                            </div>
                            <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                              <XCircle className="w-3 h-3" />
                              Rechazado
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Información adicional */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Los usuarios aprobados podrán ver y agregar productos a tu lista de compras.
            </AlertDescription>
          </Alert>
        </div>
      </SheetContent>
    </Sheet>
  )
}
