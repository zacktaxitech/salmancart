'use strict';
const path = require('path');
const express = require('express');
const session = require('express-session');

const db = require('./src/db');
const { seed } = require('./src/seed-data');
const auth = require('./src/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

/* first run: seed sample catalog + admin */
if (db.ensureSeeded(seed)) {
  console.log('[db] seeded sample catalog and admin account (admin@salmancart.com / admin123)');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  name: 'sc.sid',
  secret: process.env.SESSION_SECRET || 'salmancart-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' }
}));

auth.setupPassport(app);
app.use(auth.attachUser);

/* flash messages + shared header data */
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.categories = db.categories.all();
  const cart = req.session.cart || {};
  res.locals.cartCount = Object.values(cart).reduce((s, q) => s + (q || 0), 0);
  next();
});

/* helpers for views */
app.locals.money = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-IN');
app.locals.pct = (p) => p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;

app.use('/', require('./src/routes/auth'));
app.use('/', require('./src/routes/shop'));
app.use('/admin', require('./src/routes/admin'));

/* 404 */
app.use((req, res) => {
  res.status(404).render('shop/error', { title: 'Page not found', message: 'The page you are looking for does not exist.' });
});

/* error handler */
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).render('shop/error', { title: 'Something went wrong', message: 'An unexpected error occurred. Please try again.' });
});

if (require.main === module) {
  app.listen(PORT, HOST, () => console.log(`SalmanCart running at http://${HOST}:${PORT}`));
}

module.exports = app;
