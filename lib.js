// Zero-dependency helpers: SMTP mailer and Stripe Checkout client.
const net = require('net'), tls = require('tls'), https = require('https'), http = require('http');

function sendMail(cfg, { to, subject, text }) {
  return new Promise((resolve, reject) => {
    if (!cfg.host || !to) return reject(new Error('SMTP host or recipient missing'));
    const port = +cfg.port || 587, sec = cfg.security || 'starttls';
    let sock, buf = '', waiter = null, done = false;
    const fail = e => { if (!done) { done = true; try { sock && sock.destroy(); } catch {} reject(e instanceof Error ? e : new Error(String(e))); } };
    const timer = setTimeout(() => fail(new Error('SMTP timeout')), 20000);
    const onData = d => { buf += d.toString('utf8'); check(); };
    function check() {
      if (!waiter) return;
      const lines = buf.split('\r\n'); if (lines[lines.length - 1] === '') lines.pop(); else return;
      const last = lines[lines.length - 1];
      if (/^\d{3} /.test(last) || /^\d{3}$/.test(last)) { const w = waiter; waiter = null; const text = buf; buf = ''; w({ code: +last.slice(0, 3), text }); }
    }
    const read = () => new Promise(r => { waiter = r; check(); });
    const cmd = async (line, ok) => { sock.write(line + '\r\n'); const r = await read(); if (!ok.includes(r.code)) throw new Error('SMTP ' + line.split(' ')[0] + ' failed: ' + r.text.trim()); return r; };
    const b64 = s => Buffer.from(s, 'utf8').toString('base64');
    (async () => {
      const connect = () => new Promise((res, rej) => {
        const o = { host: cfg.host, port };
        sock = sec === 'ssl' ? tls.connect({ ...o, servername: cfg.host }, () => res()) : net.connect(o, () => res());
        sock.on('error', rej); sock.on('data', onData);
      });
      await connect();
      let r = await read(); if (r.code !== 220) throw new Error('SMTP greeting: ' + r.text.trim());
      await cmd('EHLO localhost', [250]);
      if (sec === 'starttls') {
        await cmd('STARTTLS', [220]);
        sock.removeListener('data', onData);
        sock = tls.connect({ socket: sock, servername: cfg.host }); sock.on('error', fail); sock.on('data', onData);
        await new Promise((res, rej) => { sock.once('secureConnect', res); sock.once('error', rej); });
        await cmd('EHLO localhost', [250]);
      }
      if (cfg.user) {
        await cmd('AUTH LOGIN', [334]); await cmd(b64(cfg.user), [334]); await cmd(b64(cfg.pass || ''), [235]);
      }
      const from = cfg.from || cfg.user;
      const addr = (from.match(/<([^>]+)>/) || [null, from])[1];
      await cmd(`MAIL FROM:<${addr}>`, [250]); await cmd(`RCPT TO:<${to}>`, [250, 251]); await cmd('DATA', [354]);
      const hdr = [`From: ${from}`, `To: ${to}`, `Subject: =?UTF-8?B?${b64(subject)}?=`, `Date: ${new Date().toUTCString()}`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', ''].join('\r\n');
      const body = b64(text).replace(/(.{76})/g, '$1\r\n');
      sock.write(hdr + '\r\n' + body + '\r\n.\r\n'); r = await read();
      if (r.code !== 250) throw new Error('SMTP DATA rejected: ' + r.text.trim());
      try { sock.write('QUIT\r\n'); sock.end(); } catch {}
      clearTimeout(timer); done = true; resolve(true);
    })().catch(e => { clearTimeout(timer); fail(e); });
  });
}

function stripeReq(secret, method, path, form) {
  return new Promise((resolve, reject) => {
    const data = form ? new URLSearchParams(form).toString() : null;
    const mock = process.env.STRIPE_MOCK ? process.env.STRIPE_MOCK.split(':') : null; // test hook only
    const req = (mock ? http : https).request({ hostname: mock ? mock[0] : 'api.stripe.com', ...(mock ? { port: +mock[1] } : {}), path, method, headers: { Authorization: 'Bearer ' + secret, ...(data ? { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) } : {}) } }, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => { try { const j = JSON.parse(b); res.statusCode >= 400 ? reject(new Error(j.error && j.error.message || 'Stripe error')) : resolve(j); } catch { reject(new Error('Bad Stripe response')); } });
    });
    req.on('error', reject); req.setTimeout(20000, () => req.destroy(new Error('Stripe timeout')));
    if (data) req.write(data); req.end();
  });
}
const stripe = {
  createSession: (secret, o) => {
    const f = { mode: 'payment', success_url: o.successUrl, cancel_url: o.cancelUrl, client_reference_id: String(o.reference), 'metadata[order]': String(o.reference) };
    if (o.email) f.customer_email = o.email;
    o.lines.forEach((l, i) => {
      f[`line_items[${i}][quantity]`] = l.qty; f[`line_items[${i}][price_data][currency]`] = o.currency;
      f[`line_items[${i}][price_data][unit_amount]`] = Math.round(l.price * 100); f[`line_items[${i}][price_data][product_data][name]`] = l.name;
    });
    return stripeReq(secret, 'POST', '/v1/checkout/sessions', f);
  },
  getSession: (secret, id) => stripeReq(secret, 'GET', '/v1/checkout/sessions/' + encodeURIComponent(id))
};
module.exports = { sendMail, stripe };
