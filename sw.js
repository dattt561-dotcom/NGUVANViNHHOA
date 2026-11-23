/* HỌC VĂN – Service Worker v4.9 (giới hạn cache, hạn dùng TTL, Navigation Preload, Background Sync) */
const VERSION = 'hv-4.9.9';
const SHELL_CACHE = 'hv-shell-' + VERSION;
const ASSET_CACHE = 'hv-assets-' + VERSION;
const SHELL = [
  './', './index.html',
  './css/01-base.css?v=af9ca841',
  './css/02-responsive.css?v=aaa45bea',
  './css/03-dark-a11y.css?v=f8e54677',
  './css/04-community.css?v=10a28e52',
  './css/05-effects.css?v=a22eb72c',
  './css/06-materials.css?v=ec65457f',
  './css/07-hubs.css?v=67cacda2',
  './css/08-workspace.css?v=bc44ace8',
  './css/09-intro.css?v=bba81c0a',
  './css/10-focus-login.css?v=4a0e0189',
  './css/11-perf-modern.css?v=8ab91aa2',
  './css/12-smooth.css?v=164a7878',
  './js/core/01-boot.js?v=08b0ddba',
  './js/core/02-storage-sound-theme.js?v=277a3313',
  './js/core/03-supabase.js?v=48c76c15',
  './js/core/04-ai-auth.js?v=fa52c929',
  './js/core/05-ui-realtime-intro.js?v=69d0c343',
  './js/pages/10-nav-tabs.js?v=d3b345a9',
  './js/pages/11-student-submit.js?v=9d0cacb4',
  './js/pages/12-teacher-assignments.js?v=abb9f3bb',
  './js/pages/13-classes-accounts.js?v=ec6e6cd6',
  './js/pages/14-grading.js?v=ac5fc156',
  './js/pages/15-dashboard-khbd.js?v=e2e4567e',
  './js/pages/16-import-admin.js?v=db375e18',
  './js/pages/17-library-chat.js?v=b97e57f4',
  './js/pages/18-anticheat-exam.js?v=11740dc2',
  './js/pages/19-games-voice.js?v=a9f54828',
  './js/pages/20-social.js?v=199fbaf2',
  './js/pages/21-analytics.js?v=1bb980bd',
  './js/pages/22-landing-init.js?v=37bc868a',
  './js/features/30-community.js?v=8d022e09',
  './js/features/31-feedback-pwa.js?v=28d6709a',
  './js/features/32-effects-landing.js?v=bd1633a0',
  './js/features/33-accounts-session.js?v=f8348b2f',
  './js/features/34-materials.js?v=fbbe7035',
  './js/features/35-hubs.js?v=93012529',
  './js/features/36-realtime-assignments.js?v=4bb55516',
  './js/features/37-workspace-worklog.js?v=66909cbf',
  './js/features/38-focus-timer.js?v=3607d0cf',
  './js/features/39-perf-extras.js?v=d814ede4',
  './js/features/40-modern-apis.js?v=495df959',
  './js/features/41-login-sync-password.js?v=e3c82561',
  './js/core/99-sw-register.js?v=789ca898'
];
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


// Truyền phản hồi dạng dòng (ReadableStream) từ cache để trang bắt đầu dựng sớm khi ngoại tuyến
function streamResponse(res) {
  if (!res || !res.body || typeof ReadableStream === 'undefined') return res;
  const reader = res.body.getReader();
  const rs = new ReadableStream({
    async pull(c) { const r = await reader.read(); if (r.done) c.close(); else c.enqueue(r.value); },
    cancel() { try { reader.cancel(); } catch (_) {} }
  });
  return new Response(rs, { status: res.status, statusText: res.statusText, headers: res.headers });
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
        return streamResponse((await caches.match(req)) || (await caches.match('./')) || (await caches.match('./index.html')));
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

  // CSS/JS đã đóng dấu phiên bản (?v=mã băm): cache trước, nội dung không đổi nếu URL không đổi
  if (url.origin === self.location.origin && /\/(css|js)\//.test(url.pathname) && url.search.indexOf('v=') !== -1) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res && res.ok) { const copy = res.clone(); caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      });
    }));
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
