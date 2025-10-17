import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // No-op for server-side
        },
      },
    })

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting authenticated user:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Error in getAuthenticatedUser:', error)
    return null
  }
}

// Función alternativa que extrae el user_id del JWT token directamente
export function getUserIdFromRequest(request: Request): string | null {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return null
    }

    // Decodificar el JWT token (solo la parte del payload)
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub || null
  } catch (error) {
    console.error('Error extracting user ID from token:', error)
    return null
  }
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const user = await getAuthenticatedUser()
  return user?.id || null
}
