Правь на месте при изменении кода, НЕ дописывай.

# yaya-kitchen — клиентская витрина

## 1. Назначение репо
Клиентская витрина кафе: показывает меню, принимает заказы клиентов, шлёт POST /order на сервер. Публичное, без авторизации.

## 2. Стек и точка входа
Статический PWA без сборки: vanilla JS + HTML/CSS. Точка входа — index.html в корне; service worker — sw.js (CACHE='yaya-v10'); карты — Leaflet 1.9.4 с CDN; геокодинг — Nominatim (OSM).

## 3. Структура
- index.html — вся витрина: экраны, стили, загрузка меню/баннеров/TV/радио/поздравлений из KV, экран «Мои заказы» (поллинг статусов + карта курьера), пуш-клиент, перехват fetch/XHR для сохранения номеров заказов в localStorage.
- menu.js — запасное меню + рендер категорий и карточек товара (showCat, поиск, карточка товара).
- cart.js — корзина (глобальный cart), навигация по экранам, рендер экрана корзины.
- checkout.js — оформление: GET /next-order-num, POST /order, квитанция + PDF, снапшоты заказа в localStorage.
- map.js — зоны доставки (жёстко зашитые полигоны г. Экибастуз), геолокация, Leaflet-карта, автодополнение адреса (Nominatim).
- state.js — глобальное состояние: cart, deliveryCost, payMethod, forOther.
- sw.js — service worker: network-first кэш (CACHE='yaya-v10'), пуш-уведомления статусов заказа, обработка кликов по нотификации.
- avatar.png, banner.jpg, icon-vitrina-192.png, icon-vitrina-512.png — статика (аватар курьера на карте, обычный баннер, иконки PWA).

## 4. Публичные интерфейсы
Фронтенд, своего сервера нет. Экраны index.html: menu, cart, address, checkout, success («Спасибо»), orders («Мои заказы»), info, tv (вертикальная лента видео); screen-contacts монтируется динамически из checkout.js.

Дёргает сервер yaya-db:
- GET /next-order-num — получение номера заказа (checkout.js: WEBHOOK.replace('/order', '/next-order-num')).
- POST /order — создание заказа (checkout.js); тело: items, total, address, comment, delivery, name, phone, recipient_name, pay_method, pay_phone, for_other, recipient_phone, order_num.
- GET /orders/status?nums=<список номеров> — статусы своих заказов (index.html, TRACK_API).
- GET /kv/yaya_banners, /kv/yaya_tv, /kv/yaya_radio, /kv/yaya_greetings, /kv/yaya_greet, /kv/yaya_courier_pos — чтение (index.html, cfgGet + trackGet).
- POST /kv/yaya_greet_req/append — заявка на поздравление, тело {item:req} (index.html).
- GET /push/public-key, POST /push/subscribe — подписка {role:'client', num, sub} (index.html).

KV-ключи: читает yaya_banners, yaya_tv, yaya_radio, yaya_greetings, yaya_greet, yaya_courier_pos; пишет yaya_greet_req. Константа T_COUR='yaya_order_couriers' объявлена, но не используется. localStorage: yaya_orders, yaya_receipts, yaya_order_items, yaya_last_receipt, yaya_greet_outbox, yaya_greet_done.

## 5. Внешние связи
Один сервер — yaya-db (https://yaya-db-production.up.railway.app), публично, без заголовков авторизации. Адрес зашит в трёх местах: CFG_API (index.html, cfgGet/поздравления), TRACK_API (index.html, «Мои заказы»), WEBHOOK (checkout.js, заказы). Внешние сервисы: Leaflet tiles + Nominatim OpenStreetMap (геокодинг, User-Agent YaYaChicken/1.0), qrserver.com (QR для оплаты Kaspi), Google Fonts, YouTube iframe API.

## 6. Готчи
- PWA: при ЛЮБОЙ правке .html бампать тег кэша в sw.js — текущий const CACHE = 'yaya-v10' (тег дословно: yaya-v10).
- API-база зашита в трёх местах (CFG_API, TRACK_API в index.html; WEBHOOK в checkout.js) — менять синхронно.
- Сервер — единственный источник правды: локальному состоянию не доверять. Статусы заказов приходят с сервера по своим номерам (до 50), при недоступности сервера показываются как 'new'.
- manifest.json подключён в index.html, но файла в репо нет (загрузка вернёт 404).
- content.json опционален: bootstrap делает fetch('content.json') и при ошибке работает на встроенных данных; в репо файла нет.
- Запасные данные (меню в menu.js, TV_VIDEOS в index.html) показываются, только пока не пришли KV из кабинета (admin).
- manifest.json: ссылка в index.html есть, файла нет, в .gitignore/истории отсутствует — статус открыт (TODO owner).
