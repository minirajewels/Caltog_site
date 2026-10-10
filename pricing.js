/* Shared by the storefront and regression tests. All amounts are whole rupees. */
(function (root) {
  const eligible = p => /^AT\s*-\s*R/i.test(p.code);
  function normalizeCart(input, products) {
    const result = Object.create(null);
    if (!input || typeof input !== 'object' || Array.isArray(input)) return result;
    for (const p of products) {
      const q = input[p.code];
      if (p.stock === 'In Stock' && Number.isSafeInteger(q) && q > 0 &&
          Number.isSafeInteger(q * p.price)) result[p.code] = q;
    }
    if (!Number.isSafeInteger(Object.entries(result).reduce((sum, [code,q]) =>
      sum + products.find(p => p.code === code).price * q, 0))) return Object.create(null);
    return result;
  }
  function calculate(input, products) {
    const cart = normalizeCart(input, products);
    let subtotal = 0, ringCount = 0, discount = 0;
    const rings = [];
    for (const p of products) {
      const q = cart[p.code] || 0;
      subtotal += p.price * q;
      if (q && eligible(p)) { rings.push({price:p.price, quantity:q}); ringCount += q; }
    }
    // Ascending groups of five: positions 0 and 1 in each completed group are free.
    // Count ranges rather than allocating an array for every individual unit.
    rings.sort((a,b) => a.price - b.price);
    const completeUnits = Math.floor(ringCount / 5) * 5;
    const freeBefore = n => Math.floor(n / 5) * 2 + Math.min(n % 5, 2);
    let position = 0;
    for (const ring of rings) {
      const end = Math.min(position + ring.quantity, completeUnits);
      if (position < completeUnits) discount += (freeBefore(end) - freeBefore(position)) * ring.price;
      position += ring.quantity;
    }
    const merchandise = subtotal - discount;
    const shipping = merchandise > 0 && merchandise < 999 ? 79 : 0;
    return {subtotal, discount, merchandise, shipping, total:merchandise + shipping, ringCount, freeCount:Math.floor(ringCount/5)*2};
  }
  function orderText(cart, products) {
    cart = normalizeCart(cart, products);
    const x = calculate(cart, products), money = n => '₹' + n.toLocaleString('en-IN');
    return ['Hi Minira Jewels! I would like to order:', '',
      ...Object.entries(cart).map(([code,q]) => `${code} × ${q} — ${money(products.find(p=>p.code===code).price*q)}`),
      '', `Subtotal: ${money(x.subtotal)}`, `Ring offer: -${money(x.discount)}`,
      `Merchandise payable: ${money(x.merchandise)}`, `Shipping: ${x.shipping ? money(x.shipping) : 'FREE'}`,
      `Total: ${money(x.total)}`].join('\n');
  }
  const api = {eligible, normalizeCart, calculate, orderText};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Minira = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
