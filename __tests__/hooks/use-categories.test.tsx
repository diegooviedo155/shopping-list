import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCategories } from '@/hooks/use-categories'
import type { Category } from '@/lib/types/category'

jest.mock('@/lib/utils/request-queue', () => ({
  queuedFetch: jest.fn(),
}))
jest.mock('@/lib/utils/auth-cache', () => ({
  getCachedAuthHeaders: jest.fn().mockResolvedValue({ Authorization: 'Bearer test' }),
}))

const { queuedFetch } = jest.requireMock('@/lib/utils/request-queue') as {
  queuedFetch: jest.Mock
}

function makeResponse(data: unknown, ok = true) {
  return {
    ok,
    json: () => Promise.resolve(data),
  } as Response
}

const mockCategory: Category = {
  id: '1',
  name: 'Lácteos',
  slug: 'lacteos',
  icon: 'milk',
  color: '#fff',
  isActive: true,
  orderIndex: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('useCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('carga las categorías al montar', async () => {
    queuedFetch.mockResolvedValueOnce(makeResponse([mockCategory]))

    const { result } = renderHook(() => useCategories(), { wrapper })

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.categories).toEqual([mockCategory])
    expect(result.current.error).toBeNull()
  })

  it('expone error cuando el fetch falla', async () => {
    queuedFetch.mockResolvedValueOnce(makeResponse({ error: 'Fallo de red' }, false))

    const { result } = renderHook(() => useCategories(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Fallo de red')
    expect(result.current.categories).toEqual([])
  })

  it('crea una categoría y la agrega al cache', async () => {
    const newCategory = { ...mockCategory, id: '2', name: 'Carnes' }
    queuedFetch
      .mockResolvedValueOnce(makeResponse([mockCategory]))
      .mockResolvedValueOnce(makeResponse(newCategory))

    const { result } = renderHook(() => useCategories(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createCategory({ name: 'Carnes', slug: 'carnes' } as any)
    })

    await waitFor(() => expect(result.current.categories).toHaveLength(2))
    expect(result.current.categories[1].name).toBe('Carnes')
  })

  it('actualiza una categoría en el cache', async () => {
    const updated = { ...mockCategory, name: 'Lácteos actualizado' }
    queuedFetch
      .mockResolvedValueOnce(makeResponse([mockCategory]))
      .mockResolvedValueOnce(makeResponse(updated))

    const { result } = renderHook(() => useCategories(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.updateCategory('1', { name: 'Lácteos actualizado' } as any)
    })

    await waitFor(() =>
      expect(result.current.categories[0].name).toBe('Lácteos actualizado')
    )
  })

  it('elimina una categoría del cache', async () => {
    queuedFetch
      .mockResolvedValueOnce(makeResponse([mockCategory]))
      .mockResolvedValueOnce(makeResponse(null))

    const { result } = renderHook(() => useCategories(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteCategory('1')
    })

    await waitFor(() => expect(result.current.categories).toHaveLength(0))
  })

  it('cambia el estado activo de una categoría', async () => {
    const toggled = { ...mockCategory, isActive: false }
    queuedFetch
      .mockResolvedValueOnce(makeResponse([mockCategory]))
      .mockResolvedValueOnce(makeResponse(toggled))

    const { result } = renderHook(() => useCategories(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.toggleCategoryStatus(mockCategory)
    })

    await waitFor(() =>
      expect(result.current.categories[0].isActive).toBe(false)
    )
  })

  it('isSubmitting es true mientras se ejecuta una mutación', async () => {
    let resolveCreate!: (v: Response) => void
    const pending = new Promise<Response>((res) => { resolveCreate = res })

    queuedFetch
      .mockResolvedValueOnce(makeResponse([mockCategory]))
      .mockReturnValueOnce(pending)

    const { result } = renderHook(() => useCategories(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Disparar mutación sin awaitar (queda pendiente)
    act(() => {
      result.current.createCategory({ name: 'Nueva' } as any)
    })

    await waitFor(() => expect(result.current.isSubmitting).toBe(true))

    // Resolver la mutación
    await act(async () => {
      resolveCreate(makeResponse({ ...mockCategory, id: '3', name: 'Nueva' }))
    })

    await waitFor(() => expect(result.current.isSubmitting).toBe(false))
  })
})
