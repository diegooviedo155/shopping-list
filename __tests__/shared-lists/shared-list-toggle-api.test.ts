/**
 * Tests para PATCH /api/shared-lists/[ownerId]/items/[itemId]
 *
 * Verifica los casos de autorización y la lógica de toggle.
 */

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(),
}))

import { createServerClient } from '@/lib/supabase/server'
import { PATCH } from '@/app/api/shared-lists/[ownerId]/items/[itemId]/route'
import { NextRequest } from 'next/server'

const mockCreateServerClient = createServerClient as jest.MockedFunction<
  typeof createServerClient
>

// Helper para construir el request
function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/shared-lists/owner-1/items/item-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Helper para los params de Next.js App Router
const makeParams = (ownerId: string, itemId: string) =>
  ({ params: Promise.resolve({ ownerId, itemId }) } as any)

// Helper para construir un mock de Supabase
function makeSupabaseMock({
  user = { id: 'member-1' },
  authError = null,
  accessData = { id: 'access-1' },
  accessError = null,
  updatedItem = { id: 'item-1', completed: true, updated_at: '2025-01-01' },
  updateError = null,
}: {
  user?: { id: string } | null
  authError?: unknown
  accessData?: unknown
  accessError?: unknown
  updatedItem?: unknown
  updateError?: unknown
} = {}) {
  const selectSingle = jest.fn().mockResolvedValue({ data: accessData, error: accessError })
  const updateSelectSingle = jest.fn().mockResolvedValue({ data: updatedItem, error: updateError })

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: authError }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'shared_list_access') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: selectSingle,
        }
      }
      if (table === 'shopping_items') {
        return {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: updateSelectSingle,
        }
      }
    }),
  } as unknown as Awaited<ReturnType<typeof createServerClient>>
}

// ─────────────────────────────────────────────────────────────────────────────
// Autorización
// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/shared-lists/[ownerId]/items/[itemId]', () => {
  it('devuelve 401 si el usuario no está autenticado', async () => {
    mockCreateServerClient.mockResolvedValue(
      makeSupabaseMock({ user: null, authError: new Error('No auth') })
    )

    const res = await PATCH(makeRequest({ completed: true }), makeParams('owner-1', 'item-1'))
    expect(res.status).toBe(401)
  })

  it('devuelve 403 si el usuario no tiene acceso a la lista', async () => {
    mockCreateServerClient.mockResolvedValue(
      makeSupabaseMock({ accessData: null, accessError: new Error('Not found') })
    )

    const res = await PATCH(makeRequest({ completed: true }), makeParams('owner-1', 'item-1'))
    expect(res.status).toBe(403)
  })

  it('devuelve 400 si el body no incluye completed (booleano)', async () => {
    mockCreateServerClient.mockResolvedValue(makeSupabaseMock())

    const res = await PATCH(makeRequest({ completed: 'yes' }), makeParams('owner-1', 'item-1'))
    expect(res.status).toBe(400)
  })

  it('devuelve 400 si el body está vacío', async () => {
    mockCreateServerClient.mockResolvedValue(makeSupabaseMock())

    const res = await PATCH(makeRequest({}), makeParams('owner-1', 'item-1'))
    expect(res.status).toBe(400)
  })

  it('actualiza el item y devuelve 200 con datos del item', async () => {
    const updatedItem = {
      id: 'item-1',
      completed: true,
      name: 'Leche',
      updated_at: '2025-01-01T12:00:00Z',
    }
    mockCreateServerClient.mockResolvedValue(makeSupabaseMock({ updatedItem }))

    const res = await PATCH(makeRequest({ completed: true }), makeParams('owner-1', 'item-1'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.id).toBe('item-1')
    expect(body.completed).toBe(true)
  })

  it('el propietario puede modificar sus propios items sin verificar shared_list_access', async () => {
    const mock = makeSupabaseMock({ user: { id: 'owner-1' } })
    mockCreateServerClient.mockResolvedValue(mock)

    const res = await PATCH(makeRequest({ completed: false }), makeParams('owner-1', 'item-1'))

    // No debe consultar shared_list_access cuando el user es el owner
    const sharedListAccessCalls = (mock.from as jest.Mock).mock.calls.filter(
      ([table]: [string]) => table === 'shared_list_access'
    )
    expect(sharedListAccessCalls).toHaveLength(0)
    expect(res.status).toBe(200)
  })

  it('devuelve 500 si la base de datos falla al actualizar', async () => {
    mockCreateServerClient.mockResolvedValue(
      makeSupabaseMock({ updatedItem: null, updateError: new Error('DB error') })
    )

    const res = await PATCH(makeRequest({ completed: true }), makeParams('owner-1', 'item-1'))
    expect(res.status).toBe(500)
  })
})
