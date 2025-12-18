import { createBrowserClient } from '@supabase/ssr'
import { createMockSupabaseClient, isSupabaseConfigured } from './mock'

// Función para limpiar tokens inválidos del localStorage
function cleanupInvalidTokens() {
  if (typeof window === 'undefined') return

  try {
    // Limpiar tokens de Supabase que puedan estar causando problemas
    const keys = Object.keys(localStorage)
    let cleaned = false
    
    keys.forEach(key => {
      // Limpiar claves relacionadas con Supabase auth
      if (key.includes('supabase') || key.includes('sb-') || key.startsWith('supabase.auth.token')) {
        try {
          const value = localStorage.getItem(key)
          if (value) {
            // Intentar parsear para verificar si es un token válido
            try {
              const parsed = JSON.parse(value)
              // Si el token tiene una fecha de expiración pasada, limpiarlo
              if (parsed.expires_at && parsed.expires_at < Date.now() / 1000) {
                localStorage.removeItem(key)
                cleaned = true
              }
            } catch {
              // Si no se puede parsear, podría ser un token inválido
              localStorage.removeItem(key)
              cleaned = true
            }
          }
        } catch (e) {
          // Ignorar errores al limpiar
        }
      }
    })

    if (cleaned && process.env.NODE_ENV === 'development') {
      console.log('Cleaned invalid Supabase tokens from localStorage')
    }
  } catch (error) {
    // Ignorar errores silenciosamente
  }
}

// Limpiar tokens inválidos antes de crear el cliente
if (typeof window !== 'undefined') {
  cleanupInvalidTokens()
}

// Check if Supabase is configured
const isConfigured = isSupabaseConfigured()

// Client-side Supabase client usando @supabase/ssr para compartir sesión con el servidor
export const supabase = isConfigured 
  ? createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : createMockSupabaseClient() as any

// For use in client components
export const createClientComponentClient = () => isConfigured
  ? createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : createMockSupabaseClient() as any
