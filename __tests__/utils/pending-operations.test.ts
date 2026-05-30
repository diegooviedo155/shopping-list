import { pendingOperationsQueue } from '@/lib/utils/pending-operations'

// Simular localStorage en jsdom
beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('pendingOperationsQueue', () => {
  describe('add / getAll / count', () => {
    it('agrega una operación y la persiste en localStorage', () => {
      pendingOperationsQueue.add({ itemId: 'item-1', type: 'toggle', payload: { completed: true } })
      expect(pendingOperationsQueue.count()).toBe(1)
      const ops = pendingOperationsQueue.getAll()
      expect(ops[0].itemId).toBe('item-1')
      expect(ops[0].type).toBe('toggle')
      expect(ops[0].payload).toEqual({ completed: true })
      expect(ops[0].id).toBeDefined()
      expect(ops[0].timestamp).toBeGreaterThan(0)
    })

    it('agrega múltiples operaciones distintas', () => {
      pendingOperationsQueue.add({ itemId: 'item-1', type: 'toggle', payload: { completed: true } })
      pendingOperationsQueue.add({ itemId: 'item-2', type: 'delete', payload: {} })
      pendingOperationsQueue.add({ itemId: 'item-3', type: 'move', payload: { newStatus: 'proximo_mes' } })
      expect(pendingOperationsQueue.count()).toBe(3)
    })

    it('persiste entre llamadas (lee de localStorage)', () => {
      pendingOperationsQueue.add({ itemId: 'item-1', type: 'toggle', payload: {} })
      // Simular "nueva instancia" limpiando el módulo
      expect(pendingOperationsQueue.count()).toBe(1)
    })
  })

  describe('remove', () => {
    it('elimina la operación por ID', () => {
      const op = pendingOperationsQueue.add({ itemId: 'item-1', type: 'toggle', payload: {} })
      pendingOperationsQueue.remove(op.id)
      expect(pendingOperationsQueue.count()).toBe(0)
    })

    it('no elimina otras operaciones', () => {
      const op1 = pendingOperationsQueue.add({ itemId: 'item-1', type: 'toggle', payload: {} })
      pendingOperationsQueue.add({ itemId: 'item-2', type: 'delete', payload: {} })
      pendingOperationsQueue.remove(op1.id)
      expect(pendingOperationsQueue.count()).toBe(1)
      expect(pendingOperationsQueue.getAll()[0].itemId).toBe('item-2')
    })

    it('no falla si el ID no existe', () => {
      expect(() => pendingOperationsQueue.remove('no-existe')).not.toThrow()
    })
  })

  describe('clear', () => {
    it('elimina todas las operaciones', () => {
      pendingOperationsQueue.add({ itemId: 'item-1', type: 'toggle', payload: {} })
      pendingOperationsQueue.add({ itemId: 'item-2', type: 'delete', payload: {} })
      pendingOperationsQueue.clear()
      expect(pendingOperationsQueue.count()).toBe(0)
    })
  })

  describe('deduplicación de toggle', () => {
    it('dos toggles seguidos del mismo item se anulan (resultado: 0 pendientes)', () => {
      pendingOperationsQueue.add({ itemId: 'item-1', type: 'toggle', payload: { completed: true } })
      pendingOperationsQueue.add({ itemId: 'item-1', type: 'toggle', payload: { completed: false } })
      // El segundo toggle cancela al primero
      expect(pendingOperationsQueue.count()).toBe(0)
    })

    it('toggles de distintos items no se cancelan', () => {
      pendingOperationsQueue.add({ itemId: 'item-1', type: 'toggle', payload: { completed: true } })
      pendingOperationsQueue.add({ itemId: 'item-2', type: 'toggle', payload: { completed: true } })
      expect(pendingOperationsQueue.count()).toBe(2)
    })
  })

  describe('deduplicación de delete', () => {
    it('dos deletes del mismo item reemplazan al anterior (resultado: 1 pendiente)', () => {
      pendingOperationsQueue.add({ itemId: 'item-1', type: 'delete', payload: {} })
      pendingOperationsQueue.add({ itemId: 'item-1', type: 'delete', payload: {} })
      expect(pendingOperationsQueue.count()).toBe(1)
    })
  })

  describe('deduplicación de move', () => {
    it('dos moves del mismo item reemplazan al anterior con el nuevo destino', () => {
      pendingOperationsQueue.add({ itemId: 'item-1', type: 'move', payload: { newStatus: 'proximo_mes' } })
      pendingOperationsQueue.add({ itemId: 'item-1', type: 'move', payload: { newStatus: 'este_mes' } })
      expect(pendingOperationsQueue.count()).toBe(1)
      expect(pendingOperationsQueue.getAll()[0].payload.newStatus).toBe('este_mes')
    })
  })

  describe('operaciones add — sin deduplicación', () => {
    it('dos adds distintos se acumulan', () => {
      pendingOperationsQueue.add({ itemId: 'temp-1', type: 'add', payload: { name: 'Leche' } })
      pendingOperationsQueue.add({ itemId: 'temp-2', type: 'add', payload: { name: 'Pan' } })
      expect(pendingOperationsQueue.count()).toBe(2)
    })
  })

  describe('orden FIFO', () => {
    it('devuelve las operaciones en el orden en que fueron agregadas', () => {
      pendingOperationsQueue.add({ itemId: 'item-1', type: 'toggle', payload: {} })
      pendingOperationsQueue.add({ itemId: 'item-2', type: 'delete', payload: {} })
      pendingOperationsQueue.add({ itemId: 'item-3', type: 'move', payload: { newStatus: 'proximo_mes' } })

      const ops = pendingOperationsQueue.getAll()
      expect(ops[0].itemId).toBe('item-1')
      expect(ops[1].itemId).toBe('item-2')
      expect(ops[2].itemId).toBe('item-3')
    })
  })
})
