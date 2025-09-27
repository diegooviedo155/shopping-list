import { GET, POST } from '@/app/api/shopping-items/route'
import { setupPrismaMocks, createMockRequest, mockShoppingItems, mockCreateItemData, validateApiResponse, validateErrorResponse, validateSuccessResponse } from '../utils/test-utils'

describe('/api/shopping-items', () => {
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = setupPrismaMocks()
  })

  describe('GET /api/shopping-items', () => {
    it('should return all shopping items successfully', async () => {
      // Arrange
      mockPrisma.shoppingItem.findMany.mockResolvedValue(mockShoppingItems)
      const request = createMockRequest()

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toHaveLength(3)
      expect(data[0]).toMatchObject({
        id: '1',
        name: 'Leche',
        category: 'supermercado',
        status: 'este-mes', // Converted from 'este_mes'
        completed: false,
        orderIndex: 0,
      })
      expect(mockPrisma.shoppingItem.findMany).toHaveBeenCalledWith({
        orderBy: { orderIndex: 'asc' },
      })
    })

    it('should return empty array when no items exist', async () => {
      // Arrange
      mockPrisma.shoppingItem.findMany.mockResolvedValue([])
      const request = createMockRequest()

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual([])
    })

    it('should handle database connection errors', async () => {
      // Arrange
      mockPrisma.$connect.mockRejectedValue(new Error('Connection failed'))
      const request = createMockRequest()

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Failed to fetch shopping items')
      expect(data.error).toBe('Failed to fetch shopping items')
      expect(data.details).toBe('Connection failed')
    })

    it('should handle database query errors', async () => {
      // Arrange
      mockPrisma.shoppingItem.findMany.mockRejectedValue(new Error('Query failed'))
      const request = createMockRequest()

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Failed to fetch shopping items')
      expect(data.error).toBe('Failed to fetch shopping items')
      expect(data.details).toBe('Query failed')
    })

    it('should convert database status format to frontend format', async () => {
      // Arrange
      const itemsWithDbStatus = [
        { ...mockShoppingItems[0], status: 'este_mes' },
        { ...mockShoppingItems[1], status: 'proximo_mes' },
      ]
      mockPrisma.shoppingItem.findMany.mockResolvedValue(itemsWithDbStatus)
      const request = createMockRequest()

      // Act
      const response = await GET()
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data[0].status).toBe('este-mes')
      expect(data[1].status).toBe('proximo-mes')
    })
  })

  describe('POST /api/shopping-items', () => {
    it('should create a new shopping item successfully', async () => {
      // Arrange
      const newItem = {
        id: '4',
        name: 'Pan',
        category: 'supermercado',
        status: 'este_mes',
        completed: false,
        orderIndex: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockPrisma.shoppingItem.findFirst.mockResolvedValue({ orderIndex: 2 })
      mockPrisma.shoppingItem.create.mockResolvedValue(newItem)
      
      const request = createMockRequest(mockCreateItemData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toMatchObject({
        id: '4',
        name: 'Pan',
        category: 'supermercado',
        status: 'este-mes', // Converted from 'este_mes'
        completed: false,
        orderIndex: 3,
      })
      expect(mockPrisma.shoppingItem.create).toHaveBeenCalledWith({
        data: {
          name: 'Pan',
          category: 'supermercado',
          status: 'este_mes', // Converted to database format
          completed: false,
          orderIndex: 3,
        },
      })
    })

    it('should assign correct order index for new status', async () => {
      // Arrange
      const newItem = {
        id: '4',
        name: 'Pan',
        category: 'supermercado',
        status: 'proximo_mes',
        completed: false,
        orderIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockPrisma.shoppingItem.findFirst.mockResolvedValue(null) // No existing items
      mockPrisma.shoppingItem.create.mockResolvedValue(newItem)
      
      const request = createMockRequest({
        ...mockCreateItemData,
        status: 'proximo-mes',
      }, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(mockPrisma.shoppingItem.create).toHaveBeenCalledWith({
        data: {
          name: 'Pan',
          category: 'supermercado',
          status: 'proximo_mes',
          completed: false,
          orderIndex: 0, // Should be 0 when no existing items
        },
      })
    })

    it('should trim whitespace from item name', async () => {
      // Arrange
      const newItem = {
        id: '4',
        name: 'Pan',
        category: 'supermercado',
        status: 'este_mes',
        completed: false,
        orderIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockPrisma.shoppingItem.findFirst.mockResolvedValue(null)
      mockPrisma.shoppingItem.create.mockResolvedValue(newItem)
      
      const request = createMockRequest({
        ...mockCreateItemData,
        name: '  Pan  ',
      }, 'POST')

      // Act
      const response = await POST(request)

      // Assert
      validateSuccessResponse(response)
      expect(mockPrisma.shoppingItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Pan', // Should be trimmed
        }),
      })
    })

    it('should return 400 for invalid input data', async () => {
      // Arrange
      const invalidData = {
        name: '', // Empty name
        category: 'invalid-category',
        status: 'invalid-status',
      }
      const request = createMockRequest(invalidData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 400, 'Datos inválidos')
      expect(data.error).toBe('Datos inválidos')
      expect(data.details).toContain('name')
    })

    it('should return 400 for missing required fields', async () => {
      // Arrange
      const incompleteData = {
        name: 'Pan',
        // Missing category and status
      }
      const request = createMockRequest(incompleteData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 400, 'Datos inválidos')
      expect(data.error).toBe('Datos inválidos')
    })

    it('should handle database creation errors', async () => {
      // Arrange
      mockPrisma.shoppingItem.findFirst.mockResolvedValue(null)
      mockPrisma.shoppingItem.create.mockRejectedValue(new Error('Creation failed'))
      
      const request = createMockRequest(mockCreateItemData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Failed to create shopping item')
      expect(data.error).toBe('Failed to create shopping item')
      expect(data.details).toBe('Creation failed')
    })

    it('should handle JSON parsing errors', async () => {
      // Arrange
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      })

      // Act
      const response = await POST(request as any)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create shopping item')
    })
  })
})
