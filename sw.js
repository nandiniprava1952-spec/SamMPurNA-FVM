/* SamMPurna FVM service worker — app shell offline. Bump VERSION on every release. */
const VERSION = 'smp-fvm-v31';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];
const LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    const all = [...SHELL.map(u => [u, true]), ...LIBS.map(u => [u, false])], total = all.length;
    let done = 0;
    const say = async () => {                                   // tell open pages how far the download is
      const p = Math.round(100 * done / total);
      for (const cl of await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })) cl.postMessage({ type: 'UPDATE_PROGRESS', pct: p });
    };
    await say();
    await Promise.all(all.map(async ([u, required]) => {
      try {
        const r = await fetch(u, u.startsWith('http') ? { mode: 'cors' } : { cache: 'reload' });   // reload = bypass HTTP cache so the new version really downloads
        if (!r.ok) throw new Error('HTTP ' + r.status);
        await c.put(u, r);
      } catch (err) { if (required) throw err; }                // CDN libs are optional; app-shell files are not
      done++; await say();
    }));
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;                               // Apps Script POSTs go straight to the network
  if (url.origin !== location.origin) {
    if (LIBS.includes(req.url)) e.respondWith(caches.match(req.url).then(r => r || fetch(req)));  // pinned CDN libs: cache first
    return;                                                       // everything else cross-origin: untouched (never cache data)
  }
  if (req.mode === 'navigate') {                                  // pages: network first so releases arrive, cache when offline
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {                   // static files: stale-while-revalidate
    const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
