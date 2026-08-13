export type Lang = 'tr' | 'en'

// All user-facing landing copy lives here. Headlines that break across two
// lines use '\n'; Landing.tsx splits on it and inserts <br />.
// The brand name "DETOX PLUS +" is never translated.

const DICT = {
  navCta: { en: 'Try the demo', tr: 'Demoyu dene' },
  scrollCue: { en: 'Scroll', tr: 'Kaydır' },

  heroEyebrow: { en: 'Introducing', tr: 'Karşınızda' },
  heroTitle: { en: 'Smart vending.\nFresh thinking.', tr: 'Akıllı otomat.\nTaptaze bir fikir.' },
  heroSub: {
    en: 'Cold-pressed juice, chosen for you — by a machine that knows what your day needs.',
    tr: 'Sana özel soğuk sıkım meyve suyu — gününe ne iyi gelir bilen bir makineden.',
  },

  optionsTitle: { en: 'Every craving.\nEvery occasion.', tr: 'Her istek.\nHer an.' },
  optionsSub: {
    en: 'Cold-pressed juices, wellness shots, probiotic yogurts and fresh fruit. Restocked daily.',
    tr: 'Soğuk sıkım meyve suları, wellness shotlar, probiyotik yoğurtlar ve taze meyve. Her gün tazelenir.',
  },

  designTitle: { en: 'Slim fit.\nFits anywhere.', tr: 'İnce tasarım.\nHer yere sığar.' },
  designSub: { en: 'One square meter is all it asks.', tr: 'Tek istediği bir metrekare.' },
  chipSchools: { en: 'Schools', tr: 'Okullar' },
  chipHospitals: { en: 'Hospitals', tr: 'Hastaneler' },
  chipGyms: { en: 'Gyms', tr: 'Spor salonları' },
  chipOffices: { en: 'Offices', tr: 'Ofisler' },

  tryitEyebrow: { en: 'Interactive demo', tr: 'İnteraktif demo' },
  tryitTitle: { en: 'Say hello.', tr: 'Merhaba de.' },
  tryitSub: {
    en: 'Answer three quick questions. Let it read your day with a face scan. It vends what fits.',
    tr: 'Üç kısa soruya cevap ver. Gününü yüz taramasıyla okusun. Sana uygun olanı versin.',
  },
  tryitHint: { en: 'Tap the screen →', tr: 'Ekrana dokun →' },
  tapBadge: { en: 'Tap to try', tr: 'Dokun, dene' },
  payCta: { en: 'Tap the card to pay', tr: 'Ödemek için karta dokun' },
  navHardware: { en: 'Hardware', tr: 'Donanım' },
  credit: { en: 'Designed & created by', tr: 'Tasarım ve geliştirme:' },

  drinkTitle: { en: 'Meet Green Detox.', tr: 'Green Detox ile tanış.' },
  drinkSub: {
    en: 'Spinach, cucumber, green apple, lemon. Cold-pressed. Never heated.',
    tr: 'Ispanak, salatalık, yeşil elma, limon. Soğuk sıkım. Asla ısıtılmadı.',
  },

  benefitsTitle: { en: 'Good.\nFor real.', tr: 'İyi.\nGerçekten.' },
  stat1Title: { en: 'Deep cleanse', tr: 'Derin arınma' },
  stat1Sub: { en: 'detox greens, pressed raw', tr: 'çiğ sıkılmış detoks yeşillikleri' },
  stat2Title: { en: 'Light digestion', tr: 'Hafif sindirim' },
  stat2Sub: { en: 'cucumber & apple fibre', tr: 'salatalık ve elma lifi' },
  stat3Title: { en: 'Skin glow', tr: 'Işıldayan cilt' },
  stat3Sub: { en: 'antioxidants, no added sugar', tr: 'antioksidan dolu, şeker ilavesiz' },
  stat4Title: { en: 'All-day hydration', tr: 'Gün boyu nem' },
  stat4Sub: { en: '96% water-rich produce', tr: '%96 su içeren malzemeler' },

  finaleTitle: { en: 'Fresh. Smart.\nEverywhere.', tr: 'Taze. Akıllı.\nHer yerde.' },
  finaleSub: {
    en: 'DETOX PLUS + — smart vending for places that care.',
    tr: 'DETOX PLUS + — önemseyen mekânlar için akıllı otomat.',
  },
  finaleCta: { en: 'Try the demo', tr: 'Demoyu dene' },
  finaleKiosk: { en: 'Open the kiosk ↗', tr: "Kiosk'u aç ↗" },
} as const

export type LandingCopyKey = keyof typeof DICT

export function t(lang: Lang, key: LandingCopyKey): string {
  return DICT[key][lang]
}

const STORAGE_KEY = 'dp-lang'

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'tr' || saved === 'en') return saved
  } catch {
    // storage unavailable — fall through to browser language
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('tr')
    ? 'tr'
    : 'en'
}

export function persistLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // storage unavailable — choice lives for the session only
  }
}
