// YaYa · service worker
// Стратегия network-first: всегда пытаемся взять свежий файл из сети,
// кэш — только запасной вариант при отсутствии связи.
//
// ВАЖНО про обновления: при каждом изменении сайта поднимай номер версии
// ниже (v2 → v3 → v4 ...). Это заставит браузер выкинуть старый кэш и
// подтянуть свежие файлы, даже если приложение установлено как PWA.
const CACHE = 'yaya-v7';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isCode = /\.(html|js|css)$/i.test(url.pathname) || url.pathname.endsWith('/');

  e.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache: isCode ? 'no-store' : 'default' });
      const cache = await caches.open(CACHE);
      cache.put(req, fresh.clone()).catch(() => {});
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      throw err;
    }
  })());
});
