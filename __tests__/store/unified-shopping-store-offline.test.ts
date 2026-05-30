/**
 * Tests del comportamiento offline del store.
 *
 * Verifica que cuando hay un error de red (sin conexión):
 * - La UI mantiene el estado optimista (NO hace rollback)
 * - La operación se encola en pendingOperationsQueue
 *
 * Cuando hay un error de servidor (4xx/5xx):
 * - La UI revierte al estado anterior (rollback)
 * - No se encola nada
 */

jest.mock('@/lib/utils/request-queue', () => ({
  queuedFetch: jest.fn(),
}))

jest.mock('@/lib/utils/auth-cache', () => ({
  getCachedAuthHeaders: jest.fn().mockResolvedValue({
    'Content-Type': 'application/json',
    Authorization: 'Bearer test-token',
  }),
}))

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-test' } } },
        error: null,
      }),
    },
  },
}))

import { useUnifiedShoppingStore } from '@/lib/store/unified-shopping-store'
import { pendingOperationsQueue } from '@/lib/utils/pending-operations'
import { queuedFetch } from '@/lib/utils/request-queue'

const mockFetch = queuedFetch as jest.MockedFunction<typeof queuedFetch>

function makeItem(id = 'item-1', completed = false) {
  return {
    id,
    name: 'Leche',
    category: 'supermercado',
    status: 'este_mes',
    completed,
    orderIndex: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

const NETWORK_ERROR = new Error('Failed to fetch')
const SERVER_ERROR = new Error('HTTP 500: Internal Server Error')

beforeEach(() => {
  useUnifiedShoppingStore.setState({
    items: [],
    categories: [],
    loading: false,
    error: null,
    isRefreshing: false,
    activeTab: 'este_mes' as const,
    selectedCategory: 'supermercado' as const,
    searchQuery: '',
    hasInitialized: false,
    lastFetch: null,
    movingItems: [],
  })
  localStorage.clear()
  jest.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// toggleItemCompleted — modo offline
// ─────────────────────────────────────────────────────────────────────────────
describe('toggleItemCompleted — error de red (offline)', () => {
  it('mantiene el estado optimista (NO hace rollback)', async () => {
    const item = makeItem('item-1', false)
    useUnifiedShoppingStore.setState({ items: [item] })

    mockFetch.mockRejectedValueOnce(NETWORK_ERROR)

    // No debe lanzar error
    await expect(
      useUnifiedShoppingStore.getState().toggleItemCompleted('item-1')
    ).resolves.toBeUndefined()

    // La UI mantiene el estado optimista (completed = true)
    expect(useUnifiedShoppingStore.getState().items[0].completed).toBe(true)
  })

  it('encola la operación para sincronizar después', async () => {
    const item = makeItem('item-1', false)
    useUnifiedShoppingStore.setState({ items: [item] })

    mockFetch.mockRejectedValueOnce(NETWORK_ERROR)

    await useUnifiedShoppingStore.getState().toggleItemCompleted('item-1')

    expect(pendingOperationsQueue.count()).toBe(1)
    const ops = pendingOperationsQueue.getAll()
    expect(ops[0].type).toBe('toggle')
    expect(ops[0].itemId).toBe('item-1')
    expect(ops[0].payload.completed).toBe(true)
  })
})

describe('toggleItemCompleted — error de servidor (rollback)', () => {
  it('revierte la UI y no encola nada', async () => {
    const item = makeItem('item-1', false)
    useUnifiedShoppingStore.setState({ items: [item] })

    mockFetch.mockRejectedValueOnce(SERVER_ERROR)

    await expect(
      useUnifiedShoppingStore.getState().toggleItemCompleted('item-1')
    ).rejects.toThrow()

    // La UI revierte al estado original
    expect(useUnifiedShoppingStore.getState().items[0].completed).toBe(false)
    // Nada en la cola
    expect(pendingOperationsQueue.count()).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// deleteItem — modo offline
// ─────────────────────────────────────────────────────────────────────────────
describe('deleteItem — error de red (offline)', () => {
  it('mantiene el item eliminado en la UI (NO lo restaura)', async () => {
    const item = makeItem()
    useUnifiedShoppingStore.setState({ items: [item] })

    mockFetch.mockRejectedValueOnce(NETWORK_ERROR)

    await expect(
      useUnifiedShoppingStore.getState().deleteItem('item-1')
    ).resolves.toBeUndefined()

    // El item debe seguir eliminado de la UI
    expect(useUnifiedShoppingStore.getState().items).toHaveLength(0)
  })

  it('encola la operación delete', async () => {
    const item = makeItem()
    useUnifiedShoppingStore.setState({ items: [item] })

    mockFetch.mockRejectedValueOnce(NETWORK_ERROR)

    await useUnifiedShoppingStore.getState().deleteItem('item-1')

    expect(pendingOperationsQueue.count()).toBe(1)
    const ops = pendingOperationsQueue.getAll()
    expect(ops[0].type).toBe('delete')
    expect(ops[0].itemId).toBe('item-1')
  })
})

describe('deleteItem — error de servidor (rollback)', () => {
  it('restaura el item en la UI y no encola nada', async () => {
    const item = makeItem()
    useUnifiedShoppingStore.setState({ items: [item] })

    mockFetch.mockRejectedValueOnce(SERVER_ERROR)

    await expect(
      useUnifiedShoppingStore.getState().deleteItem('item-1')
    ).rejects.toThrow()

    expect(useUnifiedShoppingStore.getState().items).toHaveLength(1)
    expect(pendingOperationsQueue.count()).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// addItem — modo offline
// ─────────────────────────────────────────────────────────────────────────────
describe('addItem — error de red (offline)', () => {
  it('mantiene el item temporal en la UI (NO lo elimina)', async () => {
    const category = { id: 'cat-1', slug: 'supermercado' }
    useUnifiedShoppingStore.setState({ items: [], categories: [category] })

    mockFetch.mockRejectedValueOnce(NETWORK_ERROR)

    await expect(
      useUnifiedShoppingStore.getState().addItem('Leche', 'supermercado', 'este_mes')
    ).resolves.toBeUndefined()

    // El item temporal debe seguir en la UI
    const items = useUnifiedShoppingStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].id).toMatch(/^temp-/)
    expect(items[0].name).toBe('Leche')
  })

  it('encola la operación add con el tempId', async () => {
    const category = { id: 'cat-1', slug: 'supermercado' }
    useUnifiedShoppingStore.setState({ items: [], categories: [category] })

    mockFetch.mockRejectedValueOnce(NETWORK_ERROR)

    await useUnifiedShoppingStore.getState().addItem('Leche', 'supermercado', 'este_mes')

    expect(pendingOperationsQueue.count()).toBe(1)
    const ops = pendingOperationsQueue.getAll()
    expect(ops[0].type).toBe('add')
    expect(ops[0].payload.name).toBe('Leche')
    expect(ops[0].payload.tempId).toMatch(/^temp-/)
  })
})

describe('addItem — error de servidor (rollback)', () => {
  it('elimina el item temporal y no encola nada', async () => {
    const category = { id: 'cat-1', slug: 'supermercado' }
    useUnifiedShoppingStore.setState({ items: [], categories: [category] })

    mockFetch.mockRejectedValueOnce(SERVER_ERROR)

    await expect(
      useUnifiedShoppingStore.getState().addItem('Leche', 'supermercado', 'este_mes')
    ).rejects.toThrow()

    expect(useUnifiedShoppingStore.getState().items).toHaveLength(0)
    expect(pendingOperationsQueue.count()).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// isNetworkError — verificar que distingue correctamente los errores
// ─────────────────────────────────────────────────────────────────────────────
describe('isNetworkError', () => {
  it('reconoce "Failed to fetch" como error de red', async () => {
    const { isNetworkError } = await import('@/lib/utils/is-network-error')
    expect(isNetworkError(new Error('Failed to fetch'))).toBe(true)
  })

  it('reconoce timeout como error de red', async () => {
    const { isNetworkError } = await import('@/lib/utils/is-network-error')
    expect(isNetworkError(new Error('Request timeout after 10000ms'))).toBe(true)
  })

  it('NO reconoce errores HTTP como errores de red', async () => {
    const { isNetworkError } = await import('@/lib/utils/is-network-error')
    expect(isNetworkError(new Error('HTTP 500: Internal Server Error'))).toBe(false)
    expect(isNetworkError(new Error('HTTP 401: Unauthorized'))).toBe(false)
    expect(isNetworkError(new Error('HTTP 403: Forbidden'))).toBe(false)
  })

  it('devuelve false para valores no-Error', async () => {
    const { isNetworkError } = await import('@/lib/utils/is-network-error')
    expect(isNetworkError('string error')).toBe(false)
    expect(isNetworkError(null)).toBe(false)
    expect(isNetworkError(undefined)).toBe(false)
    expect(isNetworkError(42)).toBe(false)
  })
})
