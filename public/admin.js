const $ = s => document.querySelector(s);
let D, tab = 'orders';
const J = { 'Content-Type': 'application/json' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function api(m, u, b) {
  const r = await fetch(u, { method: m, headers: J, body: b ? JSON.stringify(b) : undefined });
  if (r.status === 401 && !u.includes('login')) { $('#app').style.display = 'none'; $('#login').style.display = 'grid'; throw new Error('Not logged in'); }
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Request failed'); return j;
}
async function login() { try { await api('POST', '/api/login', { user: $('#u').value, pass: $('#p').value }); load(); } catch (e) { $('#lm').textContent = e.message; } }
$('#loginBtn').onclick = login; $('#p').onkeydown = e => { if (e.key === 'Enter') login(); };
async function load() { D = await api('GET', '/api/admin/all'); $('#login').style.display = 'none'; $('#app').style.display = 'grid'; draw(); }
const TABS = [['orders', 'Orders'], ['products', 'Products'], ['content', 'Site content'], ['shoptype', 'Shop type'], ['payments', 'Payments & alerts'], ['bookings', 'Bookings & messages'], ['account', 'Account']];
function draw() {
  const nn = D.orders.filter(o => o.status === 'new').length;
  $('#side').innerHTML = `<div class="logo">${esc(D.settings.brand)}</div>` + TABS.map(([k, n]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${n}${k === 'orders' && nn ? `<span class="pill">${nn}</span>` : ''}</button>`).join('') + '<div class="grow"></div><button id="viewsite">View site ↗</button><button id="logout">Log out</button>';
  document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
  $('#viewsite').onclick = () => window.open('/', '_blank'); $('#logout').onclick = async () => { await api('POST', '/api/logout'); location.reload(); };
  ({ orders, products, content, shoptype, payments, bookings, account })[tab]();
}
const set = h => { $('#main').innerHTML = h; };
const cur = () => D.settings.currency;
const dt = s => new Date(s).toLocaleString();

/* ---------- orders ---------- */
const STAT = ['new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];
function orders() {
  const list = D.orders;
  set(`<h2>Orders</h2><p class="sub">${list.length} total. Change the status as you work on each order.</p>` + (list.length ? list.map(o => {
    const wa = 'https://wa.me/' + String(o.customer.phone).replace(/\D/g, '') + '?text=' + encodeURIComponent(`Hello ${o.customer.name}, this is ${D.settings.brand} about your order #${o.number}.`);
    return `<div class="card"><div class="row" style="justify-content:space-between"><div><b>#${o.number}</b> <span class="badge st-${o.status}">${o.status.replace('_', ' ')}</span> <span class="badge">${o.payment.method === 'card' ? 'Card' : 'Cash on delivery'}: ${o.payment.status}</span><div class="small">${dt(o.created)}</div></div><div style="text-align:right"><b>${cur()} ${o.total}</b><div class="small">items ${o.subtotal} + delivery ${o.delivery}</div></div></div>
<div class="g" style="margin-top:10px"><div><b>${esc(o.customer.name)}</b><br>${esc(o.customer.phone)}${o.customer.email ? '<br>' + esc(o.customer.email) : ''}<br><span class="small">${esc(o.customer.address)}</span>${o.customer.notes ? `<br><span class="small">Note: ${esc(o.customer.notes)}</span>` : ''}</div>
<div>${o.items.map(i => `${i.qty} x ${esc(i.name)} <span class="small">(${cur()} ${i.price})</span>`).join('<br>')}</div></div>
<div class="row" style="margin-top:12px"><select data-os="${o.number}" style="width:auto">${STAT.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
${o.payment.method === 'cod' || o.payment.status !== 'paid' ? `<button class="s" data-paid="${o.number}">Mark paid</button>` : ''}<a class="s" style="text-decoration:none" target="_blank" href="${wa}">WhatsApp customer</a><button class="s d" data-od="${o.number}">Delete</button></div>
${(o.notifications || []).length ? `<div class="small" style="margin-top:8px">Alerts: ${o.notifications.map(esc).join(' / ')}</div>` : ''}</div>`;
  }).join('') : '<div class="card">No orders yet. Place a test order on the storefront to see it here.</div>'));
  document.querySelectorAll('[data-os]').forEach(s => s.onchange = async () => { await api('PUT', '/api/admin/orders/' + s.dataset.os, { status: s.value }); load(); });
  document.querySelectorAll('[data-paid]').forEach(b => b.onclick = async () => { await api('PUT', '/api/admin/orders/' + b.dataset.paid, { paymentStatus: 'paid' }); load(); });
  document.querySelectorAll('[data-od]').forEach(b => b.onclick = async () => { if (confirm('Delete order #' + b.dataset.od + '?')) { await api('DELETE', '/api/admin/orders/' + b.dataset.od); load(); } });
}

/* ---------- image picker ---------- */
function imgField(id, val, label) {
  return `<div class="imgf" data-if="${id}"><img src="${esc(val)}" onerror="this.style.visibility='hidden'" onload="this.style.visibility='visible'" alt=""><div class="col"><span class="small">${label || 'Image'}</span><select data-ipick="${id}"><option value="">Choose a bundled/uploaded image...</option>${D.images.map(p => `<option value="${esc(p)}" ${p === val ? 'selected' : ''}>${esc(p.replace('/img/', ''))}</option>`).join('')}</select><div class="row"><input data-itext="${id}" value="${esc(val)}" placeholder="/img/... or upload" style="flex:1"><label class="s" style="cursor:pointer">Upload<input type="file" accept="image/jpeg,image/png,image/webp" data-iup="${id}" hidden></label></div></div></div>`;
}
function wireImg(root, onChange) {
  root.querySelectorAll('[data-ipick]').forEach(s => s.onchange = () => { const t = root.querySelector(`[data-itext="${s.dataset.ipick}"]`); t.value = s.value; t.dispatchEvent(new Event('change')); });
  root.querySelectorAll('[data-itext]').forEach(t => t.addEventListener('change', () => { const w = root.querySelector(`[data-if="${t.dataset.itext}"] img`); w.src = t.value; onChange(t.dataset.itext, t.value); }));
  root.querySelectorAll('[data-iup]').forEach(f => f.onchange = () => {
    const file = f.files[0]; if (!file) return; const rd = new FileReader();
    rd.onload = async () => { try { const r = await api('POST', '/api/admin/upload', { name: file.name, data: rd.result }); D.images.push(r.path); const t = root.querySelector(`[data-itext="${f.dataset.iup}"]`); t.value = r.path; t.dispatchEvent(new Event('change')); } catch (e) { alert(e.message); } };
    rd.readAsDataURL(file);
  });
}

/* ---------- products ---------- */
let pcat = 'All';
function products() {
  const cats = D.categories; const list = D.products.filter(p => pcat === 'All' || p.category === pcat);
  set(`<h2>Products</h2><p class="sub">Edits save as soon as you leave a field. "Hero slide" products animate in the pinned hero on the home page (best with 4 to 7).</p>
<div class="row" style="margin-bottom:14px"><select id="pf" style="width:auto"><option>All</option>${cats.map(c => `<option ${c === pcat ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select><button class="btn" id="addP">+ Add product</button><button class="s" id="catEd">Edit categories</button></div>
<div id="newP"></div>
${list.map(p => `<div class="card prod" data-p="${p.id}"><img class="pim" src="${esc(p.image)}" onerror="this.style.visibility='hidden'" alt=""><div><div class="g">
<label>Name<input data-f="name" value="${esc(p.name)}"></label><label>Category<input data-f="category" list="cl" value="${esc(p.category)}"></label><label>Price (${cur()})<input data-f="price" type="number" step="0.01" value="${p.price}"></label><label>Badge (optional)<input data-f="badge" value="${esc(p.badge)}" placeholder="New, Sale..."></label>
<label class="span2">Description<textarea data-f="desc" rows="2">${esc(p.desc)}</textarea></label><div class="span2">${imgField('p' + p.id, p.image, 'Product photo')}</div>
<label class="chk"><input type="checkbox" data-f="available" ${p.available ? 'checked' : ''}> Shown in shop</label><label class="chk"><input type="checkbox" data-f="featured" ${p.featured ? 'checked' : ''}> Hero slide</label><div style="padding-top:14px"><button class="s d" data-del="${p.id}">Delete</button></div></div></div></div>`).join('') || '<div class="card">No products here.</div>'}
<datalist id="cl">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist>`);
  $('#pf').onchange = e => { pcat = e.target.value; products(); };
  $('#addP').onclick = newProduct; $('#catEd').onclick = catEditor;
  document.querySelectorAll('[data-p]').forEach(card => {
    const id = card.dataset.p;
    card.querySelectorAll('[data-f]').forEach(inp => inp.onchange = async () => { const k = inp.dataset.f; const v = inp.type === 'checkbox' ? inp.checked : inp.value; try { await api('PUT', '/api/admin/products/' + id, { [k]: v }); const it = D.products.find(x => x.id == id); it[k] = v; if (k === 'category' && !D.categories.includes(v)) D.categories.push(v); flash(card); } catch (e) { alert(e.message); } });
    wireImg(card, async (_, v) => { await api('PUT', '/api/admin/products/' + id, { image: v }); D.products.find(x => x.id == id).image = v; card.querySelector('.pim').src = v; card.querySelector('.pim').style.visibility = 'visible'; flash(card); });
    card.querySelector('[data-del]').onclick = async () => { if (confirm('Delete this product?')) { await api('DELETE', '/api/admin/products/' + id); await load(); } };
  });
}
function flash(card) { card.style.borderColor = 'var(--ok)'; setTimeout(() => card.style.borderColor = '', 700); }
function newProduct() {
  $('#newP').innerHTML = `<div class="card"><h3 style="margin-top:0">New product</h3><div class="g"><label>Name<input id="n_name"></label><label>Category<input id="n_cat" list="cl" value="${esc(pcat !== 'All' ? pcat : D.categories[0] || '')}"></label><label>Price<input id="n_price" type="number" step="0.01"></label><label>Badge<input id="n_badge"></label><label class="span2">Description<textarea id="n_desc" rows="2"></textarea></label><div class="span2" id="n_img">${imgField('new', '', 'Photo')}</div></div><div class="row" style="margin-top:12px"><button class="btn" id="n_save">Save product</button><button class="s" id="n_cancel">Cancel</button><span class="msg err" id="n_msg"></span></div></div>`;
  wireImg($('#newP'), () => {});
  $('#n_cancel').onclick = () => $('#newP').innerHTML = '';
  $('#n_save').onclick = async () => { try { await api('POST', '/api/admin/products', { name: $('#n_name').value, category: $('#n_cat').value, price: $('#n_price').value, badge: $('#n_badge').value, desc: $('#n_desc').value, image: $('[data-itext=new]').value }); await load(); } catch (e) { $('#n_msg').textContent = e.message; } };
}
function catEditor() {
  $('#newP').innerHTML = `<div class="card"><h3 style="margin-top:0">Categories (one per line)</h3><textarea id="cats" rows="6">${esc(D.categories.join('\n'))}</textarea><div class="row" style="margin-top:10px"><button class="btn" id="cs">Save</button><button class="s" id="cc">Cancel</button></div><p class="small">Removing a category from this list does not delete its products.</p></div>`;
  $('#cc').onclick = () => $('#newP').innerHTML = ''; $('#cs').onclick = async () => { await api('PUT', '/api/admin/categories', { categories: $('#cats').value.split('\n') }); await load(); };
}

/* ---------- generic settings form ---------- */
function field(f) {
  const v = D.settings[f[0]]; const [k, label, type, hint] = f;
  if (type === 'check') return `<label class="chk"><input type="checkbox" data-s="${k}" ${v ? 'checked' : ''}> ${label}</label>`;
  if (type === 'image') return `<div class="span2">${imgField('s_' + k, v, label)}</div>`;
  if (type === 'textarea') return `<label class="span2">${label}<textarea data-s="${k}" rows="3">${esc(v)}</textarea>${hint ? `<span class="small">${hint}</span>` : ''}</label>`;
  if (type && type.startsWith('select:')) return `<label>${label}<select data-s="${k}">${type.slice(7).split('|').map(o => { const [val, n] = o.split('='); return `<option value="${val}" ${val === v ? 'selected' : ''}>${n}</option>`; }).join('')}</select></label>`;
  return `<label>${label}<input data-s="${k}" type="${type || 'text'}" ${type === 'number' ? 'step="any"' : ''} value="${esc(v)}">${hint ? `<span class="small">${hint}</span>` : ''}</label>`;
}
function saveBtn(label) { return `<div class="row" style="margin-top:14px"><button class="btn" id="saveS">${label || 'Save changes'}</button><span class="msg" id="sm"></span></div>`; }
function wireSave() {
  $('#saveS').onclick = async () => {
    const b = {}; document.querySelectorAll('[data-s]').forEach(i => b[i.dataset.s] = i.type === 'checkbox' ? i.checked : i.value);
    document.querySelectorAll('[data-itext]').forEach(i => { if (i.dataset.itext.startsWith('s_')) b[i.dataset.itext.slice(2)] = i.value; });
    try { D.settings = await api('PUT', '/api/admin/settings', b); $('#sm').className = 'msg'; $('#sm').textContent = 'Saved. Refresh the storefront to see it.'; } catch (e) { $('#sm').className = 'msg err'; $('#sm').textContent = e.message; }
  };
  wireImg($('#main'), () => {});
}
const grp = (t, fs) => `<h3>${t}</h3><div class="card"><div class="g">${fs.map(field).join('')}</div></div>`;

/* ---------- content ---------- */
function content() {
  set(`<h2>Site content & branding</h2><p class="sub">Everything on the storefront. Product names and photos live under Products.</p>` +
    grp('Branding', [['brand', 'Shop name'], ['kicker', 'Tagline'], ['marquee', 'Scrolling banner words', 'text', 'Separate with commas'], ['heroHint', 'Hero scroll hint'], ['badgeText', 'Rotating badge text'], ['heroShape', 'Hero photo shape', 'select:circle=Circle|arch=Arch (tall)']]) +
    grp('Colors', [['accent', 'Accent color', 'color'], ['accent2', 'Light accent (gradient end)', 'color'], ['bg', 'Background', 'color'], ['bg2', 'Background glow', 'color']]) +
    grp('Story section', [['aboutTitleA', 'Title (plain part)'], ['aboutTitleB', 'Title (gradient part)'], ['about', 'Story text', 'textarea'], ['storyImage', 'Story photo', 'image'], ['stat1Value', 'Stat 1 number', 'number'], ['stat1Label', 'Stat 1 label'], ['stat2Value', 'Stat 2 number', 'number'], ['stat2Label', 'Stat 2 label'], ['stat3Value', 'Stat 3 number', 'number'], ['stat3Label', 'Stat 3 label'], ['stat4Value', 'Stat 4 number', 'number'], ['stat4Label', 'Stat 4 label']]) +
    grp('Shop & gallery', [['shopTitleA', 'Shop title (plain)'], ['shopTitleB', 'Shop title (gradient)'], ['addLabel', 'Add button text'], ['galleryTitleA', 'Gallery title (plain)'], ['galleryTitleB', 'Gallery title (gradient)'], ['gallery1', 'Gallery photo 1', 'image'], ['gallery2', 'Gallery photo 2', 'image'], ['gallery3', 'Gallery photo 3', 'image']]) +
    grp('Contact & hours', [['address', 'Address'], ['hours', 'Opening hours'], ['phone', 'Phone'], ['contactEmail', 'Public email'], ['showReserve', 'Show table reservation form', 'check']]) + saveBtn());
  wireSave();
}

/* ---------- shop type ---------- */
function shoptype() {
  set(`<h2>Shop type</h2><p class="sub">Current: <b>${esc((D.presets.find(p => p.id === D.settings.shopType) || {}).name || D.settings.shopType)}</b>. Applying a preset re-skins the storefront (texts, photos, colors, hero) and can replace the product list. Orders, payment and notification settings are kept.</p>
<div class="preset">${D.presets.map(p => `<div class="card"><h4>${esc(p.name)}</h4><p class="small">Sample catalog, categories, photos and copy for a ${esc(p.name.toLowerCase())}.</p><div class="row" style="margin-top:10px"><button class="btn" data-pre="${p.id}">${D.settings.shopType === p.id ? 'Reset to this preset' : 'Switch to this'}</button></div></div>`).join('')}</div>
<p class="small" style="margin-top:14px"><label><input type="checkbox" id="repl" checked> Also replace products and categories with the preset's sample catalog (your current products will be removed)</label></p><div class="msg" id="pm"></div>`);
  document.querySelectorAll('[data-pre]').forEach(b => b.onclick = async () => {
    const rep = $('#repl').checked; if (!confirm(`Apply this preset?${rep ? ' Your current products will be replaced.' : ' Texts, colors and photos will be replaced.'}`)) return;
    await api('POST', '/api/admin/preset', { id: b.dataset.pre, resetProducts: rep }); await load(); $('#pm').textContent = 'Preset applied.';
  });
}

/* ---------- payments & notifications ---------- */
function payments() {
  const s = D.settings;
  set(`<h2>Payments & alerts</h2><p class="sub">Order alerts go to WhatsApp and email. Customers pay by cash on delivery and/or card.</p>` +
    grp('Money', [['currency', 'Currency label (shown to customers)'], ['deliveryFee', 'Delivery fee', 'number'], ['freeDeliveryOver', 'Free delivery over (0 = never)', 'number'], ['codEnabled', 'Accept cash on delivery', 'check']]) +
    grp('WhatsApp alerts', [['whatsappOwner', 'Your WhatsApp number (with country code)', 'text', 'Digits only, e.g. 966501234567'], ['notifyWhatsapp', 'After checkout, offer a "send order on WhatsApp" button', 'check']]) +
    `<p class="small">How it works: after placing an order the customer taps one button that opens WhatsApp with the full order text addressed to your number. For fully automatic WhatsApp messages you would need the WhatsApp Business Cloud API (not included).</p>` +
    grp('Email alerts (SMTP)', [['notifyEmail', 'Email me on every new order', 'check'], ['ownerEmail', 'Send alerts to'], ['smtpHost', 'SMTP host', 'text', 'e.g. smtp.gmail.com'], ['smtpPort', 'SMTP port', 'number'], ['smtpSecurity', 'Security', 'select:starttls=STARTTLS (port 587)|ssl=SSL/TLS (port 465)|none=None (port 25)'], ['smtpUser', 'SMTP username'], ['smtpPass', 'SMTP password', 'password', 'Gmail needs an App Password'], ['smtpFrom', 'From address', 'text', 'e.g. Shop <you@gmail.com>']]) +
    `<div class="row"><button class="s" id="testMail">Save and send test email</button><span class="msg" id="tm"></span></div>` +
    grp('Card payments (Stripe)', [['stripeEnabled', 'Accept card payments', 'check'], ['stripeSecret', 'Stripe secret key', 'password', 'Starts with sk_live_ or sk_test_'], ['stripeCurrency', 'Stripe currency code', 'text', 'Lowercase ISO code, e.g. sar, usd, aed'], ['publicUrl', 'Public website address', 'text', 'Required when live, e.g. https://myshop.com']]) + saveBtn('Save settings'));
  wireSave();
  $('#testMail').onclick = async () => { $('#saveS').click(); await new Promise(r => setTimeout(r, 500)); $('#tm').className = 'msg'; $('#tm').textContent = 'Sending...'; try { await api('POST', '/api/admin/test-email'); $('#tm').textContent = 'Test email sent. Check the inbox.'; } catch (e) { $('#tm').className = 'msg err'; $('#tm').textContent = e.message; } };
}

/* ---------- bookings & messages ---------- */
function bookings() {
  set(`<h2>Reservations</h2><table><tr><th>Name</th><th>Phone</th><th>Guests</th><th>When</th><th>Status</th><th></th></tr>${D.reservations.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.phone)}</td><td>${r.guests}</td><td>${esc(r.date)} ${esc(r.time)}</td><td>${r.status}</td><td><button class="s" data-rs="${r.id}:confirmed">Confirm</button> <button class="s" data-rs="${r.id}:cancelled">Cancel</button> <button class="s d" data-rd="reservations:${r.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan=6>None yet</td></tr>'}</table>
<h2>Messages</h2><table><tr><th>From</th><th>Message</th><th></th></tr>${D.messages.map(m => `<tr style="${m.read ? 'opacity:.5' : ''}"><td>${esc(m.name)}<br><span class="small">${esc(m.email)}</span></td><td>${esc(m.message)}</td><td><button class="s" data-mr="${m.id}:${!m.read}">${m.read ? 'Unread' : 'Mark read'}</button> <button class="s d" data-rd="messages:${m.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan=3>None yet</td></tr>'}</table>`);
  document.querySelectorAll('[data-rs]').forEach(b => b.onclick = async () => { const [id, st] = b.dataset.rs.split(':'); await api('PUT', '/api/admin/reservations/' + id, { status: st }); load(); });
  document.querySelectorAll('[data-mr]').forEach(b => b.onclick = async () => { const [id, rd] = b.dataset.mr.split(':'); await api('PUT', '/api/admin/messages/' + id, { read: rd === 'true' }); load(); });
  document.querySelectorAll('[data-rd]').forEach(b => b.onclick = async () => { const [k, id] = b.dataset.rd.split(':'); if (confirm('Delete?')) { await api('DELETE', `/api/admin/${k}/${id}`); load(); } });
}

/* ---------- account ---------- */
function account() {
  set(`<h2>Account</h2><p class="sub">Change the admin login. Do this before you go live.</p><div class="card" style="max-width:420px"><div class="f" style="display:grid;gap:10px"><label>Username<input id="a_user" value="${esc(D.adminUser)}"></label><label>Current password<input id="a_cur" type="password"></label><label>New password (8+ characters)<input id="a_new" type="password"></label><div class="row"><button class="btn" id="a_save">Change login</button><span class="msg" id="a_msg"></span></div></div></div>`);
  $('#a_save').onclick = async () => { try { await api('POST', '/api/admin/password', { user: $('#a_user').value, current: $('#a_cur').value, password: $('#a_new').value }); $('#a_msg').className = 'msg'; $('#a_msg').textContent = 'Updated.'; $('#a_cur').value = $('#a_new').value = ''; } catch (e) { $('#a_msg').className = 'msg err'; $('#a_msg').textContent = e.message; } };
}
api('GET', '/api/admin/all').then(d => { D = d; $('#login').style.display = 'none'; $('#app').style.display = 'grid'; draw(); }).catch(() => {});
