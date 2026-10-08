/* Offline cache so the game works without internet once installed. */
const CACHE = 'wickd-v6';
const FILES = ['./', 'index.html', 'css/style.css', 'js/scenarios.js', 'js/data.js', 'js/store.js', 'js/icons.js', 'js/mascot.js', 'js/avatar.js', 'js/gems.js', 'js/chart.js', 'js/market.js', 'js/live.js', 'js/room.js', 'js/meta.js', 'js/pro.js', 'js/app.js', 'manifest.webmanifest', 'assets/icon.svg'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
