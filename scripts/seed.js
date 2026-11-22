'use strict';
/* Reseed the store from scratch: node scripts/seed.js --force */
const fs = require('fs');
const db = require('../src/db');
const { seed } = require('../src/seed-data');

if (process.argv.includes('--force') && fs.existsSync(db.STORE_FILE)) {
  fs.unlinkSync(db.STORE_FILE);
  console.log('[seed] removed existing store.json');
}
const fresh = db.ensureSeeded(seed);
console.log(fresh ? '[seed] sample catalog + admin seeded.' : '[seed] store already seeded; use --force to reset.');
