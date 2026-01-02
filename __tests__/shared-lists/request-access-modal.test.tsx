/**
 * Tests para el componente RequestAccessModal
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RequestAccessModal } from '@/components/shared-lists/request-access-modal'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/hooks/use-toast'

// Mock dependencies
jest.mock('@/components/auth/auth-provider')
jest.mock('@/hooks/use-toast')
jest.mock('@/lib/utils/request-queue')
jest.mock('@/lib/utils/auth-cache')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>

// Mock queuedFetch
const mockQueuedFetch = jest.fn()
jest.mock('@/lib/utils/request-queue', () => ({
  queuedFetch: (...args: any[]) => mockQueuedFetch(...args),
}))

// Mock getCachedAuthHeaders
const mockGetCachedAuthHeaders = jest.fn().mockResolvedValue({})
jest.mock('@/lib/utils/auth-cache', () => ({
  getCachedAuthHeaders: () => mockGetCachedAuthHeaders(),
}))

describe('RequestAccessModal', () => {
  const mockShowSuccess = jest.fn()
  const mockShowError = jest.fn()
  const mockOnClose = jest.fn()
  const mockUser = {
    id: 'requester-123',
    email: 'requester@example.com',
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

  it('should render modal when isOpen is true', () => {
    render(
      <RequestAccessModal
        isOpen={true}
        onClose={mockOnClose}
        listOwnerId="owner-123"
        listName="Mi Lista"
        ownerName="Juan"
      />
    )
    expect(screen.getByText('Solicitar Acceso')).toBeInTheDocument()
  })

  it('should not render modal when isOpen is false', () => {
    render(
      <RequestAccessModal
        isOpen={false}
        onClose={mockOnClose}
        listOwnerId="owner-123"
        listName="Mi Lista"
        ownerName="Juan"
      />
    )
    expect(screen.queryByText('Solicitar Acceso')).not.toBeInTheDocument()
  })

  it('should prefill requester name from email', () => {
    render(
      <RequestAccessModal
        isOpen={true}
        onClose={mockOnClose}
        listOwnerId="owner-123"
        listName="Mi Lista"
        ownerName="Juan"
      />
    )
    const nameInput = screen.getByLabelText(/Tu nombre/i) as HTMLInputElement
    expect(nameInput.value).toBe('requester')
  })

  it('should prefill default message', () => {
    render(
      <RequestAccessModal
        isOpen={true}
        onClose={mockOnClose}
        listOwnerId="owner-123"
        listName="Mi Lista"
        ownerName="Juan"
      />
    )
    const messageInput = screen.getByPlaceholderText(/Escribe un mensaje/i) as HTMLTextAreaElement
    expect(messageInput.value).toContain('Mi Lista')
  })

  it('should require requester name', async () => {
    render(
      <RequestAccessModal
        isOpen={true}
        onClose={mockOnClose}
        listOwnerId="owner-123"
        listName="Mi Lista"
        ownerName="Juan"
      />
    )
    const nameInput = screen.getByLabelText(/Tu nombre/i)
    fireEvent.change(nameInput, { target: { value: '' } })
    
    const submitButton = screen.getByText('Enviar Solicitud')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Error', 'Por favor ingresa tu nombre')
    })
  })

  it('should send access request successfully', async () => {
    mockQueuedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        request: {
          id: 'request-123',
          status: 'pending',
        },
      }),
    })

    render(
      <RequestAccessModal
        isOpen={true}
        onClose={mockOnClose}
        listOwnerId="owner-123"
        listName="Mi Lista"
        ownerName="Juan"
      />
    )
    
    const nameInput = screen.getByLabelText(/Tu nombre/i)
    fireEvent.change(nameInput, { target: { value: 'María García' } })
    
    const submitButton = screen.getByText('Enviar Solicitud')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockQueuedFetch).toHaveBeenCalledWith(
        '/api/access-requests',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            list_owner_id: 'owner-123',
            requester_id: 'requester-123',
            requester_email: 'requester@example.com',
            requester_name: 'María García',
            list_name: 'Mi Lista',
            message: expect.stringContaining('Mi Lista'),
          }),
        }),
        0
      )
    })
    
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Solicitud enviada',
        'Tu solicitud de acceso ha sido enviada correctamente'
      )
      expect(screen.getByText('¡Solicitud Enviada!')).toBeInTheDocument()
    })
  })

  it('should handle API error', async () => {
    mockQueuedFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Error al crear solicitud',
      }),
    })

    render(
      <RequestAccessModal
        isOpen={true}
        onClose={mockOnClose}
        listOwnerId="owner-123"
        listName="Mi Lista"
        ownerName="Juan"
      />
    )
    
    const nameInput = screen.getByLabelText(/Tu nombre/i)
    fireEvent.change(nameInput, { target: { value: 'María García' } })
    
    const submitButton = screen.getByText('Enviar Solicitud')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith('Error', 'Error al crear solicitud')
      expect(screen.getByText('Error al Enviar')).toBeInTheDocument()
    })
  })

  it('should allow retry after error', async () => {
    mockQueuedFetch
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Error al crear solicitud' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ request: { id: 'request-123' } }),
      })

    render(
      <RequestAccessModal
        isOpen={true}
        onClose={mockOnClose}
        listOwnerId="owner-123"
        listName="Mi Lista"
        ownerName="Juan"
      />
    )
    
    const nameInput = screen.getByLabelText(/Tu nombre/i)
    fireEvent.change(nameInput, { target: { value: 'María García' } })
    
    const submitButton = screen.getByText('Enviar Solicitud')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Error al Enviar')).toBeInTheDocument()
    })
    
    const retryButton = screen.getByText('Reintentar')
    fireEvent.click(retryButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enviar Solicitud')).toBeInTheDocument()
    })
  })

  it('should close modal on cancel', () => {
    render(
      <RequestAccessModal
        isOpen={true}
        onClose={mockOnClose}
        listOwnerId="owner-123"
        listName="Mi Lista"
        ownerName="Juan"
      />
    )
    
    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should reset form when modal is closed', () => {
    const { rerender } = render(
      <RequestAccessModal
        isOpen={true}
        onClose={mockOnClose}
        listOwnerId="owner-123"
        listName="Mi Lista"
        ownerName="Juan"
      />
    )
    
    const nameInput = screen.getByLabelText(/Tu nombre/i) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Test Name' } })
    
    // Close modal
    rerender(
      <RequestAccessModal
        isOpen={false}
        onClose={mockOnClose}
        listOwnerId="owner-123"
        listName="Mi Lista"
        ownerName="Juan"
      />
    )
    
    // Reopen modal
    rerender(
      <RequestAccessModal
        isOpen={true}
        onClose={mockOnClose}
        listOwnerId="owner-123"
        listName="Mi Lista"
        ownerName="Juan"
      />
    )
    
    const nameInputAfter = screen.getByLabelText(/Tu nombre/i) as HTMLInputElement
    expect(nameInputAfter.value).toBe('requester') // Should be reset
  })

  it('should show loading state while submitting', async () => {
    let resolveRequest: (value: any) => void
    const pendingRequest = new Promise((resolve) => {
      resolveRequest = resolve
    })
    mockQueuedFetch.mockReturnValue(pendingRequest)

    render(
      <RequestAccessModal
        isOpen={true}
        onClose={mockOnClose}
        listOwnerId="owner-123"
        listName="Mi Lista"
        ownerName="Juan"
      />
    )
    
    const nameInput = screen.getByLabelText(/Tu nombre/i)
    fireEvent.change(nameInput, { target: { value: 'María García' } })
    
    const submitButton = screen.getByText('Enviar Solicitud')
    fireEvent.click(submitButton)
    
    expect(screen.getByText('Enviando...')).toBeInTheDocument()
    
    // Resolve the request
    resolveRequest!({
      ok: true,
      json: async () => ({ request: { id: 'request-123' } }),
    })
    
    await waitFor(() => {
      expect(screen.queryByText('Enviando...')).not.toBeInTheDocument()
    })
  })

  it('should use default values when props are not provided', () => {
    render(
      <RequestAccessModal
        isOpen={true}
        onClose={mockOnClose}
        listOwnerId="owner-123"
      />
    )
    
    expect(screen.getByText(/Solicita acceso a la lista de compras de Usuario/i)).toBeInTheDocument()
    const messageInput = screen.getByPlaceholderText(/Escribe un mensaje/i) as HTMLTextAreaElement
    expect(messageInput.value).toContain('Mi Lista Personal')
  })
})

