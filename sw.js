/* Avanza — service worker.
   Borra la caché de la app anterior (Nexo QR / Control de Llaves) y sirve
   siempre la versión más reciente (network-first). Solo gestiona los archivos
   propios del sitio; no intercepta Supabase ni los CDN. */
const CACHE = 'avanza-v1';

self.addEventListener('install', function (e) { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.map(function (k) { return caches.delete(k); })); // limpia TODO lo viejo
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (e) {
  var url;
  try { url = new URL(e.request.url); } catch (err) { return; }
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // deja pasar CDN y Supabase
  e.respondWith((async function () {
    try {
      var fresh = await fetch(e.request);
      if (fresh && fresh.status === 200) {
        var c = await caches.open(CACHE);
        c.put(e.request, fresh.clone());
      }
      return fresh;
    } catch (err) {
      var cached = await caches.match(e.request);
      return cached || new Response('', { status: 504 });
    }
  })());
});
