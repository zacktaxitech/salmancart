'use strict';
/* Captures storefront + admin screenshots using system Chrome. */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const OUT = path.join(__dirname, '..', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const shot = async (page, name) => {
    await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
    console.log('saved', name);
  };

  // Desktop storefront
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let page = await desk.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await shot(page, '01-home-desktop');
  await page.goto(BASE + '/products?category=mobiles', { waitUntil: 'networkidle' });
  await shot(page, '02-listing-desktop');
  await page.goto(BASE + '/product/aurora-x5-pro', { waitUntil: 'networkidle' });
  await shot(page, '03-product-desktop');

  // add to cart then view cart
  await page.click('.detail-actions button[type=submit]');
  await page.waitForTimeout(600);
  await page.goto(BASE + '/cart', { waitUntil: 'networkidle' });
  await shot(page, '04-cart-desktop');

  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await shot(page, '05-login-desktop');

  // Admin
  await page.fill('input[name=email]', 'admin@salmancart.com');
  await page.fill('input[name=password]', 'admin123');
  await page.click('.auth-card button[type=submit]');
  await page.waitForURL(BASE + '/', { timeout: 5000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
  await shot(page, '06-admin-dashboard');
  await page.goto(BASE + '/admin/products', { waitUntil: 'networkidle' });
  await shot(page, '07-admin-products');
  await page.goto(BASE + '/admin/inventory', { waitUntil: 'networkidle' });
  await shot(page, '08-admin-inventory');

  // Mobile storefront
  const mob = await browser.newContext({ viewport: { width: 390, height: 844 } });
  page = await mob.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await shot(page, '09-home-mobile');
  await page.goto(BASE + '/product/striderun-air-sneakers', { waitUntil: 'networkidle' });
  await shot(page, '10-product-mobile');

  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
