// ── Переход к оформлению (Экран 4) ───────────────────────────────────
async function goCheckout() {
  const address = document.getElementById('addressInput').value.trim();
  if (!address) {
    document.getElementById('addressInput').focus();
    document.getElementById('addressInput').style.borderColor = 'red';
    setTimeout(() => document.getElementById('addressInput').style.borderColor = '', 1500);
    return;
  }
  if (!deliveryCost || deliveryCost === 0) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ' Экибастуз')}&format=json&limit=1&accept-language=ru&countrycodes=kz`;
      const r = await fetch(url, { headers: { 'User-Agent': 'YaYaChicken/1.0' } });
      const data = await r.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const zone = getDeliveryZone(lat, lng);
        if (zone) {
          deliveryCost = zone.cost;
          const status = document.getElementById('geoStatus');
          status.style.display = 'block';
          status.style.color = 'green';
          status.textContent = 'Доставка: ' + zone.price;
        }
      }
    } catch (e) { console.log('geocode error:', e); }
  }
  renderCheckout();
  showScreen('checkout');
}

// ── Оплата ────────────────────────────────────────────────────────────
const KASPI_QR_LINK = 'https://pay.kaspi.kz/pay/yayachicken';

function selectPay(method) {
  payMethod = method;
  ['pay-cash', 'pay-kaspi-qr', 'pay-kaspi-remote', 'pay-halyk-remote']
    .forEach(id => document.getElementById(id).classList.remove('selected'));
  document.getElementById('pay-' + method).classList.add('selected');

  const qrBlock     = document.getElementById('qrBlock');
  const remoteBlock = document.getElementById('remoteBlock');
  const remoteLabel = document.getElementById('remoteLabel');

  qrBlock.classList.remove('show');
  remoteBlock.classList.remove('show');

  if (method === 'kaspi-qr') {
    const { total } = getStats();
    const grand = total + (deliveryCost || 0);
    document.getElementById('qrAmount').textContent =
      grand > 0 ? 'К оплате: ' + grand.toLocaleString('ru') + ' тг' : '';
    document.getElementById('qrImg').src =
      'https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=' + encodeURIComponent(KASPI_QR_LINK);
    qrBlock.classList.add('show');
  } else if (method === 'kaspi-remote') {
    remoteLabel.textContent = 'Ваш номер Kaspi — на него придёт запрос на оплату:';
    remoteBlock.classList.add('show');
    setTimeout(() => document.getElementById('remotePhone').focus(), 100);
  } else if (method === 'halyk-remote') {
    remoteLabel.textContent = 'Ваш номер Halyk Bank — на него придёт запрос на оплату:';
    remoteBlock.classList.add('show');
    setTimeout(() => document.getElementById('remotePhone').focus(), 100);
  }
}

// Премиум-иконки (тонкие линии, без эмодзи). Возвращает inline-SVG.
function ic(name, size) {
  size = size || 13;
  const p = {
    user:  '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    pin:   '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
    chat:  '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    cash:  '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    card:  '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    bank:  '<path d="M3 10 12 4l9 6"/><path d="M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18"/>',
    device:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18.5h2"/>',
    list:  '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.2"/><circle cx="3.5" cy="12" r="1.2"/><circle cx="3.5" cy="18" r="1.2"/>',
    clip:  '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3.2A1.2 1.2 0 0 1 10.2 2h3.6A1.2 1.2 0 0 1 15 4"/><path d="M9 11h6M9 15h4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>'
  }[name] || '';
  return '<svg viewBox="0 0 24 24" style="width:' + size + 'px;height:' + size + 'px;vertical-align:-2px;' +
         'margin-right:6px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round">' + p + '</svg>';
}

function getPayLabel() {
  const map = {
    'cash':         ic('cash')   + 'Наличные',
    'kaspi-qr':     ic('device') + 'Kaspi QR',
    'kaspi-remote': ic('card')   + 'Kaspi удалённый',
    'halyk-remote': ic('bank')   + 'Halyk удалённый',
  };
  return map[payMethod] || payMethod;
}

function getPayPhone() {
  if (payMethod === 'kaspi-remote' || payMethod === 'halyk-remote') {
    return document.getElementById('remotePhone').value.trim() || null;
  }
  return null;
}

function toggleOther() {
  forOther = !forOther;
  document.getElementById('otherToggle').classList.toggle('on', forOther);
  document.getElementById('otherPhone').style.display = forOther ? 'block' : 'none';
}

// ── Рендер экрана оформления (Экран 4) ───────────────────────────────
function renderCheckout() {
  const items = [];
  for (const [id, qty] of Object.entries(cart)) {
    if (qty <= 0) continue;
    const item = findItem(id);
    if (item) items.push({ ...item, qty });
  }
  const { total } = getStats();
  const delivery = deliveryCost || 0;
  const address = document.getElementById('addressInput').value.trim();

  document.getElementById('checkoutItems').innerHTML = `
    <div class="form-label" style="margin-bottom:10px;">${ic('list',16)}Состав заказа</div>
    ${items.map(i => `
      <div style="padding:8px 0;border-bottom:1px solid var(--gray2);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:800;line-height:1.3;">${i.name}</div>
            ${i.desc ? `<div class="co-item-desc">${i.desc}</div>` : ''}
            <div style="font-size:12px;color:var(--text2);font-weight:600;margin-top:3px;">${i.price.toLocaleString('ru')} тг × ${i.qty}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;margin-top:2px;">
            <button class="qty-btn" onclick="removeItem('${i.id}');renderCheckout()">−</button>
            <span class="qty-num">${i.qty}</span>
            <button class="qty-btn" onclick="addItem('${i.id}');renderCheckout()">+</button>
            <div style="font-size:14px;font-weight:900;color:var(--orange);min-width:70px;text-align:right;">${(i.price * i.qty).toLocaleString('ru')} тг</div>
          </div>
        </div>
      </div>`).join('')}`;

  document.getElementById('checkoutSummary').innerHTML = `
    <div class="form-label" style="margin-bottom:10px;">${ic('clip',16)}Итог</div>
    <div class="summary-row">
      <span class="summary-label">${ic('pin')}Адрес</span>
      <span style="font-size:12px;font-weight:700;text-align:right;max-width:190px;color:var(--text);">${address}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Сумма заказа</span>
      <span class="summary-val">${total.toLocaleString('ru')} тг</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Доставка</span>
      <span class="summary-val" style="color:var(--orange);">${delivery > 0 ? delivery.toLocaleString('ru') + ' тг' : 'Бесплатно'}</span>
    </div>
    <div class="summary-divider"></div>
    <div class="summary-row">
      <span class="summary-total-label">К оплате</span>
      <span class="summary-total-val">${(total + delivery).toLocaleString('ru')} тг</span>
    </div>`;
}

// ── ШАГ 1: Контакты (имя + телефон) ───────────────────────────────────
// Экран screen-contacts открывается из корзины ПЕРЕД адресом.
function goContacts() {
  showScreen('contacts');
  window.scrollTo(0, 0);
}
function contactHint(which, msg) {
  const inputId = which === 'name' ? 'custNameInput' : 'custPhoneInput';
  const hintId  = which === 'name' ? 'hint-custName' : 'hint-custPhone';
  const el = document.getElementById(inputId);
  const h  = document.getElementById(hintId);
  if (h)  { h.textContent = msg; h.style.display = 'block'; }
  if (el) { el.style.borderColor = '#ff6b6b'; el.focus(); }
}
function clearContactHint(which) {
  const inputId = which === 'name' ? 'custNameInput' : 'custPhoneInput';
  const hintId  = which === 'name' ? 'hint-custName' : 'hint-custPhone';
  const el = document.getElementById(inputId);
  const h  = document.getElementById(hintId);
  if (h)  h.style.display = 'none';
  if (el) el.style.borderColor = '';
}
// Проверяем имя + телефон и переходим к экрану адреса (многозональная карта — как есть)
function goAddressFromContacts() {
  const name  = (document.getElementById('custNameInput')?.value  || '').trim();
  const phone = (document.getElementById('custPhoneInput')?.value || '').trim();
  const digits = phone.replace(/\D/g, '');
  if (!name)               { contactHint('name',  'Подскажите, как вас зовут'); return; }
  if (!phone)              { contactHint('phone', 'Оставьте телефон — так мы сможем связаться'); return; }
  if (digits.length < 10)  { contactHint('phone', 'Проверьте номер — кажется, не хватает цифр'); return; }
  goAddress();
}

// ── Подтверждение заказа ──────────────────────────────────────────────
let currentOrderNum = null;  // номер текущего заказа, полученный с сервера

function confirmOrder() {
  const address = document.getElementById('addressInput').value.trim();
  if (!address) {
    document.getElementById('addressInput').focus();
    document.getElementById('addressInput').style.borderColor = 'red';
    setTimeout(() => document.getElementById('addressInput').style.borderColor = '', 1500);
    return;
  }
  if (payMethod === 'kaspi-remote' || payMethod === 'halyk-remote') {
    const rp = document.getElementById('remotePhone');
    if (!rp.value.trim()) {
      rp.focus(); rp.style.borderColor = 'red';
      setTimeout(() => rp.style.borderColor = '', 1500);
      return;
    }
  }

  // Имя и телефон клиента (обязательные — собираются на шаге «Контакты»)
  const custName  = (document.getElementById('custNameInput')?.value  || '').trim();
  const custPhone = (document.getElementById('custPhoneInput')?.value || '').trim();
  if (!custName || !custPhone) {   // подстраховка: если как-то проскочили шаг 1
    goContacts();
    return;
  }

  const items = [];
  for (const [id, qty] of Object.entries(cart)) {
    if (qty <= 0) continue;
    const item = findItem(id);
    if (item) items.push({ name: item.name, price: item.price, qty, desc: item.desc || '' });
  }

  const { total } = getStats();
  const comment = document.getElementById('commentInput').value.trim();
  const phone   = forOther ? document.getElementById('phoneInput').value.trim() : null;

  const btn = document.getElementById('confirmBtn');
  btn.disabled = true;
  btn.textContent = 'Отправляем...';

  const WEBHOOK = 'https://yaya-db-production.up.railway.app/order';

  // Сначала получаем порядковый номер заказа с сервера
  const numCtrl = new AbortController();
  setTimeout(() => numCtrl.abort(), 5000);
  fetch(WEBHOOK.replace('/order', '/next-order-num'), { signal: numCtrl.signal })
    .then(r => r.json())
    .then(d => { currentOrderNum = d.num; })
    .catch(() => { currentOrderNum = null; })
    .finally(() => {
      const orderData = {
        items, total, address, comment,
        delivery:        deliveryCost || 0,
        // Имя и телефон клиента — их читает панель курьера (recipient_name / phone)
        name:            custName,
        phone:           custPhone,
        recipient_name:  custName,
        pay_method:      payMethod,
        pay_phone:       getPayPhone(),
        for_other:       forOther,
        // Если заказ для другого — курьер звонит получателю (приоритетнее phone)
        recipient_phone: phone || null,
        order_num:       currentOrderNum,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
        signal: controller.signal
      })
        .then(r => r.json())
        .then(r => {
          clearTimeout(timeout);
          console.log('order sent:', r);
          if (r.num) currentOrderNum = r.num;
          clearCart();
          showReceipt(currentOrderNum);
          showScreen('success');
        })
        .catch(err => {
          clearTimeout(timeout);
          console.log('webhook error:', err.message);
          btn.disabled = false;
          btn.textContent = 'Подтвердить заказ';
          alert('Не удалось отправить заказ. Проверьте соединение и попробуйте ещё раз.');
        });
    });
}

// ── Квитанция (Экран 5) ───────────────────────────────────────────────
function showReceipt(orderNum) {
  const num = orderNum || currentOrderNum || '—';
  const items = [];
  for (const [id, qty] of Object.entries(cart)) {
    if (qty <= 0) continue;
    const item = findItem(id);
    if (item) items.push({ ...item, qty });
  }
  const { total } = getStats();
  const delivery = deliveryCost || 0;
  const totalAll = total + delivery;
  const address = document.getElementById('addressInput').value.trim();

  // Сохраняем состав заказа (с картинками), чтобы во вкладке «Заказы»
  // карточку можно было раскрыть по тапу и показать товары + полную стоимость.
  try {
    const _store = JSON.parse(localStorage.getItem('yaya_order_items') || '{}');
    _store[String(num)] = {
      items: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty,
                               img: i.img || i.image || i.photo || '', emoji: i.emoji || '' })),
      total: total, delivery: delivery
    };
    localStorage.setItem('yaya_order_items', JSON.stringify(_store));
  } catch (e) {}
  const comment = document.getElementById('commentInput').value.trim();
  const payStr  = getPayLabel();
  const payPhone = getPayPhone();
  const custName  = (document.getElementById('custNameInput')?.value  || '').trim();
  const custPhone = (document.getElementById('custPhoneInput')?.value || '').trim();
  const now = new Date();
  const dateStr = now.toLocaleString('ru', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

  document.getElementById('receiptDate').textContent = '№' + num + ' · ' + dateStr;

  document.getElementById('receiptItems').innerHTML =
    '<div style="font-size:12px;font-weight:800;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Состав заказа</div>' +
    items.map(i => `
      <div style="padding:6px 0;border-bottom:1px solid var(--gray2);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:800;">${i.name} ×${i.qty}</div>
            ${i.desc ? `<div class="receipt-item-desc">${i.desc}</div>` : ''}
          </div>
          <span style="font-size:13px;font-weight:900;white-space:nowrap;">${(i.price * i.qty).toLocaleString('ru')} тг</span>
        </div>
      </div>`
    ).join('');

  document.getElementById('receiptTotal').innerHTML =
    `<div style="margin-top:8px;">
      <div style="display:flex;justify-content:space-between;padding:4px 0;">
        <span style="font-size:13px;color:var(--text2);font-weight:600;">Сумма заказа</span>
        <span style="font-size:13px;font-weight:800;">${total.toLocaleString('ru')} тг</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;">
        <span style="font-size:13px;color:var(--text2);font-weight:600;">Доставка</span>
        <span style="font-size:13px;font-weight:800;color:var(--orange);">${delivery > 0 ? delivery.toLocaleString('ru') + ' тг' : 'Бесплатно'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;margin-top:4px;border-top:2px solid var(--text);">
        <span style="font-size:16px;font-weight:900;">К ОПЛАТЕ</span>
        <span style="font-size:16px;font-weight:900;color:var(--orange);">${totalAll.toLocaleString('ru')} тг</span>
      </div>
    </div>`;

  const recipientPhone = forOther ? document.getElementById('phoneInput').value.trim() : null;
  const pdfBtn = document.getElementById('pdfBtnWrap');
  if (pdfBtn) pdfBtn.style.display = 'block';

  document.getElementById('receiptInfo').innerHTML =
    `<div style="background:var(--gray);border-radius:10px;padding:10px;margin-top:8px;font-size:12px;font-weight:700;color:var(--text2);line-height:1.8;">
      ${custName ? ic('user') + custName + '<br>' : ''}${custPhone ? ic('phone') + custPhone + '<br>' : ''}${ic('pin')}${address}
      ${comment ? '<br>' + ic('chat') + comment : ''}
      ${recipientPhone ? '<br>' + ic('user') + 'Получатель: ' + recipientPhone : ''}
      ${payPhone ? '<br>' + ic('device') + 'Счёт на номер: ' + payPhone : ''}
      <br>${payStr}
    </div>`;
}

function downloadPDF() {
  const items = [];
  for (const [id, qty] of Object.entries(cart)) {
    if (qty <= 0) continue;
    const item = findItem(id);
    if (item) items.push({ ...item, qty });
  }
  const { total } = getStats();
  const delivery = deliveryCost || 0;
  const totalAll = total + delivery;
  const address  = document.getElementById('addressInput').value.trim();
  const payStr   = getPayLabel();
  const payPhone = getPayPhone();
  const comment  = document.getElementById('commentInput').value.trim();
  const recipientPhone = forOther ? document.getElementById('phoneInput').value.trim() : null;
  const now = new Date();
  const dateStr = now.toLocaleString('ru', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  const num = currentOrderNum || Date.now().toString().slice(-6);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Квитанция YaYa Chicken</title>
  <style>body{font-family:Arial,sans-serif;max-width:400px;margin:20px auto;padding:20px;color:#1a1a1a;}
  .header{background:#F4821F;color:white;padding:16px;text-align:center;border-radius:12px 12px 0 0;}
  .header h2{margin:0;font-size:20px;}.header p{margin:4px 0 0;font-size:12px;opacity:0.85;}
  .body{border:2px solid #e8e8e8;border-top:none;border-radius:0 0 12px 12px;padding:16px;}
  .item-block{padding:6px 0;border-bottom:1px solid #f0f0f0;}
  .item-row{display:flex;justify-content:space-between;font-size:13px;}
  .item-desc{font-size:11px;color:#999;margin-top:2px;line-height:1.3;}
  .total-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#666;}
  .total-final{display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #1a1a1a;font-size:16px;font-weight:bold;margin-top:8px;}
  .info{background:#f5f5f5;border-radius:8px;padding:10px;margin-top:12px;font-size:12px;line-height:1.8;}
  .footer{text-align:center;margin-top:16px;font-size:11px;color:#666;border-top:1px dashed #ccc;padding-top:12px;}
  .stitle{font-size:11px;font-weight:bold;color:#666;text-transform:uppercase;letter-spacing:0.5px;margin:12px 0 6px;}</style>
  </head><body>
  <div class="header"><h2>YaYa Chicken</h2><p>ул. Абая, 49/5 · Экибастуз</p><p>№${num} · ${dateStr}</p></div>
  <div class="body">
    <div class="stitle">Состав заказа</div>
    ${items.map(i => `
      <div class="item-block">
        <div class="item-row"><span>${i.name} ×${i.qty}</span><span>${(i.price * i.qty).toLocaleString('ru')} тг</span></div>
        ${i.desc ? `<div class="item-desc">${i.desc}</div>` : ''}
      </div>`).join('')}
    <div class="total-row" style="color:#666;margin-top:4px;"><span>Доставка</span><span>${delivery > 0 ? delivery.toLocaleString('ru') + ' тг' : 'Бесплатно'}</span></div>
    <div class="total-final"><span>К ОПЛАТЕ</span><span style="color:#F4821F;">${totalAll.toLocaleString('ru')} тг</span></div>
    <div class="info">${ic('pin')}${address}${comment ? '<br>' + ic('chat') + comment : ''}${recipientPhone ? '<br>' + ic('user') + 'Получатель: ' + recipientPhone : ''}${payPhone ? '<br>' + ic('device') + 'Счёт на номер: ' + payPhone : ''}<br>${payStr}</div>
    <div class="footer">Сохраните квитанцию для подтверждения заказа<br>Время доставки: ~45-60 минут<br>Спасибо что выбрали YaYa Chicken!</div>
  </div></body></html>`;

  try {
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `YaYa_Kvitanciya_${num}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    window.open('data:text/html;charset=utf-8,' + encodeURIComponent(html), '_blank');
  }
}

// ── Автонастройка витрины под 3 шага (без ручной правки index.html) ────
// Создаёт экран «Контакты», перенаправляет кнопку корзины на шаг 1
// и рисует индикатор шагов: кружки 1-2-3 (Заказ · Доставка · Оплата), полоски зеленеют.
(function initThreeStepCheckout() {

  // Индикатор шагов: active = текущий шаг (1, 2 или 3)
  function stepBar(active) {
    var cap = ['Заказ', 'Доставка', 'Оплата'];
    var h = '<div class="ck-steps">';
    for (var i = 1; i <= 3; i++) {
      if (i > 1) h += '<div class="ck-bar ' + ((i - 1) < active ? 'ok' : '') + '"></div>';
      var st = i < active ? 'ok' : (i === active ? 'on' : '');
      h += '<div class="ck-step ' + st + '"><div class="ck-num">' + i + '</div>' +
           '<div class="ck-cap">' + cap[i - 1] + '</div></div>';
    }
    return h + '</div>';
  }

  // Вставляет индикатор в экран и убирает старый текстовый заголовок
  function mountStep(screenId, active) {
    var scr = document.getElementById(screenId);
    if (!scr) return;
    var t = scr.querySelector('.h-title'); if (t) t.textContent = '';   // убираем «шаг X из 3»
    var existing = scr.querySelector('.ck-steps');
    if (existing) { existing.outerHTML = stepBar(active); return; }
    var hdr = scr.querySelector('.header');
    var box = document.createElement('div');
    box.innerHTML = stepBar(active);
    var node = box.firstChild;
    if (hdr && hdr.nextSibling) scr.insertBefore(node, hdr.nextSibling);
    else if (hdr) scr.appendChild(node);
    else scr.insertBefore(node, scr.firstChild);
  }

  function injectCss() {
    if (document.getElementById('ck-steps-css')) return;
    var s = document.createElement('style');
    s.id = 'ck-steps-css';
    s.textContent =
      '.ck-steps{display:flex;align-items:flex-start;justify-content:space-between;' +
      'padding:16px 22px 12px;max-width:520px;margin:0 auto}' +
      '.ck-step{display:flex;flex-direction:column;align-items:center;gap:8px;width:82px;flex:0 0 auto}' +
      '.ck-num{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;' +
      'justify-content:center;font:800 18px system-ui,sans-serif;background:#2a2724;color:#8a857c;' +
      'border:2px solid #3a3632;transition:.25s}' +
      '.ck-cap{font:800 12.5px system-ui,sans-serif;letter-spacing:.5px;color:#8a857c;' +
      'text-align:center;text-transform:uppercase}' +
      '.ck-bar{flex:1;height:3px;background:#3a3632;border-radius:2px;margin-top:20px;min-width:14px}' +
      '.ck-step.on .ck-num{background:#F4B400;color:#1a1400;border-color:#F4B400;' +
      'box-shadow:0 0 0 5px rgba(244,180,0,.20)}' +
      '.ck-step.on .ck-cap{color:#fff}' +
      '.ck-step.ok .ck-num{background:#2ecc71;color:#05240f;border-color:#2ecc71}' +
      '.ck-step.ok .ck-cap{color:#fff}' +
      '.ck-bar.ok{background:#2ecc71}';
    document.head.appendChild(s);
  }

  function setup() {
    injectCss();

    // 1) Экран «Контакты» — создаём перед экраном адреса, если его ещё нет
    if (!document.getElementById('screen-contacts')) {
      var addr = document.getElementById('screen-address');
      if (addr && addr.parentNode) {
        var wrap = document.createElement('div');
        wrap.innerHTML =
          '<div class="screen order-screen" id="screen-contacts">' +
            '<div class="header">' +
              '<button class="back-btn" onclick="goCart()">← Корзина</button>' +
              '<div class="h-title"></div>' +
              '<div style="width:60px"></div>' +
            '</div>' +
            '<div class="order-form">' +
              '<div class="form-block">' +
                '<div class="form-label"><svg><use href="#ic-phone"/></svg>Ваши контакты</div>' +
                '<input class="form-input" type="text" id="custNameInput" placeholder="Ваше имя" style="margin-bottom:4px" oninput="clearContactHint(\'name\')" autocomplete="name">' +
                '<div id="hint-custName" style="display:none;color:#ff6b6b;font-size:12px;font-weight:700;margin:2px 0 8px"></div>' +
                '<input class="form-input" type="tel" id="custPhoneInput" placeholder="Телефон, напр. +7 777 000 00 00" oninput="clearContactHint(\'phone\')" autocomplete="tel">' +
                '<div id="hint-custPhone" style="display:none;color:#ff6b6b;font-size:12px;font-weight:700;margin-top:4px"></div>' +
              '</div>' +
              '<button class="next-btn" onclick="goAddressFromContacts()">Далее →</button>' +
            '</div>' +
          '</div>';
        addr.parentNode.insertBefore(wrap.firstChild, addr);
      }
    }

    // 2) Кнопка «Оформить заказ» в корзине → сначала шаг «Контакты»
    var cart = document.getElementById('screen-cart');
    if (cart) {
      var cbtn = cart.querySelector('.next-btn');
      if (cbtn) cbtn.onclick = function () { goContacts(); };
    }

    // 3) Кнопка «Назад» на экране адреса → к «Контактам»
    var aScr = document.getElementById('screen-address');
    if (aScr) {
      var b = aScr.querySelector('.back-btn');
      if (b) { b.textContent = '← Контакты'; b.onclick = function () { goContacts(); }; }
    }

    // 4) Рисуем индикатор шагов на всех трёх экранах
    mountStep('screen-contacts', 1);
    mountStep('screen-address', 2);
    mountStep('screen-checkout', 3);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();

// ── Вкладка «Заказы»: цифра-бейдж + раскрытие карточки по тапу ──────────
// Работает поверх существующего renderOrders() — ничего не переписывает,
// а дополняет: делает карточку сворачиваемой, показывает состав товара
// (карточки как на витрине) и полную стоимость. Плюс бейдж над «Заказы».
(function initOrdersAccordion() {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return (Number(n) || 0).toLocaleString('ru-RU') + ' тг'; }
  function readItems() { try { return JSON.parse(localStorage.getItem('yaya_order_items') || '{}'); } catch (e) { return {}; } }
  function readOrders() { try { return JSON.parse(localStorage.getItem('yaya_orders') || '[]'); } catch (e) { return []; } }

  function css() {
    if (document.getElementById('yy-orders-css')) return;
    var s = document.createElement('style'); s.id = 'yy-orders-css';
    s.textContent =
      '.ord-card.yy-acc .ord-top{cursor:pointer;display:flex;align-items:center;gap:8px}' +
      '.yy-chev{margin-left:auto;transition:transform .2s;color:var(--text2,#9a9a9a);font-size:16px;line-height:1;flex:0 0 auto}' +
      '.ord-card.yy-open .yy-chev{transform:rotate(180deg)}' +
      '.yy-body{display:none;margin-top:10px}' +
      '.ord-card.yy-open .yy-body{display:block;animation:yyfade .18s ease}' +
      '@keyframes yyfade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}' +
      '.yy-comp{margin-bottom:10px}' +
      '.yy-prod{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)}' +
      '.yy-prod:last-child{border-bottom:none}' +
      '.yy-th{width:44px;height:44px;border-radius:11px;background-size:cover;background-position:center;flex:0 0 auto}' +
      '.yy-th-ph{display:flex;align-items:center;justify-content:center;background:var(--gray,#232323);' +
      'color:var(--gold,#F4B400);font-weight:900;font-size:18px}' +
      '.yy-pinfo{flex:1;min-width:0}' +
      '.yy-pname{font-weight:800;font-size:13.5px;color:var(--text,#fff);line-height:1.25}' +
      '.yy-pmeta{font-size:12px;color:var(--text2,#9a9a9a);font-weight:700;margin-top:2px}' +
      '.yy-psum{font-weight:900;font-size:13.5px;color:var(--gold,#F4B400);white-space:nowrap}' +
      '.yy-tot{margin-top:8px}' +
      '.yy-tl{display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:var(--text2,#9a9a9a);padding:3px 0}' +
      '.yy-tl-f{color:var(--text,#fff);font-weight:900;font-size:15px;border-top:1px solid rgba(255,255,255,.08);margin-top:4px;padding-top:8px}' +
      '.yy-nocomp{font-size:12px;color:var(--text2,#9a9a9a);font-weight:700;padding:6px 0}';
    document.head.appendChild(s);
  }

  function thumb(it) {
    if (it.img)   return '<div class="yy-th" style="background-image:url(\'' + esc(it.img) + '\')"></div>';
    if (it.emoji) return '<div class="yy-th yy-th-ph">' + esc(it.emoji) + '</div>';
    return '<div class="yy-th yy-th-ph">' + esc((it.name || '?').charAt(0)) + '</div>';
  }

  function compHTML(num) {
    var rec = readItems()[String(num)];
    if (!rec || !rec.items || !rec.items.length) return '<div class="yy-nocomp">Состав этого заказа недоступен</div>';
    var rows = rec.items.map(function (x) {
      return '<div class="yy-prod">' + thumb(x) +
             '<div class="yy-pinfo"><div class="yy-pname">' + esc(x.name) + '</div>' +
             '<div class="yy-pmeta">' + (x.qty || 1) + ' × ' + money(x.price) + '</div></div>' +
             '<div class="yy-psum">' + money((x.price || 0) * (x.qty || 1)) + '</div></div>';
    }).join('');
    var goods = rec.total || 0, deliv = rec.delivery || 0;
    var tot = '<div class="yy-tot">' +
      '<div class="yy-tl"><span>Сумма заказа</span><span>' + money(goods) + '</span></div>' +
      (deliv ? '<div class="yy-tl"><span>Доставка</span><span>' + money(deliv) + '</span></div>' : '') +
      '<div class="yy-tl yy-tl-f"><span>Итого</span><span>' + money(goods + deliv) + '</span></div></div>';
    return '<div class="yy-comp">' + rows + tot + '</div>';
  }

  function enhance(card) {
    if (card.__yy) return;
    var top = card.querySelector('.ord-top'); if (!top) return;
    var h = card.querySelector('h4');
    var m = h ? (h.textContent || '').match(/(\d+)/) : null;
    var num = m ? m[1] : null;

    // всё, что ниже шапки, прячем в сворачиваемое тело
    var body = document.createElement('div'); body.className = 'yy-body';
    var n = top.nextSibling;
    while (n) { var next = n.nextSibling; body.appendChild(n); n = next; }

    // состав (карточки товара) — первым в теле
    if (num != null) {
      var comp = document.createElement('div'); comp.innerHTML = compHTML(num);
      if (comp.firstChild) body.insertBefore(comp.firstChild, body.firstChild);
    }
    card.appendChild(body);

    var chev = document.createElement('div'); chev.className = 'yy-chev'; chev.textContent = '\u25be';
    top.appendChild(chev);
    top.addEventListener('click', function () { card.classList.toggle('yy-open'); });
    card.classList.add('yy-acc'); card.__yy = true;
  }

  function findNav(rx) {
    var items = document.querySelectorAll('.bottom-nav .nav-item, nav .nav-item, .bottom-nav > div, .bottom-nav > a');
    for (var i = 0; i < items.length; i++) {
      if (rx.test((items[i].textContent || '').toLowerCase())) return items[i];
    }
    return null;
  }

  function updateBadge() {
    var ordersNav = document.getElementById('nav-orders') || findNav(/заказ/);
    if (!ordersNav) return;
    // берём эталонный бейдж корзины, чтобы повторить его класс и способ показа
    var cartNav = findNav(/корзин/);
    var cartBadge = document.getElementById('navCartBadge') || (cartNav && cartNav.querySelector('.nav-badge'));
    var b = document.getElementById('navOrdersBadge');
    if (!b) {
      b = document.createElement('div');
      b.id = 'navOrdersBadge';
      b.className = cartBadge ? cartBadge.className : 'nav-badge';
      if (getComputedStyle(ordersNav).position === 'static') ordersNav.style.position = 'relative';
      ordersNav.appendChild(b);
    }
    var n = readOrders().length;
    // способ показа копируем с бейджа корзины (там точно видно); по умолчанию flex
    var disp = 'flex';
    if (cartBadge) { var d = getComputedStyle(cartBadge).display; if (d && d !== 'none') disp = d; }
    b.textContent = n;
    b.style.display = n > 0 ? disp : 'none';
  }

  function scan() {
    var list = document.getElementById('ordersList');
    if (list) { var cards = list.querySelectorAll('.ord-card'); for (var i = 0; i < cards.length; i++) enhance(cards[i]); }
    updateBadge();
  }

  // Убираем ведущие эмодзи-«буллеты» из статичных подписей экрана оплаты
  // (🟨 Способ оплаты, 🟨 Наличные, 📋/📍 и т.п.). Стрелки ← → не трогаем.
  function stripLeadingEmoji(root) {
    if (!root) return;
    var rx = /^\s*[\u{1F000}-\u{1FAFF}\u2600-\u27BF\u2B00-\u2BFF\uFE0F]+\s*/u;
    try {
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
      var nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
      nodes.forEach(function (t) { if (rx.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(rx, ''); });
    } catch (e) {}
  }

  function boot() {
    css();
    updateBadge();
    var list = document.getElementById('ordersList');
    if (list) { new MutationObserver(scan).observe(list, { childList: true }); scan(); }
    else {
      var tries = 0, t = setInterval(function () {
        var l = document.getElementById('ordersList');
        if (l) { new MutationObserver(scan).observe(l, { childList: true }); scan(); clearInterval(t); }
        if (++tries > 60) clearInterval(t);
      }, 300);
    }
    setInterval(updateBadge, 3000);   // бейдж обновляется, даже если заказ пришёл через перехватчик
    var co = document.getElementById('screen-checkout');
    stripLeadingEmoji(co);
    setTimeout(function () { stripLeadingEmoji(document.getElementById('screen-checkout')); }, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
