const CACHE_NAME = 'web-games-v6';

const ASSET_PATHS = [
    './',
    'index.html',
    'style.css',
    'app.js',
    'vocab-tracker.js',
    'manifest.json',
    'games/speed-reader/index.html',
    'games/speed-reader/style.css',
    'games/speed-reader/game.js',
    'games/speed-reader/i18n.js',
    'games/speed-reader/texts/en.js',
    'games/speed-reader/texts/de.js',
    'games/speed-reader/texts/uk.js',
    'games/word-in-context/index.html',
    'games/word-in-context/style.css',
    'games/word-in-context/game.js',
    'games/word-in-context/i18n.js',
    'vocabulary/index.html',
    'vocabulary/style.css',
    'vocabulary/app.js',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            const base = self.registration.scope;
            return cache.addAll(ASSET_PATHS.map((p) => new URL(p, base).href));
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetched = fetch(event.request).then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => cached || new Response('You are offline. Please reconnect and try again.', {
                status: 503,
                headers: { 'Content-Type': 'text/html' }
            }));
            return cached || fetched;
        })
    );
});
