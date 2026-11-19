/* =========================================================
   Barza Menu — app.js
   ---------------------------------------------------------
   How the app works (big picture):
     1. Load config.json (restaurant info) and menu.json (items).
     2. Apply branding (colours, logo, name) from the config.
     3. Render category tabs + item cards.
     4. Keep a cart in memory (and in localStorage so a refresh
        doesn't lose it).
     5. "Order on WhatsApp" turns the cart into a text message
        and opens wa.me/<number>?text=<message>.

   No frameworks, no build step: plain JavaScript you can read
   from top to bottom.
   ========================================================= */

'use strict';

/* ---------------------------------------------------------
   1) UI text in both languages
   Every fixed piece of text on the page lives here.
   In the HTML, elements with data-i18n="key" get their text
   from this object when the language changes.
   --------------------------------------------------------- */
const I18N = {
  ar: {
    skip: 'تخطَّ إلى القائمة',
    demo: 'هذه قائمة تجريبية لمقهى خيالي — ليست نشاطاً تجارياً حقيقياً',
    searchLabel: 'ابحث في القائمة',
    searchPh: 'ابحث: كرك، لاتيه…',
    all: 'الكل',
    popular: 'الأكثر طلباً',
    unavailable: 'غير متوفر',
    add: 'أضف',
    addAria: 'أضف {name} إلى السلة',
    incAria: 'زِد كمية {name}',
    decAria: 'أنقص كمية {name}',
    added: 'أُضيف {name} إلى السلة',
    noResults: 'لا توجد نتائج مطابقة',
    viewCart: 'عرض السلة',
    cart: 'سلتك',
    close: 'إغلاق',
    emptyCart: 'السلة فارغة — أضف شيئاً لذيذاً!',
    name: 'الاسم (اختياري)',
    table: 'رقم الطاولة / استلام',
    tablePh: 'مثال: طاولة ٤ أو استلام من السيارة',
    notes: 'ملاحظات',
    notesPh: 'مثال: بدون سكر',
    total: 'المجموع',
    orderWa: 'اطلب عبر واتساب',
    clear: 'إفراغ السلة',
    open: 'مفتوح الآن',
    closed: 'مغلق الآن',
    madeBy: 'صُنعت بواسطة',
    switchLang: 'Switch to English',
    loadError: 'تعذّر تحميل القائمة. إذا فتحت الملف مباشرة من جهازك، شغّل خادماً محلياً (راجع README).'
  },
  en: {
    skip: 'Skip to menu',
    demo: 'This is a demo menu for a fictional café — not a real business',
    searchLabel: 'Search the menu',
    searchPh: 'Search: karak, latte…',
    all: 'All',
    popular: 'Popular',
    unavailable: 'Unavailable',
    add: 'Add',
    addAria: 'Add {name} to cart',
    incAria: 'Increase {name}',
    decAria: 'Decrease {name}',
    added: '{name} added to cart',
    noResults: 'No matching items',
    viewCart: 'View cart',
    cart: 'Your cart',
    close: 'Close',
    emptyCart: 'Your cart is empty — add something tasty!',
    name: 'Name (optional)',
    table: 'Table number / pickup',
    tablePh: 'e.g. Table 4 or curbside pickup',
    notes: 'Notes',
    notesPh: 'e.g. no sugar',
    total: 'Total',
    orderWa: 'Order on WhatsApp',
    clear: 'Clear cart',
    open: 'Open now',
    closed: 'Closed now',
    madeBy: 'Made by',
    switchLang: 'التبديل إلى العربية',
    loadError: 'Could not load the menu. If you opened the file directly, run a local server (see README).'
  }
};

/* ---------------------------------------------------------
   2) App state — the single source of truth.
   Whenever something changes we update `state` and re-render.
   --------------------------------------------------------- */
const state = {
  lang: 'ar',          // 'ar' or 'en'
  config: null,        // contents of config.json
  categories: [],      // from menu.json
  items: [],           // from menu.json
  activeCat: 'all',    // selected tab
  query: '',           // search text
  cart: {}             // { itemId: quantity }
};

/* Short helper to grab elements by id */
const $ = (id) => document.getElementById(id);

/* ---------------------------------------------------------
   3) Small helpers
   --------------------------------------------------------- */

/** Translate a UI key, replacing {name}-style placeholders. */
function t(key, vars = {}) {
  let text = I18N[state.lang][key] || key;
  for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, v);
  return text;
}

/** Read a bilingual field, e.g. pick(item, 'name') → item.name_ar or item.name_en.
 *  Falls back to Arabic if the English value is missing. */
function pick(obj, field, lang = state.lang) {
  return obj[`${field}_${lang}`] || obj[`${field}_ar`] || '';
}

/** Format an OMR price. The Omani rial has 3 decimals (1 OMR = 1000 baisa). */
function formatPrice(amount, lang = state.lang) {
  const currency = lang === 'ar' ? state.config.currency_ar : state.config.currency_en;
  return `${Number(amount).toFixed(3)} ${currency}`;
}

/** Make Arabic search forgiving: remove diacritics and unify similar letters
 *  (أ إ آ → ا , ة → ه , ى → ي). Also lower-cases English. */
function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')   // tashkeel + tatweel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

/** Create an element with attributes and children in one line.
 *  Using textContent (never innerHTML with data) keeps us safe from HTML injection. */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('data-') || key.startsWith('aria-') || key === 'role') node.setAttribute(key, value);
    else node[key] = value;
  }
  for (const child of children) if (child) node.append(child);
  return node;
}

/** Simple localStorage wrapper that never crashes (private mode, etc.). */
const storage = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }
};

/** Is the restaurant open right now? Handles closing after midnight (e.g. 18:00 → 02:00). */
function isOpenNow(open, close, now = new Date()) {
  const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const current = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(open);
  const end = toMinutes(close);
  if (start === end) return true;                 // open 24h
  if (end > start) return current >= start && current < end;
  return current >= start || current < end;       // crosses midnight
}

/* ---------------------------------------------------------
   4) Branding & language
   --------------------------------------------------------- */

/** Push config.json values into the page (colours, logo, name…). */
function applyConfig() {
  const c = state.config;
  const root = document.documentElement.style;
  root.setProperty('--primary', c.colors.primary);
  root.setProperty('--accent', c.colors.accent);
  root.setProperty('--bg', c.colors.background);
  root.setProperty('--surface', c.colors.surface);
  root.setProperty('--text', c.colors.text);
  document.querySelector('meta[name="theme-color"]').content = c.colors.primary;

  $('logo').src = c.logo;
  $('demoBanner').hidden = !c.demo;
}

/** Switch every piece of text on the page to the current language. */
function applyLanguage() {
  const c = state.config;
  const isAr = state.lang === 'ar';

  document.documentElement.lang = state.lang;
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';

  // Static texts marked in the HTML
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-aria]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nAria)); });

  // Restaurant info
  const name = pick(c, 'name');
  $('restaurantName').textContent = name;
  $('tagline').textContent = pick(c, 'tagline');
  $('hoursLabel').textContent = pick(c.hours, 'label');
  $('location').textContent = pick(c, 'location');
  $('logo').alt = name;
  document.title = `${name} | ${isAr ? 'القائمة' : 'Menu'}`;

  const open = isOpenNow(c.hours.open, c.hours.close);
  $('openStatus').textContent = open ? t('open') : t('closed');
  $('openStatus').className = `status-pill ${open ? 'open' : 'closed'}`;

  // The toggle shows the *other* language
  $('langToggle').textContent = isAr ? 'EN' : 'ع';
  $('langToggle').setAttribute('aria-label', t('switchLang'));
  $('tabs').setAttribute('aria-label', isAr ? 'الأقسام' : 'Categories');
}

/* ---------------------------------------------------------
   5) Rendering the menu
   --------------------------------------------------------- */

function renderTabs() {
  const tabs = $('tabs');
  tabs.innerHTML = '';
  const all = [{ id: 'all', icon: '', label: t('all') }]
    .concat(state.categories.map((c) => ({ id: c.id, icon: c.icon, label: pick(c, 'name') })));

  for (const cat of all) {
    tabs.append(el('button', {
      class: 'tab',
      type: 'button',
      role: 'tab',
      'aria-selected': String(state.activeCat === cat.id),
      'data-cat': cat.id,
      text: `${cat.icon ? cat.icon + ' ' : ''}${cat.label}`
    }));
  }
}

/** Which items should be visible given the selected tab and the search box? */
function visibleItems() {
  const q = normalize(state.query);
  return state.items.filter((item) => {
    if (state.activeCat !== 'all' && item.category !== state.activeCat) return false;
    if (!q) return true;
    const haystack = normalize([item.name_ar, item.name_en, item.desc_ar, item.desc_en].join(' '));
    return haystack.includes(q);
  });
}

function renderMenu() {
  const menu = $('menu');
  menu.innerHTML = '';
  const items = visibleItems();
  $('emptyState').hidden = items.length > 0;

  // Group by category, keeping the order defined in menu.json
  for (const cat of state.categories) {
    const catItems = items.filter((i) => i.category === cat.id);
    if (!catItems.length) continue;

    const section = el('section', { 'aria-labelledby': `sec-${cat.id}` },
      el('h2', { class: 'section-title', id: `sec-${cat.id}`, text: `${cat.icon} ${pick(cat, 'name')}` })
    );
    const grid = el('div', { class: 'grid' });
    catItems.forEach((item) => grid.append(renderCard(item, cat)));
    section.append(grid);
    menu.append(section);
  }
}

/** One item card: image (or emoji placeholder), name, description, price, controls. */
function renderCard(item, cat) {
  const available = item.available !== false;
  const name = pick(item, 'name');

  const media = item.image
    ? el('img', { class: 'card-img', src: item.image, alt: '', loading: 'lazy', width: 88, height: 88 })
    : el('div', { class: 'card-img', 'aria-hidden': 'true', text: cat.icon });

  const title = el('h3', { class: 'card-title', text: name });
  if (item.popular && available) title.append(el('span', { class: 'badge', text: t('popular') }));
  if (!available) title.append(el('span', { class: 'badge off', text: t('unavailable') }));

  const foot = el('div', { class: 'card-foot', 'data-controls': item.id },
    el('span', { class: 'price', text: formatPrice(item.price) })
  );
  foot.append(renderControls(item));

  return el('article', { class: `card${available ? '' : ' unavailable'}` },
    media,
    el('div', { class: 'card-body' },
      title,
      el('p', { class: 'card-desc', text: pick(item, 'desc') }),
      foot
    )
  );
}

/** "Add" button when the item is not in the cart, otherwise a  − qty +  stepper. */
function renderControls(item) {
  const name = pick(item, 'name');
  const qty = state.cart[item.id] || 0;

  if (item.available === false) {
    return el('button', { class: 'add-btn', type: 'button', disabled: true, text: t('add') });
  }
  if (qty === 0) {
    return el('button', {
      class: 'add-btn', type: 'button', 'data-action': 'inc', 'data-id': item.id,
      'aria-label': t('addAria', { name }), text: `+ ${t('add')}`
    });
  }
  return el('div', { class: 'stepper' },
    el('button', { class: 'step-btn', type: 'button', 'data-action': 'dec', 'data-id': item.id, 'aria-label': t('decAria', { name }), text: '−' }),
    el('span', { class: 'qty', text: String(qty) }),
    el('button', { class: 'step-btn', type: 'button', 'data-action': 'inc', 'data-id': item.id, 'aria-label': t('incAria', { name }), text: '+' })
  );
}

/** Re-draw only the controls of one card (keeps scroll + keyboard focus stable). */
function refreshCardControls(id, focusAction) {
  const foot = document.querySelector(`[data-controls="${CSS.escape(id)}"]`);
  if (!foot) return;
  const item = findItem(id);
  foot.lastElementChild.replaceWith(renderControls(item));
  // Put keyboard focus back on a sensible button
  const target = foot.querySelector(`[data-action="${focusAction}"]`) || foot.querySelector('button');
  if (target && document.activeElement === document.body) target.focus();
}

/* ---------------------------------------------------------
   6) Cart logic
   --------------------------------------------------------- */

const findItem = (id) => state.items.find((i) => i.id === id);
const cartKey = () => `barza-menu-cart:${state.config.name_en}`;

function cartEntries() {
  // Ignore items that were removed from menu.json or became unavailable
  return Object.entries(state.cart)
    .map(([id, qty]) => ({ item: findItem(id), qty }))
    .filter((e) => e.item && e.item.available !== false && e.qty > 0);
}

function cartTotal() {
  return cartEntries().reduce((sum, e) => sum + e.item.price * e.qty, 0);
}

function changeQty(id, delta) {
  const next = (state.cart[id] || 0) + delta;
  if (next <= 0) delete state.cart[id];
  else state.cart[id] = Math.min(next, 99);
  storage.set(cartKey(), state.cart);

  if (delta > 0) {
    showToast(t('added', { name: pick(findItem(id), 'name') }));
    $('cartBar').classList.remove('bump'); void $('cartBar').offsetWidth; $('cartBar').classList.add('bump');
  }
  refreshCardControls(id, delta > 0 ? 'inc' : 'dec');
  renderCart();

  // If the change happened inside the open cart, keep focus there
  if ($('cartDialog').open) {
    const again = $('cartList').querySelector(`[data-id="${CSS.escape(id)}"][data-action="${delta > 0 ? 'inc' : 'dec'}"]`);
    (again || $('closeCart')).focus();
  }
}

/** Update the floating bar and the cart dialog. */
function renderCart() {
  const entries = cartEntries();
  const count = entries.reduce((n, e) => n + e.qty, 0);
  const total = formatPrice(cartTotal());

  $('cartBar').hidden = count === 0;
  $('cartCount').textContent = count;
  $('cartBarTotal').textContent = total;
  $('cartTotal').textContent = total;
  document.querySelector('.whatsapp-btn').disabled = count === 0;

  const list = $('cartList');
  list.innerHTML = '';
  if (!entries.length) {
    list.append(el('li', { class: 'cart-empty', text: t('emptyCart') }));
    return;
  }
  for (const { item, qty } of entries) {
    const name = pick(item, 'name');
    list.append(el('li', { class: 'cart-line' },
      el('div', { class: 'line-name' },
        document.createTextNode(name),
        el('small', { text: `${formatPrice(item.price)} × ${qty} = ${formatPrice(item.price * qty)}` })
      ),
      el('div', { class: 'stepper' },
        el('button', { class: 'step-btn', type: 'button', 'data-action': 'dec', 'data-id': item.id, 'aria-label': t('decAria', { name }), text: '−' }),
        el('span', { class: 'qty', text: String(qty) }),
        el('button', { class: 'step-btn', type: 'button', 'data-action': 'inc', 'data-id': item.id, 'aria-label': t('incAria', { name }), text: '+' })
      )
    ));
  }
}

/* ---------------------------------------------------------
   7) WhatsApp order message
   The message is bilingual so any staff member can read it.
   --------------------------------------------------------- */
function buildOrderMessage() {
  const c = state.config;
  const line = '—————————————';
  const out = [];

  out.push('*طلب جديد | New Order*');
  out.push(`${c.name_ar} | ${c.name_en}`);
  out.push(line);
  for (const { item, qty } of cartEntries()) {
    out.push(`${qty} × ${item.name_ar} | ${item.name_en} = ${(item.price * qty).toFixed(3)} ${c.currency_en}`);
  }
  out.push(line);
  out.push(`*المجموع | Total: ${cartTotal().toFixed(3)} ${c.currency_en}*`);

  const name = $('custName').value.trim();
  const table = $('custTable').value.trim();
  const notes = $('custNotes').value.trim();
  if (name) out.push(`الاسم | Name: ${name}`);
  if (table) out.push(`الطاولة / الاستلام | Table / Pickup: ${table}`);
  if (notes) out.push(`ملاحظات | Notes: ${notes}`);

  return out.join('\n');
}

function sendOrder(event) {
  event.preventDefault();
  if (!cartEntries().length) return;
  const phone = String(state.config.whatsapp).replace(/\D/g, ''); // digits only, e.g. 96876632622
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(buildOrderMessage())}`;
  window.open(url, '_blank', 'noopener');
}

/* ---------------------------------------------------------
   8) Toast ("Added to cart")
   --------------------------------------------------------- */
let toastTimer;
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
}

/* ---------------------------------------------------------
   9) Events — we use "event delegation": one listener on a
   parent handles clicks for all the buttons inside it.
   --------------------------------------------------------- */
function bindEvents() {
  $('langToggle').addEventListener('click', () => {
    state.lang = state.lang === 'ar' ? 'en' : 'ar';
    storage.set('barza-menu-lang', state.lang);
    renderAll();
  });

  $('tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    state.activeCat = btn.dataset.cat;
    renderTabs();
    renderMenu();
    $('tabs').querySelector(`[data-cat="${CSS.escape(state.activeCat)}"]`).focus();
  });

  $('search').addEventListener('input', (e) => {
    state.query = e.target.value;
    renderMenu();
  });

  // + / − buttons inside cards and inside the cart dialog
  const onQtyClick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    changeQty(btn.dataset.id, btn.dataset.action === 'inc' ? 1 : -1);
  };
  $('menu').addEventListener('click', onQtyClick);
  $('cartList').addEventListener('click', onQtyClick);

  $('cartBar').addEventListener('click', () => $('cartDialog').showModal());
  $('closeCart').addEventListener('click', () => $('cartDialog').close());
  // Close the dialog when tapping the dark backdrop
  $('cartDialog').addEventListener('click', (e) => { if (e.target === $('cartDialog')) $('cartDialog').close(); });

  $('clearCart').addEventListener('click', () => {
    state.cart = {};
    storage.set(cartKey(), state.cart);
    renderMenu();
    renderCart();
  });

  $('orderForm').addEventListener('submit', sendOrder);

  // Add a soft shadow under the sticky toolbar once the page scrolls
  window.addEventListener('scroll', () => {
    $('toolbar').classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

function renderAll() {
  applyLanguage();
  renderTabs();
  renderMenu();
  renderCart();
}

/* ---------------------------------------------------------
   10) Start the app
   --------------------------------------------------------- */
async function init() {
  try {
    const [config, menu] = await Promise.all([
      fetch('config.json').then((r) => r.json()),
      fetch('menu.json').then((r) => r.json())
    ]);
    state.config = config;
    state.categories = menu.categories;
    state.items = menu.items;
  } catch (err) {
    console.error(err);
    $('menu').textContent = I18N.ar.loadError + ' — ' + I18N.en.loadError;
    return;
  }

  // Language: ?lang=en in the URL wins, then the last choice, then Arabic.
  const urlLang = new URLSearchParams(location.search).get('lang');
  state.lang = ['ar', 'en'].includes(urlLang) ? urlLang : storage.get('barza-menu-lang', 'ar');
  state.cart = storage.get(cartKey(), {});

  applyConfig();
  bindEvents();
  renderAll();
}

init();
