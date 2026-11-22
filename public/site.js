(function () {
  window.__rv = true; document.documentElement.classList.add('js');
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let D, S, cat = 'All', slides = [], active = 0, cart = [];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => (S.currency || '') + ' ' + (Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const hex2rgb = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255].join(','); };
  const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200); };

  /* ---------- preloader ---------- */
  let pl = 0; const plTimer = setInterval(() => { pl = Math.min(100, pl + 4 + Math.random() * 6); $('#plNum').textContent = Math.floor(pl); $('#plLine').style.width = pl + '%'; if (pl >= 100) clearInterval(plTimer); }, 60);
  function finishPreloader() {
    const go = () => { clearInterval(plTimer); $('#plNum').textContent = 100; $('#plLine').style.width = '100%'; setTimeout(() => { $('#preloader').classList.add('done'); document.body.classList.remove('is-loading'); setTimeout(() => { const st = $('#stage'); if (st) st.classList.add('ready'); observeAll(); }, 250); }, 350); };
    if (pl >= 100) go(); else setTimeout(finishPreloader, 120);
  }

  /* ---------- theme + static bindings ---------- */
  function applyTheme() {
    const r = document.documentElement.style;
    r.setProperty('--bg', S.bg); r.setProperty('--bg2', S.bg2); r.setProperty('--accent', S.accent); r.setProperty('--accent2', S.accent2);
    r.setProperty('--accent-rgb', hex2rgb(S.accent)); r.setProperty('--bg-rgb', hex2rgb(S.bg));
    document.title = S.brand; const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = S.bg;
    $$('[data-bind]').forEach(el => { el.textContent = S[el.dataset.bind] ?? ''; });
    $('#about').textContent = S.about; $('#storyImg').src = S.storyImg || S.storyImage; $('#g1').src = S.gallery1; $('#g2').src = S.gallery2; $('#g3').src = S.gallery3;
    $('#heroHint').textContent = S.heroHint; $('#badgeText').textContent = S.badgeText;
    $('#stage').classList.toggle('arch', S.heroShape === 'arch');
    const mq = (S.marquee || '').split(',').map(x => x.trim()).filter(Boolean); const one = mq.map(x => `<span>${esc(x)}</span><b>✦</b>`).join('');
    $('#marquee').innerHTML = one.repeat(Math.max(2, Math.ceil(12 / Math.max(1, mq.length)))) ; $('#marquee').innerHTML += $('#marquee').innerHTML;
    $('#reserve').hidden = !S.showReserve; $$('[data-reserve]').forEach(a => a.hidden = !S.showReserve);
    $$('[data-k]').forEach(b => b.dataset.val = S[b.dataset.k]);
  }

  /* ---------- hero ---------- */
  const PART_SVG = {
    bean: c => `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="12" ry="17" fill="${c}" transform="rotate(25 20 20)"/><path d="M14 8c8 8-6 16 6 24" stroke="rgba(0,0,0,.45)" stroke-width="2.4" fill="none" transform="rotate(25 20 20)"/></svg>`,
    leaf: c => `<svg viewBox="0 0 40 40"><path d="M6 34C4 14 16 4 36 4c0 20-10 32-30 30Z" fill="${c}"/><path d="M8 32C16 22 24 14 32 8" stroke="rgba(0,0,0,.35)" stroke-width="1.6" fill="none"/></svg>`,
    ring: c => `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="none" stroke="${c}" stroke-width="4"/></svg>`,
    spark: c => `<svg viewBox="0 0 40 40"><path d="M20 2l4 14 14 4-14 4-4 14-4-14L2 20l14-4Z" fill="${c}"/></svg>`,
    dot: c => `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="${c}"/></svg>`,
    bar: c => `<svg viewBox="0 0 40 40"><rect x="17" y="2" width="6" height="36" rx="3" fill="${c}"/></svg>`
  };
  const PART_SETS = { coffee: ['bean', 'leaf', 'bean', 'spark', 'dot'], phones: ['ring', 'spark', 'bar', 'dot', 'spark'], watches: ['ring', 'spark', 'dot', 'bar', 'spark'] };
  const PCOL = () => ['#6b3f22', '#8a5a34', S.accent, S.accent2, '#4e8f4a'];
  let parts = [];
  const rnd = (seed) => { let x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };
  function buildParticles() {
    const host = $('#particles'); host.innerHTML = ''; parts = [];
    const kinds = PART_SETS[S.shopType] || PART_SETS.coffee; const cols = PCOL();
    for (let i = 0; i < 16; i++) {
      const kind = kinds[i % kinds.length]; const col = S.shopType === 'coffee' ? cols[i % cols.length] : (i % 2 ? S.accent : S.accent2);
      const el = document.createElement('div'); el.className = 'pt' + (i % 5 === 0 ? ' blur' : '');
      const size = 22 + rnd(i + 3) * 50; el.style.setProperty('--s', size + 'px'); el.style.left = (4 + rnd(i + 11) * 92) + '%'; el.style.top = (8 + rnd(i + 23) * 80) + '%';
      el.style.setProperty('--fd', (5 + rnd(i) * 5) + 's'); el.style.setProperty('--fdl', (-rnd(i + 5) * 5) + 's'); el.style.setProperty('--dl', (rnd(i + 7) * .35) + 's');
      el.innerHTML = `<div class="pm" data-depth="${(.4 + rnd(i + 31) * 1.4).toFixed(2)}"><div class="pi">${PART_SVG[kind](col)}</div></div>`;
      host.appendChild(el); parts.push(el);
    }
  }
  function placeParticles(i) {
    parts.forEach((el, k) => {
      const dx = (rnd(k * 7 + i * 13 + 1) - .5) * 38, dy = (rnd(k * 5 + i * 17 + 2) - .5) * 32, r = (rnd(k + i * 3) - .5) * 240;
      el.style.transform = `translate3d(${dx}vw,${dy}vh,0) rotate(${r}deg)`;
    });
  }
  function splitName(n) { n = n.replace(/\s*\(.*?\)\s*/g, ' ').trim(); const w = n.split(/\s+/); return w.length > 1 ? [w[0], w.slice(1).join(' ')] : [n, '']; }
  function bigWord(n) { const c = n.replace(/\s*\(.*?\)\s*/g, ' ').trim(); return c.length <= 11 ? c : c.split(/\s+/)[0]; }
  function buildHero() {
    let f = D.products.filter(p => p.featured && p.image); if (f.length < 2) f = D.products.filter(p => p.image);
    slides = f.slice(0, 7); const n = slides.length || 1;
    $('#top').style.setProperty('--n', n);
    $('#dishes').querySelectorAll('.dish').forEach(e => e.remove()); $('#words').innerHTML = ''; $('#infos').innerHTML = ''; $('#tableList').innerHTML = '';
    slides.forEach((p, i) => {
      const d = document.createElement('div'); d.className = 'dish'; d.innerHTML = `<div class="frame"><img src="${esc(p.image)}" alt="${esc(p.name)}"></div>`; $('#dishes').appendChild(d);
      const w = document.createElement('div'); w.className = 'word'; w.setAttribute('aria-hidden', 'true'); w.innerHTML = [...bigWord(p.name)].map((ch, k) => `<span style="--i:${k}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join(''); $('#words').appendChild(w);
      const [a, b] = splitName(p.name); const inf = document.createElement('div'); inf.className = 'info';
      inf.innerHTML = `<div class="idx" style="--i:0"><em>${String(i + 1).padStart(2, '0')}</em><span> / <b>${String(n).padStart(2, '0')}</b></span></div><div class="cat" style="--i:1">${esc(p.category)}${p.badge ? ' · ' + esc(p.badge) : ''}</div><h1 class="dname" style="--i:2"><span>${esc(a)}</span>${b ? `<i>${esc(b)}</i>` : ''}</h1><p class="desc" style="--i:3">${esc(p.desc)}</p><div class="buy" style="--i:4"><span class="price">${fmt(p.price)}</span><button class="add-pill" data-add="${p.id}">+ ${esc(S.addLabel || 'Add')}</button><a class="on-menu" href="#shop">Shop all →</a></div>`;
      $('#infos').appendChild(inf);
      const li = document.createElement('li'); li.innerHTML = `<button type="button" data-go="${i}"><span class="t">${esc(splitName(p.name)[0] + (splitName(p.name)[1] ? ' ' + splitName(p.name)[1] : ''))}</span><span class="n">${String(i + 1).padStart(2, '0')}</span></button>`; $('#tableList').appendChild(li);
    });
    $$('[data-go]').forEach(b => b.onclick = () => { const i = +b.dataset.go; const h = $('#top'); const total = h.offsetHeight - innerHeight; const y = h.offsetTop + (n > 1 ? (i + .5) / n * total : 0); scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); });
    buildParticles(); setActive(0, true);
  }
  function setActive(i, force) {
    if (i === active && !force) return; active = i;
    $$('#dishes .dish').forEach((e, k) => { e.classList.toggle('is-active', k === i); e.classList.toggle('is-prev', k < i); });
    $$('#words .word').forEach((e, k) => { e.classList.toggle('is-active', k === i); e.classList.toggle('is-prev', k < i); });
    $$('#infos .info').forEach((e, k) => { e.classList.toggle('is-active', k === i); });
    $$('#tableList button').forEach((e, k) => e.classList.toggle('on', k === i));
    placeParticles(i);
  }
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false; const y = scrollY;
      $('#topbar').classList.toggle('solid', y > 30);
      const doc = document.documentElement.scrollHeight - innerHeight; $('#prog').style.transform = `scaleX(${doc > 0 ? Math.min(1, y / doc) : 0})`;
      const h = $('#top'), total = h.offsetHeight - innerHeight, n = slides.length || 1;
      const p = total > 0 ? Math.min(1, Math.max(0, (y - h.offsetTop) / total)) : 0;
      $('#heroBar').style.transform = `scaleX(${p})`;
      setActive(Math.min(n - 1, Math.floor(p * n * .9999)));
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
  function setVh() { document.documentElement.style.setProperty('--vh', innerHeight * .01 + 'px'); }
  addEventListener('resize', setVh); setVh();
  $('#stage').addEventListener('mousemove', e => {
    if (reduce) return; const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    parts.forEach(p => { const m = p.firstChild, d = +m.dataset.depth; m.style.transform = `translate3d(${-x * d * 46}px,${-y * d * 34}px,0)`; });
  });

  /* ---------- reveal on scroll ---------- */
  let io;
  function observeAll(root) {
    $$('[data-stagger]').forEach(c => [...c.children].forEach((ch, i) => { if (ch.hasAttribute('data-r') && !ch.style.getPropertyValue('--d')) ch.style.setProperty('--d', i * 90); }));
    io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) reveal(e.target); }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    (root || document).querySelectorAll('[data-r]:not(.in)').forEach(el => io.observe(el));
  }
  function reveal(el) {
    io.unobserve(el); el.classList.add('in'); if (el.querySelector('[data-k]') || el.hasAttribute('data-k')) counters(el);
    setTimeout(() => el.removeAttribute('data-r'), 1500 + (+el.style.getPropertyValue('--d') || 0));
  }
  function counters(root) { root.querySelectorAll('[data-k]').forEach(b => { if (b.dataset.done) return; b.dataset.done = 1; const to = +b.dataset.val || 0; const t0 = performance.now(); const dur = 1600; (function f(t) { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); b.textContent = Math.round(to * e).toLocaleString(); if (k < 1) requestAnimationFrame(f); })(t0); }); }

  /* ---------- shop ---------- */
  function renderTabs() {
    const cats = ['All', ...D.categories.filter(c => D.products.some(p => p.category === c))];
    $('#tabs').innerHTML = cats.map((c, i) => `<button class="tab ${c === cat ? 'on' : ''}" data-r="zoom" style="--d:${i * 70}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
    $$('.tab').forEach(b => b.onclick = () => { cat = b.dataset.c; renderTabs(); renderGrid(true); });
    observeAll($('#tabs'));
  }
  const anims = ['up', 'left', 'right', 'zoom', 'flip'];
  function renderGrid(instant) {
    const list = D.products.filter(p => cat === 'All' || p.category === cat);
    $('#items').innerHTML = list.length ? list.map((p, i) => `<article class="pc" data-r="${anims[i % 3 === 1 ? 3 : i % 3 === 0 ? 0 : 3]}" style="--d:${(i % 4) * 110}"><div class="ph">${p.image ? `<img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}">` : `<div class="ini grad">${esc(p.name[0] || '')}</div>`}${p.badge ? `<span class="bdg">${esc(p.badge)}</span>` : ''}</div><div class="pb"><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p><div class="pr"><span class="pp">${fmt(p.price)}</span><button class="add" data-add="${p.id}">Add</button></div></div></article>`).join('') : '<p class="empty">Nothing here yet.</p>';
    observeAll($('#items'));
    if (instant) requestAnimationFrame(() => requestAnimationFrame(() => { $$('#items [data-r]').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight) reveal(el); }); }));
  }

  /* ---------- cart ---------- */
  const saveCart = () => localStorage.setItem('cart_' + S.shopType, JSON.stringify(cart));
  function loadCart() { try { cart = JSON.parse(localStorage.getItem('cart_' + S.shopType) || '[]').filter(c => D.products.some(p => p.id == c.id)); } catch { cart = []; } }
  const prod = id => D.products.find(p => p.id == id);
  const cartCount = () => cart.reduce((a, c) => a + c.qty, 0);
  const sub = () => cart.reduce((a, c) => a + (prod(c.id)?.price || 0) * c.qty, 0);
  const delivery = () => { const s = sub(); return (S.freeDeliveryOver > 0 && s >= S.freeDeliveryOver) || !cart.length ? 0 : +S.deliveryFee || 0; };
  function updBadge(bump) { const c = $('#cartCount'); c.textContent = cartCount(); c.dataset.n = cartCount(); if (bump) { const b = $('#cartBtn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); } }
  function add(id) { const e = cart.find(c => c.id == id); e ? e.qty++ : cart.push({ id, qty: 1 }); saveCart(); updBadge(true); toast(prod(id).name + ' added'); if ($('#drawer').classList.contains('on')) view === 'cart' && cartView(); }
  document.addEventListener('click', e => { const b = e.target.closest('[data-add]'); if (b) add(b.dataset.add); });
  let view = 'cart';
  function openDrawer() { $('#drawer').classList.add('on'); $('#scrim').classList.add('on'); cartView(); }
  function closeDrawer() { $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); }
  $('#cartBtn').onclick = openDrawer; $('#drClose').onclick = closeDrawer; $('#scrim').onclick = closeDrawer;
  addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  function totals() { return `<div class="sum"><span>Subtotal</span><span>${fmt(sub())}</span></div><div class="sum"><span>Delivery</span><span>${delivery() ? fmt(delivery()) : 'Free'}</span></div><div class="sum total"><span>Total</span><b>${fmt(sub() + delivery())}</b></div>`; }
  function cartView() {
    view = 'cart'; $('#drTitle').textContent = 'Your cart';
    $('#drBody').innerHTML = cart.length ? cart.map((c, i) => { const p = prod(c.id); return `<div class="ci" style="animation-delay:${i * 70}ms">${p.image ? `<img src="${esc(p.image)}" alt="">` : ''}<div class="ci-name">${esc(p.name)}<small>${fmt(p.price)}</small></div><div class="step"><button data-q="${c.id}:-1" aria-label="Less">−</button><b>${c.qty}</b><button data-q="${c.id}:1" aria-label="More">+</button></div><div class="ci-total">${fmt(p.price * c.qty)}</div></div>`; }).join('') : '<p class="empty">Your cart is empty.</p>';
    $('#drFoot').innerHTML = cart.length ? totals() + '<button class="btn gold wide" id="toCheckout" style="margin-top:12px">Checkout</button>' : '<button class="btn ghost wide" id="keep">Keep shopping</button>';
    $$('[data-q]').forEach(b => b.onclick = () => { const [id, d] = b.dataset.q.split(':'); const e = cart.find(c => c.id == id); e.qty += +d; if (e.qty <= 0) cart = cart.filter(c => c.id != id); saveCart(); updBadge(); cartView(); });
    const tc = $('#toCheckout'); if (tc) tc.onclick = checkoutView; const k = $('#keep'); if (k) k.onclick = closeDrawer;
  }
  function checkoutView() {
    view = 'checkout'; $('#drTitle').textContent = 'Checkout';
    const card = S.stripeEnabled, cod = S.codEnabled;
    let saved = {}; try { saved = JSON.parse(localStorage.getItem('cust') || '{}'); } catch {}
    $('#drBody').innerHTML = `<form class="form" id="co" style="padding-top:8px"><label>Full name<input name="name" required autocomplete="name" value="${esc(saved.name)}"></label><label>Phone (WhatsApp)<input name="phone" type="tel" required autocomplete="tel" value="${esc(saved.phone)}"></label><label>Email (optional)<input name="email" type="email" autocomplete="email" value="${esc(saved.email)}"></label><label>Delivery address<textarea name="address" rows="3" required autocomplete="street-address">${esc(saved.address)}</textarea></label><label>Notes (optional)<input name="notes"></label>
<div style="display:grid;gap:8px">${cod ? `<label class="pay-opt"><input type="radio" name="payment" value="cod" checked> Cash on delivery</label>` : ''}${card ? `<label class="pay-opt"><input type="radio" name="payment" value="card" ${cod ? '' : 'checked'}> Pay by card (secure checkout)</label>` : ''}${!cod && !card ? '<p class="form-msg err">No payment method is enabled. Please contact the shop.</p>' : ''}</div><p class="form-msg err" id="coMsg"></p></form>`;
    $('#drFoot').innerHTML = totals() + `<div style="display:flex;gap:10px;margin-top:12px"><button class="btn ghost" id="back">Back</button><button class="btn gold" id="place" style="flex:1">Place order</button></div>`;
    $('#back').onclick = cartView; $('#place').onclick = place;
  }
  async function place() {
    const f = $('#co'); if (!f.reportValidity()) return; const fd = Object.fromEntries(new FormData(f)); const btn = $('#place'); btn.disabled = true; btn.textContent = 'Placing...'; $('#coMsg').textContent = '';
    localStorage.setItem('cust', JSON.stringify({ name: fd.name, phone: fd.phone, email: fd.email, address: fd.address }));
    try {
      const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart, payment: fd.payment, customer: { name: fd.name, phone: fd.phone, email: fd.email, address: fd.address, notes: fd.notes } }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Could not place order');
      if (j.url) { location.href = j.url; return; }
      cart = []; saveCart(); updBadge(); success(j);
    } catch (e) { $('#coMsg').textContent = e.message; btn.disabled = false; btn.textContent = 'Place order'; }
  }
  function success(j) {
    view = 'done'; $('#drTitle').textContent = 'Thank you';
    $('#drBody').innerHTML = `<div class="done"><div class="done-tick">✓</div><h3>Order #${j.number} received</h3><p>Total ${fmt(j.total)}. We will confirm with you shortly.</p>${j.whatsappUrl ? `<a class="btn gold" target="_blank" rel="noopener" href="${esc(j.whatsappUrl)}">Send order on WhatsApp</a><p style="font-size:13px">Tap to message the shop so we can start right away.</p>` : ''}</div>`;
    $('#drFoot').innerHTML = '<button class="btn ghost wide" id="fin">Close</button>'; $('#fin').onclick = closeDrawer; $('#drawer').classList.add('on'); $('#scrim').classList.add('on');
  }

  /* ---------- forms ---------- */
  function wire(id, url, msg, ok) { $(id).onsubmit = async e => { e.preventDefault(); const b = Object.fromEntries(new FormData(e.target)); const m = $(msg); m.className = 'form-msg'; try { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }); const j = await r.json(); m.textContent = r.ok ? ok : j.error; if (!r.ok) m.className = 'form-msg err'; else e.target.reset(); } catch { m.textContent = 'Network error'; m.className = 'form-msg err'; } }; }
  wire('#rf', '/api/reserve', '#rm', 'Thank you. We will confirm your table shortly.'); wire('#cf', '/api/contact', '#cm', 'Message sent. Thank you.');

  /* ---------- boot ---------- */
  async function boot() {
    try { D = await (await fetch('/api/public')).json(); } catch { document.body.classList.remove('is-loading'); $('#preloader').remove(); return; }
    S = D.settings; applyTheme(); loadCart(); updBadge(); buildHero(); renderTabs(); renderGrid(); onScroll();
    // payment return from Stripe
    const q = new URLSearchParams(location.search);
    if (q.get('paid') && q.get('sid')) {
      history.replaceState({}, '', '/');
      fetch(`/api/orders/confirm?order=${encodeURIComponent(q.get('paid'))}&sid=${encodeURIComponent(q.get('sid'))}`).then(r => r.json()).then(j => { if (j.ok) { cart = []; saveCart(); updBadge(); success(j); } else toast(j.error || 'Payment not confirmed'); });
    } else if (q.get('cancelled')) { history.replaceState({}, '', '/'); toast('Payment cancelled. Your cart is still here.'); }
    finishPreloader();
  }
  boot();
})();
