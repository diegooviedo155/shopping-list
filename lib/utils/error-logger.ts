/**
 * Utilidad para guardar y recuperar logs de errores
 */

export interface ErrorLog {
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  url: string
  type?: 'error' | 'unhandled' | 'boundary'
}

const MAX_LOGS = 20

export function saveErrorLog(error: ErrorLog) {
  if (typeof window === 'undefined') return

  try {
    const existingLogs = JSON.parse(sessionStorage.getItem('error-logs') || '[]')
    existingLogs.push(error)
    // Mantener solo los últimos N errores
    const recentLogs = existingLogs.slice(-MAX_LOGS)
    sessionStorage.setItem('error-logs', JSON.stringify(recentLogs))
    
    // También guardar en localStorage para persistencia entre sesiones (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      const devLogs = JSON.parse(localStorage.getItem('dev-error-logs') || '[]')
      devLogs.push(error)
      const recentDevLogs = devLogs.slice(-MAX_LOGS)
      localStorage.setItem('dev-error-logs', JSON.stringify(recentDevLogs))
    }
  } catch (e) {
    console.warn('Error al guardar log:', e)
  }
}

export function getErrorLogs(): ErrorLog[] {
  if (typeof window === 'undefined') return []

  try {
    const logs = JSON.parse(sessionStorage.getItem('error-logs') || '[]')
    return logs
  } catch (e) {
    return []
  }
}

export function clearErrorLogs() {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem('error-logs')
  if (process.env.NODE_ENV === 'development') {
    localStorage.removeItem('dev-error-logs')
  }
}

/**
 * Inicializa el interceptor global de errores
 */
export function initErrorInterceptor() {
  if (typeof window === 'undefined') return

  // Interceptar errores no manejados
  window.addEventListener('error', (event) => {
    saveErrorLog({
      message: event.message || 'Error no manejado',
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      type: 'unhandled',
    })
  })

  // Interceptar promesas rechazadas no manejadas
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason))
    
    saveErrorLog({
      message: error.message || 'Promise rechazada no manejada',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      type: 'unhandled',
    })
  })
}

