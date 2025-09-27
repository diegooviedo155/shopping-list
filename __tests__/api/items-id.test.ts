import { PATCH } from '@/app/api/items/[id]/route'
import { createMockRequest, createMockContext, validateApiResponse, validateErrorResponse, validateSuccessResponse } from '../utils/test-utils'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
  })),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('/api/items/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('PATCH /api/items/[id]', () => {
    it('should update item completed status successfully', async () => {
      // Arrange
      const updateData = { completed: true }
      const updatedItem = {
        id: '1',
        name: 'Leche',
        category: 'supermercado',
        status: 'este-mes',
        completed: true,
        order_index: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      mockSupabaseClient.from().update().eq().select().single().data = updatedItem
      const request = createMockRequest(updateData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual(updatedItem)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('shopping_items')
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        completed: true,
        updated_at: expect.any(String),
      })
      expect(mockSupabaseClient.from().update().eq).toHaveBeenCalledWith('id', '1')
    })

    it('should update item status successfully', async () => {
      // Arrange
      const updateData = { status: 'proximo-mes' }
      const updatedItem = {
        id: '1',
        name: 'Leche',
        category: 'supermercado',
        status: 'proximo-mes',
        completed: false,
        order_index: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      mockSupabaseClient.from().update().eq().select().single().data = updatedItem
      const request = createMockRequest(updateData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual(updatedItem)
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        status: 'proximo-mes',
        updated_at: expect.any(String),
      })
    })

    it('should update both completed and status successfully', async () => {
      // Arrange
      const updateData = { completed: true, status: 'proximo-mes' }
      const updatedItem = {
        id: '1',
        name: 'Leche',
        category: 'supermercado',
        status: 'proximo-mes',
        completed: true,
        order_index: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      mockSupabaseClient.from().update().eq().select().single().data = updatedItem
      const request = createMockRequest(updateData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual(updatedItem)
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        completed: true,
        status: 'proximo-mes',
        updated_at: expect.any(String),
      })
    })

    it('should return 400 when no fields to update', async () => {
      // Arrange
      const updateData = {}
      const request = createMockRequest(updateData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 400, 'Se requiere al menos un campo para actualizar')
      expect(data.error).toBe('Se requiere al menos un campo para actualizar (completed o status)')
    })

    it('should return 400 when completed is undefined and status is empty', async () => {
      // Arrange
      const updateData = { completed: undefined, status: '' }
      const request = createMockRequest(updateData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 400, 'Se requiere al menos un campo para actualizar')
      expect(data.error).toBe('Se requiere al menos un campo para actualizar (completed o status)')
    })

    it('should handle only completed field', async () => {
      // Arrange
      const updateData = { completed: false }
      const updatedItem = {
        id: '1',
        name: 'Leche',
        category: 'supermercado',
        status: 'este-mes',
        completed: false,
        order_index: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      mockSupabaseClient.from().update().eq().select().single().data = updatedItem
      const request = createMockRequest(updateData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual(updatedItem)
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        completed: false,
        updated_at: expect.any(String),
      })
    })

    it('should handle only status field', async () => {
      // Arrange
      const updateData = { status: 'este-mes' }
      const updatedItem = {
        id: '1',
        name: 'Leche',
        category: 'supermercado',
        status: 'este-mes',
        completed: false,
        order_index: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      mockSupabaseClient.from().update().eq().select().single().data = updatedItem
      const request = createMockRequest(updateData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual(updatedItem)
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        status: 'este-mes',
        updated_at: expect.any(String),
      })
    })

    it('should handle Supabase update errors', async () => {
      // Arrange
      const updateData = { completed: true }
      const mockError = new Error('Supabase update failed')
      mockSupabaseClient.from().update().eq().select().single().error = mockError
      const request = createMockRequest(updateData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Error al actualizar el ítem')
      expect(data.error).toBe('Error al actualizar el ítem')
      expect(data.details).toBe('Supabase update failed')
    })

    it('should handle unexpected errors', async () => {
      // Arrange
      const updateData = { completed: true }
      jest.spyOn(console, 'error').mockImplementation(() => {})
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Unexpected error')
      })
      const request = createMockRequest(updateData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Error al actualizar el ítem')
      expect(data.error).toBe('Error al actualizar el ítem')
      expect(data.details).toBe('Unexpected error')
    })

    it('should handle JSON parsing errors', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/test', {
        method: 'PATCH',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      })
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request as any, context)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Error al actualizar el ítem')
    })

    it('should set updated_at timestamp', async () => {
      // Arrange
      const updateData = { completed: true }
      const updatedItem = {
        id: '1',
        name: 'Leche',
        category: 'supermercado',
        status: 'este-mes',
        completed: true,
        order_index: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      mockSupabaseClient.from().update().eq().select().single().data = updatedItem
      const request = createMockRequest(updateData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)

      // Assert
      validateSuccessResponse(response)
      const updateCall = mockSupabaseClient.from().update.mock.calls[0][0]
      expect(updateCall.updated_at).toBeDefined()
      expect(new Date(updateCall.updated_at)).toBeInstanceOf(Date)
    })

    it('should handle missing id parameter', async () => {
      // Arrange
      const updateData = { completed: true }
      const request = createMockRequest(updateData, 'PATCH')
      const context = createMockContext({ id: '' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Error al actualizar el ítem')
      expect(data.error).toBe('Error al actualizar el ítem')
    })
  })
})
