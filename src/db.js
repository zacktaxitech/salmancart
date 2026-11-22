'use strict';
/**
 * SalmanCart data layer.
 * JSON-file backed store (like the Powernexa build) so the app runs with zero
 * external services. On Render free tier the filesystem is ephemeral, so a
 * redeploy resets data to the seed catalog - documented in README/RENDER notes.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const EMPTY = () => ({
  meta: { seededAt: null, version: 1 },
  users: [],
  categories: [],
  products: [],
  orders: [],
  counters: { order: 1000 }
});

let store = null;
let saveTimer = null;

function load() {
  if (store) return store;
  try {
    if (fs.existsSync(STORE_FILE)) {
      store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('[db] store.json unreadable, starting fresh:', err.message);
    store = null;
  }
  if (!store || typeof store !== 'object') store = EMPTY();
  for (const key of ['users', 'categories', 'products', 'orders']) {
    if (!Array.isArray(store[key])) store[key] = [];
  }
  if (!store.counters) store.counters = { order: 1000 };
  return store;
}

function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const tmp = STORE_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
      fs.renameSync(tmp, STORE_FILE);
    } catch (err) {
      console.error('[db] save failed:', err.message);
    }
  }, 150);
}

function saveNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = STORE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
  fs.renameSync(tmp, STORE_FILE);
}

function id(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function nextOrderNumber() {
  const s = load();
  s.counters.order += 1;
  return 'SC' + s.counters.order;
}

/* ---------------- users ---------------- */
const users = {
  all: () => load().users,
  byId: (uid) => load().users.find(u => u.id === uid) || null,
  byEmail: (email) => load().users.find(u => u.email && u.email.toLowerCase() === String(email).toLowerCase()) || null,
  byGoogleId: (gid) => load().users.find(u => u.googleId === gid) || null,
  create(user) {
    const s = load();
    const rec = Object.assign({ id: id('usr'), role: 'customer', createdAt: new Date().toISOString() }, user);
    s.users.push(rec); save();
    return rec;
  },
  update(uid, patch) {
    const u = users.byId(uid);
    if (!u) return null;
    Object.assign(u, patch, { updatedAt: new Date().toISOString() });
    save();
    return u;
  },
  remove(uid) {
    const s = load();
    const i = s.users.findIndex(u => u.id === uid);
    if (i === -1) return false;
    s.users.splice(i, 1); save();
    return true;
  }
};

/* ---------------- categories ---------------- */
const categories = {
  all: () => load().categories.slice().sort((a, b) => (a.order || 0) - (b.order || 0)),
  byId: (cid) => load().categories.find(c => c.id === cid) || null,
  bySlug: (slug) => load().categories.find(c => c.slug === slug) || null,
  create(cat) {
    const s = load();
    const rec = Object.assign({ id: id('cat'), createdAt: new Date().toISOString() }, cat);
    s.categories.push(rec); save();
    return rec;
  },
  update(cid, patch) {
    const c = categories.byId(cid);
    if (!c) return null;
    Object.assign(c, patch, { updatedAt: new Date().toISOString() });
    save();
    return c;
  },
  remove(cid) {
    const s = load();
    const i = s.categories.findIndex(c => c.id === cid);
    if (i === -1) return false;
    s.categories.splice(i, 1); save();
    return true;
  }
};

/* ---------------- products ---------------- */
const products = {
  all: () => load().products,
  byId: (pid) => load().products.find(p => p.id === pid) || null,
  bySlug: (slug) => load().products.find(p => p.slug === slug) || null,
  byCategory: (slug) => load().products.filter(p => p.category === slug),
  featured: () => load().products.filter(p => p.featured),
  deals: () => load().products.filter(p => p.deal),
  create(prod) {
    const s = load();
    const rec = Object.assign({
      id: id('prd'), rating: 4.2, ratingCount: 0, stock: 0,
      featured: false, deal: false, createdAt: new Date().toISOString()
    }, prod);
    s.products.push(rec); save();
    return rec;
  },
  update(pid, patch) {
    const p = products.byId(pid);
    if (!p) return null;
    Object.assign(p, patch, { updatedAt: new Date().toISOString() });
    save();
    return p;
  },
  remove(pid) {
    const s = load();
    const i = s.products.findIndex(p => p.id === pid);
    if (i === -1) return false;
    s.products.splice(i, 1); save();
    return true;
  },
  search(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    return load().products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }
};

/* ---------------- orders ---------------- */
const orders = {
  all: () => load().orders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  byId: (oid) => load().orders.find(o => o.id === oid) || null,
  byNumber: (num) => load().orders.find(o => o.number === num) || null,
  byUser: (uid) => load().orders.filter(o => o.userId === uid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  create(order) {
    const s = load();
    const rec = Object.assign({
      id: id('ord'), number: nextOrderNumber(), status: 'Placed',
      createdAt: new Date().toISOString(), history: [{ status: 'Placed', at: new Date().toISOString() }]
    }, order);
    s.orders.push(rec); save();
    return rec;
  },
  setStatus(oid, status) {
    const o = orders.byId(oid);
    if (!o) return null;
    o.status = status;
    o.history.push({ status, at: new Date().toISOString() });
    o.updatedAt = new Date().toISOString();
    save();
    return o;
  }
};

/* ---------------- seed on first run ---------------- */
function ensureSeeded(seedFn) {
  const s = load();
  if (s.meta.seededAt) return false;
  seedFn({ users, categories, products });
  s.meta.seededAt = new Date().toISOString();
  saveNow();
  return true;
}

module.exports = { load, save, saveNow, users, categories, products, orders, ensureSeeded, STORE_FILE, DATA_DIR, EMPTY };
