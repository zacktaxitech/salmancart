// Store template server. Zero npm dependencies. Node 16+.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { presets, commonSettings } = require('./presets');
const { sendMail, stripe } = require('./lib');

const PORT = process.env.PORT || 3000;
const DB = process.env.DB_FILE || path.join(__dirname, 'data', 'db.json');
const PUB = path.join(__dirname, 'public');
const UPLOADS = path.join(PUB, 'uploads');
const SECRET_KEYS = ['smtpPass', 'stripeSecret'];
const MASK = '********';
const sessions = new Map();
const attempts = new Map();

const hash = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
function newAdmin(user, pw) { const salt = crypto.randomBytes(16).toString('hex'); return { user, salt, hash: hash(pw, salt) }; }
function initDb() {
  fs.mkdirSync(path.dirname(DB), { recursive: true }); fs.mkdirSync(UPLOADS, { recursive: true });
  if (fs.existsSync(DB)) return;
  const type = process.env.SHOP_TYPE && presets[process.env.SHOP_TYPE] ? process.env.SHOP_TYPE : 'coffee';
  const p = presets[type];
  save({ admin: newAdmin(process.env.ADMIN_USER || 'admin', process.env.ADMIN_PASS || 'admin123'), settings: { shopType: type, ...commonSettings, ...p.settings }, categories: p.categories.slice(), products: JSON.parse(JSON.stringify(p.products)), orders: [], reservations: [], messages: [], seq: 1000 });
}
const load = () => JSON.parse(fs.readFileSync(DB, 'utf8'));
function save(d) { const tmp = DB + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(d, null, 2)); fs.renameSync(tmp, DB); }

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
const body = (req, max = 6e6) => new Promise(r => { let b = ''; req.on('data', c => { b += c; if (b.length > max) req.destroy(); }); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch { r({}); } }); });
const cookie = req => Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(c => { const i = c.indexOf('='); return [c.slice(0, i).trim(), c.slice(i + 1)]; }));
const authed = req => sessions.has(cookie(req).sid);
const clean = (s, n = 500) => String(s ?? '').slice(0, n);
const eq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const money = n => Math.round(n * 100) / 100;
const digits = s => String(s || '').replace(/[^\d]/g, '');

const publicSettings = s => { const o = { ...s }; SECRET_KEYS.forEach(k => delete o[k]); ['smtpHost','smtpPort','smtpSecurity','smtpUser','smtpFrom','ownerEmail','whatsappOwner','publicUrl'].forEach(k => delete o[k]); o.stripeEnabled = !!(s.stripeEnabled && s.stripeSecret); return o; };
const adminSettings = s => { const o = { ...s }; SECRET_KEYS.forEach(k => { if (o[k]) o[k] = MASK; }); return o; };
const baseUrl = (req, s) => (s.publicUrl || `http://${req.headers.host}`).replace(/\/$/, '');

function orderText(o, s) {
  const lines = o.items.map(i => `- ${i.qty} x ${i.name} (${s.currency} ${i.price}) = ${s.currency} ${money(i.price * i.qty)}`).join('\n');
  return `New order #${o.number} at ${s.brand}\n\n${lines}\n\nSubtotal: ${s.currency} ${o.subtotal}\nDelivery: ${s.currency} ${o.delivery}\nTotal: ${s.currency} ${o.total}\nPayment: ${o.payment.method === 'card' ? 'Card' : 'Cash on delivery'} (${o.payment.status})\n\nCustomer: ${o.customer.name}\nPhone: ${o.customer.phone}\nEmail: ${o.customer.email || '-'}\nAddress: ${o.customer.address}\nNotes: ${o.customer.notes || '-'}`;
}
const waLink = (num, text) => num ? `https://wa.me/${digits(num)}?text=${encodeURIComponent(text)}` : '';
async function notifyOrder(orderNumber) {
  const db = load(); const o = db.orders.find(x => x.number === orderNumber); if (!o) return;
  const s = db.settings; const log = [];
  if (s.notifyEmail && s.smtpHost && s.ownerEmail) {
    try { await sendMail({ host: s.smtpHost, port: s.smtpPort, security: s.smtpSecurity, user: s.smtpUser, pass: s.smtpPass, from: s.smtpFrom || s.smtpUser }, { to: s.ownerEmail, subject: `New order #${o.number} - ${s.currency} ${o.total}`, text: orderText(o, s) }); log.push('Email sent to owner'); }
    catch (e) { log.push('Email failed: ' + e.message); console.error('Email failed:', e.message); }
  } else log.push('Email not configured (skipped)');
  const d2 = load(); const o2 = d2.orders.find(x => x.number === orderNumber); if (o2) { o2.notifications = log; save(d2); }
}

function validateOrder(db, b) {
  const items = [];
  for (const it of Array.isArray(b.items) ? b.items.slice(0, 50) : []) {
    const p = db.products.find(x => x.id == it.id && x.available); const qty = Math.min(99, Math.max(1, parseInt(it.qty) || 0));
    if (p && qty) items.push({ id: p.id, name: p.name, price: p.price, qty });
  }
  const c = b.customer || {}; const customer = { name: clean(c.name, 80).trim(), phone: clean(c.phone, 30).trim(), email: clean(c.email, 120).trim(), address: clean(c.address, 300).trim(), notes: clean(c.notes, 500).trim() };
  if (!items.length) return { error: 'Your cart is empty' };
  if (!customer.name) return { error: 'Please enter your name' };
  if (digits(customer.phone).length < 7) return { error: 'Please enter a valid phone number' };
  if (!customer.address) return { error: 'Please enter your delivery address' };
  if (customer.email && !/^\S+@\S+\.\S+$/.test(customer.email)) return { error: 'Email looks invalid' };
  const s = db.settings; const subtotal = money(items.reduce((a, i) => a + i.price * i.qty, 0));
  const delivery = (s.freeDeliveryOver > 0 && subtotal >= s.freeDeliveryOver) ? 0 : money(+s.deliveryFee || 0);
  return { items, customer, subtotal, delivery, total: money(subtotal + delivery) };
}

function applyPreset(db, id, resetProducts) {
  const p = presets[id]; if (!p) return false;
  const keep = {}; ['currency','deliveryFee','freeDeliveryOver','codEnabled','whatsappOwner','notifyWhatsapp','notifyEmail','ownerEmail','smtpHost','smtpPort','smtpSecurity','smtpUser','smtpPass','smtpFrom','stripeEnabled','stripeSecret','stripeCurrency','publicUrl'].forEach(k => keep[k] = db.settings[k]);
  db.settings = { ...commonSettings, ...p.settings, ...keep, shopType: id };
  if (resetProducts) { db.categories = p.categories.slice(); db.products = JSON.parse(JSON.stringify(p.products)); }
  return true;
}

initDb();
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'); const p = url.pathname; const m = req.method;
  try {
    if (p.startsWith('/api/')) {
      const db = load(); const s = db.settings;
      // ---- public ----
      if (p === '/api/public' && m === 'GET') return send(res, 200, { settings: publicSettings(s), categories: db.categories, products: db.products.filter(x => x.available) });
      if (p === '/api/reserve' && m === 'POST') {
        const b = await body(req); if (!b.name || !b.date || !b.time) return send(res, 400, { error: 'Name, date and time are required' });
        db.reservations.push({ id: Date.now(), name: clean(b.name, 80), phone: clean(b.phone, 40), guests: Math.min(20, Math.max(1, +b.guests || 2)), date: clean(b.date, 20), time: clean(b.time, 10), status: 'pending', created: new Date().toISOString() });
        save(db); return send(res, 200, { ok: true });
      }
      if (p === '/api/contact' && m === 'POST') {
        const b = await body(req); if (!b.name || !b.message) return send(res, 400, { error: 'Name and message are required' });
        db.messages.push({ id: Date.now(), name: clean(b.name, 80), email: clean(b.email, 120), message: clean(b.message, 2000), read: false, created: new Date().toISOString() });
        save(db); return send(res, 200, { ok: true });
      }
      if (p === '/api/orders' && m === 'POST') {
        const b = await body(req); const v = validateOrder(db, b); if (v.error) return send(res, 400, { error: v.error });
        const method = b.payment === 'card' ? 'card' : 'cod';
        if (method === 'cod' && !s.codEnabled) return send(res, 400, { error: 'Cash on delivery is not available' });
        if (method === 'card' && !(s.stripeEnabled && s.stripeSecret)) return send(res, 400, { error: 'Card payment is not available' });
        const number = ++db.seq;
        const order = { number, created: new Date().toISOString(), items: v.items, subtotal: v.subtotal, delivery: v.delivery, total: v.total, customer: v.customer, payment: { method, status: 'pending' }, status: method === 'card' ? 'awaiting_payment' : 'new', notifications: [] };
        db.orders.push(order); save(db);
        if (method === 'cod') { notifyOrder(number); return send(res, 200, { ok: true, number, total: v.total, whatsappUrl: s.notifyWhatsapp ? waLink(s.whatsappOwner, orderText(order, s)) : '' }); }
        try {
          const root = baseUrl(req, s);
          const lines = v.items.map(i => ({ name: i.name, price: i.price, qty: i.qty })); if (v.delivery > 0) lines.push({ name: 'Delivery', price: v.delivery, qty: 1 });
          const sess = await stripe.createSession(s.stripeSecret, { successUrl: `${root}/?paid=${number}&sid={CHECKOUT_SESSION_ID}`, cancelUrl: `${root}/?cancelled=${number}`, reference: number, currency: s.stripeCurrency || 'sar', email: v.customer.email, lines });
          const d2 = load(); const o2 = d2.orders.find(x => x.number === number); o2.payment.sessionId = sess.id; save(d2);
          return send(res, 200, { ok: true, number, url: sess.url });
        } catch (e) {
          const d2 = load(); const o2 = d2.orders.find(x => x.number === number); if (o2) { o2.status = 'cancelled'; o2.payment.status = 'failed'; o2.notifications = ['Stripe error: ' + e.message]; save(d2); }
          return send(res, 502, { error: 'Card payment could not be started: ' + e.message });
        }
      }
      if (p === '/api/orders/confirm' && m === 'GET') {
        const num = +url.searchParams.get('order'), sid = url.searchParams.get('sid') || '';
        const o = db.orders.find(x => x.number === num); if (!o || o.payment.method !== 'card' || o.payment.sessionId !== sid) return send(res, 404, { error: 'Order not found' });
        if (o.payment.status !== 'paid') {
          try { const sess = await stripe.getSession(s.stripeSecret, sid); if (sess.payment_status !== 'paid') return send(res, 402, { error: 'Payment not completed' }); o.payment.status = 'paid'; o.status = 'new'; save(db); notifyOrder(num); }
          catch (e) { return send(res, 502, { error: e.message }); }
        }
        return send(res, 200, { ok: true, number: num, total: o.total, whatsappUrl: s.notifyWhatsapp ? waLink(s.whatsappOwner, orderText(o, s)) : '' });
      }
      // ---- auth ----
      if (p === '/api/login' && m === 'POST') {
        const ip = req.socket.remoteAddress; const a = attempts.get(ip) || { n: 0, t: Date.now() };
        if (Date.now() - a.t > 6e5) { a.n = 0; a.t = Date.now(); }
        if (a.n >= 10) return send(res, 429, { error: 'Too many attempts. Try again in a few minutes.' });
        const b = await body(req);
        if (eq(String(b.user || ''), db.admin.user) && eq(hash(String(b.pass || ''), db.admin.salt), db.admin.hash)) {
          attempts.delete(ip); const sid = crypto.randomBytes(24).toString('hex'); sessions.set(sid, Date.now());
          res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': `sid=${sid}; HttpOnly; SameSite=Strict; Path=/` }); return res.end('{"ok":true}');
        }
        a.n++; attempts.set(ip, a); return send(res, 401, { error: 'Wrong username or password' });
      }
      if (p === '/api/logout' && m === 'POST') { sessions.delete(cookie(req).sid); return send(res, 200, { ok: true }); }
      // ---- admin ----
      if (!authed(req)) return send(res, 401, { error: 'Not logged in' });
      if (p === '/api/admin/all' && m === 'GET') {
        const imgs = []; const walk = (d, rel) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { if (f.isDirectory()) walk(path.join(d, f.name), rel + '/' + f.name); else if (/\.(jpe?g|png|webp|svg)$/i.test(f.name)) imgs.push(rel + '/' + f.name); } };
        walk(path.join(PUB, 'img'), '/img'); if (fs.existsSync(UPLOADS)) walk(UPLOADS, '/uploads');
        return send(res, 200, { settings: adminSettings(s), categories: db.categories, products: db.products, orders: db.orders.slice().reverse(), reservations: db.reservations, messages: db.messages, presets: Object.entries(presets).map(([id, v]) => ({ id, name: v.name })), images: imgs, adminUser: db.admin.user });
      }
      if (p === '/api/admin/settings' && m === 'PUT') {
        const b = await body(req);
        for (const k of Object.keys(b)) {
          if (!(k in s) && !(k in commonSettings)) continue; if (k === 'shopType') continue;
          if (SECRET_KEYS.includes(k) && b[k] === MASK) continue;
          const cur = s[k]; s[k] = typeof cur === 'number' ? (+b[k] || 0) : typeof cur === 'boolean' ? (b[k] === true || b[k] === 'true') : clean(b[k], 600);
        }
        s.whatsappOwner = digits(s.whatsappOwner);
        save(db); return send(res, 200, adminSettings(s));
      }
      if (p === '/api/admin/preset' && m === 'POST') { const b = await body(req); if (!applyPreset(db, b.id, b.resetProducts !== false)) return send(res, 400, { error: 'Unknown preset' }); save(db); return send(res, 200, { ok: true }); }
      if (p === '/api/admin/categories' && m === 'PUT') { const b = await body(req); db.categories = [...new Set((b.categories || []).map(x => clean(x, 40).trim()).filter(Boolean))]; save(db); return send(res, 200, db.categories); }
      if (p === '/api/admin/password' && m === 'POST') {
        const b = await body(req);
        if (!eq(hash(String(b.current || ''), db.admin.salt), db.admin.hash)) return send(res, 400, { error: 'Current password is wrong' });
        if (String(b.password || '').length < 8) return send(res, 400, { error: 'New password must be at least 8 characters' });
        db.admin = newAdmin(clean(b.user || db.admin.user, 40) || db.admin.user, String(b.password)); save(db); return send(res, 200, { ok: true });
      }
      if (p === '/api/admin/test-email' && m === 'POST') {
        try { await sendMail({ host: s.smtpHost, port: s.smtpPort, security: s.smtpSecurity, user: s.smtpUser, pass: s.smtpPass, from: s.smtpFrom || s.smtpUser }, { to: s.ownerEmail, subject: `Test email from ${s.brand}`, text: 'Your email settings work. New orders will be emailed to this address.' }); return send(res, 200, { ok: true }); }
        catch (e) { return send(res, 400, { error: e.message }); }
      }
      if (p === '/api/admin/upload' && m === 'POST') {
        const b = await body(req, 8e6); const ext = (path.extname(String(b.name || '')).toLowerCase() || '').replace('.jpeg', '.jpg');
        if (!['.jpg', '.png', '.webp'].includes(ext)) return send(res, 400, { error: 'Use a JPG, PNG or WebP image' });
        const buf = Buffer.from(String(b.data || '').split(',').pop(), 'base64'); if (!buf.length || buf.length > 5e6) return send(res, 400, { error: 'Image must be under 5 MB' });
        const name = Date.now() + '-' + crypto.randomBytes(3).toString('hex') + ext; fs.writeFileSync(path.join(UPLOADS, name), buf); return send(res, 200, { path: '/uploads/' + name });
      }
      if (p === '/api/admin/products' && m === 'POST') {
        const b = await body(req); if (!b.name) return send(res, 400, { error: 'Name required' });
        const it = { id: Date.now(), category: clean(b.category, 40) || db.categories[0] || '', name: clean(b.name, 80), desc: clean(b.desc, 300), price: +b.price || 0, image: clean(b.image, 200), badge: clean(b.badge, 20), featured: !!b.featured, available: b.available !== false };
        if (it.category && !db.categories.includes(it.category)) db.categories.push(it.category);
        db.products.push(it); save(db); return send(res, 200, it);
      }
      let mm;
      if ((mm = p.match(/^\/api\/admin\/products\/(\d+)$/))) {
        const i = db.products.findIndex(x => x.id == mm[1]); if (i < 0) return send(res, 404, { error: 'Not found' });
        if (m === 'DELETE') { db.products.splice(i, 1); save(db); return send(res, 200, { ok: true }); }
        if (m === 'PUT') { const b = await body(req); const it = db.products[i];
          for (const k of ['category', 'name', 'desc', 'image', 'badge']) if (k in b) it[k] = clean(b[k], k === 'desc' ? 300 : 200);
          if ('price' in b) it.price = +b.price || 0; if ('featured' in b) it.featured = !!b.featured; if ('available' in b) it.available = !!b.available;
          if (it.category && !db.categories.includes(it.category)) db.categories.push(it.category);
          save(db); return send(res, 200, it); }
      }
      if ((mm = p.match(/^\/api\/admin\/orders\/(\d+)$/))) {
        const i = db.orders.findIndex(x => x.number == mm[1]); if (i < 0) return send(res, 404, { error: 'Not found' });
        if (m === 'DELETE') { db.orders.splice(i, 1); save(db); return send(res, 200, { ok: true }); }
        if (m === 'PUT') { const b = await body(req); const o = db.orders[i];
          if (['new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'].includes(b.status)) o.status = b.status;
          if (['pending', 'paid', 'failed', 'refunded'].includes(b.paymentStatus)) o.payment.status = b.paymentStatus;
          save(db); return send(res, 200, o); }
      }
      if ((mm = p.match(/^\/api\/admin\/(reservations|messages)\/(\d+)$/))) {
        const list = db[mm[1]]; const i = list.findIndex(x => x.id == mm[2]); if (i < 0) return send(res, 404, { error: 'Not found' });
        if (m === 'DELETE') { list.splice(i, 1); save(db); return send(res, 200, { ok: true }); }
        if (m === 'PUT') { const b = await body(req); if (mm[1] === 'reservations' && ['pending', 'confirmed', 'cancelled'].includes(b.status)) list[i].status = b.status; if (mm[1] === 'messages' && 'read' in b) list[i].read = !!b.read; save(db); return send(res, 200, list[i]); }
      }
      return send(res, 404, { error: 'Unknown endpoint' });
    }
    if (p === '/admin') { res.writeHead(200, { 'Content-Type': types['.html'] }); return res.end(fs.readFileSync(path.join(PUB, 'admin.html'))); }
    const f = path.normalize(path.join(PUB, p === '/' ? 'index.html' : decodeURIComponent(p)));
    if (!f.startsWith(PUB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(fs.readFileSync(f));
  } catch (e) { console.error(e); if (!res.headersSent) send(res, 500, { error: 'Server error' }); }
}).listen(PORT, () => console.log(`Store: http://localhost:${PORT}\nAdmin: http://localhost:${PORT}/admin`));
