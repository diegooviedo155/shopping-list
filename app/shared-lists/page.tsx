"use client"

import { useState, useEffect, useRef } from 'react'
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
  Share2, 
  AlertCircle,
  Loader2,
  ShoppingCart,
  User
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth/auth-provider'
// import { useSharedLists } from '@/hooks/use-shared-lists'
import Link from 'next/link'

interface AccessRequest {
  id: string
  requesterEmail: string
  requesterName: string
  listName: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  message?: string
}

interface SharedList {
  id: string
  name: string
  ownerEmail: string
  ownerName: string
  memberCount: number
  itemCount: number
  createdAt: string
}

export default function SharedListsPage() {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  // const { sharedLists: realSharedLists, loading: sharedListsLoading, error: sharedListsError } = useSharedLists()
  const [sharedListsLoading, setSharedListsLoading] = useState(false)
  const [sharedListsError, setSharedListsError] = useState<string | null>(null)
  const [realSharedLists, setRealSharedLists] = useState<SharedList[]>([])
  const [loading, setLoading] = useState(false)
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([])
  const [activeTab, setActiveTab] = useState<'requests' | 'my-lists'>('requests')
  const loadedRequests = useRef(false)




  // Cargar solicitudes de acceso desde la API
  useEffect(() => {
    const loadAccessRequests = async () => {
      if (!user || loadedRequests.current) return
      
      loadedRequests.current = true
      setLoading(true)
      try {
        const response = await fetch('/api/access-requests?type=owner', {
          credentials: 'include'
        })
        const data = await response.json()
        
        if (response.ok) {
          // Transformar los datos al formato esperado
          const transformedRequests = data.requests.map((req: any) => ({
            id: req.id,
            requesterEmail: req.requester_email,
            requesterName: req.requester_name || req.requester_email?.split('@')[0] || 'Usuario',
            listName: req.list_name,
            status: req.status,
            createdAt: req.created_at,
            message: req.message
          }))
          
          // Eliminar duplicados basándose en el ID único
          const uniqueRequests = transformedRequests.filter((req, index, self) =>
            index === self.findIndex((r) => r.id === req.id)
          )
          
          setAccessRequests(uniqueRequests)
        } else {
          showError('Error', 'No se pudieron cargar las solicitudes')
        }
      } catch (error) {
        console.error('Error loading access requests:', error)
        showError('Error', 'No se pudieron cargar las solicitudes')
      } finally {
        setLoading(false)
      }
    }

    loadAccessRequests()
  }, [user])

  // Cargar listas compartidas
  useEffect(() => {
    const loadSharedLists = async () => {
      if (!user) return
      
      setSharedListsLoading(true)
      setSharedListsError(null)
      
      try {
        const response = await fetch('/api/shared-lists/my-access', {
          credentials: 'include'
        })
        const data = await response.json()
        
        if (response.ok) {
          // Transformar los datos al formato esperado
          const transformedLists = data.sharedLists.map((list: any) => ({
            id: list.id,
            name: list.list_name,
            ownerEmail: list.owner_email,
            ownerName: list.owner_name,
            memberCount: 1,
            itemCount: 0,
            createdAt: list.granted_at
          }))
          setRealSharedLists(transformedLists)
        } else {
          setSharedListsError(data.error || 'Error al cargar listas compartidas')
        }
      } catch (error) {
        console.error('Error loading shared lists:', error)
        setSharedListsError('Error al cargar listas compartidas')
      } finally {
        setSharedListsLoading(false)
      }
    }

    loadSharedLists()
  }, [user])

  const handleApproveRequest = async (requestId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/access-requests/${requestId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved'
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al aprobar solicitud')
      }
      
      setAccessRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'approved' as const }
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
    try {
      setLoading(true)
      const response = await fetch(`/api/access-requests/${requestId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected'
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al rechazar solicitud')
      }
      
      setAccessRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'rejected' as const }
            : req
        )
      )
      
      showSuccess('Solicitud rechazada', 'El usuario no podrá acceder a tu lista')
    } catch (error) {
      console.error('Error rejecting request:', error)
      showError('Error', error instanceof Error ? error.message : 'No se pudo rechazar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  const pendingRequests = accessRequests.filter(req => req.status === 'pending')
  const approvedRequests = accessRequests.filter(req => req.status === 'approved')

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Cargando listas compartidas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Listas Compartidas</h1>
          <p className="text-muted-foreground">
            Gestiona el acceso a tus listas y ve las listas que otros han compartido contigo
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={activeTab === 'requests' ? 'default' : 'outline'}
            onClick={() => setActiveTab('requests')}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Solicitudes de Acceso
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'my-lists' ? 'default' : 'outline'}
            onClick={() => setActiveTab('my-lists')}
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            Mis Listas Compartidas
          </Button>
        </div>

        {/* Contenido de las tabs */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Solicitudes pendientes */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Solicitudes Pendientes
                {pendingRequests.length > 0 && (
                  <Badge variant="outline">{pendingRequests.length}</Badge>
                )}
              </h2>
              
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No hay solicitudes pendientes</h3>
                      <p className="text-muted-foreground">
                        Cuando alguien solicite acceso a tu lista, aparecerá aquí.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{request.requesterName}</CardTitle>
                            <CardDescription>{request.requesterEmail}</CardDescription>
                            <p className="text-sm text-muted-foreground mt-1">
                              Solicita acceso a: <strong>{request.listName}</strong>
                            </p>
                            {request.message && (
                              <p className="text-sm mt-2 p-2 bg-muted rounded">
                                "{request.message}"
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pendiente
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApproveRequest(request.id)}
                            className="gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aprobar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id)}
                            className="gap-2"
                          >
                            <XCircle className="w-4 h-4" />
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
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Solicitudes Aprobadas
                </h2>
                <div className="grid gap-4">
                  {approvedRequests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{request.requesterName}</CardTitle>
                            <CardDescription>{request.requesterEmail}</CardDescription>
                            <p className="text-sm text-muted-foreground mt-1">
                              Acceso a: <strong>{request.listName}</strong>
                            </p>
                          </div>
                          <Badge variant="default" className="flex items-center gap-1">
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
          </div>
        )}

        {activeTab === 'my-lists' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Listas que me han compartido
              </h2>
              
              {sharedListsLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Cargando listas compartidas...</h3>
                      <p className="text-muted-foreground">
                        Obteniendo las listas que otros han compartido contigo.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : sharedListsError ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Error al cargar las listas: {sharedListsError}
                  </AlertDescription>
                </Alert>
              ) : realSharedLists.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No tienes listas compartidas</h3>
                      <p className="text-muted-foreground">
                        Cuando alguien comparta una lista contigo, aparecerá aquí.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {realSharedLists.map((list) => (
                    <Card key={list.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{list.name}</CardTitle>
                            <CardDescription>
                              Compartida por {list.ownerName} ({list.ownerEmail})
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Invitado
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              Aprobada el {new Date(list.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <Button asChild>
                            <Link href={`/shared-list/c043a418-2e7c-400b-8c96-be488ce6074e?list=${encodeURIComponent(list.name)}`}>
                              <User className="w-4 h-4 mr-2" />
                              Ver Lista
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información adicional */}
        <Alert className="mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Gestión de acceso:</strong> Puedes aprobar o rechazar solicitudes de acceso a tus listas. 
            Los usuarios aprobados podrán ver y agregar productos a tu lista.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
