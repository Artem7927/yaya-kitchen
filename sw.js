// YaYa · service worker
// Стратегия network-first: всегда пытаемся взять свежий файл из сети,
// кэш — только запасной вариант при отсутствии связи.
//
// ВАЖНО про обновления: при каждом изменении сайта поднимай номер версии
// ниже (v2 → v3 → v4 ...). Это заставит браузер выкинуть старый кэш и
// подтянуть свежие файлы, даже если приложение установлено как PWA.
const CACHE = 'yaya-v11';

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

// ── Push-уведомления клиента (статус его заказа) ──────────────────────
// Сервер шлёт пуш на orders[номер], когда админ меняет статус заказа.
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; }
  catch (err) { d = { title: 'YaYa Chicken', body: e.data ? e.data.text() : '' }; }
  const opts = {
    body: d.body || '',
    icon: './icon-vitrina-192.png',
    badge: './icon-vitrina-192.png',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    data: { url: d.url || './' }
  };
  e.waitUntil(self.registration.showNotification(d.title || 'YaYa Chicken', opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil((async () => {
    const scope = self.registration.scope; // напр. https://site/yaya-kitchen/
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Фокусим ТОЛЬКО окно этого приложения (витрины), а не кабинет на том же домене.
    for (const c of all) { if (c.url && c.url.indexOf(scope) === 0 && 'focus' in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow(url);
  })());
});
