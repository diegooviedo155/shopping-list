import { GET } from '@/app/api/categories/[category]/route'
import { createMockRequest, createMockContext, validateApiResponse, validateErrorResponse, validateSuccessResponse } from '../utils/test-utils'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  })),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('/api/categories/[category]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/categories/[category]', () => {
    it('should return items for a specific category successfully', async () => {
      // Arrange
      const categoryItems = [
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
          name: 'Pan',
          category: 'supermercado',
          status: 'proximo-mes',
          completed: true,
          order_index: 1,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ]

      mockSupabaseClient.from().select().eq().order().data = categoryItems
      const request = createMockRequest()
      const context = createMockContext({ category: 'supermercado' })

      // Act
      const response = await GET(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual(categoryItems)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('shopping_items')
      expect(mockSupabaseClient.from().select).toHaveBeenCalledWith('*')
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('category', 'supermercado')
      expect(mockSupabaseClient.from().select().eq().order).toHaveBeenCalledWith('order_index', { ascending: true })
    })

    it('should handle URL encoded category names', async () => {
      // Arrange
      const categoryItems = [
        {
          id: '1',
          name: 'Frutas',
          category: 'verdulería',
          status: 'este-mes',
          completed: false,
          order_index: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockSupabaseClient.from().select().eq().order().data = categoryItems
      const request = createMockRequest()
      const context = createMockContext({ category: 'verduler%C3%ADa' }) // URL encoded

      // Act
      const response = await GET(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual(categoryItems)
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('category', 'verdulería') // Should be decoded
    })

    it('should return empty array when no items exist for category', async () => {
      // Arrange
      mockSupabaseClient.from().select().eq().order().data = []
      const request = createMockRequest()
      const context = createMockContext({ category: 'carniceria' })

      // Act
      const response = await GET(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual([])
    })

    it('should return empty array when data is null', async () => {
      // Arrange
      mockSupabaseClient.from().select().eq().order().data = null
      const request = createMockRequest()
      const context = createMockContext({ category: 'supermercado' })

      // Act
      const response = await GET(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual([])
    })

    it('should handle Supabase query errors', async () => {
      // Arrange
      const mockError = new Error('Supabase query failed')
      mockSupabaseClient.from().select().eq().order().error = mockError
      const request = createMockRequest()
      const context = createMockContext({ category: 'supermercado' })

      // Act
      const response = await GET(request, context)
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
      const context = createMockContext({ category: 'supermercado' })

      // Act
      const response = await GET(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Error al cargar los productos')
      expect(data.error).toBe('Error al cargar los productos')
      expect(data.details).toBe('Unexpected error')
    })

    it('should handle missing category parameter', async () => {
      // Arrange
      const request = createMockRequest()
      const context = createMockContext({ category: '' })

      // Act
      const response = await GET(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Error al cargar los productos')
      expect(data.error).toBe('Error al cargar los productos')
    })

    it('should handle special characters in category names', async () => {
      // Arrange
      const categoryItems = [
        {
          id: '1',
          name: 'Producto',
          category: 'categoría-con-acentos',
          status: 'este-mes',
          completed: false,
          order_index: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockSupabaseClient.from().select().eq().order().data = categoryItems
      const request = createMockRequest()
      const context = createMockContext({ category: 'categor%C3%ADa-con-acentos' })

      // Act
      const response = await GET(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual(categoryItems)
      expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('category', 'categoría-con-acentos')
    })

    it('should order items by order_index ascending', async () => {
      // Arrange
      const categoryItems = [
        { id: '1', name: 'Item 1', category: 'supermercado', order_index: 2 },
        { id: '2', name: 'Item 2', category: 'supermercado', order_index: 0 },
        { id: '3', name: 'Item 3', category: 'supermercado', order_index: 1 },
      ]

      mockSupabaseClient.from().select().eq().order().data = categoryItems
      const request = createMockRequest()
      const context = createMockContext({ category: 'supermercado' })

      // Act
      const response = await GET(request, context)

      // Assert
      validateSuccessResponse(response)
      expect(mockSupabaseClient.from().select().eq().order).toHaveBeenCalledWith('order_index', { ascending: true })
    })

    it('should handle different category types', async () => {
      // Test with different valid categories
      const categories = ['supermercado', 'verduleria', 'carniceria', 'farmacia', 'otro']
      
      for (const category of categories) {
        // Arrange
        mockSupabaseClient.from().select().eq().order().data = []
        const request = createMockRequest()
        const context = createMockContext({ category })

        // Act
        const response = await GET(request, context)

        // Assert
        validateSuccessResponse(response)
        expect(mockSupabaseClient.from().select().eq).toHaveBeenCalledWith('category', category)
      }
    })
  })
})
