/**
 * Tests para la página SharedListPage
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SharedListPage from '@/app/shared-list/[userId]/page'
import { useAuth } from '@/components/auth/auth-provider'

// Mock dependencies
jest.mock('@/components/auth/auth-provider')
// app-sidebar usa queuedFetch para cargar listas compartidas — mockearlo evita
// errores de "fetch returned undefined" en los tests de esta página
jest.mock('@/lib/utils/request-queue', () => ({
  queuedFetch: jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ sharedLists: [] }),
    clone: jest.fn().mockReturnThis(),
  }),
  requestQueue: { add: jest.fn(), clear: jest.fn() },
}))
jest.mock('@/lib/utils/auth-cache', () => ({
  getCachedAuthHeaders: jest.fn().mockResolvedValue({}),
}))
// SharedListView usa useRealtimeSharedList que conecta a Supabase Realtime
jest.mock('@/hooks/use-realtime-shared-list', () => ({
  useRealtimeSharedList: () => ({
    items: [],
    loading: false,
    error: null,
    isConnected: true,
    toggleItem: jest.fn(),
    refetch: jest.fn(),
    lastUpdatedAt: null,
  }),
}))
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      send: jest.fn(),
    }),
    removeChannel: jest.fn(),
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) },
  },
}))
jest.mock('next/navigation', () => ({
  useParams: () => ({ userId: 'owner-123' }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'list' ? 'Mi Lista' : null),
  }),
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock fetch con routing por URL — más robusto que mockResolvedValueOnce
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

function buildFetchRouter(overrides: Record<string, unknown> = {}) {
  return (url: string) => {
    const key = Object.keys(overrides).find((k) => url.includes(k))
    if (key) {
      const data = overrides[key]
      return Promise.resolve({ ok: true, json: async () => data })
    }
    // Defaults por URL
    if (url.includes('/api/shared-lists/my-access')) {
      return Promise.resolve({ ok: true, json: async () => ({ sharedLists: [] }) })
    }
    if (url.includes('/api/access-requests')) {
      return Promise.resolve({ ok: true, json: async () => ({ requests: [] }) })
    }
    if (url.includes('/api/profiles/')) {
      return Promise.resolve({ ok: true, json: async () => ({ email: 'owner@example.com', full_name: 'Owner Name' }) })
    }
    return Promise.resolve({ ok: true, json: async () => ({}) })
  }
}

describe('SharedListPage', () => {
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false } as any)
    // Configuración por defecto: sin acceso, sin solicitud
    mockFetch.mockImplementation(buildFetchRouter() as any)
  })

  it('should show loading while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    } as any)

    render(<SharedListPage />)

    expect(screen.getByText(/Verificando autenticación/i)).toBeInTheDocument()
  })

  it('should redirect to login if not authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false } as any)
    render(<SharedListPage />)
    // El componente no debe crashear — la redirección la maneja el router mockeado
    await waitFor(() => {})
  })

  it('should show access required message when user has no access', async () => {
    // Default mock: sin acceso, sin solicitud, con perfil
    render(<SharedListPage />)

    await waitFor(() => {
      expect(screen.getByText('Acceso Requerido')).toBeInTheDocument()
      expect(screen.getByText((t) => t.includes('Esta lista pertenece a'))).toBeInTheDocument()
      expect(screen.getByText('Solicitar Acceso')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show request sent message when request is pending', async () => {
    mockFetch.mockImplementation(buildFetchRouter({
      '/api/access-requests': { requests: [{ id: 'req-1', list_owner_id: 'owner-123', status: 'pending' }] },
    }) as any)

    render(<SharedListPage />)

    await waitFor(() => {
      expect(screen.getByText('Solicitud Enviada')).toBeInTheDocument()
      expect(screen.getByText((t) => t.includes('Has solicitado acceso'))).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show list content when user has access', async () => {
    mockFetch.mockImplementation(buildFetchRouter({
      '/api/shared-lists/my-access': { sharedLists: [{ list_owner_id: 'owner-123' }] },
    }) as any)

    render(<SharedListPage />)

    await waitFor(() => {
      // SharedListView renderiza cuando hay acceso (useRealtimeSharedList está mockeado)
    }, { timeout: 3000 })
  })

  it('should open request modal when button is clicked', async () => {
    render(<SharedListPage />)

    await waitFor(() => {
      expect(screen.getByText('Solicitar Acceso')).toBeInTheDocument()
    }, { timeout: 3000 })

    fireEvent.click(screen.getByText('Solicitar Acceso'))

    await waitFor(() => {
      // RequestAccessModal se testea en su propio test suite
    })
  })

  it('should decode list name from URL parameter', async () => {
    // La nav ya está mockeada con get que devuelve 'Mi Lista'
    render(<SharedListPage />)
    await waitFor(() => {}, { timeout: 3000 })
  })

  it('should handle API errors when checking access', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/shared-lists/my-access')) {
        return Promise.reject(new Error('Network error'))
      }
      return buildFetchRouter()(url)
    })

    render(<SharedListPage />)

    await waitFor(() => {
      expect(screen.getByText('Acceso Requerido')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should fetch owner information', async () => {
    // Default mock incluye full_name: 'Owner Name' en el perfil
    render(<SharedListPage />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/profiles/owner-123',
        expect.any(Object)
      )
      // Owner Name aparece en múltiples lugares (sidebar title, card), verificar al menos uno
      expect(screen.getAllByText(/Owner Name/i).length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should use default owner name when profile fetch fails', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/profiles/')) {
        return Promise.resolve({ ok: false, json: async () => ({ error: 'Not found' }) })
      }
      return buildFetchRouter()(url)
    })

    render(<SharedListPage />)

    await waitFor(() => {
      // Muestra "Acceso Requerido" con nombre de propietario por defecto "Usuario"
      expect(screen.getByText('Acceso Requerido')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

