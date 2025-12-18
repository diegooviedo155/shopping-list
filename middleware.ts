import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Verificar que las variables de entorno estén configuradas
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Si no hay configuración de Supabase, continuar sin verificar sesión
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      },
    )

    // Agregar timeout para evitar que se quede colgado (reducido a 2 segundos)
    const getUserPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Auth check timeout')), 2000)
    )

    // Intentar obtener el usuario con timeout - no bloquear si falla
    try {
      await Promise.race([getUserPromise, timeoutPromise])
      // Si se obtiene el usuario correctamente, continuar normalmente
    } catch (error) {
      // Si hay un error o timeout, simplemente continuar sin bloquear
      // No loguear en producción para evitar ruido en los logs
      if (process.env.NODE_ENV === 'development') {
        console.warn('Auth check skipped:', error instanceof Error ? error.message : 'Unknown error')
      }
      // Continuar con la respuesta normal sin bloquear la aplicación
    }
  } catch (error) {
    // Si hay un error al crear el cliente, continuar sin bloquear
    if (process.env.NODE_ENV === 'development') {
      console.warn('Middleware error (non-blocking):', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // Siempre retornar la respuesta, incluso si falla la verificación de sesión
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
