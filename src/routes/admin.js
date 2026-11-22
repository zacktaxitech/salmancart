'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { ensureAdmin } = require('../auth');

const router = express.Router();
router.use(ensureAdmin);

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'images', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_'))
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

const ORDER_STATUSES = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for delivery', 'Delivered', 'Cancelled'];

router.use((req, res, next) => {
  res.locals.adminUser = req.currentUser;
  res.locals.orderStatuses = ORDER_STATUSES;
  next();
});

/* ---------------- dashboard ---------------- */
router.get('/', (req, res) => {
  const allOrders = db.orders.all();
  const revenue = allOrders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0);
  const lowStock = db.products.all().filter(p => p.stock <= 10);
  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    stats: {
      products: db.products.all().length,
      categories: db.categories.all().length,
      orders: allOrders.length,
      customers: db.users.all().filter(u => u.role !== 'admin').length,
      revenue
    },
    recentOrders: allOrders.slice(0, 6),
    lowStock
  });
});

/* ---------------- products ---------------- */
router.get('/products', (req, res) => {
  res.render('admin/products', { title: 'Products', products: db.products.all(), categories: db.categories.all() });
});

router.get('/products/new', (req, res) => {
  res.render('admin/product-form', { title: 'New product', product: null, categories: db.categories.all(), error: null });
});

router.get('/products/:id/edit', (req, res, next) => {
  const product = db.products.byId(req.params.id);
  if (!product) return next();
  res.render('admin/product-form', { title: 'Edit product', product, categories: db.categories.all(), error: null });
});

function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'product';
}

function productFromBody(req) {
  const b = req.body;
  return {
    name: String(b.name || '').trim(),
    brand: String(b.brand || '').trim(),
    category: String(b.category || '').trim(),
    price: Math.max(0, Math.round(Number(b.price) || 0)),
    mrp: Math.max(0, Math.round(Number(b.mrp) || Number(b.price) || 0)),
    stock: Math.max(0, parseInt(b.stock, 10) || 0),
    rating: Math.min(5, Math.max(0, Number(b.rating) || 4)),
    ratingCount: Math.max(0, parseInt(b.ratingCount, 10) || 0),
    description: String(b.description || '').trim(),
    highlights: String(b.highlights || '').split('\n').map(s => s.trim()).filter(Boolean),
    featured: b.featured === 'on',
    deal: b.deal === 'on',
    color: b.color || '#4f46e5'
  };
}

router.post('/products', upload.single('imageFile'), (req, res) => {
  const data = productFromBody(req);
  if (!data.name || !data.category || data.price <= 0) {
    return res.status(400).render('admin/product-form', { title: 'New product', product: req.body, categories: db.categories.all(), error: 'Name, category and a price above 0 are required.' });
  }
  data.slug = slugify(data.name) + '-' + Math.random().toString(36).slice(2, 6);
  data.image = req.file ? '/images/uploads/' + req.file.filename : `/images/products/${data.slug}.svg`;
  const p = db.products.create(data);
  res.redirect('/admin/products?saved=' + encodeURIComponent(p.name));
});

router.post('/products/:id', upload.single('imageFile'), (req, res, next) => {
  const p = db.products.byId(req.params.id);
  if (!p) return next();
  const data = productFromBody(req);
  if (req.file) data.image = '/images/uploads/' + req.file.filename;
  db.products.update(p.id, data);
  res.redirect('/admin/products?saved=' + encodeURIComponent(data.name || p.name));
});

router.post('/products/:id/delete', (req, res) => {
  db.products.remove(req.params.id);
  res.redirect('/admin/products');
});

/* ---------------- categories ---------------- */
router.get('/categories', (req, res) => {
  res.render('admin/categories', { title: 'Categories', categories: db.categories.all(), error: null });
});

router.post('/categories', (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).render('admin/categories', { title: 'Categories', categories: db.categories.all(), error: 'Name is required.' });
  db.categories.create({
    name,
    slug: slugify(name) + '-' + Math.random().toString(36).slice(2, 5),
    tagline: String(req.body.tagline || '').trim(),
    accent: req.body.accent || '#4f46e5',
    icon: 'tag',
    order: db.categories.all().length + 1
  });
  res.redirect('/admin/categories');
});

router.post('/categories/:id', (req, res) => {
  db.categories.update(req.params.id, {
    name: String(req.body.name || '').trim(),
    tagline: String(req.body.tagline || '').trim(),
    accent: req.body.accent || '#4f46e5'
  });
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', (req, res) => {
  const cat = db.categories.byId(req.params.id);
  if (cat && db.products.byCategory(cat.slug).length > 0) {
    return res.status(409).render('admin/categories', { title: 'Categories', categories: db.categories.all(), error: `"${cat.name}" still has products. Move or delete them first.` });
  }
  db.categories.remove(req.params.id);
  res.redirect('/admin/categories');
});

/* ---------------- inventory ---------------- */
router.get('/inventory', (req, res) => {
  const products = db.products.all().slice().sort((a, b) => a.stock - b.stock);
  res.render('admin/inventory', { title: 'Inventory', products });
});

router.post('/inventory/:id', (req, res) => {
  const stock = Math.max(0, parseInt(req.body.stock, 10) || 0);
  db.products.update(req.params.id, { stock });
  res.redirect('/admin/inventory');
});

/* ---------------- orders ---------------- */
router.get('/orders', (req, res) => {
  const status = req.query.status || '';
  let list = db.orders.all();
  if (status) list = list.filter(o => o.status === status);
  res.render('admin/orders', { title: 'Orders', orders: list, activeStatus: status });
});

router.get('/orders/:id', (req, res, next) => {
  const order = db.orders.byId(req.params.id);
  if (!order) return next();
  res.render('admin/order-detail', { title: 'Order ' + order.number, order });
});

router.post('/orders/:id/status', (req, res) => {
  const status = req.body.status;
  if (ORDER_STATUSES.includes(status)) db.orders.setStatus(req.params.id, status);
  res.redirect('/admin/orders/' + req.params.id);
});

/* ---------------- users ---------------- */
router.get('/users', (req, res) => {
  res.render('admin/users', { title: 'Users', users: db.users.all() });
});

router.post('/users/:id/role', (req, res) => {
  const target = db.users.byId(req.params.id);
  if (target && target.id !== req.currentUser.id) {
    db.users.update(target.id, { role: target.role === 'admin' ? 'customer' : 'admin' });
  }
  res.redirect('/admin/users');
});

router.post('/users/:id/delete', (req, res) => {
  const target = db.users.byId(req.params.id);
  if (target && target.id !== req.currentUser.id) db.users.remove(target.id);
  res.redirect('/admin/users');
});

module.exports = router;
