/**
 * Tests para useRealtimeSharedList
 */

// Los mocks deben definirse con factories inline para evitar el problema de
// temporal dead zone (jest.mock() se hoistea antes de los const del módulo)
jest.mock('@/lib/supabase/client', () => {
  const mockSend = jest.fn().mockResolvedValue('ok')
  const mockSubscribe = jest.fn().mockReturnThis()
  const mockOn = jest.fn().mockReturnThis()

  return {
    supabase: {
      channel: jest.fn().mockReturnValue({ on: mockOn, subscribe: mockSubscribe, send: mockSend }),
      removeChannel: jest.fn(),
    },
  }
})

import { renderHook, act, waitFor } from '@testing-library/react'
import { useRealtimeSharedList } from '@/hooks/use-realtime-shared-list'
import { supabase } from '@/lib/supabase/client'

const OWNER_ID = 'owner-abc'

function makeItem(id: string, completed = false) {
  return {
    id,
    name: `Item ${id}`,
    category_id: 'cat-1',
    status: 'este_mes',
    completed,
    order_index: 0,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    categories: {
      id: 'cat-1',
      name: 'Supermercado',
      slug: 'supermercado',
      color: '#10b981',
      icon: 'shopping-cart',
    },
  }
}

function mockOkFetch(data: unknown) {
  return { ok: true, status: 200, json: jest.fn().mockResolvedValue(data) }
}

function mockFailFetch(data: unknown = { error: 'Error' }) {
  return { ok: false, status: 500, json: jest.fn().mockResolvedValue(data) }
}

const originalFetch = global.fetch

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers() // evitar leaks por el polling setTimeout
  global.fetch = jest.fn()
})

afterEach(() => {
  jest.useRealTimers()
})

afterAll(() => {
  global.fetch = originalFetch
})

describe('useRealtimeSharedList', () => {
  it('carga los items al montar', async () => {
    const items = [makeItem('item-1'), makeItem('item-2')]
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockOkFetch(items))

    const { result } = renderHook(() => useRealtimeSharedList(OWNER_ID))

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.items).toHaveLength(2)
    expect(result.current.error).toBeNull()
  })

  it('setea error si el fetch devuelve status no-ok', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(
      mockFailFetch({ error: 'No autorizado' })
    )

    const { result } = renderHook(() => useRealtimeSharedList(OWNER_ID))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeTruthy()
    expect(result.current.items).toHaveLength(0)
  })

  it('toggleItem aplica actualización optimista antes de que el servidor responda', async () => {
    const items = [makeItem('item-1', false)]
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockOkFetch(items))    // fetch inicial
      .mockReturnValueOnce(new Promise(() => {}))   // PATCH que nunca resuelve

    const { result } = renderHook(() => useRealtimeSharedList(OWNER_ID))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => { result.current.toggleItem('item-1') })

    // La UI debe reflejar el cambio optimistamente (completed = true)
    expect(result.current.items[0].completed).toBe(true)
  })

  it('toggleItem hace rollback si el PATCH falla', async () => {
    const items = [makeItem('item-1', false)]
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockOkFetch(items))
      .mockResolvedValueOnce(mockFailFetch())

    const { result } = renderHook(() => useRealtimeSharedList(OWNER_ID))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await expect(result.current.toggleItem('item-1')).rejects.toThrow()
    })

    expect(result.current.items[0].completed).toBe(false)
  })

  it('toggleItem hace broadcast después de un PATCH exitoso', async () => {
    const items = [makeItem('item-1', false)]
    const updatedItem = { ...items[0], completed: true, updated_at: '2025-01-02T00:00:00Z' }

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockOkFetch(items))
      .mockResolvedValueOnce(mockOkFetch(updatedItem))

    const { result } = renderHook(() => useRealtimeSharedList(OWNER_ID))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.toggleItem('item-1')
    })

    const channel = (supabase.channel as jest.Mock).mock.results[0].value
    expect(channel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'broadcast',
        event: 'item:toggled',
        payload: expect.objectContaining({
          itemId: 'item-1',
          completed: true,
        }),
      })
    )
  })

  it('remueve el canal Realtime al desmontar', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockOkFetch([]))

    const { unmount } = renderHook(() => useRealtimeSharedList(OWNER_ID))
    await waitFor(() => {})

    unmount()

    expect(supabase.removeChannel).toHaveBeenCalled()
  })

  it('suscribe al canal con el nombre correcto', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockOkFetch([]))

    renderHook(() => useRealtimeSharedList(OWNER_ID))
    await waitFor(() => {})

    expect(supabase.channel).toHaveBeenCalledWith(`shared-list:${OWNER_ID}`)
  })

  it('refetch actualiza los items', async () => {
    const initial = [makeItem('item-1', false)]
    const updated = [makeItem('item-1', true)]

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockOkFetch(initial))
      .mockResolvedValueOnce(mockOkFetch(updated))

    const { result } = renderHook(() => useRealtimeSharedList(OWNER_ID))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.items[0].completed).toBe(false)

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.items[0].completed).toBe(true)
  })
})
