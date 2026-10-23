/* HỌC VĂN – Service Worker (khớp với hoc-van-4.0-supabase.html) */
const VERSION = 'hv-4.8.0';
const SHELL_CACHE = 'hv-shell-' + VERSION;
const ASSET_CACHE = 'hv-assets-' + VERSION;
const SHELL = ['./', './index.html', './sw.js'];

// Không bao giờ cache dữ liệu động / API / realtime
const NEVER_CACHE = [
  'supabase.co', 'supabase.in',
  'generativelanguage.googleapis.com',
  'googleapis.com/v1', 'api.anthropic.com'
];
// Thư viện tĩnh dùng stale-while-revalidate
const STATIC_HOSTS = [
  'cdn.tailwindcss.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net',
  'fonts.googleapis.com', 'fonts.gstatic.com'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(SHELL_CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return (k.indexOf('hv-shell-') === 0 && k !== SHELL_CACHE) ||
               (k.indexOf('hv-assets-') === 0 && k !== ASSET_CACHE);
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (NEVER_CACHE.some(function (h) { return url.href.indexOf(h) !== -1; })) return;

  // Trang HTML: luôn ưu tiên mạng để thấy bản mới nhất, mất mạng mới dùng cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) { const copy = res.clone(); caches.open(SHELL_CACHE).then(function (c) { c.put('./', copy); }); }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match('./') || caches.match('./index.html'); });
      })
    );
    return;
  }

  // Thư viện CDN / font: stale-while-revalidate
  if (STATIC_HOSTS.indexOf(url.hostname) !== -1) {
    e.respondWith(
      caches.open(ASSET_CACHE).then(function (c) {
        return c.match(req).then(function (hit) {
          const net = fetch(req).then(function (res) {
            if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
            return res;
          }).catch(function () { return hit; });
          return hit || net;
        });
      })
    );
    return;
  }

  // File cùng origin khác: network-first
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) { const copy = res.clone(); caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return caches.match(req); })
    );
  }
});
