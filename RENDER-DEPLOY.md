# Deploying SalmanCart on Render (free tier)

1. Push this folder to a GitHub repo (exclude `node_modules` and `data/store.json` via the included .gitignore).
2. Render -> New -> Web Service -> connect the repo.
3. Settings:
   - Build command: `npm install`
   - Start command: `npm start`
   - The app already binds `HOST=0.0.0.0` and uses Render's `PORT`.
4. Add environment variables:
   - `SESSION_SECRET` = any long random string
   - (optional) the three Google login variables from GOOGLE-LOGIN-SETUP.md
5. Deploy. Render gives you a public URL.

## Data persistence warning (important)

Render's free tier uses an **ephemeral filesystem**. Every redeploy, restart or spin-down resets `data/store.json` to the seeded sample catalog. That means:

- products/orders/users entered after deploy disappear on the next redeploy
- it is fine for demos and evaluation
- before entering real data, either keep a copy (Admin -> note orders externally), attach a persistent disk (paid), or later swap `src/db.js` for a hosted database

Always export or record anything important before pressing "Deploy" again.
