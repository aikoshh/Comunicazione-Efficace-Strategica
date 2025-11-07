// sw.js
const CACHE_NAME = 'ces-coach-cache-v2'; // Increased version to force update

// Lista di tutte le risorse critiche da pre-caricare
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  // Copiato da assets.ts per il pre-caching
  'https://images.weserv.nl/?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1556761175-5973dc0f32e7%3Fq%3D80%26w%3D600%26h%3D360%26auto%3Dformat%26fit%3Dcrop&output=webp&q=80',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/gestire-conversazioni-difficili_2.MP4',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/domande-strategiche_2.MP4',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/allenamento-personalizzato_2.MP4',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/ascolto-strategico_2.MP4',
  'https://images.weserv.nl/?url=https%3A%2F%2Fwww.marinaosnaghi.com%2Fwp-content%2Fuploads%2F2020%2F03%2FParlare-in-pubblico-1170x600.jpg&output=webp&q=80',
  'https://images.weserv.nl/?url=https%3A%2F%2Fwww.centroclinicaformazionestrategica.it%2FCES-APP%2Fimages%2Fchat-strategica.png&output=webp&q=80',
  'https://images.weserv.nl/?url=https%3A%2F%2Fwww.centroclinicaformazionestrategica.it%2FCES-APP%2Fimages%2FCES-COACH-LOGO-trasparente.PNG&output=webp&q=80',
  'https://images.weserv.nl/?url=https%3A%2F%2Fwww.centroclinicaformazionestrategica.it%2FCES-APP%2Fimages%2FCES-COACH-LOGO-PICCOLO.png&output=webp&q=80',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/presentazione-iniziale.MP4',
  'https://images.weserv.nl/?url=https%3A%2F%2Fwww.centroclinicaformazionestrategica.it%2FCES-APP%2Fimages%2Fivano-cincinnato.png&output=webp&q=80',
  'https://images.weserv.nl/?url=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1590650516494-0c8e4a4dd67e%3Fq%3D80%26w%3D1200%26auto%3Dformat%26fit%3Dcrop&output=webp&q=80',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/sfida-del-giorno.MP4',
  'https://images.weserv.nl/?url=https%3A%2F%2Fwww.centroclinicaformazionestrategica.it%2FCES-APP%2Fimages%2Fsfida-del-giorno.png&output=webp&q=80',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/valuta-livello-iniziale.MP4',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/risultati-pro.MP4',
  'https://images.weserv.nl/?url=https%3A%2F%2Fwww.centroclinicaformazionestrategica.it%2FCES-APP%2Fimages%2Fdialogo%2520strategico.png&output=webp&q=80',
  'https://images.weserv.nl/?url=https%3A%2F%2Fwww.centroclinicaformazionestrategica.it%2FCES-APP%2Fimages%2FRiformulazione%2520sintetica.png&output=webp&q=80',
  'https://images.weserv.nl/?url=https%3A%2F%2Fwww.centroclinicaformazionestrategica.it%2FCES-APP%2Fimages%2Fallenamento-personalizzato.png&output=webp&q=80',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/gestire-conversazioni-difficili.MP4',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/dare-feedback-efficace.mp4',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/domande-strategiche.MP4',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/ascolto-strategico.MP4',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/allenamento-personalizzato_2.MP4',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/voce-strategica.MP4',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/chat-strategica.MP4',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/vantaggio-risultati-pro.MP4',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/feedback%20paraverbale.MP4',
  'https://www.centroclinicaformazionestrategica.it/CES-APP/images/librerie-strategiche.MP4'
];

// L'evento 'install' viene ora usato per pre-caricare tutte le risorse critiche.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and pre-caching resources');
        // Usiamo addAll che è atomico: se una risorsa fallisce, l'intero caching fallisce.
        // Aggiungiamo un catch per ogni risorsa per evitare che un fallimento blocchi tutto.
        const promises = urlsToCache.map(url => {
          return fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
            console.warn(`Failed to fetch and cache: ${url}`);
          }).catch(err => {
            console.warn(`Failed to fetch ${url}:`, err);
          });
        });
        return Promise.all(promises);
      })
      .then(() => self.skipWaiting()) // Attiva subito il nuovo service worker
  );
});

// L'evento 'activate' pulisce le vecchie cache non più necessarie.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Prende il controllo della pagina immediatamente
  );
});

// L'evento 'fetch' intercetta tutte le richieste di rete.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Per la navigazione (richieste HTML), proviamo prima la rete.
  // Se fallisce (offline), serviamo l'index.html dalla cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Per tutte le altre risorse (JS, CSS, immagini, video), usiamo una strategia "cache-first".
  // Dato che abbiamo pre-caricato tutto, la maggior parte delle richieste troverà una corrispondenza.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se la risorsa è in cache, la serviamo subito.
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Altrimenti, la richiediamo alla rete.
      return fetch(event.request).then((networkResponse) => {
        // E la mettiamo in cache per le prossime volte (utile per risorse non pre-caricate).
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
