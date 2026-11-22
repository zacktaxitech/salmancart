// Shop-type presets. Applying one replaces the storefront content and the product catalog.
// Edit freely: every field here ends up editable in the admin panel afterwards.
const P = (id, dir, o) => ({ id, category: o.c, name: o.n, desc: o.d, price: o.p, image: o.i ? `/img/${dir}/${o.i}` : '', badge: o.b || '', featured: !!o.f, available: true });

const presets = {
  coffee: {
    name: 'Coffee shop',
    settings: {
      brand: 'Ember & Oak', kicker: 'Specialty coffee / Bakery / Kitchen',
      marquee: 'Small batch roasts,Baked before sunrise,Poured slowly,Served warm,Come and sit down',
      aboutTitleA: 'Come and', aboutTitleB: 'sit down.',
      about: 'A slow room in the middle of a fast city. We roast in small batches, bake before sunrise and close when the last cup is finished.',
      shopTitleA: 'Made slowly,', shopTitleB: 'served warm.', galleryTitleA: 'A room worth', galleryTitleB: 'staying in.',
      storyImage: '/img/coffee/interior.jpg', gallery1: '/img/coffee/interior2.jpg', gallery2: '/img/coffee/tea.jpg', gallery3: '/img/coffee/latte.jpg',
      heroShape: 'circle', accent: '#d6a54e', accent2: '#f6e7c8', bg: '#0b0907', bg2: '#16110b',
      address: '12 Quiet Street, Riyadh', hours: 'Sat-Thu 7:00 - 23:00 / Fri 14:00 - 23:00', phone: '+966 50 000 0000', contactEmail: 'hello@example.com',
      stat1Value: 14200, stat1Label: 'Cups poured', stat2Value: 6, stat2Label: 'Origins', stat3Value: 42, stat3Label: 'Seats', stat4Value: 9, stat4Label: 'Years',
      showReserve: true, heroHint: 'Scroll to pour the next cup', badgeText: 'FRESHLY POURED · SLOW ROASTED · SMALL BATCH ·', addLabel: 'Add to order'
    },
    categories: ['Coffee', 'Bakery', 'Kitchen'],
    products: [
      P(1,'coffee',{c:'Coffee',n:'Iced Latte',d:'Cold milk poured over slow-brewed espresso and ice.',p:21,i:'hero.jpg',f:1,b:'Signature'}),
      P(2,'coffee',{c:'Coffee',n:'Flat White',d:'Double ristretto, silky milk.',p:16,i:'latte.jpg',f:1}),
      P(3,'coffee',{c:'Coffee',n:'Pour Over (V60)',d:'Single origin, rotating weekly.',p:22,i:'v60.jpg',f:1}),
      P(4,'coffee',{c:'Coffee',n:'Cardamom Latte',d:'House spiced, lightly sweet.',p:19,i:'latte2.jpg',f:1}),
      P(5,'coffee',{c:'Coffee',n:'Masala Chai',d:'Black tea, spices and steamed milk.',p:15,i:'tea.jpg'}),
      P(6,'coffee',{c:'Bakery',n:'Butter Croissant',d:'72-hour laminated dough.',p:14,i:'croissant.jpg',f:1}),
      P(7,'coffee',{c:'Bakery',n:'Date & Walnut Loaf',d:'Warm, with salted butter.',p:15}),
      P(8,'coffee',{c:'Kitchen',n:'Eggs on Sourdough',d:'Soft scramble, chive, labneh.',p:34,i:'eggs.jpg',f:1})
    ]
  },
  phones: {
    name: 'Mobile phone shop',
    settings: {
      brand: 'Nova Mobile', kicker: 'Phones / Audio / Accessories',
      marquee: 'New arrivals,Official warranty,Same-day delivery,Trade-in welcome,Best prices',
      aboutTitleA: 'The latest tech,', aboutTitleB: 'honest prices.',
      about: 'Genuine phones, audio and accessories with full warranty. Walk in, call or order online and we deliver the same day.',
      shopTitleA: 'Shop the', shopTitleB: 'latest.', galleryTitleA: 'Picked for', galleryTitleB: 'you.',
      storyImage: '/img/phones/flagship-1.jpg', gallery1: '/img/phones/phone-buds.jpg', gallery2: '/img/phones/earbuds-3d.jpg', gallery3: '/img/phones/phone-hand.jpg',
      heroShape: 'arch', accent: '#5ad1ff', accent2: '#d9f3ff', bg: '#07090d', bg2: '#0e1420',
      address: '45 Tech Street, Riyadh', hours: 'Sat-Thu 10:00 - 23:00 / Fri 16:00 - 23:00', phone: '+966 50 000 0000', contactEmail: 'sales@example.com',
      stat1Value: 12000, stat1Label: 'Phones sold', stat2Value: 40, stat2Label: 'Brands', stat3Value: 24, stat3Label: 'Month warranty', stat4Value: 8, stat4Label: 'Years',
      showReserve: false, heroHint: 'Scroll to see the next device', badgeText: 'GENUINE · WARRANTY · FAST DELIVERY ·', addLabel: 'Add to cart'
    },
    categories: ['Flagship', 'Mid-range', 'Audio', 'Accessories'],
    products: [
      P(1,'phones',{c:'Flagship',n:'Nova X1 Pro',d:'6.7 inch OLED, triple camera, 256 GB.',p:3499,i:'flagship-1.jpg',f:1,b:'New'}),
      P(2,'phones',{c:'Flagship',n:'Nova X1 Ultra',d:'Titanium frame, 1 TB option, all-day battery.',p:4299,i:'flagship-2.jpg',f:1}),
      P(3,'phones',{c:'Mid-range',n:'Pulse 5G',d:'120 Hz display, 5G, 128 GB.',p:1699,i:'phone-hand.jpg',f:1}),
      P(4,'phones',{c:'Mid-range',n:'Aero Lite',d:'Slim, bright screen, great battery.',p:999,i:'android-hand.jpg'}),
      P(5,'phones',{c:'Mid-range',n:'Duo Bundle',d:'Phone plus wireless buds in one box.',p:1899,i:'phone-buds.jpg',f:1,b:'Bundle'}),
      P(6,'phones',{c:'Mid-range',n:'Classic S',d:'Simple, reliable, great value.',p:599,i:'classic.jpg'}),
      P(7,'phones',{c:'Audio',n:'Air Buds 3D',d:'Noise cancelling wireless earbuds.',p:249,i:'earbuds-3d.jpg',f:1}),
      P(8,'phones',{c:'Audio',n:'Buds Go',d:'Compact earbuds with charging case.',p:179,i:'earbuds-black.jpg'}),
      P(9,'phones',{c:'Accessories',n:'Fast Charge Cable',d:'Braided USB-C, 1.5 m.',p:39,i:'cable.jpg'}),
      P(10,'phones',{c:'Accessories',n:'Power Bank 10,000',d:'Slim, fast charging, travel pouch.',p:129,i:'powerbank.jpg'})
    ]
  },
  watches: {
    name: 'Watch shop',
    settings: {
      brand: 'Chrono House', kicker: 'Classic / Sport / Smart / Luxury',
      marquee: 'Timeless design,Automatic movements,Genuine leather,Free gift box,Two year warranty',
      aboutTitleA: 'Time well', aboutTitleB: 'spent.',
      about: 'A curated collection of dress, sport and smart watches. Every piece is checked, boxed and covered by our two year warranty.',
      shopTitleA: 'The', shopTitleB: 'collection.', galleryTitleA: 'Details that', galleryTitleB: 'matter.',
      storyImage: '/img/watches/leather.jpg', gallery1: '/img/watches/classic-2.jpg', gallery2: '/img/watches/rose-mesh.jpg', gallery3: '/img/watches/chrono-pop.jpg',
      heroShape: 'circle', accent: '#c9a45c', accent2: '#f4ead2', bg: '#08080a', bg2: '#141418',
      address: '9 Prestige Avenue, Riyadh', hours: 'Sat-Thu 11:00 - 22:00 / Fri 16:00 - 22:00', phone: '+966 50 000 0000', contactEmail: 'hello@example.com',
      stat1Value: 5400, stat1Label: 'Watches sold', stat2Value: 30, stat2Label: 'Brands', stat3Value: 24, stat3Label: 'Month warranty', stat4Value: 12, stat4Label: 'Years',
      showReserve: false, heroHint: 'Scroll to see the next watch', badgeText: 'AUTHENTIC · BOXED · 2 YEAR WARRANTY ·', addLabel: 'Add to cart'
    },
    categories: ['Classic', 'Sport', 'Smart', 'Luxury'],
    products: [
      P(1,'watches',{c:'Classic',n:'Heritage Skeleton',d:'Roman dial, open heart, leather strap.',p:1299,i:'classic-1.jpg',f:1,b:'Best seller'}),
      P(2,'watches',{c:'Classic',n:'Aurora Automatic',d:'Automatic movement, sapphire glass.',p:1899,i:'classic-2.jpg',f:1}),
      P(3,'watches',{c:'Classic',n:'Rose Mesh',d:'Slim case, rose gold mesh strap.',p:649,i:'rose-mesh.jpg',f:1}),
      P(4,'watches',{c:'Classic',n:'Leather Minimal',d:'Clean white dial, brown leather.',p:549,i:'leather.jpg'}),
      P(5,'watches',{c:'Classic',n:'Vintage Dress',d:'Domed crystal, hand wound feel.',p:749,i:'vintage.jpg'}),
      P(6,'watches',{c:'Sport',n:'Chrono Pop',d:'Three-register chronograph.',p:799,i:'chrono-pop.jpg',f:1}),
      P(7,'watches',{c:'Sport',n:'Titan Sport',d:'Steel bracelet, 100 m water resistant.',p:1199,i:'sport.jpg',f:1}),
      P(8,'watches',{c:'Smart',n:'Pulse Smart',d:'Heart rate, notifications, 7 day battery.',p:899,i:'smart.jpg'}),
      P(9,'watches',{c:'Luxury',n:'Emerald Gold',d:'Gold tone case, emerald dial.',p:3299,i:'gold-green.jpg',f:1})
    ]
  }
};

const commonSettings = {
  currency: 'SAR', deliveryFee: 15, freeDeliveryOver: 200, codEnabled: true,
  whatsappOwner: '', notifyWhatsapp: true, notifyEmail: true, ownerEmail: '',
  smtpHost: '', smtpPort: 587, smtpSecurity: 'starttls', smtpUser: '', smtpPass: '', smtpFrom: '',
  stripeEnabled: false, stripeSecret: '', stripeCurrency: 'sar', publicUrl: ''
};
module.exports = { presets, commonSettings };
