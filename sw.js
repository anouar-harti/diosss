// Service Worker básico para permitir la instalación PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Estrategia simple: Network Only (para evitar problemas de caché en desarrollo)
  // Esto es suficiente para que Chrome detecte la app como instalable.
  event.respondWith(fetch(event.request));
});