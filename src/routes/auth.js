'use strict';
const express = require('express');
const passport = require('passport');
const db = require('../db');
const { hashPassword, verifyPassword, googleConfigured, loginLocal, logout } = require('../auth');

const router = express.Router();

function flash(req, type, text) { req.session.flash = { type, text }; }

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login', error: null });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.byEmail(email || '');
  if (!user || !verifyPassword(password || '', user.passwordHash)) {
    return res.status(401).render('auth/login', { title: 'Login', error: 'Invalid email or password.' });
  }
  loginLocal(req, res, user);
  flash(req, 'ok', `Welcome back, ${user.name.split(' ')[0]}!`);
  res.redirect(req.session.returnTo || '/');
});

router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'Create account', error: null });
});

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).render('auth/register', { title: 'Create account', error: 'All fields are required.' });
  }
  if (String(password).length < 6) {
    return res.status(400).render('auth/register', { title: 'Create account', error: 'Password must be at least 6 characters.' });
  }
  if (db.users.byEmail(email)) {
    return res.status(409).render('auth/register', { title: 'Create account', error: 'An account with this email already exists.' });
  }
  const user = db.users.create({
    name: String(name).trim(),
    email: String(email).trim(),
    passwordHash: hashPassword(password),
    provider: 'local',
    role: 'customer'
  });
  loginLocal(req, res, user);
  flash(req, 'ok', 'Account created. Happy shopping!');
  res.redirect(req.session.returnTo || '/');
});

router.get('/auth/google', (req, res, next) => {
  if (!googleConfigured()) {
    flash(req, 'warn', 'Google login is not configured yet. Use email login, or see GOOGLE-LOGIN-SETUP.md to enable it.');
    return res.redirect('/login');
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/auth/google/callback', (req, res, next) => {
  if (!googleConfigured()) return res.redirect('/login');
  passport.authenticate('google', { failureRedirect: '/login' }, (err, user) => {
    if (err || !user) {
      flash(req, 'warn', 'Google sign-in failed. Please try again.');
      return res.redirect('/login');
    }
    loginLocal(req, res, user);
    req.logIn(user, () => {
      flash(req, 'ok', `Welcome, ${user.name.split(' ')[0]}!`);
      res.redirect(req.session.returnTo || '/');
    });
  })(req, res, next);
});

router.get('/logout', (req, res, next) => logout(req, res, next));

module.exports = router;
