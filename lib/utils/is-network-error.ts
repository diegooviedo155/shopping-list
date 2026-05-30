/**
 * Determina si un error proviene de una falla de red (sin conexión, timeout)
 * vs un error del servidor (4xx, 5xx).
 *
 * Es importante distinguirlos porque:
 * - Error de red → guardar operación en cola, no hacer rollback de la UI
 * - Error de servidor → rollback + mostrar toast de error al usuario
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const msg = error.message.toLowerCase()
  const name = error.name.toLowerCase()

  return (
    // Chrome / Firefox
    msg.includes('failed to fetch') ||
    // Firefox alternativo
    msg.includes('networkerror') ||
    // Safari
    msg.includes('load failed') ||
    msg.includes('the internet connection appears to be offline') ||
    // AbortController timeout
    name === 'aborterror' ||
    // Timeout interno de RequestQueue (10s)
    msg.includes('timeout') ||
    // Timeout interno de RequestQueue (string exacto)
    msg.includes('request timeout') ||
    // Electron / React Native
    msg.includes('network request failed')
  )
}
