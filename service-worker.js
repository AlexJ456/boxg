// service-worker.js

const CACHE_NAME = 'box-breathing-cache-v1'; // Increment version to force update
const urlsToCache = [
    '/', // Cache the root URL
    '/index.html', // Cache the main HTML file
    '/app.js', // Cache the main JavaScript file
    '/manifest.json', // Cache the manifest file
    // Add paths to any other essential assets like icons if they are local
    // '/images/icon-192.png',
    // '/images/icon-512.png',
    // Add CDN URLs if you want to cache them, though this can be complex
    // 'https://cdn.tailwindcss.com', // Caching opaque responses from CDNs might not save data
    // 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap' // Caching external fonts
];

// --- Installation ---
// Cache essential files when the service worker is installed.
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching app shell');
                // Add all essential assets to the cache.
                // Use addAll for atomic operation (all succeed or all fail).
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // Force the waiting service worker to become the active service worker.
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Caching failed', error);
            })
    );
});

// --- Activation ---
// Clean up old caches when the service worker is activated.
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Delete caches that are not the current one.
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of uncontrolled clients (tabs) immediately.
            return self.clients.claim();
        })
    );
});

// --- Fetch (Cache First Strategy) ---
// Intercept network requests and serve cached assets first.
self.addEventListener('fetch', event => {
    // console.log('Service Worker: Fetching', event.request.url);

    // We only want to handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Cache First strategy
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // 1. Cache Hit: Return the cached response
                if (cachedResponse) {
                    // console.log('Service Worker: Serving from cache:', event.request.url);
                    return cachedResponse;
                }

                // 2. Cache Miss: Fetch from the network
                // console.log('Service Worker: Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then(networkResponse => {
                        // 3. Network Success: Cache the response and return it
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                             // Don't cache opaque responses (like from CDNs unless careful) or errors
                            return networkResponse;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // console.log('Service Worker: Caching new resource:', event.request.url);
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(error => {
                        // 4. Network Failure (Offline): Try to return a fallback
                        console.log('Service Worker: Network request failed, trying fallback.', error);

                        // Specifically for navigation requests (loading the page itself),
                        // return the cached index.html as a fallback.
                        if (event.request.mode === 'navigate') {
                            console.log('Service Worker: Serving index.html as fallback for navigation.');
                            return caches.match('/index.html');
                        }

                        // For other types of requests (like JS, CSS),
                        // if they weren't cached initially, there's no specific fallback here.
                        // You could return a generic offline asset if needed.
                        // return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
                        return undefined; // Let the browser handle the error for non-navigation requests
                    });
            })
    );
});
