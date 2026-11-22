'use strict';
const { test, before } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-admin-'));
const request = require('supertest');
const app = require('../server');
const db = require('../src/db');

async function adminAgent() {
  const agent = request.agent(app);
  const res = await agent.post('/login').send('email=admin@salmancart.com&password=admin123');
  assert.equal(res.status, 302);
  return agent;
}

test('admin panel blocked for guests and customers', async () => {
  assert.equal((await request(app).get('/admin')).status, 302);
  const agent = request.agent(app);
  await agent.post('/register').send('name=Cust&email=cust@test.com&password=secret1');
  const res = await agent.get('/admin');
  assert.equal(res.status, 403);
});

test('admin dashboard renders stats', async () => {
  const agent = await adminAgent();
  const res = await agent.get('/admin');
  assert.equal(res.status, 200);
  assert.match(res.text, /Products/);
  assert.match(res.text, /Revenue/);
});

test('admin can create, edit and delete a product', async () => {
  const agent = await adminAgent();
  let res = await agent.post('/admin/products')
    .field('name', 'Test Widget Pro')
    .field('brand', 'TestBrand')
    .field('category', 'electronics')
    .field('price', '1234')
    .field('mrp', '1999')
    .field('stock', '15')
    .field('description', 'A test widget')
    .field('highlights', 'Fast\nShiny');
  assert.equal(res.status, 302);

  const created = db.products.all().find(p => p.name === 'Test Widget Pro');
  assert.ok(created, 'product created');
  assert.equal(created.price, 1234);
  assert.deepEqual(created.highlights, ['Fast', 'Shiny']);

  res = await agent.get('/admin/products/' + created.id + '/edit');
  assert.equal(res.status, 200);

  res = await agent.post('/admin/products/' + created.id)
    .field('name', 'Test Widget Pro')
    .field('category', 'electronics')
    .field('price', '1099')
    .field('stock', '7');
  assert.equal(res.status, 302);
  assert.equal(db.products.byId(created.id).price, 1099);

  res = await agent.post('/admin/products/' + created.id + '/delete');
  assert.equal(res.status, 302);
  assert.equal(db.products.byId(created.id), null);
});

test('admin can add and delete a category; category with products is protected', async () => {
  const agent = await adminAgent();
  let res = await agent.post('/admin/categories').send('name=Gadget Zone&tagline=Neat stuff');
  assert.equal(res.status, 302);
  const cat = db.categories.all().find(c => c.name === 'Gadget Zone');
  assert.ok(cat);

  const mobiles = db.categories.bySlug('mobiles');
  res = await agent.post('/admin/categories/' + mobiles.id + '/delete');
  assert.equal(res.status, 409, 'cannot delete category that still has products');

  res = await agent.post('/admin/categories/' + cat.id + '/delete');
  assert.equal(res.status, 302);
  assert.equal(db.categories.byId(cat.id), null);
});

test('inventory update changes stock', async () => {
  const agent = await adminAgent();
  const p = db.products.bySlug('aurora-x5-pro');
  const res = await agent.post('/admin/inventory/' + p.id).send('stock=99');
  assert.equal(res.status, 302);
  assert.equal(db.products.byId(p.id).stock, 99);
});

test('order status lifecycle works', async () => {
  // customer places an order
  const buyer = request.agent(app);
  await buyer.post('/register').send('name=Ord&email=ord@test.com&password=secret1');
  const p = db.products.bySlug('glowmood-lamp');
  await buyer.post('/cart/add').set('Accept', 'application/json').send(`productId=${p.id}&qty=1`);
  const placed = await buyer.post('/checkout').send('name=Ord&phone=9000000000&address=1 Street&city=Riyadh&pincode=122001');
  assert.equal(placed.status, 302);
  const order = db.orders.all()[0];
  assert.ok(order);

  const agent = await adminAgent();
  let res = await agent.get('/admin/orders');
  assert.match(res.text, new RegExp(order.number));
  res = await agent.post('/admin/orders/' + order.id + '/status').send('status=Shipped');
  assert.equal(res.status, 302);
  assert.equal(db.orders.byId(order.id).status, 'Shipped');

  // customer sees updated status
  res = await buyer.get('/orders');
  assert.match(res.text, /Shipped/);
});

test('admin can promote a user to admin but cannot demote self', async () => {
  const agent = await adminAgent();
  const cust = db.users.byEmail('cust@test.com');
  let res = await agent.post('/admin/users/' + cust.id + '/role');
  assert.equal(res.status, 302);
  assert.equal(db.users.byId(cust.id).role, 'admin');

  const me = db.users.byEmail('admin@salmancart.com');
  res = await agent.post('/admin/users/' + me.id + '/role');
  assert.equal(res.status, 302);
  assert.equal(db.users.byId(me.id).role, 'admin', 'self-demotion prevented');
});

test('google login route reports not-configured without env keys', async () => {
  const res = await request(app).get('/auth/google');
  assert.equal(res.status, 302);
  assert.match(res.headers.location, /\/login/);
});
