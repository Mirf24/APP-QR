/* Guarda la app en el móvil para que abra al instante y funcione sin cobertura. */
const CACHE = 'nexo-qr-v1';
const ARCHIVOS = [
  './',
  './index.html',
  './jsQR.js',
  './manifest.webmanifest',
  './marca-nexo.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ns => Promise.all(ns.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Las llamadas a la hoja de cálculo nunca se guardan: siempre datos frescos.
  if (url.hostname.indexOf('google.com') !== -1) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(guardado => {
      const red = fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic'){
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
        }
        return resp;
      }).catch(() => guardado);
      return guardado || red;
    })
  );
});
