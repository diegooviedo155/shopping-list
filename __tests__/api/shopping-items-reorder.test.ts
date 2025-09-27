import { POST } from '@/app/api/shopping-items/reorder/route'
import { setupPrismaMocks, createMockRequest, createMockContext, mockReorderData, validateApiResponse, validateErrorResponse, validateSuccessResponse } from '../utils/test-utils'

describe('/api/shopping-items/reorder', () => {
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = setupPrismaMocks()
  })

  describe('POST /api/shopping-items/reorder', () => {
    it('should reorder items successfully', async () => {
      // Arrange
      const itemsToReorder = [
        { id: '1', orderIndex: 0 },
        { id: '2', orderIndex: 1 },
        { id: '3', orderIndex: 2 },
      ]
      
      mockPrisma.shoppingItem.findMany.mockResolvedValue(itemsToReorder)
      mockPrisma.$transaction.mockResolvedValue([])
      
      const request = createMockRequest(mockReorderData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual({ success: true })
      expect(mockPrisma.shoppingItem.findMany).toHaveBeenCalledWith({
        where: { status: 'este_mes' }, // Converted from 'este-mes'
        orderBy: { orderIndex: 'asc' },
        select: { id: true, orderIndex: true },
      })
      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('should handle reorder from index 0 to index 2', async () => {
      // Arrange
      const itemsToReorder = [
        { id: '1', orderIndex: 0 }, // Source item
        { id: '2', orderIndex: 1 },
        { id: '3', orderIndex: 2 },
      ]
      
      mockPrisma.shoppingItem.findMany.mockResolvedValue(itemsToReorder)
      mockPrisma.$transaction.mockResolvedValue([])
      
      const reorderData = {
        status: 'este-mes',
        sourceIndex: 0,
        destIndex: 2,
      }
      const request = createMockRequest(reorderData, 'POST')

      // Act
      const response = await POST(request)

      // Assert
      validateSuccessResponse(response)
      expect(mockPrisma.$transaction).toHaveBeenCalledWith([
        expect.objectContaining({
          where: { id: '2' },
          data: { orderIndex: 0 },
        }),
        expect.objectContaining({
          where: { id: '3' },
          data: { orderIndex: 1 },
        }),
        expect.objectContaining({
          where: { id: '1' },
          data: { orderIndex: 2 },
        }),
      ])
    })

    it('should handle reorder from index 2 to index 0', async () => {
      // Arrange
      const itemsToReorder = [
        { id: '1', orderIndex: 0 },
        { id: '2', orderIndex: 1 },
        { id: '3', orderIndex: 2 }, // Source item
      ]
      
      mockPrisma.shoppingItem.findMany.mockResolvedValue(itemsToReorder)
      mockPrisma.$transaction.mockResolvedValue([])
      
      const reorderData = {
        status: 'este-mes',
        sourceIndex: 2,
        destIndex: 0,
      }
      const request = createMockRequest(reorderData, 'POST')

      // Act
      const response = await POST(request)

      // Assert
      validateSuccessResponse(response)
      expect(mockPrisma.$transaction).toHaveBeenCalledWith([
        expect.objectContaining({
          where: { id: '3' },
          data: { orderIndex: 0 },
        }),
        expect.objectContaining({
          where: { id: '1' },
          data: { orderIndex: 1 },
        }),
        expect.objectContaining({
          where: { id: '2' },
          data: { orderIndex: 2 },
        }),
      ])
    })

    it('should return success when source and dest index are the same', async () => {
      // Arrange
      const itemsToReorder = [
        { id: '1', orderIndex: 0 },
        { id: '2', orderIndex: 1 },
      ]
      
      mockPrisma.shoppingItem.findMany.mockResolvedValue(itemsToReorder)
      
      const reorderData = {
        status: 'este-mes',
        sourceIndex: 1,
        destIndex: 1, // Same as source
      }
      const request = createMockRequest(reorderData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual({ success: true })
      expect(mockPrisma.$transaction).not.toHaveBeenCalled()
    })

    it('should return 400 for invalid indices (source out of bounds)', async () => {
      // Arrange
      const itemsToReorder = [
        { id: '1', orderIndex: 0 },
        { id: '2', orderIndex: 1 },
      ]
      
      mockPrisma.shoppingItem.findMany.mockResolvedValue(itemsToReorder)
      
      const reorderData = {
        status: 'este-mes',
        sourceIndex: 5, // Out of bounds
        destIndex: 1,
      }
      const request = createMockRequest(reorderData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 400, 'Índices inválidos')
      expect(data.error).toBe('Índices inválidos')
    })

    it('should return 400 for invalid indices (dest out of bounds)', async () => {
      // Arrange
      const itemsToReorder = [
        { id: '1', orderIndex: 0 },
        { id: '2', orderIndex: 1 },
      ]
      
      mockPrisma.shoppingItem.findMany.mockResolvedValue(itemsToReorder)
      
      const reorderData = {
        status: 'este-mes',
        sourceIndex: 0,
        destIndex: 5, // Out of bounds
      }
      const request = createMockRequest(reorderData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 400, 'Índices inválidos')
      expect(data.error).toBe('Índices inválidos')
    })

    it('should return 400 for negative indices', async () => {
      // Arrange
      const itemsToReorder = [
        { id: '1', orderIndex: 0 },
        { id: '2', orderIndex: 1 },
      ]
      
      mockPrisma.shoppingItem.findMany.mockResolvedValue(itemsToReorder)
      
      const reorderData = {
        status: 'este-mes',
        sourceIndex: -1, // Negative
        destIndex: 1,
      }
      const request = createMockRequest(reorderData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 400, 'Índices inválidos')
      expect(data.error).toBe('Índices inválidos')
    })

    it('should return 400 for invalid input data', async () => {
      // Arrange
      const invalidData = {
        status: 'invalid-status',
        sourceIndex: 'not-a-number',
        destIndex: 'not-a-number',
      }
      const request = createMockRequest(invalidData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 400, 'Datos inválidos')
      expect(data.error).toBe('Datos inválidos')
    })

    it('should return 400 for missing required fields', async () => {
      // Arrange
      const incompleteData = {
        status: 'este-mes',
        // Missing sourceIndex and destIndex
      }
      const request = createMockRequest(incompleteData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 400, 'Datos inválidos')
      expect(data.error).toBe('Datos inválidos')
    })

    it('should handle database query errors', async () => {
      // Arrange
      mockPrisma.shoppingItem.findMany.mockRejectedValue(new Error('Query failed'))
      const request = createMockRequest(mockReorderData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Failed to reorder shopping items')
      expect(data.error).toBe('Failed to reorder shopping items')
      expect(data.details).toBe('Query failed')
    })

    it('should handle database transaction errors', async () => {
      // Arrange
      const itemsToReorder = [
        { id: '1', orderIndex: 0 },
        { id: '2', orderIndex: 1 },
      ]
      
      mockPrisma.shoppingItem.findMany.mockResolvedValue(itemsToReorder)
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'))
      
      const request = createMockRequest(mockReorderData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Failed to reorder shopping items')
      expect(data.error).toBe('Failed to reorder shopping items')
      expect(data.details).toBe('Transaction failed')
    })

    it('should handle empty items list', async () => {
      // Arrange
      mockPrisma.shoppingItem.findMany.mockResolvedValue([])
      
      const reorderData = {
        status: 'este-mes',
        sourceIndex: 0,
        destIndex: 1,
      }
      const request = createMockRequest(reorderData, 'POST')

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 400, 'Índices inválidos')
      expect(data.error).toBe('Índices inválidos')
    })

    it('should convert frontend status format to database format', async () => {
      // Arrange
      const itemsToReorder = [
        { id: '1', orderIndex: 0 },
        { id: '2', orderIndex: 1 },
      ]
      
      mockPrisma.shoppingItem.findMany.mockResolvedValue(itemsToReorder)
      mockPrisma.$transaction.mockResolvedValue([])
      
      const reorderData = {
        status: 'proximo-mes', // Frontend format
        sourceIndex: 0,
        destIndex: 1,
      }
      const request = createMockRequest(reorderData, 'POST')

      // Act
      const response = await POST(request)

      // Assert
      validateSuccessResponse(response)
      expect(mockPrisma.shoppingItem.findMany).toHaveBeenCalledWith({
        where: { status: 'proximo_mes' }, // Should be converted to database format
        orderBy: { orderIndex: 'asc' },
        select: { id: true, orderIndex: true },
      })
    })
  })
})
