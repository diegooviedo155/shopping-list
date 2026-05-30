/**
 * Cola persistente de operaciones pendientes de sincronización.
 *
 * Cuando el usuario realiza una mutación (tildar, borrar, agregar, mover)
 * sin conexión a internet, la operación se guarda aquí. Al recuperar la
 * conexión, el hook `usePendingSync` las reproduce en orden FIFO.
 */

export type OperationType = 'toggle' | 'delete' | 'add' | 'move' | 'update-name'

export interface PendingOperation {
  id: string
  type: OperationType
  itemId: string
  payload: Record<string, unknown>
  timestamp: number
}

const STORAGE_KEY = 'lo-que-falta:pending-ops'

function readFromStorage(): PendingOperation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PendingOperation[]) : []
  } catch {
    return []
  }
}

function writeToStorage(ops: PendingOperation[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ops))
  } catch {
    // Ignorar errores de storage (modo privado, disco lleno, etc.)
  }
}

export const pendingOperationsQueue = {
  getAll(): PendingOperation[] {
    return readFromStorage()
  },

  add(op: Omit<PendingOperation, 'id' | 'timestamp'>): PendingOperation {
    const operation: PendingOperation = {
      ...op,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
    const current = readFromStorage()

    // Deduplicar: si ya existe una operación del mismo tipo para el mismo item,
    // reemplazarla en lugar de acumular (ej: toggle rápido x2 cancela el efecto)
    if (op.type === 'toggle' || op.type === 'delete' || op.type === 'move') {
      const existing = current.findIndex(
        (o) => o.type === op.type && o.itemId === op.itemId
      )
      if (existing !== -1) {
        if (op.type === 'toggle') {
          // Dos toggles seguidos se anulan
          const updated = current.filter((_, i) => i !== existing)
          writeToStorage(updated)
          return operation // devolvemos la operación pero sin persistirla
        }
        // Para delete y move: reemplazar la anterior por la nueva
        const updated = [...current]
        updated[existing] = operation
        writeToStorage(updated)
        return operation
      }
    }

    writeToStorage([...current, operation])
    return operation
  },

  remove(id: string): void {
    const updated = readFromStorage().filter((op) => op.id !== id)
    writeToStorage(updated)
  },

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  },

  count(): number {
    return readFromStorage().length
  },
}
