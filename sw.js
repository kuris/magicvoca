const CACHE_NAME = 'magicvoca-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Skip caching for node_modules and specific problematic files
  if (event.request.url.includes('node_modules') || 
      event.request.url.includes('lucide-react') ||
      event.request.url.includes('.pnpm') ||
      event.request.url.includes('?v=')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // Fallback for failed requests
          return new Response('', { status: 404 });
        });
      })
      .catch(() => {
        // Fallback for cache errors
        return fetch(event.request).catch(() => {
          return new Response('', { status: 404 });
        });
      })
  );
});
