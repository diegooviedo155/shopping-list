/**
 * Tests para la página SharedListsPage
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SharedListsPage from '@/app/shared-lists/page'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/hooks/use-toast'

// Mock dependencies
jest.mock('@/components/auth/auth-provider')
jest.mock('@/hooks/use-toast')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>

// Mock fetch
global.fetch = jest.fn()

describe('SharedListsPage', () => {
  const mockShowSuccess = jest.fn()
  const mockShowError = jest.fn()
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseToast.mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
    })
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    } as any)
  })

  it('should render the page with tabs', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })

    render(<SharedListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Solicitudes de Acceso')).toBeInTheDocument()
      expect(screen.getByText('Mis Listas Compartidas')).toBeInTheDocument()
    })
  })

  it('should load and display pending access requests', async () => {
    const mockRequests = [
      {
        id: 'req-1',
        requester_email: 'requester1@example.com',
        requester_name: 'Requester 1',
        list_name: 'Mi Lista',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        message: 'Por favor, dame acceso',
      },
    ]

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })

    render(<SharedListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Requester 1')).toBeInTheDocument()
      expect(screen.getByText('requester1@example.com')).toBeInTheDocument()
      expect(screen.getByText(/Solicita acceso a: Mi Lista/)).toBeInTheDocument()
      expect(screen.getByText('Por favor, dame acceso')).toBeInTheDocument()
    })
  })

  it('should approve access request', async () => {
    const mockRequests = [
      {
        id: 'req-1',
        requester_email: 'requester1@example.com',
        requester_name: 'Requester 1',
        list_name: 'Mi Lista',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          request: { ...mockRequests[0], status: 'approved' },
        }),
      })

    render(<SharedListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Aprobar')).toBeInTheDocument()
    })

    const approveButton = screen.getByText('Aprobar')
    fireEvent.click(approveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/access-requests/req-1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'approved' }),
        })
      )
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Solicitud aprobada',
        'El usuario ahora puede acceder a tu lista'
      )
    })
  })

  it('should reject access request', async () => {
    const mockRequests = [
      {
        id: 'req-1',
        requester_email: 'requester1@example.com',
        requester_name: 'Requester 1',
        list_name: 'Mi Lista',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          request: { ...mockRequests[0], status: 'rejected' },
        }),
      })

    render(<SharedListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Rechazar')).toBeInTheDocument()
    })

    const rejectButton = screen.getByText('Rechazar')
    fireEvent.click(rejectButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/access-requests/req-1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'rejected' }),
        })
      )
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Solicitud rechazada',
        'El usuario no podrá acceder a tu lista'
      )
    })
  })

  it('should display approved requests separately', async () => {
    const mockRequests = [
      {
        id: 'req-1',
        requester_email: 'requester1@example.com',
        requester_name: 'Requester 1',
        list_name: 'Mi Lista',
        status: 'approved',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })

    render(<SharedListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Solicitudes Aprobadas')).toBeInTheDocument()
      expect(screen.getByText('Requester 1')).toBeInTheDocument()
    })
  })

  it('should load and display shared lists', async () => {
    const mockSharedLists = [
      {
        id: 'shared-1',
        list_name: 'Lista Compartida',
        owner_email: 'owner@example.com',
        owner_name: 'Owner',
        list_owner_id: 'owner-123',
        granted_at: '2024-01-01T00:00:00Z',
      },
    ]

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: mockSharedLists }),
      })

    render(<SharedListsPage />)

    // Switch to my-lists tab
    await waitFor(() => {
      const myListsTab = screen.getByText('Mis Listas Compartidas')
      fireEvent.click(myListsTab)
    })

    await waitFor(() => {
      expect(screen.getByText('Lista Compartida')).toBeInTheDocument()
      expect(screen.getByText(/Compartida por Owner/)).toBeInTheDocument()
    })
  })

  it('should show empty state when no pending requests', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })

    render(<SharedListsPage />)

    await waitFor(() => {
      expect(screen.getByText('No hay solicitudes pendientes')).toBeInTheDocument()
    })
  })

  it('should show empty state when no shared lists', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })

    render(<SharedListsPage />)

    await waitFor(() => {
      const myListsTab = screen.getByText('Mis Listas Compartidas')
      fireEvent.click(myListsTab)
    })

    await waitFor(() => {
      expect(screen.getByText('No tienes listas compartidas')).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Error al cargar solicitudes' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })

    render(<SharedListsPage />)

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Error', 'No se pudieron cargar las solicitudes')
    })
  })

  it('should show loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    render(<SharedListsPage />)

    // The page should show loading spinner
    expect(screen.getByText(/Cargando listas compartidas/i)).toBeInTheDocument()
  })

  it('should display badge with pending requests count', async () => {
    const mockRequests = [
      {
        id: 'req-1',
        requester_email: 'requester1@example.com',
        requester_name: 'Requester 1',
        list_name: 'Mi Lista',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'req-2',
        requester_email: 'requester2@example.com',
        requester_name: 'Requester 2',
        list_name: 'Mi Lista',
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: mockRequests }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })

    render(<SharedListsPage />)

    await waitFor(() => {
      const badge = screen.getByText('2')
      expect(badge).toBeInTheDocument()
    })
  })

  it('should switch between tabs', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })

    render(<SharedListsPage />)

    await waitFor(() => {
      expect(screen.getByText('Solicitudes de Acceso')).toBeInTheDocument()
    })

    const myListsTab = screen.getByText('Mis Listas Compartidas')
    fireEvent.click(myListsTab)

    await waitFor(() => {
      expect(screen.getByText('Listas que me han compartido')).toBeInTheDocument()
    })
  })
})

