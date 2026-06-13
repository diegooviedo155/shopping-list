const STATIC_CACHE = 'shopping-static-v3'
const DATA_CACHE = 'shopping-data-v3'

const STATIC_URLS = [
  '/',
  '/lists',
  '/offline.html',
  '/manifest.json',
  '/icons/manifest-icon-192.png',
  '/icons/manifest-icon-512.png',
  '/icons/apple-icon-180.png',
  '/logo.png',
]

// Rutas de API cuyos GET se cachean con estrategia "Network First, Fall Back to Cache"
const CACHEABLE_API_ROUTES = [
  '/api/shopping-items',
  '/api/categories',
]

// ─── Install ───────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_URLS))
      .then(() => self.skipWaiting()) // activar inmediatamente
  )
})

// ─── Activate ──────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n !== STATIC_CACHE && n !== DATA_CACHE)
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim()) // tomar control de todas las pestañas
  )
})

// ─── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Nunca interceptar peticiones a Supabase ni autenticación
  if (url.hostname.includes('supabase') || url.pathname.includes('/auth/')) {
    return
  }

  // Nunca cachear mutaciones (POST, PUT, PATCH, DELETE)
  if (request.method !== 'GET') {
    return
  }

  // ── Estrategia: Network First, Fall Back to Cache para APIs de datos ────
  const isCacheableApi = CACHEABLE_API_ROUTES.some((route) =>
    url.pathname.startsWith(route)
  )

  if (isCacheableApi) {
    event.respondWith(networkFirstDataStrategy(request))
    return
  }

  // ── Estrategia: Cache First para assets estáticos ───────────────────────
  event.respondWith(cacheFirstStaticStrategy(request))
})

/**
 * Network First: intenta la red y cachea la respuesta.
 * Si no hay red, devuelve la caché. Si tampoco hay caché,
 * devuelve un JSON de error indicando modo offline.
 */
async function networkFirstDataStrategy(request) {
  try {
    const networkResponse = await fetch(request.clone())
    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached

    return new Response(
      JSON.stringify({ error: 'Sin conexión', offline: true, data: [] }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * Cache First: sirve desde caché si está disponible.
 * Si no hay caché, va a la red y cachea el resultado.
 * Si tampoco hay red y es navegación, devuelve la página principal.
 */
async function cacheFirstStaticStrategy(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.status === 200 && networkResponse.type === 'basic') {
      const contentType = networkResponse.headers.get('content-type') || ''
      const isCacheable =
        contentType.includes('text/html') ||
        contentType.includes('text/css') ||
        contentType.includes('application/javascript') ||
        contentType.includes('image/')

      if (isCacheable) {
        const cache = await caches.open(STATIC_CACHE)
        cache.put(request, networkResponse.clone())
      }
    }
    return networkResponse
  } catch {
    if (request.mode === 'navigate') {
      // Intentar la página cacheada primero (app shell completa)
      const root = await caches.match('/')
      if (root) return root
      // Fallback: página offline propia en lugar del error genérico de Chrome
      const offline = await caches.match('/offline.html')
      if (offline) return offline
    }
    // Para assets (JS/CSS/imagen) que fallan offline, devolver respuesta vacía
    // en lugar de propagar el error (evita que Chrome muestre su página de error)
    return new Response('', { status: 503, statusText: 'Service Unavailable' })
  }
}
