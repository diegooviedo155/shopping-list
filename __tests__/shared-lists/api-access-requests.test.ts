/**
 * Tests para las API routes de access-requests
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/access-requests/route'
import { PUT, DELETE } from '@/app/api/access-requests/[id]/route'
import { createServerClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server')

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

describe('Access Requests API', () => {
  let mockSupabase: any
  let mockUser: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      user_metadata: { full_name: 'Test User' },
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
      insert: jest.fn(() => mockSupabase),
      update: jest.fn(() => mockSupabase),
      delete: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      in: jest.fn(() => mockSupabase),
      order: jest.fn(() => mockSupabase),
      single: jest.fn(() => mockSupabase),
    }

    mockCreateServerClient.mockResolvedValue(mockSupabase as any)
  })

  describe('GET /api/access-requests', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost:3000/api/access-requests?type=owner')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      
      // Debug: check what we're getting
      const text = await response.text()
      const data = text ? JSON.parse(text) : null
      
      expect(data).toBeTruthy()
      expect(data?.error).toBe('No autorizado')
    })

    it('should return access requests for owner', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          list_owner_id: 'user-123',
          requester_id: 'requester-1',
          requester_email: 'requester1@example.com',
          requester_name: 'Requester 1',
          list_name: 'Mi Lista',
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockResolvedValueOnce({
              data: mockRequests,
              error: null,
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/access-requests?type=owner')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.requests).toHaveLength(1)
      expect(data.requests[0].id).toBe('req-1')
    })

    it('should return access requests for requester', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          list_owner_id: 'owner-1',
          requester_id: 'user-123',
          requester_email: 'user@example.com',
          requester_name: 'Test User',
          list_name: 'Mi Lista',
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockResolvedValueOnce({
              data: mockRequests,
              error: null,
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/access-requests?type=requester')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.requests).toHaveLength(1)
    })

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          order: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/access-requests?type=owner')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Error al obtener solicitudes')
    })
  })

  describe('POST /api/access-requests', () => {
    it('should create a new access request', async () => {
      const newRequest = {
        id: 'req-new',
        list_owner_id: 'owner-123',
        requester_id: 'user-123',
        requester_email: 'user@example.com',
        requester_name: 'Test User',
        list_name: 'Mi Lista',
        status: 'pending',
      }

      // Mock check for existing request
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockReturnValueOnce({
                single: jest.fn().mockResolvedValueOnce({
                  data: null,
                  error: { code: 'PGRST116' }, // Not found
                }),
              }),
            }),
          }),
        }),
      } as any)

      // Mock insert
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: newRequest,
              error: null,
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/access-requests', {
        method: 'POST',
        body: JSON.stringify({
          list_owner_id: 'owner-123',
          requester_email: 'user@example.com',
          requester_name: 'Test User',
          list_name: 'Mi Lista',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.request.id).toBe('req-new')
    })

    it('should return 400 if required fields are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/access-requests', {
        method: 'POST',
        body: JSON.stringify({
          requester_email: 'user@example.com',
          // Missing list_owner_id
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Datos requeridos faltantes')
    })

    it('should return 409 if request already exists', async () => {
      const existingRequest = {
        id: 'req-existing',
        list_owner_id: 'owner-123',
        requester_id: 'user-123',
        status: 'pending',
      }

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockReturnValueOnce({
                single: jest.fn().mockResolvedValueOnce({
                  data: existingRequest,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/access-requests', {
        method: 'POST',
        body: JSON.stringify({
          list_owner_id: 'owner-123',
          requester_email: 'user@example.com',
          list_name: 'Mi Lista',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Ya tienes una solicitud pendiente para esta lista')
    })

    it('should handle database errors on insert', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            eq: jest.fn().mockReturnValueOnce({
              eq: jest.fn().mockReturnValueOnce({
                single: jest.fn().mockResolvedValueOnce({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              }),
            }),
          }),
        }),
      } as any)

      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/access-requests', {
        method: 'POST',
        body: JSON.stringify({
          list_owner_id: 'owner-123',
          requester_email: 'user@example.com',
          list_name: 'Mi Lista',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Error al crear solicitud')
    })
  })

  describe('PUT /api/access-requests/[id]', () => {
    it('should update access request status', async () => {
      const existingRequest = {
        id: 'req-1',
        list_owner_id: 'user-123',
      }

      const updatedRequest = {
        ...existingRequest,
        status: 'approved',
      }

      // Mock fetch existing request
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: existingRequest,
              error: null,
            }),
          }),
        }),
      } as any)

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({
                data: updatedRequest,
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/access-requests/req-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'req-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.request.status).toBe('approved')
    })

    it('should return 403 if user is not the owner', async () => {
      const existingRequest = {
        id: 'req-1',
        list_owner_id: 'other-user',
      }

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: existingRequest,
              error: null,
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/access-requests/req-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'req-1' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('No autorizado para modificar esta solicitud')
    })

    it('should return 404 if request not found', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/access-requests/req-1', {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' }),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'req-1' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Solicitud no encontrada')
    })
  })

  describe('DELETE /api/access-requests/[id]', () => {
    it('should delete access request', async () => {
      const existingRequest = {
        id: 'req-1',
        list_owner_id: 'user-123',
      }

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: existingRequest,
              error: null,
            }),
          }),
        }),
      } as any)

      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockResolvedValueOnce({
            error: null,
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/access-requests/req-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'req-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 403 if user is not the owner', async () => {
      const existingRequest = {
        id: 'req-1',
        list_owner_id: 'other-user',
      }

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({
              data: existingRequest,
              error: null,
            }),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/access-requests/req-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'req-1' }) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('No autorizado para eliminar esta solicitud')
    })
  })
})

