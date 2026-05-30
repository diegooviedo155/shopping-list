/**
 * Tests para las operaciones optimistas del unified-shopping-store.
 *
 * Valida que:
 * - Las mutaciones actualicen la UI inmediatamente (antes de la respuesta del servidor)
 * - El rollback funcione correctamente cuando el servidor devuelve error
 * - movingItems sea un array serializable (no un Set)
 */

// Los mocks deben declararse ANTES de cualquier import del módulo bajo prueba
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
import { queuedFetch } from '@/lib/utils/request-queue'

const mockFetch = queuedFetch as jest.MockedFunction<typeof queuedFetch>

// Helper para crear un item de prueba
function makeItem(overrides: Partial<{
  id: string
  name: string
  category: string
  status: string
  completed: boolean
  orderIndex: number
}> = {}) {
  return {
    id: 'item-1',
    name: 'Leche',
    category: 'supermercado',
    status: 'este_mes',
    completed: false,
    orderIndex: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

// Helper para crear una respuesta mock exitosa
function mockOkResponse(data: unknown) {
  return Promise.resolve({
    json: jest.fn().mockResolvedValue(data),
    clone: jest.fn().mockReturnThis(),
    ok: true,
    status: 200,
  } as unknown as Response)
}

const INITIAL_STORE_STATE = {
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
  movingItems: [] as string[],
}

beforeEach(() => {
  useUnifiedShoppingStore.setState(INITIAL_STORE_STATE)
  localStorage.clear()
  jest.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// toggleItemCompleted
// ─────────────────────────────────────────────────────────────────────────────
describe('toggleItemCompleted', () => {
  it('actualiza la UI de forma optimista antes de recibir respuesta del servidor', async () => {
    const item = makeItem({ completed: false })
    useUnifiedShoppingStore.setState({ items: [item] })

    // Mock que nunca resuelve — simula red lenta
    let resolveServer!: (r: Response) => void
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((res) => {
        resolveServer = res
      })
    )

    const togglePromise = useUnifiedShoppingStore.getState().toggleItemCompleted('item-1')

    // La UI debe cambiar ANTES de que el servidor responda
    expect(useUnifiedShoppingStore.getState().items[0].completed).toBe(true)

    // Resolver el servidor y verificar que el estado final es correcto
    resolveServer(
      mockOkResponse({ completed: true }) as unknown as Response
    )
    await togglePromise

    expect(useUnifiedShoppingStore.getState().items[0].completed).toBe(true)
  })

  it('revierte la UI (rollback) si el servidor devuelve error', async () => {
    const item = makeItem({ completed: false })
    useUnifiedShoppingStore.setState({ items: [item] })

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(
      useUnifiedShoppingStore.getState().toggleItemCompleted('item-1')
    ).rejects.toThrow()

    // El item debe volver al estado original (false)
    expect(useUnifiedShoppingStore.getState().items[0].completed).toBe(false)
  })

  it('no hace nada si el item no existe', async () => {
    useUnifiedShoppingStore.setState({ items: [] })

    await useUnifiedShoppingStore.getState().toggleItemCompleted('no-existe')

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('puede alternar de true a false con rollback correcto', async () => {
    const item = makeItem({ completed: true })
    useUnifiedShoppingStore.setState({ items: [item] })

    mockFetch.mockRejectedValueOnce(new Error('Server error'))

    await expect(
      useUnifiedShoppingStore.getState().toggleItemCompleted('item-1')
    ).rejects.toThrow()

    // Debe revertir a true (el valor original)
    expect(useUnifiedShoppingStore.getState().items[0].completed).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// updateItemCompletedStatus
// ─────────────────────────────────────────────────────────────────────────────
describe('updateItemCompletedStatus', () => {
  it('actualiza la UI optimistamente', async () => {
    const item = makeItem({ completed: false })
    useUnifiedShoppingStore.setState({ items: [item] })

    let resolveServer!: (r: Response) => void
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((res) => { resolveServer = res })
    )

    const updatePromise = useUnifiedShoppingStore.getState().updateItemCompletedStatus('item-1', true)

    // UI actualizada antes del servidor
    expect(useUnifiedShoppingStore.getState().items[0].completed).toBe(true)

    resolveServer(mockOkResponse({ completed: true }) as unknown as Response)
    await updatePromise

    expect(useUnifiedShoppingStore.getState().items[0].completed).toBe(true)
  })

  it('hace rollback si el servidor falla', async () => {
    const item = makeItem({ completed: false })
    useUnifiedShoppingStore.setState({ items: [item] })

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(
      useUnifiedShoppingStore.getState().updateItemCompletedStatus('item-1', true)
    ).rejects.toThrow()

    expect(useUnifiedShoppingStore.getState().items[0].completed).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// deleteItem
// ─────────────────────────────────────────────────────────────────────────────
describe('deleteItem', () => {
  it('elimina el item de la UI inmediatamente', async () => {
    const item = makeItem()
    useUnifiedShoppingStore.setState({ items: [item] })

    let resolveServer!: (r: Response) => void
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((res) => { resolveServer = res })
    )

    const deletePromise = useUnifiedShoppingStore.getState().deleteItem('item-1')

    // El item debe desaparecer antes de que el servidor confirme
    expect(useUnifiedShoppingStore.getState().items).toHaveLength(0)

    resolveServer(mockOkResponse(null) as unknown as Response)
    await deletePromise

    expect(useUnifiedShoppingStore.getState().items).toHaveLength(0)
  })

  it('restaura el item si el servidor falla', async () => {
    const item = makeItem()
    useUnifiedShoppingStore.setState({ items: [item] })

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(
      useUnifiedShoppingStore.getState().deleteItem('item-1')
    ).rejects.toThrow()

    // El item debe ser restaurado
    expect(useUnifiedShoppingStore.getState().items).toHaveLength(1)
    expect(useUnifiedShoppingStore.getState().items[0].id).toBe('item-1')
    expect(useUnifiedShoppingStore.getState().items[0].name).toBe('Leche')
  })

  it('no hace nada si el item no existe', async () => {
    useUnifiedShoppingStore.setState({ items: [] })

    await useUnifiedShoppingStore.getState().deleteItem('no-existe')

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('elimina el item correcto cuando hay múltiples items', async () => {
    const items = [
      makeItem({ id: 'item-1', name: 'Leche', orderIndex: 0 }),
      makeItem({ id: 'item-2', name: 'Pan', orderIndex: 1 }),
      makeItem({ id: 'item-3', name: 'Huevos', orderIndex: 2 }),
    ]
    useUnifiedShoppingStore.setState({ items })

    mockFetch.mockResolvedValueOnce(mockOkResponse(null) as unknown as Response)

    await useUnifiedShoppingStore.getState().deleteItem('item-2')

    const remaining = useUnifiedShoppingStore.getState().items
    expect(remaining).toHaveLength(2)
    expect(remaining.find((i) => i.id === 'item-2')).toBeUndefined()
    expect(remaining.find((i) => i.id === 'item-1')).toBeDefined()
    expect(remaining.find((i) => i.id === 'item-3')).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// addItem
// ─────────────────────────────────────────────────────────────────────────────
describe('addItem', () => {
  const category = { id: 'cat-1', slug: 'supermercado', name: 'Supermercado' }

  it('agrega un item temporal con ID "temp-" antes de la respuesta del servidor', async () => {
    useUnifiedShoppingStore.setState({ items: [], categories: [category] })

    const serverItem = {
      id: 'server-id-1',
      name: 'Leche',
      categories: { slug: 'supermercado' },
      status: 'este_mes',
      completed: false,
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let resolveServer!: (r: Response) => void
    mockFetch.mockReturnValueOnce(
      new Promise<Response>((res) => { resolveServer = res })
    )

    const addPromise = useUnifiedShoppingStore.getState().addItem('Leche', 'supermercado', 'este_mes')

    // Debe haber un item temporal inmediatamente
    const stateAfterOptimistic = useUnifiedShoppingStore.getState()
    expect(stateAfterOptimistic.items).toHaveLength(1)
    expect(stateAfterOptimistic.items[0].id).toMatch(/^temp-/)
    expect(stateAfterOptimistic.items[0].name).toBe('Leche')
    expect(stateAfterOptimistic.items[0].completed).toBe(false)

    resolveServer(mockOkResponse(serverItem) as unknown as Response)
    await addPromise

    // El ID temporal debe ser reemplazado por el del servidor
    const finalState = useUnifiedShoppingStore.getState()
    expect(finalState.items).toHaveLength(1)
    expect(finalState.items[0].id).toBe('server-id-1')
    expect(finalState.items[0].name).toBe('Leche')
  })

  it('elimina el item temporal si el servidor falla', async () => {
    useUnifiedShoppingStore.setState({ items: [], categories: [category] })

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(
      useUnifiedShoppingStore.getState().addItem('Leche', 'supermercado', 'este_mes')
    ).rejects.toThrow()

    // No debe quedar el item temporal
    expect(useUnifiedShoppingStore.getState().items).toHaveLength(0)
  })

  it('mantiene otros items existentes al hacer rollback', async () => {
    const existing = makeItem({ id: 'existing-1', name: 'Pan' })
    useUnifiedShoppingStore.setState({ items: [existing], categories: [category] })

    mockFetch.mockRejectedValueOnce(new Error('Server error'))

    await expect(
      useUnifiedShoppingStore.getState().addItem('Leche', 'supermercado', 'este_mes')
    ).rejects.toThrow()

    const items = useUnifiedShoppingStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('existing-1')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// movingItems — debe ser un array serializable, no un Set
// ─────────────────────────────────────────────────────────────────────────────
describe('movingItems', () => {
  it('es un array (no un Set)', () => {
    const { movingItems } = useUnifiedShoppingStore.getState()
    expect(Array.isArray(movingItems)).toBe(true)
  })

  it('se serializa correctamente con JSON.stringify', () => {
    useUnifiedShoppingStore.setState({ movingItems: ['item-1', 'item-2'] })
    const { movingItems } = useUnifiedShoppingStore.getState()

    expect(() => JSON.stringify(movingItems)).not.toThrow()
    expect(JSON.parse(JSON.stringify(movingItems))).toEqual(['item-1', 'item-2'])
  })

  it('isMovingItem devuelve true solo para items en la lista', () => {
    useUnifiedShoppingStore.setState({ movingItems: ['item-1'] })
    const { isMovingItem } = useUnifiedShoppingStore.getState()

    expect(isMovingItem('item-1')).toBe(true)
    expect(isMovingItem('item-2')).toBe(false)
  })

  it('cleanupStuckMovingItems limpia el array', () => {
    useUnifiedShoppingStore.setState({ movingItems: ['item-1', 'item-2'] })
    useUnifiedShoppingStore.getState().cleanupStuckMovingItems()

    expect(useUnifiedShoppingStore.getState().movingItems).toEqual([])
  })
})
