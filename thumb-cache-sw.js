// Orbital8 thumbnail store (service worker).
// Thumbnails are saved on the device the first time they load and served from there afterwards, so Grid,
// Table and Explore read them locally instead of asking Google Drive again - across visits too.
// Only thumbnail requests are touched; everything else goes to the network untouched.
const CACHE = 'orbital8-thumbs-v1';
const MAX_ENTRIES = 1500;

const isThumbnail = url =>
    (url.hostname === 'drive.google.com' && url.pathname === '/thumbnail')
    || url.hostname.endsWith('.googleusercontent.com')
    || (url.hostname === 'graph.microsoft.com' && url.pathname.includes('/thumbnails/'))
    // Local test server used by the e2e suite.
    || (url.hostname === '127.0.0.1' && url.pathname.startsWith('/img/'));

self.addEventListener('install', event => { event.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });

let trimScheduled = false;
async function trim(cache) {
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - MAX_ENTRIES; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    let url;
    try { url = new URL(request.url); } catch (_) { return; }
    if (!isThumbnail(url)) return;
    event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(request.url, { ignoreVary: true, ignoreSearch: false });
        if (hit) return hit;
        const response = await fetch(request);
        // Opaque (cross-origin) responses can't be inspected; the page evicts any that fail to decode.
        if (response.ok || response.type === 'opaque') {
            cache.put(request.url, response.clone()).catch(() => {});
            if (!trimScheduled) { trimScheduled = true; setTimeout(() => { trimScheduled = false; trim(cache).catch(() => {}); }, 30000); }
        }
        return response;
    })());
});

self.addEventListener('message', event => {
    const data = event.data || {};
    if (data.type === 'evict' && data.url) event.waitUntil(caches.open(CACHE).then(cache => cache.delete(data.url)));
    if (data.type === 'clear') event.waitUntil(caches.delete(CACHE));
});
