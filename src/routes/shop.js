'use strict';
const express = require('express');
const db = require('../db');
const { ensureAuth } = require('../auth');

const router = express.Router();

/* ---------------- cart helpers (session-based) ---------------- */
function getCart(req) {
  if (!req.session.cart) req.session.cart = {};
  return req.session.cart;
}

function cartDetailed(req) {
  const cart = getCart(req);
  const items = [];
  let subtotal = 0, mrpTotal = 0, count = 0;
  for (const [pid, qty] of Object.entries(cart)) {
    const p = db.products.byId(pid);
    if (!p || qty <= 0) continue;
    const line = p.price * qty;
    subtotal += line;
    mrpTotal += (p.mrp || p.price) * qty;
    count += qty;
    items.push({ product: p, qty, line });
  }
  return { items, subtotal, mrpTotal, discount: mrpTotal - subtotal, count, delivery: subtotal >= 499 || subtotal === 0 ? 0 : 40 };
}

/* ---------------- home ---------------- */
router.get('/', (req, res) => {
  res.render('shop/home', {
    title: 'SalmanCart - Online Shopping',
    featured: db.products.featured(),
    deals: db.products.deals().slice(0, 12),
    newest: db.products.all().slice(-8).reverse()
  });
});

/* ---------------- listing with filters + search ---------------- */
router.get('/products', (req, res) => {
  const { category, q, sort, min, max, inStock } = req.query;
  let list = db.products.all();

  if (q) list = db.products.search(q);
  if (category) list = list.filter(p => p.category === category);
  if (min) list = list.filter(p => p.price >= Number(min));
  if (max) list = list.filter(p => p.price <= Number(max));
  if (inStock === '1') list = list.filter(p => p.stock > 0);

  switch (sort) {
    case 'price-asc': list = list.slice().sort((a, b) => a.price - b.price); break;
    case 'price-desc': list = list.slice().sort((a, b) => b.price - a.price); break;
    case 'rating': list = list.slice().sort((a, b) => b.rating - a.rating); break;
    case 'discount': list = list.slice().sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp); break;
    default: list = list.slice().sort((a, b) => (b.featured - a.featured) || (b.rating - a.rating));
  }

  const cat = category ? db.categories.bySlug(category) : null;
  res.render('shop/listing', {
    title: q ? `Search: ${q}` : (cat ? cat.name : 'All products'),
    products: list,
    query: { category: category || '', q: q || '', sort: sort || '', min: min || '', max: max || '', inStock: inStock || '' }
  });
});

/* ---------------- product detail ---------------- */
router.get('/product/:slug', (req, res, next) => {
  const p = db.products.bySlug(req.params.slug);
  if (!p) return next();
  const related = db.products.byCategory(p.category).filter(x => x.id !== p.id).slice(0, 8);
  res.render('shop/product', { title: p.name, product: p, related });
});

/* ---------------- cart ---------------- */
router.get('/cart', (req, res) => {
  res.render('shop/cart', Object.assign({ title: 'My Cart' }, cartDetailed(req)));
});

router.post('/cart/add', (req, res) => {
  const { productId, qty } = req.body;
  const p = db.products.byId(productId);
  if (!p) return res.status(404).json({ ok: false, error: 'Product not found' });
  const cart = getCart(req);
  const want = (cart[productId] || 0) + Math.max(1, parseInt(qty, 10) || 1);
  if (p.stock <= 0) return res.status(400).json({ ok: false, error: 'Out of stock' });
  cart[productId] = Math.min(want, p.stock);
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({ ok: true, cartCount: cartDetailed(req).count });
  }
  res.redirect('/cart');
});

router.post('/cart/update', (req, res) => {
  const { productId, qty } = req.body;
  const cart = getCart(req);
  const q = parseInt(qty, 10) || 0;
  const p = db.products.byId(productId);
  if (q <= 0) delete cart[productId];
  else if (p) cart[productId] = Math.min(q, p.stock);
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    const detail = cartDetailed(req);
    return res.json({ ok: true, cartCount: detail.count, subtotal: detail.subtotal });
  }
  res.redirect('/cart');
});

router.post('/cart/remove', (req, res) => {
  const cart = getCart(req);
  delete cart[req.body.productId];
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.json({ ok: true, cartCount: cartDetailed(req).count });
  }
  res.redirect('/cart');
});

/* ---------------- checkout ---------------- */
router.get('/checkout', ensureAuth, (req, res) => {
  const detail = cartDetailed(req);
  if (detail.items.length === 0) {
    req.session.flash = { type: 'warn', text: 'Your cart is empty.' };
    return res.redirect('/cart');
  }
  res.render('shop/checkout', Object.assign({ title: 'Checkout', error: null }, detail));
});

router.post('/checkout', ensureAuth, (req, res) => {
  const detail = cartDetailed(req);
  if (detail.items.length === 0) return res.redirect('/cart');
  const { name, phone, address, city, pincode } = req.body;
  if (!name || !phone || !address || !city || !pincode) {
    return res.status(400).render('shop/checkout', Object.assign({ title: 'Checkout', error: 'Please fill in all delivery fields.' }, detail));
  }
  // stock check + decrement
  for (const it of detail.items) {
    if (it.product.stock < it.qty) {
      return res.status(409).render('shop/checkout', Object.assign({ title: 'Checkout', error: `"${it.product.name}" no longer has enough stock.` }, detail));
    }
  }
  for (const it of detail.items) {
    db.products.update(it.product.id, { stock: it.product.stock - it.qty });
  }
  const order = db.orders.create({
    userId: req.currentUser.id,
    customer: { name, email: req.currentUser.email, phone, address, city, pincode },
    items: detail.items.map(it => ({ productId: it.product.id, slug: it.product.slug, name: it.product.name, image: it.product.image, price: it.product.price, qty: it.qty })),
    subtotal: detail.subtotal,
    discount: detail.discount,
    delivery: detail.delivery,
    total: detail.subtotal + detail.delivery,
    payment: 'Cash on Delivery'
  });
  req.session.cart = {};
  res.redirect('/order-success/' + order.number);
});

router.get('/order-success/:number', ensureAuth, (req, res, next) => {
  const order = db.orders.byNumber(req.params.number);
  if (!order || order.userId !== req.currentUser.id) return next();
  res.render('shop/order-success', { title: 'Order placed', order });
});

router.get('/orders', ensureAuth, (req, res) => {
  res.render('shop/orders', { title: 'My Orders', orders: db.orders.byUser(req.currentUser.id) });
});

module.exports = router;
