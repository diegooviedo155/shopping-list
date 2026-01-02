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
  const mockProfile = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Juan Pérez',
  }

  // Store original env
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset env
    process.env = { ...originalEnv }
    delete process.env.NEXT_PUBLIC_APP_URL

    mockUseToast.mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
    })
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      loading: false,
    } as any)

    // JSDOM already sets location.origin to 'http://localhost' by default
    // We don't need to modify it, the code will use it as fallback
    // For tests that need NEXT_PUBLIC_APP_URL, we'll set it in the test itself

    // Mock window.open
    window.open = jest.fn()

    // Mock navigator.clipboard
    global.navigator.clipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    } as any
  })

  afterEach(() => {
    process.env = originalEnv
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
    
    // JSDOM uses 'http://localhost' by default
    const input = screen.getByDisplayValue(
      /http:\/\/localhost\/shared-list\/user-123\?list=Mi%20Lista/
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
    
    // JSDOM uses 'http://localhost' by default
    const input = screen.getByDisplayValue(
      /http:\/\/localhost\/request-access\?list=Mi%20Lista/
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
    // Use navigator.clipboard (modern API)
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const linkButton = screen.getByText('Enlace')
    fireEvent.click(linkButton)
    
    const copyButton = screen.getByText('Copiar Enlace')
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
      expect(mockShowSuccess).toHaveBeenCalledWith('Éxito', 'Enlace copiado al portapapeles')
    })
  })

  it('should handle copy failure gracefully', async () => {
    // Mock clipboard to throw error, then fallback to execCommand that fails
    global.navigator.clipboard = {
      writeText: jest.fn().mockRejectedValue(new Error('Clipboard error')),
    } as any
    
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
    
    const encodedName = encodeURIComponent('Lista con espacios y símbolos & más')
    const input = screen.getByDisplayValue(
      new RegExp(encodedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    )
    expect(input).toBeInTheDocument()
    expect((input as HTMLInputElement).value).toContain(encodedName)
  })

  it('should use NEXT_PUBLIC_APP_URL when available', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://loquefalta.app'
    
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const linkButton = screen.getByText('Enlace')
    fireEvent.click(linkButton)
    
    const input = screen.getByDisplayValue(
      /https:\/\/loquefalta\.app\/shared-list\/user-123\?list=Mi%20Lista/
    )
    expect(input).toBeInTheDocument()
  })

  it('should fallback to window.location.origin when NEXT_PUBLIC_APP_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const linkButton = screen.getByText('Enlace')
    fireEvent.click(linkButton)
    
    // JSDOM uses 'http://localhost' by default
    const input = screen.getByDisplayValue(
      /http:\/\/localhost\/shared-list\/user-123\?list=Mi%20Lista/
    )
    expect(input).toBeInTheDocument()
  })

  it('should include owner name in WhatsApp message', () => {
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const shareButton = screen.getByText('Compartir por WhatsApp')
    fireEvent.click(shareButton)
    
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('Juan Pérez')),
      '_blank'
    )
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('Lo Que Falta')),
      '_blank'
    )
  })

  it('should use email username when profile full_name is not available', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: { ...mockProfile, full_name: null },
      loading: false,
    } as any)

    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const shareButton = screen.getByText('Compartir por WhatsApp')
    fireEvent.click(shareButton)
    
    // Should use email username (test)
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('test')),
      '_blank'
    )
  })

  it('should use navigator.clipboard when available', async () => {
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const linkButton = screen.getByText('Enlace')
    fireEvent.click(linkButton)
    
    const copyButton = screen.getByText('Copiar Enlace')
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost/shared-list/user-123?list=Mi%20Lista')
      )
      expect(mockShowSuccess).toHaveBeenCalledWith('Éxito', 'Enlace copiado al portapapeles')
    })
  })

  it('should fallback to execCommand when clipboard API is not available', async () => {
    // Remove clipboard API
    delete (global.navigator as any).clipboard
    
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

  it('should handle clipboard API errors gracefully', async () => {
    // Mock clipboard to throw error
    global.navigator.clipboard = {
      writeText: jest.fn().mockRejectedValue(new Error('Clipboard error')),
    } as any
    
    // Mock document.execCommand as fallback
    document.execCommand = jest.fn().mockReturnValue(true)
    
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

  it('should include proper WhatsApp message format with emojis', () => {
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const shareButton = screen.getByText('Compartir por WhatsApp')
    fireEvent.click(shareButton)
    
    const callArgs = (window.open as jest.Mock).mock.calls[0][0]
    const decodedMessage = decodeURIComponent(callArgs.split('text=')[1])
    
    expect(decodedMessage).toContain('👋')
    expect(decodedMessage).toContain('🔗')
    expect(decodedMessage).toContain('✨')
    expect(decodedMessage).toContain('Juan Pérez')
    expect(decodedMessage).toContain('Mi Lista')
    expect(decodedMessage).toContain('Lo Que Falta')
    expect(decodedMessage).toContain('agregar productos pero no editarlos')
  })

  it('should use custom message when provided in WhatsApp', () => {
    render(<ShareListButton listName="Mi Lista" />)
    const button = screen.getByText('Compartir Lista')
    fireEvent.click(button)
    
    const textarea = screen.getByPlaceholderText('Agrega un mensaje personalizado...')
    fireEvent.change(textarea, { target: { value: 'Mensaje personalizado de prueba' } })
    
    const shareButton = screen.getByText('Compartir por WhatsApp')
    fireEvent.click(shareButton)
    
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('Mensaje personalizado de prueba')),
      '_blank'
    )
  })
})

