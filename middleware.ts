import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Verificar que las variables de entorno estén configuradas
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    // Si no hay configuración de Supabase, continuar sin verificar sesión
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Handle OAuth callback redirects (simplified)
    if (request.nextUrl.pathname === "/" && request.nextUrl.hash) {
      // Let the client-side JavaScript handle the OAuth redirect
    }

    // Agregar timeout para evitar que se quede colgado (reducido a 2 segundos)
    let user = null;
    try {
      const getUserPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Auth check timeout")), 2000)
      );

      // Intentar obtener el usuario con timeout - no bloquear si falla
      const result = (await Promise.race([getUserPromise, timeoutPromise])) as {
        data: { user: any };
      };
      user = result.data.user;
    } catch (error) {
      // Si hay un error o timeout, simplemente continuar sin bloquear
      // No loguear en producción para evitar ruido en los logs
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "Auth check skipped:",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
      // Continuar con user = null para que la lógica de rutas funcione correctamente
    }

    // Define route patterns
    const isAuthRoute =
      request.nextUrl.pathname.startsWith("/login") ||
      request.nextUrl.pathname.startsWith("/register") ||
      request.nextUrl.pathname.startsWith("/auth") ||
      request.nextUrl.pathname.startsWith("/forgot-password") ||
      request.nextUrl.pathname.startsWith("/reset-password") ||
      request.nextUrl.pathname.startsWith("/error");

    // Special handling for reset-password page - don't redirect authenticated users
    if (request.nextUrl.pathname === "/reset-password" && user) {
      return supabaseResponse;
    }

    const isProtectedRoute =
      !isAuthRoute &&
      (request.nextUrl.pathname === "/" ||
        request.nextUrl.pathname.startsWith("/lists") ||
        request.nextUrl.pathname.startsWith("/admin") ||
        request.nextUrl.pathname.startsWith("/categories"));

    // Redirect logic
    // Importante: La sesión del cliente está en localStorage y el middleware solo ve cookies.
    // Para evitar loops, NO redirigimos aquí cuando no hay usuario.
    if (isProtectedRoute && !user) {
      return supabaseResponse;
    }

    if (
      isAuthRoute &&
      user &&
      !request.nextUrl.pathname.startsWith("/auth/callback")
    ) {
      // Evitar redirecciones desde middleware para no crear loops.
      // Dejamos que el cliente redirija tras login exitoso.
      return supabaseResponse;
    }
  } catch (error) {
    // Si hay un error al crear el cliente, continuar sin bloquear
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Middleware error (non-blocking):",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  // Siempre retornar la respuesta, incluso si falla la verificación de sesión
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/lists/:path*",
    "/admin/:path*",
    "/categories/:path*",
    "/login",
    "/register",
    "/auth/:path*",
    "/forgot-password",
    "/reset-password",
  ],
};
