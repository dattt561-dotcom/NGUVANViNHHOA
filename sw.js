/* HỌC VĂN – Service Worker v4.9 (giới hạn cache, hạn dùng TTL, Navigation Preload, Background Sync) */
const VERSION = 'hv-4.9.1';
const SHELL_CACHE = 'hv-shell-' + VERSION;
const ASSET_CACHE = 'hv-assets-' + VERSION;
const SHELL = ['./', './index.html'];
const MAX_ASSETS = 80;                    // số tệp tối đa trong cache tài nguyên
const TTL = 7 * 24 * 3600 * 1000;         // hạn dùng cache tài nguyên: 7 ngày

const NEVER_CACHE = ['supabase.co', 'supabase.in', 'generativelanguage.googleapis.com', 'api.anthropic.com', 'meet.google.com'];
const STATIC_HOSTS = ['cdn.tailwindcss.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(SHELL_CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    const keys = await caches.keys();
    await Promise.all(keys.filter(function (k) {
      return (k.indexOf('hv-shell-') === 0 && k !== SHELL_CACHE) || (k.indexOf('hv-assets-') === 0 && k !== ASSET_CACHE);
    }).map(function (k) { return caches.delete(k); }));
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch (_) {} }
    await self.clients.claim();
  })());
});

self.addEventListener('message', function (e) {
  const d = e.data;
  if (d === 'SKIP_WAITING') self.skipWaiting();
  else if (d === 'CLEAR_CACHES') e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }));
  else if (d === 'TRIM') e.waitUntil(trim(ASSET_CACHE, MAX_ASSETS));
});

// Background Sync: báo cho trang đang mở đẩy hàng đợi nhật ký làm bài
self.addEventListener('sync', function (e) {
  if (e.tag === 'hv-wl') {
    e.waitUntil(self.clients.matchAll({ includeUncontrolled: true }).then(function (cs) {
      cs.forEach(function (c) { c.postMessage({ t: 'flush' }); });
    }));
  }
});

async function trim(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

async function stamp(res) {
  if (!res || res.type === 'opaque' || !res.ok) return res;
  const h = new Headers(res.headers);
  h.set('x-hv-ts', String(Date.now()));
  const body = await res.clone().blob();
  return new Response(body, { status: res.status, statusText: res.statusText, headers: h });
}

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (NEVER_CACHE.some(function (h) { return url.hostname.indexOf(h) !== -1; })) return;

  // Trang HTML: mạng trước (có Navigation Preload), mất mạng mới dùng cache
  if (req.mode === 'navigate') {
    e.respondWith((async function () {
      try {
        const pre = await e.preloadResponse;
        const res = pre || await fetch(req);
        if (res && res.ok) { const copy = res.clone(); caches.open(SHELL_CACHE).then(function (c) { c.put('./', copy); }); }
        return res;
      } catch (_) {
        return (await caches.match(req)) || (await caches.match('./')) || (await caches.match('./index.html'));
      }
    })());
    return;
  }

  // Thư viện CDN / font: stale-while-revalidate có hạn dùng + giới hạn dung lượng
  if (STATIC_HOSTS.indexOf(url.hostname) !== -1) {
    e.respondWith((async function () {
      const c = await caches.open(ASSET_CACHE);
      const hit = await c.match(req);
      const fresh = function () {
        return fetch(req).then(async function (res) {
          if (res && (res.ok || res.type === 'opaque')) { c.put(req, await stamp(res.clone())).then(function () { return trim(ASSET_CACHE, MAX_ASSETS); }).catch(function () {}); }
          return res;
        });
      };
      if (hit) {
        const ts = Number(hit.headers.get('x-hv-ts') || 0);
        if (ts && Date.now() - ts > TTL) { try { return await fresh(); } catch (_) { return hit; } }
        fresh().catch(function () {});
        return hit;
      }
      return fresh();
    })());
    return;
  }

  // Tệp cùng origin khác: mạng trước
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then(function (res) {
      if (res && res.ok) { const copy = res.clone(); caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return caches.match(req); }));
  }
});
