/**
 * Benchmark tests para comparar rendimiento antes y después de optimizaciones
 * 
 * Ejecutar con: npm test -- --testNamePattern="Benchmark"
 */

describe('Performance Benchmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
      status: 200,
      statusText: 'OK',
    })
  })

  describe('Request Queue Benchmarks', () => {
    it('benchmark: should process 50 requests efficiently', async () => {
      const { queuedFetch } = require('@/lib/utils/request-queue')
      
      const startTime = performance.now()
      
      const requests = Array.from({ length: 50 }, (_, i) =>
        queuedFetch(`/api/test/${i}`, { method: 'GET' }, 0)
      )

      await Promise.all(requests)
      
      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`\n[Benchmark] 50 requests processed in ${duration.toFixed(2)}ms`)
      console.log(`[Benchmark] Average: ${(duration / 50).toFixed(2)}ms per request`)
      
      // Con 6 peticiones concurrentes, 50 peticiones deberían tomar
      // aproximadamente el tiempo de 9 "rounds" (6 * 8 + 2)
      expect(duration).toBeLessThan(5000) // 5 segundos máximo
    })

    it('benchmark: should handle 100 concurrent requests', async () => {
      const { queuedFetch } = require('@/lib/utils/request-queue')
      
      const startTime = performance.now()
      
      const requests = Array.from({ length: 100 }, (_, i) =>
        queuedFetch(`/api/test/${i}`, { method: 'GET' }, 0)
      )

      await Promise.all(requests)
      
      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`\n[Benchmark] 100 concurrent requests processed in ${duration.toFixed(2)}ms`)
      console.log(`[Benchmark] Average: ${(duration / 100).toFixed(2)}ms per request`)
      console.log(`[Benchmark] Throughput: ${(100 / (duration / 1000)).toFixed(2)} requests/second`)
      
      expect(duration).toBeLessThan(10000) // 10 segundos máximo
    })
  })

  describe('Deduplication Benchmarks', () => {
    it('benchmark: should deduplicate 20 identical requests', async () => {
      const { queuedFetch } = require('@/lib/utils/request-queue')
      
      const startTime = performance.now()
      
      // Hacer la misma petición 20 veces
      const requests = Array.from({ length: 20 }, () =>
        queuedFetch('/api/categories', { method: 'GET' }, 0)
      )

      await Promise.all(requests)
      
      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`\n[Benchmark] 20 identical requests (deduplicated) in ${duration.toFixed(2)}ms`)
      console.log(`[Benchmark] Actual fetch calls: ${(global.fetch as jest.Mock).mock.calls.length}`)
      
      // Solo debería hacer 1 petición real
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(1)
      expect(duration).toBeLessThan(500) // Muy rápido debido a deduplicación
    })
  })

  describe('Cache Performance Benchmarks', () => {
    it('benchmark: should cache auth headers efficiently', async () => {
      const { getCachedAuthHeaders } = require('@/lib/utils/auth-cache')
      
      // Mock supabase
      const mockGetSession = jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
            expires_at: Date.now() + 3600000,
          },
        },
        error: null,
      })

      jest.doMock('@/lib/supabase/client', () => ({
        supabase: {
          auth: {
            getSession: mockGetSession,
          },
        },
      }))

      const startTime = performance.now()
      
      // Hacer 50 llamadas a getCachedAuthHeaders
      const requests = Array.from({ length: 50 }, () =>
        getCachedAuthHeaders().catch(() => ({}))
      )

      await Promise.all(requests)
      
      const endTime = performance.now()
      const duration = endTime - startTime

      console.log(`\n[Benchmark] 50 cached auth header requests in ${duration.toFixed(2)}ms`)
      console.log(`[Benchmark] Average: ${(duration / 50).toFixed(2)}ms per request`)
      
      // Debería ser muy rápido debido al caché
      expect(duration).toBeLessThan(100) // Muy rápido con caché
    })
  })
})

