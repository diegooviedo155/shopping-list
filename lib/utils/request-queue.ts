// Sistema de cola para limitar peticiones concurrentes y evitar saturación

interface QueuedRequest {
  id: string
  execute: () => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
  priority?: number
}

class RequestQueue {
  private queue: QueuedRequest[] = []
  private running: Set<string> = new Set()
  private maxConcurrent: number = 3 // Máximo de 3 peticiones concurrentes
  private timeout: number = 10000 // 10 segundos de timeout por defecto

  async add<T>(
    id: string,
    execute: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest = {
        id,
        execute: async () => {
          // Agregar timeout a la petición
          const timeoutPromise = new Promise<never>((_, timeoutReject) => {
            setTimeout(() => {
              timeoutReject(new Error(`Request timeout after ${this.timeout}ms`))
            }, this.timeout)
          })

          try {
            const result = await Promise.race([execute(), timeoutPromise])
            return result
          } catch (error) {
            throw error
          }
        },
        resolve,
        reject,
        priority
      }

      // Insertar en la cola según prioridad (mayor prioridad primero)
      const insertIndex = this.queue.findIndex(r => (r.priority || 0) < priority)
      if (insertIndex === -1) {
        this.queue.push(request)
      } else {
        this.queue.splice(insertIndex, 0, request)
      }

      this.process()
    })
  }

  private async process() {
    // Si ya estamos al máximo de concurrentes o no hay items en la cola, no hacer nada
    if (this.running.size >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    const request = this.queue.shift()
    if (!request) return

    this.running.add(request.id)

    try {
      const result = await request.execute()
      request.resolve(result)
    } catch (error) {
      request.reject(error)
    } finally {
      this.running.delete(request.id)
      // Procesar siguiente petición
      this.process()
    }
  }

  clear() {
    this.queue.forEach(req => {
      req.reject(new Error('Queue cleared'))
    })
    this.queue = []
  }

  setMaxConcurrent(max: number) {
    this.maxConcurrent = max
    this.process()
  }

  setTimeout(timeout: number) {
    this.timeout = timeout
  }
}

// Instancia global de la cola
export const requestQueue = new RequestQueue()

// Helper para hacer fetch con timeout y cola
export async function queuedFetch(
  url: string,
  options: RequestInit = {},
  priority: number = 0
): Promise<Response> {
  const requestId = `${options.method || 'GET'}_${url}_${Date.now()}_${Math.random()}`
  
  return requestQueue.add(
    requestId,
    async () => {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response
    },
    priority
  )
}

