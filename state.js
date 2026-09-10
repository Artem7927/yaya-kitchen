// ── Глобальное состояние ──────────────────────────────────────────────
const cart = {};
let deliveryCost = 0;
let payMethod = 'cash';
let forOther = false;

// ── Источник заказа (рекламная метка) ─────────────────────────────────
// Читаем ?src= или ?utm_source= ОДИН раз при загрузке витрины и кладём в
// localStorage yaya_src. Пустое значение НЕ перезатирает сохранённый
// источник: клиент мог прийти по рекламе вчера, а сегодня зайти напрямую —
// метка живёт до оформления заказа. Работает для
// artem7927.github.io/yaya-kitchen/?src=instagram.
(function(){
  try{
    const s=String(new URLSearchParams(location.search).get('src')||new URLSearchParams(location.search).get('utm_source')||'').trim();
    if(s) localStorage.setItem('yaya_src',s);
  }catch(e){}
})();
