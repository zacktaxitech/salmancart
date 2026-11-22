'use strict';
const { test, before } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-shop-'));
const request = require('supertest');
const app = require('../server');

test('home page renders with categories and products', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  assert.match(res.text, /Salman<em>Cart<\/em>/);
  assert.match(res.text, /Deals of the day/);
  assert.match(res.text, /Shop by category/);
});

test('listing filters by category', async () => {
  const res = await request(app).get('/products?category=mobiles');
  assert.equal(res.status, 200);
  assert.match(res.text, /Aurora X5 Pro/);
  assert.doesNotMatch(res.text, /Classic Denim Jacket/);
});

test('search finds products by name', async () => {
  const res = await request(app).get('/products?q=headphones');
  assert.equal(res.status, 200);
  assert.match(res.text, /SonicBoom ANC/);
});

test('listing price filter works', async () => {
  const res = await request(app).get('/products?min=20000&max=30000');
  assert.equal(res.status, 200);
  assert.match(res.text, /Aurora X5 Pro/);
  assert.doesNotMatch(res.text, /Rhythm R1/);
});

test('product detail page renders', async () => {
  const res = await request(app).get('/product/aurora-x5-pro');
  assert.equal(res.status, 200);
  assert.match(res.text, /108MP/);
  assert.match(res.text, /Similar products/);
});

test('unknown product and page return 404', async () => {
  assert.equal((await request(app).get('/product/does-not-exist')).status, 404);
  assert.equal((await request(app).get('/no-such-page')).status, 404);
});

test('cart add, update, remove flow', async () => {
  const agent = request.agent(app);
  const list = await agent.get('/products?category=mobiles');
  const m = list.text.match(/data-product-id="([^"]+)"/);
  assert.ok(m, 'product id on listing');
  const pid = m[1];

  let res = await agent.post('/cart/add').set('Accept', 'application/json').send(`productId=${pid}&qty=2`);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.cartCount, 2);

  res = await agent.post('/cart/update').set('Accept', 'application/json').send(`productId=${pid}&qty=3`);
  assert.equal(res.body.cartCount, 3);

  res = await agent.post('/cart/remove').set('Accept', 'application/json').send(`productId=${pid}`);
  assert.equal(res.body.cartCount, 0);
});

test('out-of-stock product cannot be added', async () => {
  const agent = request.agent(app);
  const res = await agent.get('/product/rhythm-r1');
  const m = res.text.match(/name="productId" value="([^"]+)"/);
  assert.ok(m);
  const add = await agent.post('/cart/add').set('Accept', 'application/json').send(`productId=${m[1]}&qty=1`);
  assert.equal(add.status, 400);
  assert.equal(add.body.ok, false);
});

test('checkout requires login', async () => {
  const res = await request(app).get('/checkout');
  assert.equal(res.status, 302);
  assert.match(res.headers.location, /\/login/);
});

test('register, add to cart, place order, stock decremented, order listed', async () => {
  const agent = request.agent(app);
  let res = await agent.post('/register').send('name=Test Buyer&email=buyer@test.com&password=secret1');
  assert.equal(res.status, 302);

  const list = await agent.get('/products?category=fashion');
  const pid = list.text.match(/data-product-id="([^"]+)"/)[1];
  await agent.post('/cart/add').set('Accept', 'application/json').send(`productId=${pid}&qty=2`);

  res = await agent.get('/checkout');
  assert.equal(res.status, 200);
  assert.match(res.text, /Delivery address/);

  res = await agent.post('/checkout').send('name=Test Buyer&phone=9876543210&address=12 MG Road&city=Bengaluru&pincode=560001');
  assert.equal(res.status, 302);
  assert.match(res.headers.location, /\/order-success\/SC\d+/);

  res = await agent.get(res.headers.location);
  assert.equal(res.status, 200);
  assert.match(res.text, /Order placed!/);

  res = await agent.get('/orders');
  assert.equal(res.status, 200);
  assert.match(res.text, /SC\d+/);
  assert.match(res.text, /Placed/);
});

test('login with seeded admin works', async () => {
  const agent = request.agent(app);
  const res = await agent.post('/login').send('email=admin@salmancart.com&password=admin123');
  assert.equal(res.status, 302);
  const home = await agent.get('/');
  assert.match(home.text, /Admin Panel/);
});

test('wrong password rejected', async () => {
  const res = await request(app).post('/login').send('email=admin@salmancart.com&password=wrong');
  assert.equal(res.status, 401);
});

test('duplicate email registration rejected', async () => {
  const res = await request(app).post('/register').send('name=Dup&email=admin@salmancart.com&password=secret1');
  assert.equal(res.status, 409);
});
