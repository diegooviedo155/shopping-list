import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mock data for testing
export const mockShoppingItems = [
  {
    id: '1',
    name: 'Leche',
    category: 'supermercado',
    status: 'este_mes',
    completed: false,
    orderIndex: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Manzanas',
    category: 'verduleria',
    status: 'proximo_mes',
    completed: true,
    orderIndex: 1,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    name: 'Pollo',
    category: 'carniceria',
    status: 'este_mes',
    completed: false,
    orderIndex: 2,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
]

export const mockCreateItemData = {
  name: 'Pan',
  category: 'supermercado',
  status: 'este-mes',
}

export const mockUpdateItemData = {
  completed: true,
  status: 'proximo-mes',
}

export const mockReorderData = {
  status: 'este-mes',
  sourceIndex: 0,
  destIndex: 2,
}

// Helper function to create a mock NextRequest
export function createMockRequest(body?: any, method: string = 'GET') {
  return new NextRequest('http://localhost:3000/api/test', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

// Helper function to setup Prisma mocks
export function setupPrismaMocks() {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>
  
  // Reset all mocks
  jest.clearAllMocks()
  
  // Setup default mocks
  mockPrisma.$connect.mockResolvedValue(undefined)
  mockPrisma.$disconnect.mockResolvedValue(undefined)
  mockPrisma.$transaction.mockImplementation((queries) => Promise.all(queries))
  
  return mockPrisma
}

// Helper function to create mock context for dynamic routes
export function createMockContext(params: Record<string, string>) {
  return { params }
}

// Helper function to validate API response structure
export function validateApiResponse(response: any, expectedStatus: number) {
  expect(response.status).toBe(expectedStatus)
  return response
}

// Helper function to validate error response
export function validateErrorResponse(response: any, expectedStatus: number, expectedError: string) {
  expect(response.status).toBe(expectedStatus)
  expect(response.body).toHaveProperty('error')
  expect(response.body.error).toContain(expectedError)
  return response
}

// Helper function to validate success response
export function validateSuccessResponse(response: any, expectedStatus: number = 200) {
  expect(response.status).toBe(expectedStatus)
  expect(response.body).not.toHaveProperty('error')
  return response
}

// Helper function to create mock Supabase client
export function createMockSupabaseClient() {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
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
}

// Helper function to setup Supabase mocks
export function setupSupabaseMocks() {
  const mockSupabaseClient = createMockSupabaseClient()
  
  jest.doMock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => mockSupabaseClient),
  }))
  
  return mockSupabaseClient
}

// Helper function to create test data for different scenarios
export const testScenarios = {
  validItem: {
    id: '1',
    name: 'Test Item',
    category: 'supermercado',
    status: 'este-mes',
    completed: false,
    orderIndex: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  
  invalidItem: {
    name: '',
    category: 'invalid-category',
    status: 'invalid-status',
  },
  
  validUpdateData: {
    completed: true,
    status: 'proximo-mes',
  },
  
  validReorderData: {
    status: 'este-mes',
    sourceIndex: 0,
    destIndex: 2,
  },
  
  categories: ['supermercado', 'verduleria', 'carniceria', 'farmacia'],
  
  statuses: ['este-mes', 'proximo-mes'],
}
