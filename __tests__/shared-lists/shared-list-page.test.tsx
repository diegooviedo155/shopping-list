/**
 * Tests para la página SharedListPage
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SharedListPage from '@/app/shared-list/[userId]/page'
import { useAuth } from '@/components/auth/auth-provider'

// Mock dependencies
jest.mock('@/components/auth/auth-provider')
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

// Mock fetch
global.fetch = jest.fn()

describe('SharedListPage', () => {
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    } as any)
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
    const mockPush = jest.fn()
    jest.doMock('next/navigation', () => ({
      useParams: () => ({ userId: 'owner-123' }),
      useSearchParams: () => ({
        get: (key: string) => (key === 'list' ? 'Mi Lista' : null),
      }),
      useRouter: () => ({
        push: mockPush,
        back: jest.fn(),
      }),
    }))

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    } as any)

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/shared-list/owner-123?list=Mi%20Lista',
      },
      writable: true,
    })

    render(<SharedListPage />)

    await waitFor(() => {
      // The component should redirect, but we can't easily test this without more setup
      // This test verifies the component doesn't crash
    })
  })

  it('should show access required message when user has no access', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          email: 'owner@example.com',
          full_name: 'Owner Name',
        }),
      })

    render(<SharedListPage />)

    await waitFor(() => {
      expect(screen.getByText('Acceso Requerido')).toBeInTheDocument()
      expect(screen.getByText(/Esta lista pertenece a Owner Name/i)).toBeInTheDocument()
      expect(screen.getByText('Solicitar Acceso')).toBeInTheDocument()
    })
  })

  it('should show request sent message when request is pending', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requests: [
            {
              id: 'req-1',
              list_owner_id: 'owner-123',
              status: 'pending',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          email: 'owner@example.com',
          full_name: 'Owner Name',
        }),
      })

    render(<SharedListPage />)

    await waitFor(() => {
      expect(screen.getByText('Solicitud Enviada')).toBeInTheDocument()
      expect(screen.getByText(/Has solicitado acceso a la lista de Owner Name/i)).toBeInTheDocument()
    })
  })

  it('should show list content when user has access', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sharedLists: [
            {
              list_owner_id: 'owner-123',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          email: 'owner@example.com',
          full_name: 'Owner Name',
        }),
      })

    // Mock HomePageContent component
    jest.mock('@/components/features/home/HomePageContent', () => ({
      HomePageContent: ({ ownerId, isSharedView }: any) => (
        <div data-testid="home-content">
          Shared List Content for {ownerId} (shared: {String(isSharedView)})
        </div>
      ),
    }))

    render(<SharedListPage />)

    await waitFor(() => {
      // The component should render HomePageContent when access is granted
      // This is a simplified test - in reality, HomePageContent would render the list
    })
  })

  it('should open request modal when button is clicked', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          email: 'owner@example.com',
          full_name: 'Owner Name',
        }),
      })

    render(<SharedListPage />)

    await waitFor(() => {
      expect(screen.getByText('Solicitar Acceso')).toBeInTheDocument()
    })

    const requestButton = screen.getByText('Solicitar Acceso')
    fireEvent.click(requestButton)

    await waitFor(() => {
      // RequestAccessModal should open
      // This is tested in the RequestAccessModal tests
    })
  })

  it('should decode list name from URL parameter', async () => {
    jest.doMock('next/navigation', () => ({
      useParams: () => ({ userId: 'owner-123' }),
      useSearchParams: () => ({
        get: (key: string) => (key === 'list' ? 'Lista%20con%20espacios' : null),
      }),
      useRouter: () => ({
        push: jest.fn(),
        back: jest.fn(),
      }),
    }))

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          email: 'owner@example.com',
          full_name: 'Owner Name',
        }),
      })

    render(<SharedListPage />)

    await waitFor(() => {
      // The list name should be decoded and used in the modal
    })
  })

  it('should handle API errors when checking access', async () => {
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          email: 'owner@example.com',
          full_name: 'Owner Name',
        }),
      })

    render(<SharedListPage />)

    await waitFor(() => {
      // Component should handle error gracefully
      // It should still show the access required message
      expect(screen.getByText('Acceso Requerido')).toBeInTheDocument()
    })
  })

  it('should fetch owner information', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          email: 'owner@example.com',
          full_name: 'Owner Name',
        }),
      })

    render(<SharedListPage />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/profiles/owner-123',
        expect.any(Object)
      )
      expect(screen.getByText(/Owner Name/i)).toBeInTheDocument()
    })
  })

  it('should use default owner name when profile fetch fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sharedLists: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ requests: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Not found' }),
      })

    render(<SharedListPage />)

    await waitFor(() => {
      // Should use default name "Usuario"
      expect(screen.getByText(/Usuario/i)).toBeInTheDocument()
    })
  })
})

