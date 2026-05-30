/**
 * Tests de rendimiento para las optimizaciones de API
 *
 * Mide:
 * - Procesamiento paralelo del RequestQueue
 * - Deduplicación de peticiones GET idénticas
 * - Priorización de peticiones en cola
 * - Funcionamiento del AuthCache
 */

// Supabase mock al nivel de módulo para que funcione en los tests de AuthCache
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}))

import { queuedFetch, requestQueue } from '@/lib/utils/request-queue'
import { authCache, getCachedAuthHeaders } from '@/lib/utils/auth-cache'
import { supabase } from '@/lib/supabase/client'

const mockGetSession = supabase.auth.getSession as jest.MockedFunction<
  typeof supabase.auth.getSession
>

// Mock fetch global
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

function makeFetchResponse(data: unknown = { data: 'test' }) {
  return Promise.resolve({
    ok: true,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue('test'),
    status: 200,
    statusText: 'OK',
    clone: jest.fn().mockReturnThis(),
  } as unknown as Response)
}

beforeEach(() => {
  jest.clearAllMocks()
  authCache.clear()
  requestQueue.clear()
  mockFetch.mockImplementation(() => makeFetchResponse())
})

// ─────────────────────────────────────────────────────────────────────────────
// Request Queue
// ─────────────────────────────────────────────────────────────────────────────
describe('Request Queue Performance', () => {
  it('procesa múltiples peticiones en paralelo', async () => {
    const start = performance.now()

    const requests = Array.from({ length: 10 }, (_, i) =>
      queuedFetch(`/api/test/${i}`, { method: 'GET' }, 0)
    )

    await Promise.all(requests)

    expect(performance.now() - start).toBeLessThan(2000)
    expect(mockFetch).toHaveBeenCalledTimes(10)
  })

  it('deduplica peticiones GET idénticas dentro de la ventana de tiempo', async () => {
    const url = '/api/categories'

    const requests = Array.from({ length: 5 }, () =>
      queuedFetch(url, { method: 'GET' }, 0)
    )

    await Promise.all(requests)

    // Solo 1 fetch real gracias a la deduplicación
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('prioriza peticiones de alta prioridad cuando la cola está llena', async () => {
    const callOrder: string[] = []

    // Fetch lento (100ms) para que se acumulen peticiones pendientes en la cola
    mockFetch.mockImplementation((url: string) =>
      new Promise((resolve) =>
        setTimeout(() => {
          callOrder.push(url as string)
          resolve({
            ok: true,
            json: jest.fn().mockResolvedValue({}),
            status: 200,
            statusText: 'OK',
            clone: jest.fn().mockReturnThis(),
          } as unknown as Response)
        }, 100)
      )
    )

    // Llenar todos los slots concurrentes (6) con baja prioridad
    const lowPriority = Array.from({ length: 6 }, (_, i) =>
      queuedFetch(`/api/low-${i}`, { method: 'GET' }, 0)
    )

    // Esperar a que estén en vuelo
    await new Promise((r) => setTimeout(r, 20))

    // Agregar más baja prioridad para que queden en cola de espera (pendientes)
    const moreLow = Array.from({ length: 4 }, (_, i) =>
      queuedFetch(`/api/low-extra-${i}`, { method: 'GET' }, 0)
    )

    // Alta prioridad — debe ser la siguiente en procesarse después de que libere un slot
    const highPriority = queuedFetch('/api/high', { method: 'GET' }, 2)

    await Promise.all([...lowPriority, ...moreLow, highPriority])

    // La petición de alta prioridad debe haberse procesado antes que las de baja que estaban en cola
    const highIndex = callOrder.indexOf('/api/high')
    const firstExtraLowIndex = callOrder.indexOf('/api/low-extra-0')
    expect(highIndex).toBeLessThan(firstExtraLowIndex)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Auth Cache
// ─────────────────────────────────────────────────────────────────────────────
describe('Auth Cache Performance', () => {
  it('cachea la sesión y evita múltiples llamadas a getSession', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-token',
          expires_at: Math.floor((Date.now() + 3_600_000) / 1000),
        } as any,
      },
      error: null,
    })

    const requests = Array.from({ length: 10 }, () => getCachedAuthHeaders())
    await Promise.all(requests)

    // El caché garantiza que solo se llama una vez
    expect(mockGetSession).toHaveBeenCalledTimes(1)
  })

  it('refresca el caché cuando expira', async () => {
    // Primera sesión expira rápido (100ms desde ahora en segundos)
    mockGetSession
      .mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'token-1',
            expires_at: Math.floor((Date.now() + 100) / 1000),
          } as any,
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          session: {
            access_token: 'token-2',
            expires_at: Math.floor((Date.now() + 3_600_000) / 1000),
          } as any,
        },
        error: null,
      })

    // Forzar duración de caché muy corta para el test
    authCache.setCacheDuration(50)

    await getCachedAuthHeaders()

    // Esperar a que expire el caché
    await new Promise((r) => setTimeout(r, 100))

    await getCachedAuthHeaders()

    expect(mockGetSession).toHaveBeenCalledTimes(2)

    authCache.setCacheDuration(5 * 60 * 1000) // Restaurar duración por defecto
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Batch Operations
// ─────────────────────────────────────────────────────────────────────────────
describe('Batch Operations Performance', () => {
  it('procesa 20 actualizaciones en paralelo eficientemente', async () => {
    const start = performance.now()

    const updates = Array.from({ length: 20 }, (_, i) =>
      queuedFetch(`/api/items/${i}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: true }),
      }, 0)
    )

    await Promise.all(updates)

    expect(performance.now() - start).toBeLessThan(3000)
    expect(mockFetch).toHaveBeenCalledTimes(20)
  })

  it('carga inicial (items + categorías) en paralelo', async () => {
    const start = performance.now()

    const [itemsRes, catRes] = await Promise.all([
      queuedFetch('/api/shopping-items', { method: 'GET' }, 1),
      queuedFetch('/api/categories', { method: 'GET' }, 1),
    ])

    await Promise.all([itemsRes.json(), catRes.json()])

    expect(performance.now() - start).toBeLessThan(1000)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('maneja múltiples acciones de usuario rápidas sin bloquear', async () => {
    const start = performance.now()

    const actions = Array.from({ length: 5 }, (_, i) =>
      queuedFetch(`/api/shopping-items/${i + 1}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: true }),
      }, 0)
    )

    await Promise.all(actions)

    expect(performance.now() - start).toBeLessThan(2000)
    expect(mockFetch).toHaveBeenCalledTimes(5)
  })
})
