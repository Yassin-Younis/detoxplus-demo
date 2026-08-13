// Builds overview-en.html / overview-tr.html from overview.template.html.
// Copy mirrors src/landing/i18n.ts, src/kiosk/engine/catalog.ts and
// src/landing/Hardware.tsx — part names, model numbers and prices verbatim.
// Run: node build.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

/* ---------------- catalog (from src/kiosk/engine/catalog.ts) ---------------- */

const P = (name, price, en, tr) => ({ name, price, en, tr })

const JUICES = [
  P('Green Detox', '$6.99', 'Spinach, cucumber, apple and lemon green cleanse.', 'Ispanak, salatalık, elma ve limonlu yeşil arınma.'),
  P('Immune Boost', '$6.99', 'Orange, carrot and ginger immunity support.', 'Portakal, havuç ve zencefil ile bağışıklık desteği.'),
  P('Red Detox', '$6.99', 'Beetroot, pomegranate and red berries natural power.', 'Pancar, nar ve kırmızı meyvelerle doğal güç.'),
  P('Lemon Ginger', '$5.99', 'Refreshing lemon, ginger and mint.', 'Limon, zencefil ve nane ile ferahlatıcı içim.'),
]
const SHOTS = [
  P('Celery Glow Shot', '$3.99', 'Celery pressed for skin glow.', 'Kereviz özü ile cilt parlaklığı.'),
  P('Oatmeal Ginger Rise', '$3.99', 'Oat and ginger morning rise.', 'Yulaf ve zencefille güne başlangıç.'),
  P('Turmeric Defense', '$3.99', 'Turmeric and black pepper defense.', 'Zerdeçal ve karabiberle savunma.'),
  P('Wheatgrass Cleanse', '$3.99', 'Deep cleanse with wheatgrass.', 'Buğday çimi ile derin arınma.'),
  P('Beetroot Energy', '$3.99', 'Natural energy burst from beetroot.', 'Pancar ile doğal enerji patlaması.'),
  P('Açaí Antiox', '$4.49', 'Antioxidant care with açaí.', 'Açaí ile antioksidan bakım.'),
  P('Coconut Lime Hydrate', '$3.99', 'Deep hydration with coconut water.', 'Hindistan cevizi suyu ile derin nem.'),
  P('Berry Bliss Shot', '$4.49', 'A joyful berry moment.', 'Orman meyveleri ile keyifli mola.'),
  P('Mango Turmeric Sun', '$4.49', 'Sunny energy of mango and turmeric.', 'Mango ve zerdeçal ile güneşli enerji.'),
  P('Activated Charcoal Cleanse', '$4.49', 'Powerful cleanse with activated charcoal.', 'Aktif kömür ile güçlü arınma.'),
  P('Spirulina Detox', '$4.49', 'Green power of spirulina.', 'Spirulina ile yeşil güç.'),
]
const YOGURTS = [
  P('Organic Yogurt', '$4.99', 'Organic milk, probiotic, live culture.', 'Organik süt, probiyotik, canlı kültür.'),
  P('Strawberry Yogurt', '$5.49', 'Strawberry probiotic yogurt.', 'Çilekli probiyotik yoğurt.'),
  P('Blueberry Yogurt', '$5.49', 'Blueberry probiotic yogurt.', 'Yaban mersinli probiyotik yoğurt.'),
  P('Mango Yogurt', '$5.49', 'Mango probiotic yogurt.', 'Mangolu probiyotik yoğurt.'),
  P('Chia Yogurt', '$5.99', 'Chia seed probiotic yogurt.', 'Chia tohumlu probiyotik yoğurt.'),
]
const FRUIT = [
  P('Lemon', '$2.99'),
  P('Lime', '$2.99'),
  P('Red Apple', '$3.99'),
  P('Banana', '$4.99'),
]

/* ---------------- BOM (from HARDWARE.md / src/landing/Hardware.tsx) ---------------- */

const BOM = [
  {
    part: { en: 'Embedded computer', tr: 'Gömülü bilgisayar' },
    example: 'Raspberry Pi 5 (4 GB) + 27 W USB-C PSU + 32 GB A2 microSD',
    price: '$95',
    role: { en: 'Runs the kiosk UI + hardware agent', tr: 'Kiosk arayüzünü ve donanım ajanını çalıştırır' },
  },
  {
    part: { en: 'Portrait touchscreen', tr: 'Dikey dokunmatik ekran' },
    example: '21.5" open-frame PCAP monitor (faytech FT215TMCAPOB, Mimo M21580C-OF), portrait-mounted',
    price: '$350–500',
    role: { en: 'The BODY SCAN panel', tr: 'BODY SCAN paneli' },
  },
  {
    part: { en: 'Camera', tr: 'Kamera' },
    example: 'Logitech C920 (or Brio for low light), mounted above the screen at face height',
    price: '$70–150',
    role: { en: 'Face scan (getUserMedia + MediaPipe, all on-device)', tr: 'Yüz taraması (getUserMedia + MediaPipe, tamamen cihaz üzerinde)' },
  },
  {
    part: { en: 'MDB interface', tr: 'MDB arabirimi' },
    example: 'Qibixx MDB Pi Hat (VMC variant)',
    price: '~€130',
    role: { en: "Lets the Pi drive the machine's MDB bus; can power the Pi from the machine's 24 V", tr: "Pi'nin otomatın MDB veri yolunu sürmesini sağlar; Pi'yi makinenin 24 V hattından besleyebilir" },
  },
  {
    part: { en: 'Cashless payment', tr: 'Nakitsiz ödeme' },
    example: "MDB Level-3 reader — Nayax VPOS Touch / Onyx (or a local Turkish acquirer's MDB reader)",
    price: '$200–400 + fees',
    role: { en: 'Card/NFC payment on the same MDB bus', tr: 'Aynı MDB veri yolunda kart/NFC ödeme' },
  },
  {
    part: { en: 'Vending chassis', tr: 'Otomat şasisi' },
    example: 'Refrigerated glass-front vendor with elevator delivery + MDB VMC',
    price: '$3,000–7,000',
    role: { en: 'The machine itself (see the two paths)', tr: 'Makinenin kendisi (iki yola bakın)' },
  },
  {
    part: { en: 'Connectivity', tr: 'Bağlantı' },
    example: 'LTE router (Teltonika RUT241) or venue Wi-Fi; short Ethernet cable',
    price: '~$120',
    role: { en: 'Payments, telemetry, remote menu updates', tr: 'Ödemeler, telemetri, uzaktan menü güncellemeleri' },
  },
  {
    part: { en: 'Misc', tr: 'Çeşitli' },
    example: 'Powered USB hub, HDMI cable, VESA/mounting brackets, surge-protected strip',
    price: '~$60',
    role: { en: '—', tr: '—' },
  },
]

/* ---------------- steps + stats ---------------- */

const STEPS = [
  {
    t: { en: 'Three questions', tr: 'Üç soru' },
    d: {
      en: 'Answer three quick questions about your day — energy, mood, what you need.',
      tr: 'Gününle ilgili üç kısa soruyu yanıtla — enerji, ruh hâli, neye ihtiyacın var.',
    },
  },
  {
    t: { en: 'Face scan', tr: 'Yüz taraması' },
    d: {
      en: 'An on-device face scan reads lighting, framing and wellness cues. Nothing leaves the machine.',
      tr: 'Cihaz üzerinde çalışan yüz taraması ışığı, kadrajı ve sağlıklı yaşam ipuçlarını okur. Hiçbir veri makineden çıkmaz.',
    },
  },
  {
    t: { en: 'Your match', tr: 'Sana uygun olan' },
    d: {
      en: 'The engine scores the whole catalog against your answers and picks your match.',
      tr: 'Motor, yanıtlarına göre tüm katalogu puanlar ve sana en uygun ürünü seçer.',
    },
  },
  {
    t: { en: 'Vended, chilled', tr: 'Soğuk teslim' },
    d: {
      en: 'Pay by card and take your bottle — delivered gently by elevator, never dropped.',
      tr: 'Kartla öde, şişeni al — asansörle nazikçe teslim edilir, asla düşürülmez.',
    },
  },
]

const STATS = [
  { t: { en: 'Deep cleanse', tr: 'Derin arınma' }, d: { en: 'detox greens, pressed raw', tr: 'çiğ sıkılmış detoks yeşillikleri' } },
  { t: { en: 'Light digestion', tr: 'Hafif sindirim' }, d: { en: 'cucumber & apple fibre', tr: 'salatalık ve elma lifi' } },
  { t: { en: 'Skin glow', tr: 'Işıldayan cilt' }, d: { en: 'antioxidants, no added sugar', tr: 'antioksidan dolu, şeker ilavesiz' } },
  { t: { en: 'All-day hydration', tr: 'Gün boyu nem' }, d: { en: '96% water-rich produce', tr: '%96 su içeren malzemeler' } },
]

/* ---------------- page copy ---------------- */

const COPY = {
  docLabel: { en: 'Product overview', tr: 'Ürün tanıtımı' },

  heroEyebrow: { en: 'Introducing', tr: 'Karşınızda' },
  heroTitle: { en: 'Smart vending.<br>Fresh thinking.', tr: 'Akıllı otomat.<br>Taptaze bir fikir.' },
  heroSub: {
    en: 'Cold-pressed juice, chosen for you — by a machine that knows what your day needs.',
    tr: 'Sana özel soğuk sıkım meyve suyu — gününe ne iyi gelir bilen bir makineden.',
  },

  optionsEyebrow: { en: 'The range', tr: 'Ürün gamı' },
  optionsTitle: { en: 'Every craving.<br>Every occasion.', tr: 'Her istek.<br>Her an.' },
  optionsSub: {
    en: 'Cold-pressed juices, wellness shots, probiotic yogurts and fresh fruit. Restocked daily.',
    tr: 'Soğuk sıkım meyve suları, wellness shotlar, probiyotik yoğurtlar ve taze meyve. Her gün tazelenir.',
  },

  menuEyebrow: { en: 'The menu', tr: 'Menü' },
  menuTitle: { en: 'What’s inside.', tr: 'İçinde ne var.' },
  menuSub: {
    en: 'The full product line — 24 products across four shelves. Restocked daily.',
    tr: 'Tüm ürün gamı — dört rafta 24 ürün. Her gün tazelenir.',
  },

  designEyebrow: { en: 'Design', tr: 'Tasarım' },
  designTitle: { en: 'Slim fit.<br>Fits anywhere.', tr: 'İnce tasarım.<br>Her yere sığar.' },
  designSub: { en: 'One square meter is all it asks.', tr: 'Tek istediği bir metrekare.' },
  designM2: {
    en: 'of floor space — a lit fascia, a glass front and a portrait touchscreen do the rest.',
    tr: 'zemin alanı yeter — ışıklı tabela, cam kapak ve dikey dokunmatik ekran gerisini halleder.',
  },
  chipSchools: { en: 'Schools', tr: 'Okullar' },
  chipHospitals: { en: 'Hospitals', tr: 'Hastaneler' },
  chipGyms: { en: 'Gyms', tr: 'Spor salonları' },
  chipOffices: { en: 'Offices', tr: 'Ofisler' },

  tryitEyebrow: { en: 'How it works', tr: 'Nasıl çalışır' },
  tryitTitle: { en: 'Say hello.', tr: 'Merhaba de.' },
  tryitSub: {
    en: 'Answer three quick questions. Let it read your day with a face scan. It vends what fits.',
    tr: 'Üç kısa soruya cevap ver. Gününü yüz taramasıyla okusun. Sana uygun olanı versin.',
  },
  howNote: {
    en: 'The kiosk speaks — warm, pre-generated voices in Turkish and English. The scan runs fully on-device and is presented as wellness indicators, not medical advice; the questionnaire drives the recommendation.',
    tr: 'Kiosk konuşur — Türkçe ve İngilizce, sıcak ve önceden üretilmiş seslerle. Tarama tamamen cihaz üzerinde çalışır ve tıbbi tavsiye olarak değil, sağlıklı yaşam göstergesi olarak sunulur; öneriyi asıl belirleyen ankettir.',
  },

  drinkEyebrow: { en: 'Signature drink', tr: 'İmza içecek' },
  drinkTitle: { en: 'Meet Green Detox.', tr: 'Green Detox ile tanış.' },
  drinkSub: {
    en: 'Spinach, cucumber, green apple, lemon. Cold-pressed. Never heated.',
    tr: 'Ispanak, salatalık, yeşil elma, limon. Soğuk sıkım. Asla ısıtılmadı.',
  },
  ingSpinach: { en: 'Spinach', tr: 'Ispanak' },
  ingCucumber: { en: 'Cucumber', tr: 'Salatalık' },
  ingApple: { en: 'Green apple', tr: 'Yeşil elma' },
  ingLemon: { en: 'Lemon', tr: 'Limon' },
  drinkMeta: { en: '$6.99 · 500 ml · vegan · cold-pressed', tr: '$6.99 · 500 ml · vegan · soğuk sıkım' },
  gdFamily: { en: 'The cleanse family', tr: 'Arınma ailesi' },

  benefitsEyebrow: { en: 'Benefits', tr: 'Faydalar' },
  benefitsTitle: { en: 'Good.<br>For real.', tr: 'İyi.<br>Gerçekten.' },

  hwEyebrow: { en: 'Hardware guide', tr: 'Donanım rehberi' },
  hwTitle: { en: 'From demo to machine.', tr: 'Demodan makineye.' },
  hwSub: {
    en: 'The kiosk software runs on the real machine unchanged — fullscreen Chromium on an embedded computer, talking to the vending hardware over the same event interface as the demo, carried over a local WebSocket.',
    tr: 'Kiosk yazılımı gerçek makinede hiç değişmeden çalışır — gömülü bir bilgisayarda tam ekran Chromium; otomat donanımıyla demodaki aynı olay arayüzü üzerinden, yerel bir WebSocket ile konuşur.',
  },
  hwBadge: { en: 'Recommended for the vision', tr: 'Vizyon için önerilen' },
  hwPathAName: { en: 'Path A — Real vending chassis', tr: 'A Yolu — Gerçek otomat şasisi' },
  hwPathABody: {
    en: 'A refrigerated vending machine with elevator delivery and an MDB bus — the industry-standard controller protocol. Glass bottles need elevator delivery, not drop. Examples: AMS Sensit combo coolers, Crane/Vendo glass-front refrigerated vendors. The biggest cost and lead-time item — price it early.',
    tr: 'Asansörlü teslimata ve MDB veri yoluna — sektörün standart kontrolcü protokolü — sahip soğutmalı bir otomat. Cam şişeler düşerek değil, asansörle teslim edilmeli. Örnekler: AMS Sensit combo soğutucular, Crane/Vendo camlı soğutmalı otomatlar. En büyük maliyet ve tedarik süresi kalemi — fiyatını erkenden araştırın.',
  },
  hwPathAPrice: { en: '$3,000–7,000 new · much less used', tr: '$3,000–7,000 sıfır · ikinci elde çok daha az' },
  hwPathBName: { en: 'Path B — Smart cooler', tr: 'B Yolu — Akıllı soğutucu' },
  hwPathBBody: {
    en: 'Keep the open cooler; add an electronic door lock and a card reader. The door unlocks after a card tap and purchases are detected by weight sensors or shelf cameras. Simpler mechanically, harder software; sold as a retrofit kit.',
    tr: 'Açık soğutucuyu koruyun; elektronik kapı kilidi ve kart okuyucu ekleyin. Kapı, kart okutulunca açılır; satın almalar ağırlık sensörleri veya raf kameralarıyla algılanır. Mekanik olarak daha basit, yazılımı daha zor; dönüşüm kiti olarak satılıyor.',
  },
  hwPathBPrice: { en: 'Retrofit kit on an existing cooler', tr: 'Mevcut soğutucuya dönüşüm kiti' },
  hwNote: {
    en: 'The parts listed assume Path A and are the same for either path except the MDB interface.',
    tr: "Listelenen parçalar A Yolu'na göre seçildi; MDB arabirimi dışında her iki yol için de aynıdır.",
  },
  hwBomTitle: { en: 'Bill of materials.', tr: 'Malzeme listesi.' },
  hwColPart: { en: 'Part', tr: 'Parça' },
  hwColExample: { en: 'Example', tr: 'Örnek' },
  hwColPrice: { en: '~Price', tr: '~Fiyat' },
  hwColRole: { en: 'Role', tr: 'Görev' },
  hwTotal: {
    en: 'Total electronics excluding the chassis: <b>roughly $1,000–1,400</b>.',
    tr: 'Şasi hariç toplam elektronik: <b>yaklaşık $1,000–1,400</b>.',
  },

  finaleTitle: { en: 'Fresh. Smart.<br>Everywhere.', tr: 'Taze. Akıllı.<br>Her yerde.' },
  finaleSub: {
    en: 'DETOX PLUS + — smart vending for places that care.',
    tr: 'DETOX PLUS + — önemseyen mekânlar için akıllı otomat.',
  },
  finaleCta: { en: 'Try the live demo', tr: 'Canlı demoyu dene' },
  credit: { en: 'Designed &amp; created by', tr: 'Tasarım ve geliştirme:' },
}

/* ---------------- generated blocks ---------------- */

const catCards = (lang) => {
  const cards = [
    { n: { en: '4 cold-pressed juices', tr: '4 soğuk sıkım meyve suyu' }, s: '500 ml', from: '$5.99' },
    { n: { en: '11 wellness shots', tr: '11 wellness shot' }, s: '60 ml', from: '$3.99' },
    { n: { en: '5 probiotic yogurts', tr: '5 probiyotik yoğurt' }, s: null, from: '$4.99' },
    { n: { en: '4 fresh fruits', tr: '4 taze meyve' }, s: null, from: '$2.99' },
  ]
  const from = (p) => (lang === 'tr' ? `<span class="from">${p}</span>'dan itibaren` : `${lang === 'en' ? 'from ' : ''}<span class="from">${p}</span>`)
  return cards
    .map(
      (c) => `<div class="cat"><h3>${c.n[lang]}</h3><p>${c.s ? c.s + ' · ' : ''}${from(c.from)}</p></div>`
    )
    .join('\n')
}

const menuItems = (items, lang, blurbs = true) =>
  `<ul class="mi">${items
    .map(
      (p) =>
        `<li><div class="mi-row"><span class="mi-name">${p.name}</span><span class="mi-price">${p.price}</span></div>${
          blurbs && p[lang] ? `<p class="mi-blurb">${p[lang]}</p>` : ''
        }</li>`
    )
    .join('')}</ul>`

const menuCols = (lang) => {
  const H = {
    juices: { en: 'Cold-pressed juices', tr: 'Soğuk sıkım meyve suları' },
    shots: { en: 'Wellness shots', tr: 'Wellness shotlar' },
    cont: { en: 'Shots — continued', tr: 'Shotlar — devam' },
    yogurts: { en: 'Probiotic yogurts', tr: 'Probiyotik yoğurtlar' },
    fruit: { en: 'Fresh fruit', tr: 'Taze meyve' },
  }
  const head = (t, size) => `<h4>${t}${size ? ` <span>· ${size}</span>` : ''}</h4><hr>`
  return [
    `<div class="mcol">${head(H.juices[lang], '500 ml')}${menuItems(JUICES, lang)}</div>`,
    `<div class="mcol">${head(H.shots[lang], '60 ml')}${menuItems(SHOTS.slice(0, 6), lang)}</div>`,
    `<div class="mcol"><h4 class="cont">${H.cont[lang]}</h4><hr class="thin">${menuItems(SHOTS.slice(6), lang)}</div>`,
    `<div class="mcol">${head(H.yogurts[lang])}${menuItems(YOGURTS, lang)}<div class="gap"></div>${head(H.fruit[lang])}${menuItems(FRUIT, lang, false)}</div>`,
  ].join('\n')
}

const stepsHtml = (lang) =>
  STEPS.map(
    (s, i) =>
      `<div class="step"><span class="num">0${i + 1}</span><h3>${s.t[lang]}</h3><p>${s.d[lang]}</p></div>`
  ).join('\n')

const statsHtml = (lang) =>
  STATS.map((s) => `<div class="stat"><h3>${s.t[lang]}</h3><p>${s.d[lang]}</p></div>`).join('\n')

const bomRows = (lang) =>
  BOM.map(
    (r) =>
      `<tr><td class="part">${r.part[lang]}</td><td>${r.example}</td><td class="price">${r.price}</td><td>${r.role[lang]}</td></tr>`
  ).join('\n')

/* ---------------- build ---------------- */

const template = readFileSync(join(here, 'overview.template.html'), 'utf8')

for (const lang of ['en', 'tr']) {
  let html = template
    .replaceAll('{{LANG}}', lang)
    .replaceAll('{{CATS}}', catCards(lang))
    .replaceAll('{{MENU_COLS}}', menuCols(lang))
    .replaceAll('{{STEPS}}', stepsHtml(lang))
    .replaceAll('{{STATS}}', statsHtml(lang))
    .replaceAll('{{BOM_ROWS}}', bomRows(lang))
  for (const [key, val] of Object.entries(COPY)) {
    html = html.replaceAll(`{{${key}}}`, val[lang])
  }
  const leftover = html.match(/\{\{[a-zA-Z_]+\}\}/g)
  if (leftover) throw new Error(`Unreplaced placeholders (${lang}): ${[...new Set(leftover)].join(', ')}`)
  writeFileSync(join(here, `overview-${lang}.html`), html)
  console.log(`wrote overview-${lang}.html`)
}
