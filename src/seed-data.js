'use strict';
/**
 * Original sample catalog for SalmanCart. All product names, descriptions and
 * images are invented placeholders the owner can replace with real inventory.
 */
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

const CATEGORIES = [
  { slug: 'mobiles', name: 'Mobiles', tagline: 'Latest smartphones', order: 1, accent: '#4f46e5', icon: 'phone' },
  { slug: 'electronics', name: 'Electronics', tagline: 'Laptops, audio & more', order: 2, accent: '#0ea5e9', icon: 'laptop' },
  { slug: 'fashion', name: 'Fashion', tagline: 'Clothing & footwear', order: 3, accent: '#ec4899', icon: 'shirt' },
  { slug: 'appliances', name: 'Appliances', tagline: 'Home essentials', order: 4, accent: '#f59e0b', icon: 'washer' },
  { slug: 'home-kitchen', name: 'Home & Kitchen', tagline: 'Cook, dine, decorate', order: 5, accent: '#10b981', icon: 'home' },
  { slug: 'beauty-sports', name: 'Beauty & Sports', tagline: 'Care & fitness', order: 6, accent: '#8b5cf6', icon: 'dumbbell' }
];

const PRODUCTS = [
  // Mobiles
  { slug: 'aurora-x5-pro', name: 'Aurora X5 Pro 5G (8GB RAM, 256GB)', brand: 'Aurora', category: 'mobiles', price: 24999, mrp: 32999, stock: 34, featured: true, deal: true, rating: 4.5, ratingCount: 1284, color: '#4f46e5', description: 'Flagship-grade 5G smartphone with a 120Hz AMOLED display, 108MP triple camera and all-day 5000mAh battery.', highlights: ['6.7" AMOLED, 120Hz', '108MP + 12MP + 8MP rear camera', '5000mAh, 65W fast charging', '2 years OS updates'] },
  { slug: 'aurora-m32', name: 'Aurora M32 (6GB RAM, 128GB)', brand: 'Aurora', category: 'mobiles', price: 11499, mrp: 14999, stock: 58, featured: false, deal: true, rating: 4.3, ratingCount: 3421, color: '#6366f1', description: 'Dependable everyday smartphone with a big battery, crisp display and clean software experience.', highlights: ['6.5" HD+ display', '6000mAh battery', '50MP AI camera', 'Side fingerprint sensor'] },
  { slug: 'nova-fold-lite', name: 'Nova Fold Lite (12GB RAM, 256GB)', brand: 'Nova', category: 'mobiles', price: 54999, mrp: 69999, stock: 12, featured: true, deal: false, rating: 4.6, ratingCount: 486, color: '#312e81', description: 'Book-style foldable with a multitasking-ready inner display and a tough, pocketable hinge design.', highlights: ['7.6" folding main display', '6.2" cover display', 'Flex mode for hands-free video', 'Ultra-thin glass'] },
  { slug: 'rhythm-r1', name: 'Rhythm R1 (4GB RAM, 64GB)', brand: 'Rhythm', category: 'mobiles', price: 6999, mrp: 8999, stock: 0, featured: false, deal: false, rating: 4.1, ratingCount: 892, color: '#818cf8', description: 'Budget-friendly smartphone for calls, chat, streaming and everyday apps.', highlights: ['6.1" display', '4000mAh battery', '13MP camera', 'Dual SIM + microSD'] },
  // Electronics
  { slug: 'zephyr-14-laptop', name: 'Zephyr 14 Laptop (Ryzen 7, 16GB, 512GB SSD)', brand: 'Zephyr', category: 'electronics', price: 58990, mrp: 72990, stock: 21, featured: true, deal: true, rating: 4.6, ratingCount: 764, color: '#0ea5e9', description: 'Thin-and-light 14" laptop with all-day battery, backlit keyboard and a sharp 2.2K display for work and study.', highlights: ['Ryzen 7 / 16GB RAM', '512GB NVMe SSD', '14" 2.2K anti-glare display', '1.39kg, 18h battery'] },
  { slug: 'sonicboom-anc-headphones', name: 'SonicBoom ANC Wireless Headphones', brand: 'SonicBoom', category: 'electronics', price: 4999, mrp: 7999, stock: 73, featured: true, deal: true, rating: 4.4, ratingCount: 5210, color: '#0284c7', description: 'Over-ear headphones with hybrid active noise cancellation, 60-hour battery and punchy bass.', highlights: ['Hybrid ANC', '60h playback', 'Bluetooth 5.3 + multipoint', 'Fast charge: 10 min = 5h'] },
  { slug: 'vista-43-smart-tv', name: 'Vista 43" 4K Smart TV', brand: 'Vista', category: 'electronics', price: 24990, mrp: 39990, stock: 18, featured: false, deal: true, rating: 4.3, ratingCount: 1982, color: '#0369a1', description: '4K HDR smart TV with a bezel-less design, voice remote and all popular streaming apps built in.', highlights: ['43" 4K HDR10 panel', 'Voice remote included', 'Dual-band Wi-Fi', '3 HDMI, 2 USB'] },
  { slug: 'clickshot-vlog-camera', name: 'ClickShot Vlog Camera Z20', brand: 'ClickShot', category: 'electronics', price: 32990, mrp: 37990, stock: 9, featured: false, deal: false, rating: 4.5, ratingCount: 214, color: '#38bdf8', description: 'Compact 4K vlog camera with flip screen, mic input and creamy background blur for creators.', highlights: ['4K30 video', 'Flip-out touchscreen', 'Directional mic', 'USB-C webcam mode'] },
  // Fashion
  { slug: 'urbanweave-denim-jacket', name: 'UrbanWeave Classic Denim Jacket', brand: 'UrbanWeave', category: 'fashion', price: 1799, mrp: 3599, stock: 45, featured: true, deal: true, rating: 4.4, ratingCount: 912, color: '#ec4899', description: 'Mid-wash denim jacket with a regular fit, brass buttons and four pockets. Sizes S-XXL.', highlights: ['100% cotton denim', 'Regular fit', 'Machine washable', 'Sizes S-XXL'] },
  { slug: 'striderun-air-sneakers', name: 'StrideRun Air Knit Sneakers', brand: 'StrideRun', category: 'fashion', price: 2499, mrp: 4999, stock: 61, featured: true, deal: true, rating: 4.5, ratingCount: 2330, color: '#db2777', description: 'Featherlight knit sneakers with responsive cushioning for all-day city comfort.', highlights: ['Breathable knit upper', 'Cloud-foam midsole', 'Anti-slip outsole', 'UK 6-11'] },
  { slug: 'linenloft-casual-shirt', name: 'LinenLoft Casual Shirt - Sage', brand: 'LinenLoft', category: 'fashion', price: 999, mrp: 1999, stock: 88, featured: false, deal: false, rating: 4.2, ratingCount: 640, color: '#f472b6', description: 'Breezy linen-blend shirt in a relaxed cut, perfect for warm evenings.', highlights: ['Linen-cotton blend', 'Relaxed fit', 'Mother-of-pearl buttons', 'Sizes S-XXL'] },
  { slug: 'heritageloom-saree', name: 'HeritageLoom Woven Saree - Peacock', brand: 'HeritageLoom', category: 'fashion', price: 2199, mrp: 4499, stock: 26, featured: false, deal: true, rating: 4.6, ratingCount: 388, color: '#be185d', description: 'Soft woven saree with a contrast border and matching blouse piece.', highlights: ['5.5m saree + blouse', 'Soft art silk', 'Contrast zari border', 'Dry clean recommended'] },
  // Appliances
  { slug: 'frostair-260-fridge', name: 'FrostAir 260L Double-Door Refrigerator', brand: 'FrostAir', category: 'appliances', price: 23490, mrp: 29990, stock: 14, featured: true, deal: false, rating: 4.4, ratingCount: 1130, color: '#f59e0b', description: 'Energy-efficient 260L frost-free refrigerator with convertible freezer and toughened glass shelves.', highlights: ['260L frost-free', '3-star energy rating', 'Convertible freezer', '10-year compressor warranty'] },
  { slug: 'turboheat-air-fryer', name: 'TurboHeat 4.5L Air Fryer', brand: 'TurboHeat', category: 'appliances', price: 5499, mrp: 8999, stock: 39, featured: false, deal: true, rating: 4.5, ratingCount: 4412, color: '#d97706', description: 'Crispy results with up to 85% less oil. Digital presets for fries, chicken, bake and reheat.', highlights: ['4.5L basket', '8 one-touch presets', 'Dishwasher-safe basket', 'Auto shut-off'] },
  { slug: 'aquapure-ro-purifier', name: 'AquaPure RO+UV Water Purifier', brand: 'AquaPure', category: 'appliances', price: 9499, mrp: 13999, stock: 22, featured: false, deal: false, rating: 4.3, ratingCount: 1567, color: '#fbbf24', description: '7-stage RO+UV purification with mineral guard and an 8L storage tank.', highlights: ['RO + UV + mineral guard', '8L storage', 'Filter-change alert', 'Free installation'] },
  { slug: 'cyclonewash-7kg-washer', name: 'CycloneWash 7kg Front-Load Washer', brand: 'CycloneWash', category: 'appliances', price: 27490, mrp: 33490, stock: 11, featured: true, deal: false, rating: 4.5, ratingCount: 823, color: '#b45309', description: '7kg front-load washing machine with steam wash, inverter motor and 15 wash programs.', highlights: ['7kg front load', 'Steam hygiene wash', 'Inverter motor, 5-star', '1200 RPM'] },
  // Home & Kitchen
  { slug: 'brewmaster-espresso', name: 'BrewMaster Espresso Machine 15-Bar', brand: 'BrewMaster', category: 'home-kitchen', price: 8999, mrp: 12999, stock: 17, featured: true, deal: true, rating: 4.4, ratingCount: 692, color: '#10b981', description: 'Cafe-style espresso at home with a 15-bar pump, steam wand and cup warmer.', highlights: ['15-bar Italian pump', 'Milk frothing wand', '1.5L removable tank', 'Cup warming tray'] },
  { slug: 'chefstone-cookware-set', name: 'ChefStone 5-Piece Non-Stick Cookware Set', brand: 'ChefStone', category: 'home-kitchen', price: 2999, mrp: 5999, stock: 52, featured: false, deal: true, rating: 4.3, ratingCount: 2104, color: '#059669', description: 'Granite-finish non-stick set: fry pan, kadai, tawa and two saucepans with lids.', highlights: ['5-piece set', '3-layer non-stick', 'Gas & induction friendly', 'Cool-touch handles'] },
  { slug: 'dreamrest-memory-pillow', name: 'DreamRest Memory Foam Pillow (Pack of 2)', brand: 'DreamRest', category: 'home-kitchen', price: 1299, mrp: 2599, stock: 96, featured: false, deal: false, rating: 4.2, ratingCount: 3120, color: '#34d399', description: 'Orthopedic memory foam pillows with breathable bamboo covers.', highlights: ['Pack of 2', 'Medium-firm support', 'Washable bamboo cover', 'Standard size'] },
  { slug: 'glowmood-lamp', name: 'GlowMood Smart Table Lamp', brand: 'GlowMood', category: 'home-kitchen', price: 1499, mrp: 2999, stock: 41, featured: false, deal: true, rating: 4.4, ratingCount: 540, color: '#6ee7b7', description: 'Dimmable smart lamp with 16M colors, app control and sunrise wake-up mode.', highlights: ['16M colors', 'App + touch control', 'Sunrise alarm', 'USB powered'] },
  // Beauty & Sports
  { slug: 'fitpulse-smartwatch', name: 'FitPulse Pro Smartwatch', brand: 'FitPulse', category: 'beauty-sports', price: 3499, mrp: 6999, stock: 67, featured: true, deal: true, rating: 4.4, ratingCount: 6210, color: '#8b5cf6', description: 'AMOLED smartwatch with Bluetooth calling, SpO2, heart-rate and 100+ sport modes.', highlights: ['1.43" AMOLED', 'Bluetooth calling', 'SpO2 + HR tracking', '10-day battery'] },
  { slug: 'velvetglow-vitamin-serum', name: 'VelvetGlow Vitamin C Serum 30ml', brand: 'VelvetGlow', category: 'beauty-sports', price: 649, mrp: 1099, stock: 120, featured: false, deal: true, rating: 4.3, ratingCount: 4480, color: '#a78bfa', description: 'Brightening vitamin C serum with hyaluronic acid for a fresh, even glow.', highlights: ['15% vitamin C', 'With hyaluronic acid', 'Dermat tested', '30ml glass bottle'] },
  { slug: 'ironcore-dumbbell-set', name: 'IronCore Adjustable Dumbbell Set 20kg', brand: 'IronCore', category: 'beauty-sports', price: 2299, mrp: 3999, stock: 33, featured: false, deal: false, rating: 4.5, ratingCount: 1189, color: '#7c3aed', description: 'Adjustable 20kg dumbbell set with anti-roll plates and comfort-grip bars.', highlights: ['2 x 10kg adjustable', 'Anti-roll plates', 'Steel construction', 'Carry case included'] },
  { slug: 'trailblaze-yoga-mat', name: 'TrailBlaze Anti-Slip Yoga Mat 6mm', brand: 'TrailBlaze', category: 'beauty-sports', price: 799, mrp: 1599, stock: 74, featured: false, deal: true, rating: 4.4, ratingCount: 980, color: '#c4b5fd', description: '6mm cushioned yoga mat with alignment lines and a carry strap.', highlights: ['6mm cushioning', 'Anti-slip texture', 'Alignment guides', 'Carry strap included'] }
];

function seed(db) {
  // Admin account (change the password after first login - see README)
  db.users.create({
    name: 'Store Admin',
    email: 'admin@salmancart.com',
    passwordHash: hashPassword('admin123'),
    role: 'admin',
    provider: 'local'
  });

  for (const c of CATEGORIES) db.categories.create(c);
  for (const p of PRODUCTS) {
    db.products.create(Object.assign({ image: `/images/products/${p.slug}.svg` }, p));
  }
}

module.exports = { seed, CATEGORIES, PRODUCTS, hashPassword };
