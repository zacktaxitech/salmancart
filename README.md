# SalmanCart

A complete Flipkart-style e-commerce storefront with a full admin panel. Built with Node.js + Express, server-rendered EJS pages, and a JSON file database (no external services needed).

## What's included

**Storefront**
- Homepage with hero, category tiles, "Deals of the day" carousel, featured picks and new arrivals
- Product listing with category filter, price range, stock filter, text search and 5 sort orders
- Product detail pages with highlights, ratings, stock state and quantity stepper
- Session cart (guests can shop), free delivery over Rs. 499
- Checkout with delivery address + Cash on Delivery, order confirmation page
- "My Orders" with live status updates set from the admin panel

**Accounts**
- Email/password registration and login (scrypt-hashed passwords)
- Google login, config-ready: set 3 environment variables and it goes live (see GOOGLE-LOGIN-SETUP.md)
- Seeded admin account: **admin@salmancart.com / admin123** (change it after first login)

**Admin panel** at /admin
- Dashboard: product/category/order/customer counts, revenue, recent orders, low-stock alerts
- Products: create, edit, delete, image upload, featured/deal flags
- Categories: add, rename, recolor, delete (protected while products exist)
- Orders: filter by status, detail view, status lifecycle with history
- Inventory: stock levels sorted lowest-first with inline editing
- Users: promote/demote admin roles, remove users (self protected)

## Run it

```bash
npm install
node scripts/generate-images.js   # only needed if images/ are missing (they are included in the zip)
npm start                          # http://localhost:3000
```

Data is stored in `data/store.json`. A fresh install starts with the original sample catalog (24 products, 6 categories, all invented). Replace products from the admin panel, or reset everything:

```bash
node scripts/seed.js --force
```

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `PORT` / `HOST` | Listen address | `3000` / `0.0.0.0` |
| `SESSION_SECRET` | Session signing secret | dev default - set in production |
| `DATA_DIR` | Where store.json lives | `./data` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Google login | unset = email login only |

## Tests

```bash
npm test
```

21 tests cover the storefront, cart, checkout, auth and every admin CRUD flow.

## Important notes

- **All catalog content is original placeholder material** (invented brands, generated SVG artwork). No content was copied from Flipkart or any other retailer. Replace it with your own products before going live.
- The JSON file database is perfect for demo and small deployments. On Render's free tier the filesystem resets on redeploy, which wipes entered data - see RENDER-DEPLOY.md before deploying real records.
- Change the admin password and set `SESSION_SECRET` before real use.
