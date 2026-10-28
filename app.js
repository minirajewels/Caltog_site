'use strict';
let products = [], cart = {}, category = 'All', visible = 24;
const $ = selector => document.querySelector(selector);
const money = n => '₹' + n.toLocaleString('en-IN');
function notice(message) { $('.status').textContent = message; }
function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function button(text, action, code) {
  const el = element('button', '', text);
  el.type = 'button'; el.dataset.action = action;
  if (code) el.dataset.code = code;
  return el;
}
function persist() {
  try { localStorage.setItem('miniraCart', JSON.stringify(cart)); }
  catch { notice('Your cart works here, but this browser cannot save it for later.'); }
  updateCart();
}
function sanitize(input) {
  const clean = Minira.normalizeCart(input, products);
  if (Object.keys(input || {}).some(code => clean[code] !== input[code]))
    notice('Unavailable items or invalid quantities were removed from your cart.');
  return clean;
}
function renderChips() {
  const chips = $('.chips'); chips.replaceChildren();
  for (const name of ['All', ...new Set(products.map(p=>p.category))]) {
    const el = button(name, 'category'); el.dataset.category = name;
    el.className = 'chip' + (category === name ? ' active' : '');
    el.setAttribute('aria-pressed', String(category === name)); chips.append(el);
  }
}
function render() {
  const query = $('.search').value.trim().toLowerCase();
  const list = products.filter(p => (category === 'All' || p.category === category) &&
    (!query || p.code.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)));
  $('.results').textContent = `${list.length} pieces`;
  const grid = $('.grid'); grid.replaceChildren();
  for (const p of list.slice(0, visible)) {
    const card = element('article', 'card'), frame = element('div', 'img');
    const img = element('img'); img.alt = p.name || p.code;
    img.loading = grid.childElementCount < 2 ? 'eager' : 'lazy';
    img.decoding = 'async'; img.width = 600; img.height = 600;
    const asset = window.MiniraImages?.[p.image];
    if (asset) {
      img.sizes = '(min-width: 1100px) 263px, (min-width: 700px) calc(25vw - 18px), calc(50vw - 18px)';
      img.srcset = asset.srcset;
      img.src = asset.src;
    } else {
      img.src = 'images/products/' + encodeURIComponent(p.image);
    }
    img.addEventListener('error', () => { frame.replaceChildren(element('span', 'image-missing', 'Photo coming soon')); }, {once:true});
    frame.append(img);
    const info = element('div', 'info');
    info.append(element('h2', 'code', p.name || p.code), element('p', 'category', p.category),
      element('div', 'price', money(p.price)),
      element('div', 'offer', Minira.eligible(p) ? 'Buy 3 Rings, Get 2 Free' : ''));
    const add = button(p.stock === 'In Stock' ? 'ADD TO CART' : 'OUT OF STOCK', 'add', p.code);
    add.className = 'add'; add.disabled = p.stock !== 'In Stock';
    add.setAttribute('aria-label', `${add.textContent}: ${p.code}`);
    info.append(add); card.append(frame, info); grid.append(card);
  }
  if (!list.length) grid.append(element('p', '', 'No pieces found. Try another code or category.'));
  $('.more').hidden = visible >= list.length;
}
function change(code, delta) {
  const p = products.find(p=>p.code === code);
  if (!p || p.stock !== 'In Stock') return;
  const next = (cart[code] || 0) + delta;
  if (next <= 0) delete cart[code];
  else {
    const candidate = {...cart, [code]: next};
    if (Minira.normalizeCart(candidate, products)[code] !== next) return;
    cart = candidate;
  }
  persist();
  notice(delta > 0 ? `${code} added to your cart.` : 'Cart updated.');
}
function updateCart() {
  $('.count').textContent = Object.values(cart).reduce((sum,q)=>sum+q,0);
  const items = $('.items'); items.replaceChildren();
  for (const [code,q] of Object.entries(cart)) {
    const p = products.find(p=>p.code===code), row = element('div','row');
    const label = element('div'); label.append(element('b','',code),element('div','',money(p.price*q)));
    const qty = element('div','qty');
    const minus = button('−','minus',code), plus = button('+','add',code);
    minus.setAttribute('aria-label',`Decrease ${code} quantity`); plus.setAttribute('aria-label',`Increase ${code} quantity`);
    qty.append(minus,element('span','',String(q)),plus); row.append(label,qty); items.append(row);
  }
  if (!Object.keys(cart).length) items.append(element('p','','Your cart is empty. Explore the collection to find your favourites.'));
  const x = Minira.calculate(cart,products), summary = $('.summary'); summary.replaceChildren();
  for (const [label,value] of [['Subtotal',money(x.subtotal)],['Ring offer', '− '+money(x.discount)],
    ['Merchandise payable',money(x.merchandise)],['Shipping',x.shipping ? money(x.shipping) : 'FREE'],['Total',money(x.total)]]) {
    const row = element('div',label === 'Total' ? 'summary-row total' : 'summary-row');
    row.append(element('span','',label),element('span','',value)); summary.append(row);
  }
  if (x.freeCount) summary.append(element('p','offer',`${x.freeCount} ring units free. The two lowest-priced rings in each complete group of five are discounted.`));
  $('.checkout').disabled = !Object.keys(cart).length;
  $('.share').disabled = !Object.keys(cart).length;
}
async function shareCart() {
  const url = new URL(location.href);
  url.searchParams.set('cart',btoa(JSON.stringify(cart)));
  try { await navigator.clipboard.writeText(url.href); notice('Cart link copied.'); }
  catch { $('.share-link').hidden = false; $('.share-link').value = url.href; $('.share-link').focus(); $('.share-link').select(); notice('Copy the selected cart link.'); }
}
document.addEventListener('click', event => {
  const target = event.target.closest('button[data-action]'); if (!target || target.disabled) return;
  switch (target.dataset.action) {
    case 'add': change(target.dataset.code,1); break;
    case 'minus': change(target.dataset.code,-1); break;
    case 'category': category=target.dataset.category; visible=24; renderChips(); render(); break;
    case 'more': visible+=24; render(); break;
    case 'open': $('.drawer').showModal(); break;
    case 'close': $('.drawer').close(); break;
    case 'share': shareCart(); break;
    case 'checkout':
      cart=sanitize(cart); persist();
      if (Object.keys(cart).length) location.href='https://wa.me/917202811287?text='+encodeURIComponent(Minira.orderText(cart,products));
      break;
  }
});
$('.search').addEventListener('input',()=>{visible=24;render();});
async function init() {
  try {
    const response = await fetch('products.json'); if (!response.ok) throw new Error('Catalogue fetch failed');
    products = await response.json(); products.sort((a,b)=>a.order-b.order);
    if (!Array.isArray(products) || products.some(p=>typeof p.code!=='string' || !Number.isSafeInteger(p.price) || p.price<0)) throw new Error('Invalid catalogue');
    let saved={}; try { saved=JSON.parse(localStorage.getItem('miniraCart')||'{}'); } catch { notice('Your saved cart could not be read. You can start a new cart.'); }
    const shared=new URLSearchParams(location.search).get('cart');
    if (shared) { try { saved=JSON.parse(atob(shared)); } catch { notice('This cart link could not be read. Your saved cart is still available.'); } }
    cart=sanitize(saved); renderChips(); render(); persist();
  } catch { $('.grid').textContent='We couldn’t load the collection. Please refresh or contact Minira on WhatsApp.'; }
}
init();
