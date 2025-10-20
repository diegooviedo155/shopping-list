import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Handle OAuth callback redirects (simplified)
  if (request.nextUrl.pathname === '/' && request.nextUrl.hash) {
    // Let the client-side JavaScript handle the OAuth redirect
  }

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define route patterns
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register') ||
                     request.nextUrl.pathname.startsWith('/auth') ||
                     request.nextUrl.pathname.startsWith('/forgot-password') ||
                     request.nextUrl.pathname.startsWith('/reset-password') ||
                     request.nextUrl.pathname.startsWith('/error')
  
  // Special handling for reset-password page - don't redirect authenticated users
  if (request.nextUrl.pathname === '/reset-password' && user) {
    return supabaseResponse
  }
  
  const isProtectedRoute = !isAuthRoute && (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/lists') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/categories')
  )

  // Redirect logic
  // Importante: La sesión del cliente está en localStorage y el middleware solo ve cookies.
  // Para evitar loops, NO redirigimos aquí cuando no hay usuario.
  if (isProtectedRoute && !user) {
    return supabaseResponse
  }

  if (isAuthRoute && user && !request.nextUrl.pathname.startsWith('/auth/callback')) {
    // Evitar redirecciones desde middleware para no crear loops.
    // Dejamos que el cliente redirija tras login exitoso.
    return supabaseResponse
  }

  // Return the supabaseResponse for all other cases
  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/lists/:path*',
    '/admin/:path*',
    '/categories/:path*',
    '/login',
    '/register',
    '/auth/:path*',
    '/forgot-password',
    '/reset-password',
  ],
}