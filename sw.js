const CACHE_NAME = 'ces-coach-cache-v1';

// L'evento 'install' viene usato per preparare il service worker, ma non pre-cacheremo
// le risorse esterne per evitare problemi con CORS e CDN.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting()); // Attiva subito il nuovo service worker
});

// L'evento 'activate' pulisce le vecchie cache non più necessarie.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Prende il controllo della pagina immediatamente
  );
});

// L'evento 'fetch' intercetta tutte le richieste di rete.
self.addEventListener('fetch', (event) => {
  // Per la navigazione (richieste HTML), proviamo prima la rete.
  // Se fallisce (offline), serviamo l'index.html dalla cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Per tutte le altre risorse (JS, CSS, immagini, video), usiamo una strategia "cache-first".
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se la risorsa è in cache, la serviamo subito.
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Altrimenti, la richiediamo alla rete.
      return fetch(event.request).then((networkResponse) => {
        // E la mettiamo in cache per le prossime volte.
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
