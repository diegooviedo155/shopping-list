/**
 * Tests para las API routes de shared-lists
 */

import { NextRequest } from 'next/server'
import { GET as getMyAccess } from '@/app/api/shared-lists/my-access/route'
import { GET as getItems } from '@/app/api/shared-lists/[ownerId]/items/route'
import { createServerClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

describe('Shared Lists API', () => {
  let mockSupabase: any
  let mockUser: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUser = {
      id: 'user-123',
      email: 'user@example.com',
    }

    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      in: jest.fn(() => mockSupabase),
      order: jest.fn(() => mockSupabase),
      single: jest.fn(() => mockSupabase),
    }

    mockCreateServerClient.mockResolvedValue(mockSupabase as any)
  })

  describe('GET /api/shared-lists/my-access', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost:3000/api/shared-lists/my-access')
      const response = await getMyAccess(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No autorizado')
    })

    it('should return shared lists for the authenticated user', async () => {
      const mockSharedLists = [
        {
          id: 'shared-1',
          list_owner_id: 'owner-123',
          member_id: 'user-123',
          list_name: 'Mi Lista',
          granted_at: '2024-01-01T00:00:00Z',
        },
      ]

      const mockProfiles = [
        {
          id: 'owner-123',
          email: 'owner@example.com',
          full_name: 'Owner Name',
        },
      ]

      // Mock shared lists query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockResolvedValueOnce({
              data: mockSharedLists,
              error: null,
            }),
          }),
        }),
      } as any)

      // Mock profiles query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          in: jest.fn().mockResolvedValueOnce({
            data: mockProfiles,
            error: null,
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/shared-lists/my-access')
      const response = await getMyAccess(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sharedLists).toHaveLength(1)
      expect(data.sharedLists[0].list_owner_id).toBe('owner-123')
      expect(data.sharedLists[0].owner_email).toBe('owner@example.com')
      expect(data.sharedLists[0].owner_name).toBe('Owner Name')
    })

    it('should handle missing profile gracefully', async () => {
      const mockSharedLists = [
        {
          id: 'shared-1',
          list_owner_id: 'owner-123',
          member_id: 'user-123',
          list_name: 'Mi Lista',
          granted_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockResolvedValueOnce({
              data: mockSharedLists,
              error: null,
            }),
          }),
        }),
      } as any)

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          in: jest.fn().mockResolvedValueOnce({
            data: [],
            error: null,
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/shared-lists/my-access')
      const response = await getMyAccess(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sharedLists[0].owner_email).toBe('usuario@ejemplo.com')
      expect(data.sharedLists[0].owner_name).toBe('Usuario')
    })

    it('should extract name from email if full_name is missing', async () => {
      const mockSharedLists = [
        {
          id: 'shared-1',
          list_owner_id: 'owner-123',
          member_id: 'user-123',
          list_name: 'Mi Lista',
          granted_at: '2024-01-01T00:00:00Z',
        },
      ]

      const mockProfiles = [
        {
          id: 'owner-123',
          email: 'juan@example.com',
          full_name: null,
        },
      ]

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockResolvedValueOnce({
              data: mockSharedLists,
              error: null,
            }),
          }),
        }),
      } as any)

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          in: jest.fn().mockResolvedValueOnce({
            data: mockProfiles,
            error: null,
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/shared-lists/my-access')
      const response = await getMyAccess(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sharedLists[0].owner_name).toBe('Juan')
    })

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            order: jest.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/shared-lists/my-access')
      const response = await getMyAccess(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Error al obtener listas compartidas')
    })
  })

  describe('GET /api/shared-lists/[ownerId]/items', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost:3000/api/shared-lists/owner-123/items')
      const response = await getItems(request, { params: Promise.resolve({ ownerId: 'owner-123' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No autorizado')
    })

    it('should return items if user has access', async () => {
      const mockAccess = {
        id: 'access-1',
        list_owner_id: 'owner-123',
        member_id: 'user-123',
      }

      const mockItems = [
        {
          id: 'item-1',
          user_id: 'owner-123',
          name: 'Producto 1',
          status: 'este_mes',
        },
      ]

      // Mock access check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: mockAccess,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      // Mock items query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              order: jest.fn().mockResolvedValueOnce({
                data: mockItems,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/shared-lists/owner-123/items')
      const response = await getItems(request, { params: Promise.resolve({ ownerId: 'owner-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('item-1')
      expect(data[0].status).toBe('este_mes')
    })

    it('should return 403 if user does not have access', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/shared-lists/owner-123/items')
      const response = await getItems(request, { params: Promise.resolve({ ownerId: 'owner-123' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('No tienes acceso a esta lista')
    })

    it('should only return items with status "este_mes"', async () => {
      const mockAccess = {
        id: 'access-1',
        list_owner_id: 'owner-123',
        member_id: 'user-123',
      }

      const mockItems = [
        {
          id: 'item-1',
          user_id: 'owner-123',
          name: 'Producto 1',
          status: 'este_mes',
        },
        {
          id: 'item-2',
          user_id: 'owner-123',
          name: 'Producto 2',
          status: 'proximo_mes',
        },
      ]

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: mockAccess,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              order: jest.fn().mockResolvedValueOnce({
                data: mockItems.filter(item => item.status === 'este_mes'),
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/shared-lists/owner-123/items')
      const response = await getItems(request, { params: Promise.resolve({ ownerId: 'owner-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.every((item: any) => item.status === 'este_mes')).toBe(true)
    })

    it('should handle database errors', async () => {
      const mockAccess = {
        id: 'access-1',
        list_owner_id: 'owner-123',
        member_id: 'user-123',
      }

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: mockAccess,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              order: jest.fn().mockResolvedValueOnce({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/shared-lists/owner-123/items')
      const response = await getItems(request, { params: Promise.resolve({ ownerId: 'owner-123' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Error al obtener items')
    })
  })
})

