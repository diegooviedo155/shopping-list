// Sistema de cola para limitar peticiones concurrentes y evitar saturación
// Incluye deduplicación de peticiones idénticas

interface QueuedRequest {
  id: string
  key: string // Clave única para deduplicación
  execute: () => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
  priority?: number
}

class RequestQueue {
  private queue: QueuedRequest[] = []
  private running: Set<string> = new Set()
  private pendingRequests: Map<string, Promise<any>> = new Map() // Para deduplicación
  private maxConcurrent: number = 6 // Aumentado a 6 peticiones concurrentes
  private timeout: number = 10000 // 10 segundos de timeout por defecto
  private deduplicationWindow = 1000 // Ventana de deduplicación: 1 segundo

  async add<T>(
    id: string,
    execute: () => Promise<T>,
    priority: number = 0,
    key?: string // Clave opcional para deduplicación
  ): Promise<T> {
    // Si se proporciona una clave, verificar si hay una petición pendiente idéntica
    if (key) {
      const pendingRequest = this.pendingRequests.get(key)
      if (pendingRequest) {
        // Retornar la promesa existente en lugar de crear una nueva
        return pendingRequest as Promise<T>
      }
    }

    return new Promise<T>((resolve, reject) => {
      const requestKey = key || id
      const request: QueuedRequest = {
        id,
        key: requestKey,
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

      // Si hay una clave, guardar la promesa para deduplicación
      if (key) {
        const requestPromise = new Promise<T>((innerResolve, innerReject) => {
          request.resolve = (value: any) => {
            // Clonar la respuesta si es un Response para evitar problemas de body ya leído
            // Esto es crítico cuando hay deduplicación y múltiples promesas comparten la respuesta
            let clonedValue = value
            if (value && typeof value === 'object' && 'clone' in value && typeof value.clone === 'function') {
              try {
                clonedValue = value.clone()
              } catch (e) {
                // Si falla el clone, usar el valor original
                clonedValue = value
              }
            }
            // Cada promesa debe recibir su propia copia clonada
            innerResolve(clonedValue)
            // Para la promesa original, también clonar
            if (value && typeof value === 'object' && 'clone' in value && typeof value.clone === 'function') {
              try {
                resolve(value.clone())
              } catch (e) {
                resolve(value)
              }
            } else {
              resolve(value)
            }
          }
          request.reject = (error: any) => {
            innerReject(error)
            reject(error)
          }
        })
        
        this.pendingRequests.set(key, requestPromise)
        
        // Limpiar después de la ventana de deduplicación
        setTimeout(() => {
          this.pendingRequests.delete(key)
        }, this.deduplicationWindow)
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
      // Resolver la promesa - la clonación se maneja en el resolve handler cuando hay deduplicación
      request.resolve(result)
    } catch (error) {
      request.reject(error)
    } finally {
      this.running.delete(request.id)
      // Limpiar de pendingRequests si existe
      if (request.key && request.key !== request.id) {
        this.pendingRequests.delete(request.key)
      }
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
  
  // Crear clave de deduplicación para peticiones GET idénticas
  // Solo deduplicar peticiones GET para evitar problemas con POST/PUT/DELETE
  const deduplicationKey = options.method === 'GET' || !options.method
    ? `${options.method || 'GET'}_${url}_${JSON.stringify(options.headers || {})}`
    : undefined
  
  const response = await requestQueue.add(
    requestId,
    async () => {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response
    },
    priority,
    deduplicationKey
  )
  
  // Siempre clonar la respuesta para evitar problemas de body ya leído
  // Esto es especialmente importante cuando hay deduplicación, pero también
  // previene problemas si la respuesta se lee múltiples veces por error
  // Nota: Si hay deduplicación, la respuesta ya fue clonada en el handler,
  // pero clonar de nuevo aquí no causa problemas y asegura consistencia
  if (typeof response.clone === 'function') {
    try {
      return response.clone()
    } catch (e) {
      // Si falla el clone (puede pasar en mocks de tests), retornar la respuesta original
      return response
    }
  }
  
  // Si no tiene clone (mocks de tests), retornar la respuesta original
  return response
}

