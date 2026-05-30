import { isNetworkError } from './is-network-error'

/**
 * Ejecuta `fn` y, si falla con un error de servidor 5xx, lo reintenta
 * una vez después de `delayMs` ms.
 *
 * - Errores de red (sin conexión, timeout) → no reintenta (van a la cola offline)
 * - Errores 4xx → no reintenta (no van a cambiar)
 * - Errores 5xx → 1 reintento silencioso
 */
export async function withServerRetry<T>(
  fn: () => Promise<T>,
  delayMs = 800
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (isNetworkError(error)) throw error

    const msg = error instanceof Error ? error.message.toLowerCase() : ''
    const isServerError =
      msg.includes('http 5') ||
      msg.includes('500') ||
      msg.includes('502') ||
      msg.includes('503') ||
      msg.includes('504')

    if (!isServerError) throw error

    await new Promise<void>((resolve) => setTimeout(resolve, delayMs))
    return fn()
  }
}
