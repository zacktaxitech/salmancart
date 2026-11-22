'use strict';
/**
 * Authentication: local email/password (scrypt) + Google OAuth 2.0.
 *
 * Google login is config-ready: set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and
 * GOOGLE_CALLBACK_URL in the environment and the "Continue with Google" button
 * goes live. Until then the site runs fully on local accounts and the seeded
 * admin login. See GOOGLE-LOGIN-SETUP.md.
 */
const crypto = require('crypto');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('scrypt:')) return false;
  const [, salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function googleConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function setupPassport(app) {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => {
    const user = db.users.byId(id);
    done(null, user || false);
  });

  if (googleConfigured()) {
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback';
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL
    }, (accessToken, refreshToken, profile, done) => {
      try {
        let user = db.users.byGoogleId(profile.id);
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!user && email) user = db.users.byEmail(email);
        if (user) {
          if (!user.googleId) db.users.update(user.id, { googleId: profile.id, avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined });
        } else {
          user = db.users.create({
            name: profile.displayName || (email ? email.split('@')[0] : 'Customer'),
            email,
            googleId: profile.id,
            avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
            provider: 'google',
            role: 'customer'
          });
        }
        done(null, user);
      } catch (err) { done(err); }
    }));
  }

  app.use(passport.initialize());
  app.use(passport.session());
}

/* ---------------- middleware ---------------- */
function attachUser(req, res, next) {
  res.locals.user = req.user || (req.session.userId ? db.users.byId(req.session.userId) : null);
  res.locals.googleConfigured = googleConfigured();
  next();
}

function ensureAuth(req, res, next) {
  const user = req.user || (req.session.userId ? db.users.byId(req.session.userId) : null);
  if (user) { req.currentUser = user; return next(); }
  req.session.returnTo = req.originalUrl;
  req.session.flash = { type: 'warn', text: 'Please log in to continue.' };
  return res.redirect('/login');
}

function ensureAdmin(req, res, next) {
  const user = req.user || (req.session.userId ? db.users.byId(req.session.userId) : null);
  if (user && user.role === 'admin') { req.currentUser = user; return next(); }
  if (user) return res.status(403).render('shop/error', { title: 'Access denied', message: 'This area is for store admins only.' });
  req.session.returnTo = req.originalUrl;
  req.session.flash = { type: 'warn', text: 'Please log in with an admin account.' };
  return res.redirect('/login');
}

function loginLocal(req, res, user) {
  req.session.userId = user.id;
}

function logout(req, res, next) {
  const done = () => {
    req.session.destroy(() => res.redirect('/'));
  };
  if (typeof req.logout === 'function') {
    req.logout(() => done());
  } else done();
}

module.exports = { hashPassword, verifyPassword, googleConfigured, setupPassport, attachUser, ensureAuth, ensureAdmin, loginLocal, logout };
