const CACHE_NAME = 'shopping-list-v1';
const urlsToCache = [
  '/',
  '/lists',
  '/manifest.json',
  '/icons/manifest-icon-192.png',
  '/icons/manifest-icon-512.png',
  '/icons/apple-icon-180.png'
];

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// URLs que NO deben ser cacheadas (APIs externas, Supabase, etc.)
const shouldBypassCache = (url, request) => {
  // Bypass para peticiones a Supabase (cualquier dominio de Supabase)
  if (url.includes('supabase.co') || url.includes('supabase')) {
    return true;
  }
  
  // Bypass para peticiones a APIs
  if (url.includes('/api/')) {
    return true;
  }
  
  // Bypass para peticiones POST, PUT, DELETE, PATCH (no deben cachearse)
  if (request.method !== 'GET') {
    return true;
  }
  
  // Bypass para peticiones con credenciales
  if (request.credentials === 'include' || request.credentials === 'same-origin') {
    return true;
  }
  
  // Bypass para peticiones con headers de autorización
  if (request.headers && request.headers.get('authorization')) {
    return true;
  }
  
  return false;
};

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const request = event.request;
  
  // Si es una petición que debe ser bypassed, hacer fetch directo sin cache
  if (shouldBypassCache(url, request)) {
    // NO usar event.respondWith para peticiones que deben ser bypassed
    // Esto permite que la petición pase directamente sin interceptar
    return;
  }
  
  // Solo cachear peticiones GET para recursos estáticos
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Devolver desde cache si está disponible
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Si no está en cache, hacer fetch normal
        return fetch(request)
          .then((response) => {
            // Solo cachear respuestas exitosas y que sean del mismo origen
            if (response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                // Solo cachear recursos estáticos (HTML, CSS, JS, imágenes)
                const contentType = response.headers.get('content-type');
                if (contentType && (
                  contentType.includes('text/html') ||
                  contentType.includes('text/css') ||
                  contentType.includes('application/javascript') ||
                  contentType.includes('image/')
                )) {
                  cache.put(request, responseToCache);
                }
              });
            }
            return response;
          })
          .catch((error) => {
            console.warn('Error en fetch:', error);
            // Si es una petición de navegación y falla, intentar devolver página offline
            if (request.mode === 'navigate') {
              return caches.match('/');
            }
            throw error;
          });
      })
  );
});
