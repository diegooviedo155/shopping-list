import { GET } from '@/app/api/items/route'
import { createMockRequest, validateApiResponse, validateErrorResponse, validateSuccessResponse } from '../utils/test-utils'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(() => ({
        data: [],
        error: null,
      })),
    })),
  })),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('/api/items', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/items', () => {
    it('should return all items successfully', async () => {
      // Arrange
      const mockItems = [
        {
          id: '1',
          name: 'Leche',
          category: 'supermercado',
          status: 'este-mes',
          completed: false,
          order_index: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Manzanas',
          category: 'verduleria',
          status: 'proximo-mes',
          completed: true,
          order_index: 1,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ]

      mockSupabaseClient.from().select().order().data = mockItems
      const request = createMockRequest()

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual(mockItems)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('shopping_items')
      expect(mockSupabaseClient.from().select).toHaveBeenCalledWith('*')
      expect(mockSupabaseClient.from().select().order).toHaveBeenCalledWith('category', { ascending: true })
      expect(mockSupabaseClient.from().select().order().order).toHaveBeenCalledWith('order_index', { ascending: true })
    })

    it('should return empty array when no items exist', async () => {
      // Arrange
      mockSupabaseClient.from().select().order().data = []
      const request = createMockRequest()

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual([])
    })

    it('should handle Supabase query errors', async () => {
      // Arrange
      const mockError = new Error('Supabase query failed')
      mockSupabaseClient.from().select().order().error = mockError
      const request = createMockRequest()

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Error al cargar los productos')
      expect(data.error).toBe('Error al cargar los productos')
      expect(data.details).toBe('Supabase query failed')
    })

    it('should handle unexpected errors', async () => {
      // Arrange
      jest.spyOn(console, 'error').mockImplementation(() => {})
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Unexpected error')
      })
      const request = createMockRequest()

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Error al cargar los productos')
      expect(data.error).toBe('Error al cargar los productos')
      expect(data.details).toBe('Unexpected error')
    })

    it('should handle null data response', async () => {
      // Arrange
      mockSupabaseClient.from().select().order().data = null
      const request = createMockRequest()

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual([])
    })

    it('should order items by category and order_index', async () => {
      // Arrange
      const mockItems = [
        { id: '1', category: 'carniceria', order_index: 0 },
        { id: '2', category: 'supermercado', order_index: 1 },
        { id: '3', category: 'supermercado', order_index: 0 },
        { id: '4', category: 'verduleria', order_index: 0 },
      ]

      mockSupabaseClient.from().select().order().data = mockItems
      const request = createMockRequest()

      // Act
      const response = await GET()

      // Assert
      validateSuccessResponse(response)
      
      // Verify the order calls
      const orderCalls = mockSupabaseClient.from().select().order.mock.calls
      expect(orderCalls[0]).toEqual(['category', { ascending: true }])
      expect(orderCalls[1]).toEqual(['order_index', { ascending: true }])
    })
  })
})
