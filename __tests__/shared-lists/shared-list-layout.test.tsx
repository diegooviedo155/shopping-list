/**
 * Tests para el layout de shared-list que genera metadata dinámica
 */

import { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'

// Mock dependencies
jest.mock('@/lib/supabase/server')

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

describe('SharedListLayout - generateMetadata', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = 'https://loquefalta.app'
    
    mockCreateServerClient.mockResolvedValue(mockSupabase as any)
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  it('should generate metadata with owner information', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'juan@example.com',
      full_name: 'Juan Pérez',
    }

    mockSupabase.single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    // Import the function dynamically to get the latest version
    const { generateMetadata } = await import('@/app/shared-list/[userId]/layout')
    
    const metadata = await generateMetadata({
      params: Promise.resolve({ userId: 'user-123' }),
    })

    expect(metadata.title).toBe('Lista de Compras - Juan Pérez | Lo Que Falta')
    expect(metadata.description).toBe('Lista de compras compartida por Juan Pérez. Colabora en esta lista y nunca olvides lo que necesitas comprar.')
    expect(metadata.openGraph?.title).toBe('Lista de Compras - Juan Pérez | Lo Que Falta')
    expect(metadata.openGraph?.description).toBe('Lista de compras compartida por Juan Pérez. Colabora en esta lista y nunca olvides lo que necesitas comprar.')
    expect(metadata.openGraph?.url).toBe('https://loquefalta.app/shared-list/user-123')
    expect(metadata.openGraph?.siteName).toBe('Lo Que Falta')
    expect(metadata.openGraph?.type).toBe('website')
  })

  it('should use email username when full_name is not available', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'test@example.com',
      full_name: null,
    }

    mockSupabase.single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    const { generateMetadata } = await import('@/app/shared-list/[userId]/layout')
    
    const metadata = await generateMetadata({
      params: Promise.resolve({ userId: 'user-123' }),
    })

    expect(metadata.title).toBe('Lista de Compras - test | Lo Que Falta')
    expect(metadata.description).toContain('test')
  })

  it('should use default values when profile is not found', async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    })

    const { generateMetadata } = await import('@/app/shared-list/[userId]/layout')
    
    const metadata = await generateMetadata({
      params: Promise.resolve({ userId: 'user-123' }),
    })

    expect(metadata.title).toBe('Lista de Compras - Usuario | Lo Que Falta')
    expect(metadata.description).toContain('Usuario')
  })

  it('should use localhost when NEXT_PUBLIC_APP_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL

    const mockProfile = {
      id: 'user-123',
      email: 'juan@example.com',
      full_name: 'Juan Pérez',
    }

    mockSupabase.single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    const { generateMetadata } = await import('@/app/shared-list/[userId]/layout')
    
    const metadata = await generateMetadata({
      params: Promise.resolve({ userId: 'user-123' }),
    })

    expect(metadata.openGraph?.url).toBe('http://localhost:3000/shared-list/user-123')
  })

  it('should include Open Graph images', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'juan@example.com',
      full_name: 'Juan Pérez',
    }

    mockSupabase.single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    const { generateMetadata } = await import('@/app/shared-list/[userId]/layout')
    
    const metadata = await generateMetadata({
      params: Promise.resolve({ userId: 'user-123' }),
    })

    expect(metadata.openGraph?.images).toBeDefined()
    expect(Array.isArray(metadata.openGraph?.images)).toBe(true)
    if (metadata.openGraph?.images && Array.isArray(metadata.openGraph.images)) {
      expect(metadata.openGraph.images[0]).toMatchObject({
        url: '/apple-splash-2048-1536.jpg',
        width: 2048,
        height: 1536,
        alt: 'Lista de Compras - Juan Pérez',
      })
    }
  })

  it('should include Twitter card metadata', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'juan@example.com',
      full_name: 'Juan Pérez',
    }

    mockSupabase.single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    const { generateMetadata } = await import('@/app/shared-list/[userId]/layout')
    
    const metadata = await generateMetadata({
      params: Promise.resolve({ userId: 'user-123' }),
    })

    expect(metadata.twitter?.card).toBe('summary_large_image')
    expect(metadata.twitter?.title).toBe('Lista de Compras - Juan Pérez | Lo Que Falta')
    expect(metadata.twitter?.description).toBe('Lista de compras compartida por Juan Pérez. Colabora en esta lista y nunca olvides lo que necesitas comprar.')
    expect(metadata.twitter?.images).toEqual(['/apple-splash-2048-1536.jpg'])
  })

  it('should include canonical URL', async () => {
    const mockProfile = {
      id: 'user-123',
      email: 'juan@example.com',
      full_name: 'Juan Pérez',
    }

    mockSupabase.single.mockResolvedValue({
      data: mockProfile,
      error: null,
    })

    const { generateMetadata } = await import('@/app/shared-list/[userId]/layout')
    
    const metadata = await generateMetadata({
      params: Promise.resolve({ userId: 'user-123' }),
    })

    expect(metadata.alternates?.canonical).toBe('https://loquefalta.app/shared-list/user-123')
  })

  it('should handle database errors gracefully', async () => {
    mockSupabase.single.mockRejectedValue(new Error('Database error'))

    const { generateMetadata } = await import('@/app/shared-list/[userId]/layout')
    
    // Should not throw, should use default values
    const metadata = await generateMetadata({
      params: Promise.resolve({ userId: 'user-123' }),
    })

    expect(metadata.title).toBe('Lista de Compras - Usuario | Lo Que Falta')
  })
})

