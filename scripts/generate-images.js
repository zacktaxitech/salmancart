'use strict';
/**
 * Generates all original SVG artwork for SalmanCart: logo, hero art, category
 * icons and one placeholder image per seeded product. Run: node scripts/generate-images.js
 */
const fs = require('fs');
const path = require('path');
const { PRODUCTS, CATEGORIES } = require('../src/seed-data');

const OUT = path.join(__dirname, '..', 'public', 'images');
const PROD_OUT = path.join(OUT, 'products');
fs.mkdirSync(PROD_OUT, { recursive: true });

const w = (file, svg) => fs.writeFileSync(path.join(OUT, file), svg);
const wp = (file, svg) => fs.writeFileSync(path.join(PROD_OUT, file), svg);

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + amt)));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/* ---------- logo: lightning cart ---------- */
w('logo.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb020"/><stop offset="1" stop-color="#ff8a00"/></linearGradient></defs>
<rect x="4" y="4" width="56" height="56" rx="16" fill="url(#lg)"/>
<path d="M20 18h6l4 22h16l4-14H27" fill="none" stroke="#231a00" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M35 22l-7 10h6l-4 9 11-12h-6l6-7z" fill="#231a00"/>
<circle cx="31" cy="47" r="3.4" fill="#231a00"/><circle cx="45" cy="47" r="3.4" fill="#231a00"/>
</svg>`);

/* ---------- hero art: bag + boxes ---------- */
w('hero.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 300">
<defs>
<linearGradient id="bag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb020"/><stop offset="1" stop-color="#ff8a00"/></linearGradient>
<linearGradient id="box" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe6ff"/></linearGradient>
</defs>
<ellipse cx="160" cy="272" rx="120" ry="16" fill="rgba(0,0,0,.18)"/>
<path d="M96 110h128l-10 148a14 14 0 0 1-14 13H120a14 14 0 0 1-14-13z" fill="url(#bag)"/>
<path d="M122 110v-8a38 38 0 0 1 76 0v8" fill="none" stroke="#231a00" stroke-width="9" stroke-linecap="round"/>
<path d="M150 140l-14 22h12l-8 20 24-26h-13l10-16z" fill="#231a00"/>
<g transform="rotate(-8 60 200)"><rect x="24" y="168" width="72" height="72" rx="12" fill="url(#box)"/><path d="M24 192h72" stroke="#b9c4f0" stroke-width="5"/><path d="M60 168v24" stroke="#b9c4f0" stroke-width="5"/></g>
<g transform="rotate(9 268 210)"><rect x="236" y="180" width="62" height="62" rx="11" fill="url(#box)"/><path d="M236 201h62" stroke="#b9c4f0" stroke-width="5"/></g>
<circle cx="52" cy="96" r="10" fill="#67e8f9"/><circle cx="272" cy="76" r="13" fill="#f0abfc"/><circle cx="240" cy="130" r="6" fill="#fff"/>
</svg>`);

/* ---------- category icons ---------- */
const ICONS = {
  phone: '<rect x="8" y="3" width="8" height="18" rx="2" fill="none" stroke="{c}" stroke-width="1.8"/><line x1="10.5" y1="18" x2="13.5" y2="18" stroke="{c}" stroke-width="1.8" stroke-linecap="round"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5" fill="none" stroke="{c}" stroke-width="1.8"/><line x1="2" y1="19" x2="22" y2="19" stroke="{c}" stroke-width="1.8" stroke-linecap="round"/>',
  shirt: '<path d="M8 4l4 2 4-2 4 3-2 3v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V10L4 7z" fill="none" stroke="{c}" stroke-width="1.8" stroke-linejoin="round"/>',
  washer: '<rect x="4" y="3" width="16" height="18" rx="2.5" fill="none" stroke="{c}" stroke-width="1.8"/><circle cx="12" cy="13" r="4.5" fill="none" stroke="{c}" stroke-width="1.8"/><circle cx="7.5" cy="6.5" r="1" fill="{c}"/>',
  home: '<path d="M4 11l8-7 8 7v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" fill="none" stroke="{c}" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 20v-6h4v6" fill="none" stroke="{c}" stroke-width="1.8"/>',
  dumbbell: '<path d="M7 8v8M4 10v4M17 8v8M20 10v4M7 12h10" stroke="{c}" stroke-width="2" stroke-linecap="round"/>',
  tag: '<path d="M4 4h7l9 9-7 7-9-9z" fill="none" stroke="{c}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.4" fill="{c}"/>'
};
for (const [name, body] of Object.entries(ICONS)) {
  w(`cat-${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${body.replaceAll('{c}', '#131a2e')}</svg>`);
}

/* ---------- product placeholders ---------- */
const CAT_ICON = {};
for (const c of CATEGORIES) CAT_ICON[c.slug] = c.icon;

for (const p of PRODUCTS) {
  const c = p.color || '#4f46e5';
  const dark = shade(c, -46);
  const light = shade(c, 60);
  const initials = p.brand.split(/[\s-]/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
  const icon = CAT_ICON[p.category] || 'tag';
  wp(`${p.slug}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 330">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
<linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
</defs>
<rect width="400" height="330" rx="24" fill="url(#bg)"/>
<circle cx="330" cy="52" r="60" fill="${c}" opacity=".12"/>
<circle cx="58" cy="282" r="80" fill="${c}" opacity=".10"/>
<circle cx="200" cy="150" r="86" fill="url(#fg)"/>
<circle cx="200" cy="150" r="86" fill="none" stroke="#ffffff" stroke-width="3" opacity=".5"/>
<g transform="translate(170,120) scale(2.5)">${ICONS[icon].replaceAll('{c}', '#ffffff')}</g>
<text x="200" y="272" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="30" font-weight="800" fill="${dark}">${initials}</text>
<text x="200" y="298" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="600" fill="${c}" opacity=".8">${p.brand}</text>
</svg>`);
}

console.log(`Generated logo, hero, ${Object.keys(ICONS).length} category icons and ${PRODUCTS.length} product images.`);
