
const CACHE_NAME = 'teambot-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://i.ibb.co/v4pXp2F/teambot-mascot.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
