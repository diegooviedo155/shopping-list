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
  if (isProtectedRoute && !user) {
    // User is not authenticated and trying to access protected route
    const redirectUrl = new URL('/login', request.url)
    const response = NextResponse.redirect(redirectUrl)
    
    // Copy cookies from supabaseResponse
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
    
    return response
  }

  if (isAuthRoute && user && !request.nextUrl.pathname.startsWith('/auth/callback')) {
    // User is authenticated and trying to access auth route (except callback)
    // Redirect to home
    const redirectUrl = new URL('/', request.url)
    const response = NextResponse.redirect(redirectUrl)
    
    // Copy cookies from supabaseResponse
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, cookie)
    })
    
    return response
  }

  // Return the supabaseResponse for all other cases
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - public files
     */
    // Temporarily disabled to avoid redirect loops
    // "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}