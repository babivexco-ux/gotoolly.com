// Service Worker for Background Removal Tool
// Enables offline functionality and caches critical resources

const CACHE_VERSION = 'gotoolly-v3';
const RUNTIME_CACHE = 'gotoolly-runtime-v3';
const ASSETS_CACHE = 'gotoolly-assets-v3';
const MODEL_CACHE = 'gotoolly-models-v3';

// Files to cache on install
const CRITICAL_ASSETS = [
    '/',
    '/index.html',
    '/tools/Background%20Removal.html',
+    '/tools/image-compressor.html',
    '/assets/css/styles.min.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
    // legacy files (kept for backward-compatibility)
    '/assets/css/base.css',
    '/assets/css/layout.css',
    '/assets/css/components.css',
    '/assets/css/tools.css',
    '/assets/js/main.js',
+    '/assets/js/tools/image-compressor.js',
    '/assets/images/logo.png'
];

// Model files to cache
const MODELS_TO_CACHE = [
    '/assets/js/lib/remove-background.min.js',
    '/assets/js/lib/remove-background.wasm',
    // Local vendor builds for TensorFlow and BodyPix (replace placeholders with real builds)
    '/assets/vendor/tf.min.js',
    '/assets/vendor/body-pix.min.js'
];

// Install event - cache minimal, safe static assets (non-blocking)
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install event (safe pre-cache)');

    event.waitUntil((async () => {
        try {
            const cache = await caches.open(ASSETS_CACHE);

            // Only cache safe, small, static assets that help first paint and offline UX
            const safeAssets = [
                '/',
                '/index.html',
                '/assets/css/styles.min.css',
                '/site.webmanifest',
                '/favicon.ico',
                '/assets/images/logo-192.png',
                '/assets/icons/icon-192x192.png',
                '/assets/icons/icon-512x512.png'
            ];

            // Use best-effort caching (Promise.allSettled) to avoid failing install on network errors
            await Promise.allSettled(safeAssets.map(async (url) => {
                try {
                    const resp = await fetch(url, { cache: 'no-cache' });
                    if (resp && resp.ok) {
                        await cache.put(url, resp);
                    }
                } catch (e) {
                    console.warn('[ServiceWorker] Pre-cache failed for', url, e && e.message);
                }
            }));

            console.log('[ServiceWorker] Safe assets cached (best-effort)');
        } catch (error) {
            console.warn('[ServiceWorker] Install: caching safe assets failed', error);
        }

        // Ensure install does not block activation
        self.skipWaiting();
    })());
});

// Activate event - clean up old caches (non-blocking)
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate event (cleanup)');

    event.waitUntil((async () => {
        try {
            const cacheNames = await caches.keys();
            const expected = [ASSETS_CACHE, MODEL_CACHE, RUNTIME_CACHE];

            await Promise.all(
                cacheNames
                    .filter(name => !expected.includes(name))
                    .map(name => {
                        console.log('[ServiceWorker] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        } catch (err) {
            console.warn('[ServiceWorker] Activate cleanup failed', err && err.message);
        }

        // Take control of all pages
        self.clients.claim();
    })());
});

// Fetch event - implement network-first, then cache strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Allow Google Fonts to be handled by the service worker (cache-first)
    const isCrossOriginFont = url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com';

    // Skip other cross-origin requests
    if (url.origin !== self.location.origin && !isCrossOriginFont) {
        return;
    }
    
    // Different strategies based on request type
    if (request.destination === 'document' || url.pathname.includes('Background')) {
        // HTML documents: network-first, fallback to cache
        event.respondWith(networkFirstStrategy(request));
    } else if (request.destination === 'style') {
        // CSS: cache-first (safe static styles)
        event.respondWith(cacheFirstStrategy(request));
    } else if (request.destination === 'script') {
        // Scripts: network-first to avoid serving stale or large cached libs
        event.respondWith(networkFirstStrategy(request));
    } else if (request.destination === 'image') {
        // Images: cache-first with network update
        event.respondWith(cacheFirstStrategy(request));
    } else if (request.destination === 'font' || isCrossOriginFont) {
        // Fonts (including Google Fonts): cache-first for fast text rendering
        event.respondWith(cacheFirstStrategy(request));
    } else {
        // Default: network-first
        event.respondWith(networkFirstStrategy(request));
    }
});

/**
 * Network-first strategy: try network, fallback to cache
 * Good for documents that change frequently
 */
async function networkFirstStrategy(request) {
    try {
        // Try network first
        const response = await fetch(request);

        // If successful, cache it (but avoid caching scripts to prevent storing large or frequently-changing libs)
        if (response && response.ok) {
            if (request.destination !== 'script') {
                const cache = await caches.open(RUNTIME_CACHE);
                cache.put(request, response.clone());
            }
        }

        return response;
    } catch (error) {
        // Network failed, try cache
        const cached = await caches.match(request);

        if (cached) {
            console.log('[ServiceWorker] Using cached response for:', request.url);
            return cached;
        }

        // No cache, return offline page or error
        console.warn('[ServiceWorker] Network failed and no cache for:', request.url);
        return new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Cache-first strategy: try cache, fallback to network
 * Good for static assets that don't change often
 */
async function cacheFirstStrategy(request) {
    // Check cache first
    const cached = await caches.match(request);
    
    if (cached) {
        console.log('[ServiceWorker] Using cached asset:', request.url);
        
        // Update cache in background (stale-while-revalidate pattern)
        fetch(request)
            .then(response => {
                if (response.ok) {
                    const cache = caches.open(ASSETS_CACHE);
                    cache.then(c => c.put(request, response));
                }
            })
            .catch(err => {
                // Network error during background update, ignore
                console.log('[ServiceWorker] Background update failed:', err.message);
            });
        
        return cached;
    }
    
    // Not in cache, try network
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            // Cache the response
            const cache = await caches.open(ASSETS_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.warn('[ServiceWorker] Network failed for:', request.url);
        return new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Message handler - allow clients to control cache
 */
self.addEventListener('message', (event) => {
    const { action, payload } = event.data;
    
    switch (action) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CLEAR_CACHE':
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
            event.ports[0].postMessage({ success: true });
            break;
            
        case 'CACHE_MODELS':
            cacheModels().then(() => {
                event.ports[0].postMessage({ success: true });
            }).catch(err => {
                event.ports[0].postMessage({ success: false, error: err.message });
            });
            break;
            
        default:
            console.log('[ServiceWorker] Unknown message:', action);
    }
});

/**
 * Pre-cache AI models
 */
async function cacheModels() {
    try {
        const cache = await caches.open(MODEL_CACHE);
        
        for (const modelUrl of MODELS_TO_CACHE) {
            try {
                const response = await fetch(modelUrl);
                if (response.ok) {
                    await cache.put(modelUrl, response);
                    console.log('[ServiceWorker] Cached model:', modelUrl);
                }
            } catch (error) {
                console.warn('[ServiceWorker] Failed to cache model:', modelUrl, error);
            }
        }
    } catch (error) {
        console.error('[ServiceWorker] Failed to cache models:', error);
    }
}

console.log('[ServiceWorker] Background Removal Service Worker loaded');
