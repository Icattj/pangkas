/**
 * Pangkas — Service Worker (sw.js)
 * 
 * Strategi:
 * - Cache-first untuk asset statis (CSS, JS, gambar, font)
 * - Network-first untuk data/API requests
 * - Offline fallback page
 */

const CACHE_NAME = 'pangkas-v1';
const DATA_CACHE = 'pangkas-data-v1';

// Asset statis yang di-cache saat install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/js/db.js',
  '/js/utils.js',
  '/js/app.js',
  '/js/ui.js',
  '/manifest.json',
  // CSS akan ditambahkan nanti
  // '/css/style.css',
];

// Offline fallback HTML (inline, tidak perlu file terpisah)
const OFFLINE_PAGE = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pangkas — Offline</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a0a0f; color: #f0f0f0;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; text-align: center; padding: 24px;
    }
    .offline-icon { font-size: 72px; margin-bottom: 20px; }
    h1 { font-size: 22px; margin-bottom: 12px; }
    p { color: #888; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    button {
      padding: 14px 32px; background: #0ABFBC; color: #000;
      border: none; border-radius: 12px; font-size: 16px;
      font-weight: 600; cursor: pointer;
    }
    button:active { transform: scale(0.96); }
  </style>
</head>
<body>
  <div>
    <div class="offline-icon">📡</div>
    <h1>Kamu Sedang Offline</h1>
    <p>
      Tidak ada koneksi internet.<br>
      Data yang tersimpan di perangkat masih bisa diakses.<br>
      Coba muat ulang saat sudah online.
    </p>
    <button onclick="location.reload()">Coba Lagi</button>
  </div>
</body>
</html>`;

// ─── Install ──────────────────────────────────────────────────
// Pre-cache static assets saat pertama kali install.

self.addEventListener('install', function (event) {
  console.log('[SW] Install — caching static assets');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS).catch(function (err) {
        // Jangan gagal total kalau ada asset yang belum ada
        console.warn('[SW] Beberapa asset gagal di-cache:', err);
        // Cache satu per satu sebagai fallback
        return Promise.all(
          STATIC_ASSETS.map(function (url) {
            return cache.add(url).catch(function () {
              console.warn('[SW] Skip cache:', url);
            });
          })
        );
      });
    }).then(function () {
      // Langsung aktif, jangan tunggu tab lama ditutup
      return self.skipWaiting();
    })
  );
});

// ─── Activate ─────────────────────────────────────────────────
// Bersihkan cache lama saat versi baru aktif.

self.addEventListener('activate', function (event) {
  console.log('[SW] Activate — membersihkan cache lama');
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (name) {
          if (name !== CACHE_NAME && name !== DATA_CACHE) {
            console.log('[SW] Hapus cache lama:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(function () {
      // Ambil alih semua tab yang terbuka
      return self.clients.claim();
    })
  );
});

// ─── Fetch ────────────────────────────────────────────────────

self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);

  // Abaikan non-GET dan chrome-extension
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Tentukan strategi berdasarkan tipe request
  if (_isDataRequest(url)) {
    // Network-first untuk data/API
    event.respondWith(_networkFirst(request));
  } else {
    // Cache-first untuk asset statis
    event.respondWith(_cacheFirst(request));
  }
});

// ─── Strategies ───────────────────────────────────────────────

/**
 * Cache-first: coba cache dulu, fallback ke network.
 * Cocok untuk asset statis yang jarang berubah.
 */
function _cacheFirst(request) {
  return caches.match(request).then(function (cached) {
    if (cached) {
      // Update cache di background (stale-while-revalidate)
      _updateCache(request);
      return cached;
    }
    // Tidak ada di cache → fetch dari network
    return fetch(request).then(function (response) {
      // Cache response yang valid
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, clone);
        });
      }
      return response;
    }).catch(function () {
      // Offline — tampilkan fallback
      return _offlineFallback(request);
    });
  });
}

/**
 * Network-first: coba network dulu, fallback ke cache.
 * Cocok untuk data yang harus fresh.
 */
function _networkFirst(request) {
  return fetch(request).then(function (response) {
    if (response && response.status === 200) {
      var clone = response.clone();
      caches.open(DATA_CACHE).then(function (cache) {
        cache.put(request, clone);
      });
    }
    return response;
  }).catch(function () {
    // Network gagal — coba dari cache
    return caches.match(request).then(function (cached) {
      return cached || _offlineFallback(request);
    });
  });
}

/**
 * Background update cache (stale-while-revalidate).
 */
function _updateCache(request) {
  fetch(request).then(function (response) {
    if (response && response.status === 200) {
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(request, response);
      });
    }
  }).catch(function () {
    // Abaikan error — kita sudah punya cache
  });
}

/**
 * Offline fallback — return offline page untuk navigation requests.
 */
function _offlineFallback(request) {
  // Kalau request HTML (navigation), tampilkan offline page
  if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
    return new Response(OFFLINE_PAGE, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  // Untuk asset lain, return 503
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Cek apakah request adalah data/API (bukan asset statis).
 */
function _isDataRequest(url) {
  // API calls
  if (url.pathname.startsWith('/api/')) return true;
  // External requests
  if (url.origin !== self.location.origin) return true;
  return false;
}

console.log('[SW] Loaded ✓');
