/**
 * Tests de rendimiento para las optimizaciones de API
 * 
 * Estos tests miden:
 * - Tiempo de respuesta de peticiones
 * - Efectividad del caché de autenticación
 * - Deduplicación de peticiones
 * - Procesamiento paralelo de peticiones
 */

import { queuedFetch, requestQueue } from '@/lib/utils/request-queue'
import { authCache, getCachedAuthHeaders } from '@/lib/utils/auth-cache'

// Mock fetch
global.fetch = jest.fn()

describe('API Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    authCache.clear()
    requestQueue.clear()
    
    // Mock successful responses
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
      text: async () => 'test',
      status: 200,
      statusText: 'OK',
    })
  })

  describe('Request Queue Performance', () => {
    it('should process multiple requests in parallel', async () => {
      const startTime = performance.now()
      
      const requests = Array.from({ length: 10 }, (_, i) =>
        queuedFetch(`/api/test/${i}`, { method: 'GET' }, 0)
      )

      await Promise.all(requests)
      
      const endTime = performance.now()
      const duration = endTime - startTime

      // Con 6 peticiones concurrentes, 10 peticiones deberían tomar aproximadamente
      // el tiempo de 2 "rounds" (6 + 4)
      expect(duration).toBeLessThan(2000) // Debería ser rápido
      expect(global.fetch).toHaveBeenCalledTimes(10)
    })

    it('should deduplicate identical GET requests', async () => {
      const url = '/api/categories'
      const options = { method: 'GET' as const }
      
      // Hacer la misma petición 5 veces simultáneamente
      const requests = Array.from({ length: 5 }, () =>
        queuedFetch(url, options, 0)
      )

      await Promise.all(requests)

      // Solo debería hacer 1 petición real debido a la deduplicación
      // (Nota: la deduplicación funciona en una ventana de 1 segundo)
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should prioritize high priority requests', async () => {
      const callOrder: number[] = []
      
      // Mock fetch para registrar el orden de llamadas
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('high')) callOrder.push(1)
        if (url.includes('low')) callOrder.push(2)
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
          status: 200,
          statusText: 'OK',
        })
      })

      // Hacer peticiones de baja prioridad primero
      const lowPriority = queuedFetch('/api/low', { method: 'GET' }, 0)
      
      // Pequeño delay para asegurar que la petición de baja prioridad esté en la cola
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Hacer petición de alta prioridad
      const highPriority = queuedFetch('/api/high', { method: 'GET' }, 2)

      await Promise.all([lowPriority, highPriority])

      // La petición de alta prioridad debería procesarse primero
      expect(callOrder[0]).toBe(1) // High priority first
    })
  })

  describe('Auth Cache Performance', () => {
    it('should cache session and avoid multiple getSession calls', async () => {
      // Mock supabase client
      const mockGetSession = jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
            expires_at: Date.now() + 3600000,
          },
        },
        error: null,
      })

      jest.mock('@/lib/supabase/client', () => ({
        supabase: {
          auth: {
            getSession: mockGetSession,
          },
        },
      }))

      // Hacer múltiples llamadas a getCachedAuthHeaders
      const requests = Array.from({ length: 10 }, () =>
        getCachedAuthHeaders()
      )

      await Promise.all(requests)

      // Solo debería llamar a getSession una vez debido al caché
      // (Nota: esto requiere que el mock funcione correctamente)
      expect(mockGetSession).toHaveBeenCalledTimes(1)
    })

    it('should refresh cache when expired', async () => {
      const mockGetSession = jest.fn()
        .mockResolvedValueOnce({
          data: {
            session: {
              access_token: 'token-1',
              expires_at: Date.now() + 100, // Expira en 100ms
            },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            session: {
              access_token: 'token-2',
              expires_at: Date.now() + 3600000,
            },
          },
          error: null,
        })

      jest.mock('@/lib/supabase/client', () => ({
        supabase: {
          auth: {
            getSession: mockGetSession,
          },
        },
      }))

      // Primera llamada
      await getCachedAuthHeaders()

      // Esperar a que expire el caché
      await new Promise(resolve => setTimeout(resolve, 150))

      // Segunda llamada debería refrescar
      await getCachedAuthHeaders()

      // Debería llamar a getSession dos veces
      expect(mockGetSession).toHaveBeenCalledTimes(2)
    })
  })

  describe('Batch Operations Performance', () => {
    it('should process batch updates efficiently', async () => {
      const startTime = performance.now()
      
      // Simular actualización de 20 items
      const updates = Array.from({ length: 20 }, (_, i) =>
        queuedFetch(`/api/items/${i}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed: true }),
        }, 0)
      )

      await Promise.all(updates)
      
      const endTime = performance.now()
      const duration = endTime - startTime

      // Con 6 peticiones concurrentes, 20 peticiones deberían procesarse
      // en aproximadamente 4 "rounds" (6 + 6 + 6 + 2)
      expect(duration).toBeLessThan(3000)
      expect(global.fetch).toHaveBeenCalledTimes(20)
    })

    it('should handle concurrent requests without blocking', async () => {
      const startTime = performance.now()
      
      // Mezclar peticiones de diferentes prioridades
      const requests = [
        queuedFetch('/api/high-1', { method: 'GET' }, 2),
        queuedFetch('/api/low-1', { method: 'GET' }, 0),
        queuedFetch('/api/high-2', { method: 'GET' }, 2),
        queuedFetch('/api/low-2', { method: 'GET' }, 0),
        queuedFetch('/api/high-3', { method: 'GET' }, 2),
      ]

      await Promise.all(requests)
      
      const endTime = performance.now()
      const duration = endTime - startTime

      // Todas las peticiones deberían completarse rápidamente
      expect(duration).toBeLessThan(2000)
      expect(global.fetch).toHaveBeenCalledTimes(5)
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle initial page load efficiently', async () => {
      const startTime = performance.now()
      
      // Simular carga inicial: items + categorías
      const [itemsResponse, categoriesResponse] = await Promise.all([
        queuedFetch('/api/shopping-items', { method: 'GET' }, 1),
        queuedFetch('/api/categories', { method: 'GET' }, 1),
      ])

      await Promise.all([itemsResponse.json(), categoriesResponse.json()])
      
      const endTime = performance.now()
      const duration = endTime - startTime

      // Carga inicial debería ser rápida (< 1 segundo en condiciones normales)
      expect(duration).toBeLessThan(1000)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should handle rapid user interactions', async () => {
      const startTime = performance.now()
      
      // Simular usuario haciendo múltiples acciones rápidas
      const actions = [
        queuedFetch('/api/shopping-items/1', { method: 'PATCH', body: JSON.stringify({ completed: true }) }, 0),
        queuedFetch('/api/shopping-items/2', { method: 'PATCH', body: JSON.stringify({ completed: true }) }, 0),
        queuedFetch('/api/shopping-items/3', { method: 'PATCH', body: JSON.stringify({ completed: true }) }, 0),
        queuedFetch('/api/shopping-items/4', { method: 'PATCH', body: JSON.stringify({ completed: true }) }, 0),
        queuedFetch('/api/shopping-items/5', { method: 'PATCH', body: JSON.stringify({ completed: true }) }, 0),
      ]

      await Promise.all(actions)
      
      const endTime = performance.now()
      const duration = endTime - startTime

      // Todas las acciones deberían completarse rápidamente
      expect(duration).toBeLessThan(2000)
      expect(global.fetch).toHaveBeenCalledTimes(5)
    })
  })
})

