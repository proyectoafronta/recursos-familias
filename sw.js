// Service worker de l'aplicació AFRONTA · Recursos per a famílies
// Versió de la memòria cau: puja el número (v3, v4...) cada vegada que vulguis forçar una neteja.
const CACHE_NAME = 'afronta-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'img/logo-afronta-grafo-uab.png',
  'img/MICINN_Gob_AEI.jpg',
  'img/Cc_by-nc-nd_icon.svg',
  'img/icon-192.png',
  'img/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  // Cada fitxer es desa per separat: si un falla, la resta continua.
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(ASSETS.map((a) => cache.add(a).catch(() => {})))
    )
  );
});

self.addEventListener('activate', (e) => {
  // Esborra les memòries cau de versions anteriors
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const offlineFallback = () => caches.match(r, { ignoreSearch: true }).then((x) => x || Response.error());

  if (u.origin === self.location.origin) {
    // Fitxers de la pàgina: sempre intenta la versió nova; si va bé, n'actualitza la còpia; si no hi ha connexió, usa la còpia.
    e.respondWith(
      fetch(r).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(r, copy));
        }
        return res;
      }).catch(offlineFallback)
    );
  } else {
    // Fitxers externs: només es desen els de cdnjs (biblioteques). Les dades oficials de la Generalitat
    // i els mapes NO es desen mai, per no mostrar mai dades antigues.
    e.respondWith(
      fetch(r).then((res) => {
        if (res.ok && u.hostname === 'cdnjs.cloudflare.com') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(r, copy));
        }
        return res;
      }).catch(offlineFallback)
    );
  }
});
