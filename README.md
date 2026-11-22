# Store template (coffee shop, mobile phone shop, watch shop)

One Node.js project, no dependencies to install. The shop type is a preset you pick in the admin panel. Each preset has its own sample products, categories, photos, colors and texts.

## Run it
Needs Node 16 or newer.

    node server.js

Open http://localhost:3000 for the store and http://localhost:3000/admin for the admin panel.

Options (environment variables): PORT, SHOP_TYPE (coffee, phones or watches, used when the database is first created), DB_FILE (database path), ADMIN_USER and ADMIN_PASS (used when the database is first created).
Data is stored in data/db.json. Delete it to start fresh. Back it up before upgrading.

## Admin login
Default login: **admin / admin123**. Change it right away in Admin > Account. The password must be at least 8 characters.

## What you can do in admin
- Orders: view, change status, confirm, cancel, mark paid, WhatsApp the customer, delete.
- Products: add, edit, hide, delete, set prices, upload photos, mark "Hero slide" products (they animate in the pinned hero).
- Site content: brand name, texts, address, hours, colors.
- Shop type: switch the preset. Tick the box to replace the sample products too. Orders and payment settings are kept.
- Payments & alerts, Bookings & messages, Account.

## WhatsApp
Admin > Payments & alerts > WhatsApp. Enter your number with country code, digits only (for example 966501234567). After checkout the customer sees a button that opens WhatsApp with the full order text addressed to you. They tap send. Fully automatic WhatsApp messages need the WhatsApp Business Cloud API, which is not included.

## Email alerts (SMTP)
Admin > Payments & alerts > Email. Enter host, port, security (STARTTLS 587, SSL 465, or none), username, password, from address and the address to notify. Press "Save and send test email". Until configured, email is skipped. Gmail needs an App Password (not your normal password). Each order shows in admin whether the email went out.

## Card payments (Stripe)
Cash on delivery works out of the box. For cards: create a Stripe account, copy the secret key (sk_test_... to try, sk_live_... for real), paste it in Admin > Payments & alerts > Card payments, set the currency code (for example sar, usd), set the public website address (the https URL where the store is hosted, so Stripe can send customers back), and enable it. To test use card 4242 4242 4242 4242 with any future date and any CVC. Card option stays hidden until a key is saved. Amounts are sent as value x 100, so check zero-decimal currencies (such as JPY) before using them.

## Deploying
Any Node host works (Render, a VPS). Set PORT if the host requires it, serve over HTTPS, keep the data/ folder on persistent disk, and change the admin password.

## Photos
Bundled photos are from Pexels (free to use under the Pexels license, no attribution required): https://www.pexels.com/license/ . Phone and watch photos show real brand devices, so replace them with your own through the admin image upload. Product names and texts are placeholders.
