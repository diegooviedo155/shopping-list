// Sistema de caché para sesiones de autenticación
// Evita múltiples llamadas a getSession() en un corto período de tiempo

interface CachedSession {
  access_token: string;
  expires_at: number; // Timestamp de expiración
}

class AuthCache {
  private cache: CachedSession | null = null;
  private cacheDuration = 5 * 60 * 1000; // 5 minutos por defecto
  private refreshPromise: Promise<CachedSession | null> | null = null;

  async getSession(): Promise<CachedSession | null> {
    // Si hay un refresh en curso, esperar a que termine
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Si el caché es válido, retornarlo
    if (this.cache && Date.now() < this.cache.expires_at) {
      return this.cache;
    }

    // Si no hay caché o expiró, refrescar
    return this.refreshSession();
  }

  async refreshSession(): Promise<CachedSession | null> {
    // Si ya hay un refresh en curso, esperar a ese
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Crear la promesa de refresh
    this.refreshPromise = this._doRefresh();

    try {
      const session = await this.refreshPromise;
      return session;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async _doRefresh(): Promise<CachedSession | null> {
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.access_token) {
        this.cache = null;
        return null;
      }

      // Guardar en caché con tiempo de expiración
      this.cache = {
        access_token: session.access_token,
        expires_at: Date.now() + this.cacheDuration,
      };

      return this.cache;
    } catch (error) {
      console.error('AuthCache: Error refreshing session:', error);
      this.cache = null;
      return null;
    }
  }

  clear(): void {
    this.cache = null;
    this.refreshPromise = null;
  }

  setCacheDuration(duration: number): void {
    this.cacheDuration = duration;
  }
}

// Instancia global del caché
export const authCache = new AuthCache();

// Helper para obtener headers de autenticación con caché
export async function getCachedAuthHeaders(): Promise<Record<string, string>> {
  const session = await authCache.getSession();

  if (!session) {
    throw new Error('Usuario no autenticado');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

