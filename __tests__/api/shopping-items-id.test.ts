import { PATCH, DELETE } from '@/app/api/shopping-items/[id]/route'
import { setupPrismaMocks, createMockRequest, createMockContext, mockShoppingItems, mockUpdateItemData, validateApiResponse, validateErrorResponse, validateSuccessResponse } from '../utils/test-utils'

describe('/api/shopping-items/[id]', () => {
  let mockPrisma: any

  beforeEach(() => {
    mockPrisma = setupPrismaMocks()
  })

  describe('PATCH /api/shopping-items/[id]', () => {
    it('should update a shopping item successfully', async () => {
      // Arrange
      const updatedItem = {
        ...mockShoppingItems[0],
        completed: true,
        status: 'proximo_mes',
      }
      
      mockPrisma.shoppingItem.update.mockResolvedValue(updatedItem)
      const request = createMockRequest(mockUpdateItemData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toMatchObject({
        id: '1',
        name: 'Leche',
        category: 'supermercado',
        status: 'proximo-mes', // Converted from 'proximo_mes'
        completed: true,
      })
      expect(mockPrisma.shoppingItem.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          completed: true,
          status: 'proximo_mes', // Converted to database format
        },
      })
    })

    it('should update only completed status', async () => {
      // Arrange
      const updateData = { completed: true }
      const updatedItem = {
        ...mockShoppingItems[0],
        completed: true,
      }
      
      mockPrisma.shoppingItem.update.mockResolvedValue(updatedItem)
      const request = createMockRequest(updateData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(mockPrisma.shoppingItem.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { completed: true },
      })
    })

    it('should update only status', async () => {
      // Arrange
      const updateData = { status: 'proximo-mes' }
      const updatedItem = {
        ...mockShoppingItems[0],
        status: 'proximo_mes',
      }
      
      mockPrisma.shoppingItem.update.mockResolvedValue(updatedItem)
      const request = createMockRequest(updateData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(mockPrisma.shoppingItem.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'proximo_mes' },
      })
    })

    it('should return 400 for invalid input data', async () => {
      // Arrange
      const invalidData = {
        completed: 'invalid-boolean', // Should be boolean
        status: 'invalid-status',
      }
      const request = createMockRequest(invalidData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 400, 'Datos inválidos')
      expect(data.error).toBe('Datos inválidos')
    })

    it('should return 400 for empty update data', async () => {
      // Arrange
      const emptyData = {}
      const request = createMockRequest(emptyData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 400, 'Datos inválidos')
      expect(data.error).toBe('Datos inválidos')
    })

    it('should handle database update errors', async () => {
      // Arrange
      mockPrisma.shoppingItem.update.mockRejectedValue(new Error('Update failed'))
      const request = createMockRequest(mockUpdateItemData, 'PATCH')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Failed to update shopping item')
      expect(data.error).toBe('Failed to update shopping item')
      expect(data.details).toBe('Update failed')
    })

    it('should handle item not found errors', async () => {
      // Arrange
      mockPrisma.shoppingItem.update.mockRejectedValue(
        new Error('Record to update not found')
      )
      const request = createMockRequest(mockUpdateItemData, 'PATCH')
      const context = createMockContext({ id: 'nonexistent' })

      // Act
      const response = await PATCH(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Failed to update shopping item')
      expect(data.error).toBe('Failed to update shopping item')
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
      expect(data.error).toBe('Failed to update shopping item')
    })
  })

  describe('DELETE /api/shopping-items/[id]', () => {
    it('should delete a shopping item successfully', async () => {
      // Arrange
      mockPrisma.shoppingItem.findUnique.mockResolvedValue(mockShoppingItems[0])
      mockPrisma.shoppingItem.delete.mockResolvedValue(mockShoppingItems[0])
      const request = createMockRequest(undefined, 'DELETE')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await DELETE(request, context)
      const data = await response.json()

      // Assert
      validateSuccessResponse(response)
      expect(data).toEqual({ success: true })
      expect(mockPrisma.shoppingItem.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      })
      expect(mockPrisma.shoppingItem.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

    it('should return 404 when item does not exist', async () => {
      // Arrange
      mockPrisma.shoppingItem.findUnique.mockResolvedValue(null)
      const request = createMockRequest(undefined, 'DELETE')
      const context = createMockContext({ id: 'nonexistent' })

      // Act
      const response = await DELETE(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 404, 'Item not found')
      expect(data.error).toBe('Item not found')
      expect(mockPrisma.shoppingItem.delete).not.toHaveBeenCalled()
    })

    it('should handle database find errors', async () => {
      // Arrange
      mockPrisma.shoppingItem.findUnique.mockRejectedValue(new Error('Find failed'))
      const request = createMockRequest(undefined, 'DELETE')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await DELETE(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Failed to delete shopping item')
      expect(data.error).toBe('Failed to delete shopping item')
      expect(data.details).toBe('Find failed')
    })

    it('should handle database delete errors', async () => {
      // Arrange
      mockPrisma.shoppingItem.findUnique.mockResolvedValue(mockShoppingItems[0])
      mockPrisma.shoppingItem.delete.mockRejectedValue(new Error('Delete failed'))
      const request = createMockRequest(undefined, 'DELETE')
      const context = createMockContext({ id: '1' })

      // Act
      const response = await DELETE(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Failed to delete shopping item')
      expect(data.error).toBe('Failed to delete shopping item')
      expect(data.details).toBe('Delete failed')
    })

    it('should handle missing id parameter', async () => {
      // Arrange
      const request = createMockRequest(undefined, 'DELETE')
      const context = createMockContext({ id: '' })

      // Act
      const response = await DELETE(request, context)
      const data = await response.json()

      // Assert
      validateErrorResponse(response, 500, 'Failed to delete shopping item')
      expect(data.error).toBe('Failed to delete shopping item')
    })
  })
})
