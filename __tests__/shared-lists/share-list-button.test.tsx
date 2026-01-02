/**
 * Tests para el componente ShareListButton
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ShareListButton } from '@/components/shared-lists/share-list-button'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/hooks/use-toast'

// Mock dependencies
jest.mock('@/components/auth/auth-provider')
jest.mock('@/hooks/use-toast')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>

describe('ShareListButton', () => {
  const mockShowSuccess = jest.fn()
  const mockShowError = jest.fn()
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
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

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
      },
      writable: true,
    })

    // Mock window.open
    window.open = jest.fn()
  })

  it('should render the share button', () => {
    render(<ShareListButton listName="Mi Lista" />)
    expect(screen.getByText('Compartir Lista')).toBeInTheDocument()
  })

  it('should open dialog when button is clicked', () => {
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    expect(screen.getByText(/Compartir "Mi Lista"/)).toBeInTheDocument()
  })

  it('should show WhatsApp and Link options', () => {
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Enlace')).toBeInTheDocument()
  })

  it('should generate correct share link with user ID', () => {
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    // Switch to link method
    const linkButton = screen.getByText('Enlace')
    fireEvent.click(linkButton)
    
    const input = screen.getByDisplayValue(
      /http:\/\/localhost:3000\/shared-list\/user-123\?list=Mi%20Lista/
    )
    expect(input).toBeInTheDocument()
  })

  it('should generate share link without user ID when user is null', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    } as any)

    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const linkButton = screen.getByText('Enlace')
    fireEvent.click(linkButton)
    
    const input = screen.getByDisplayValue(
      /http:\/\/localhost:3000\/request-access\?list=Mi%20Lista/
    )
    expect(input).toBeInTheDocument()
  })

  it('should share via WhatsApp when WhatsApp method is selected', () => {
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const shareButton = screen.getByText('Compartir por WhatsApp')
    fireEvent.click(shareButton)
    
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/?text='),
      '_blank'
    )
    expect(mockShowSuccess).toHaveBeenCalledWith('Éxito', 'Enlace compartido por WhatsApp')
  })

  it('should include custom message in WhatsApp share', () => {
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const textarea = screen.getByPlaceholderText('Agrega un mensaje personalizado...')
    fireEvent.change(textarea, { target: { value: 'Mensaje personalizado' } })
    
    const shareButton = screen.getByText('Compartir por WhatsApp')
    fireEvent.click(shareButton)
    
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('Mensaje personalizado')),
      '_blank'
    )
  })

  it('should copy link to clipboard when link method is selected', async () => {
    // Mock document.execCommand
    document.execCommand = jest.fn().mockReturnValue(true)
    
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const linkButton = screen.getByText('Enlace')
    fireEvent.click(linkButton)
    
    const copyButton = screen.getByText('Copiar Enlace')
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(document.execCommand).toHaveBeenCalledWith('copy')
      expect(mockShowSuccess).toHaveBeenCalledWith('Éxito', 'Enlace copiado al portapapeles')
    })
  })

  it('should handle copy failure gracefully', async () => {
    // Mock document.execCommand to return false
    document.execCommand = jest.fn().mockReturnValue(false)
    
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const linkButton = screen.getByText('Enlace')
    fireEvent.click(linkButton)
    
    const copyButton = screen.getByText('Copiar Enlace')
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        'Error',
        'No se pudo copiar. Selecciona el enlace y usa Ctrl+C.'
      )
    })
  })

  it('should switch between WhatsApp and Link methods', () => {
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    // Initially WhatsApp should be selected
    const whatsappButton = screen.getByText('WhatsApp').closest('button')
    expect(whatsappButton).toHaveClass('bg-primary')
    
    // Switch to Link
    const linkButton = screen.getByText('Enlace')
    fireEvent.click(linkButton)
    
    // Link should now be selected
    const linkButtonElement = linkButton.closest('button')
    expect(linkButtonElement).toHaveClass('bg-primary')
  })

  it('should close dialog when cancel is clicked', () => {
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    expect(screen.getByText(/Compartir "Mi Lista"/)).toBeInTheDocument()
    
    const cancelButton = screen.getByText('Cancelar')
    fireEvent.click(cancelButton)
    
    expect(screen.queryByText(/Compartir "Mi Lista"/)).not.toBeInTheDocument()
  })

  it('should use default list name when not provided', () => {
    render(<ShareListButton />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    expect(screen.getByText(/Compartir "Mi Lista"/)).toBeInTheDocument()
  })

  it('should encode list name in URL', () => {
    render(<ShareListButton listName="Lista con espacios y símbolos & más" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const linkButton = screen.getByText('Enlace')
    fireEvent.click(linkButton)
    
    const input = screen.getByDisplayValue(
      expect.stringContaining(encodeURIComponent('Lista con espacios y símbolos & más'))
    )
    expect(input).toBeInTheDocument()
  })
})

