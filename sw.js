const CACHE_NAME = 'coach-pro-v3.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/state.js',
  '/js/calculations.js',
  '/js/printer.js',
  '/js/components/dashboard.js',
  '/js/components/clientList.js',
  '/js/components/clientDetail.js',
  '/js/components/clientModal.js',
  '/js/components/thermalModal.js',
  '/js/components/settingsModal.js',
  '/js/components/quickTools.js',
  '/js/components/assessment21.js',
  '/js/components/billing.js',
  '/js/components/bodyComp.js',
  '/js/components/comparator.js',
  '/js/components/metabolic.js',
  '/js/components/messages.js',
  '/js/components/nutrition.js',
  '/js/components/planning.js',
  '/js/components/programs.js',
  '/js/components/progressCheckin.js',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        }).catch(() => cached)
      );
    })
  );
});
