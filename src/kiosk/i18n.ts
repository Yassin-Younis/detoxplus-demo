export type Lang = 'tr' | 'en'

// All user-facing kiosk copy lives here. `spoken` variants are what the machine
// says aloud; when omitted, the visible text is spoken.

const DICT = {
  brand: { tr: 'DETOX PLUS +', en: 'DETOX PLUS +' },
  tagline: { tr: 'Taze · Doğal · Günlük Detoks', en: 'Fresh · Natural · Daily Detox' },

  attractTitle: { tr: 'Sana özel içecek önerisi', en: 'Your personal drink match' },
  attractSub: { tr: 'Başlamak için dokun', en: 'Touch to begin' },
  attractHintBoth: { tr: 'Başlamak için dokun · Touch to begin', en: 'Başlamak için dokun · Touch to begin' },

  qGoalsTitle: { tr: 'Bugün neye ihtiyacın var?', en: 'What do you need today?' },
  qGoalsSub: { tr: 'Birden fazla seçebilirsin', en: 'Pick as many as you like' },

  goalEnergy: { tr: 'Enerji', en: 'Energy' },
  goalImmunity: { tr: 'Bağışıklık', en: 'Immunity' },
  goalDetox: { tr: 'Arınma', en: 'Detox' },
  goalSkin: { tr: 'Cilt', en: 'Skin' },
  goalDigestion: { tr: 'Sindirim', en: 'Digestion' },
  goalHydration: { tr: 'Nem / Su', en: 'Hydration' },
  goalCalm: { tr: 'Sakinlik', en: 'Calm' },

  qDietTitle: { tr: 'Beslenme tercihin var mı?', en: 'Any dietary preferences?' },
  qDietSub: { tr: 'Sana uygun olanları seç', en: 'Tap all that apply' },
  dietVegan: { tr: 'Vegan', en: 'Vegan' },
  dietDairyFree: { tr: 'Sütsüz', en: 'Dairy-free' },
  dietCaffeineFree: { tr: 'Kafeinsiz', en: 'Caffeine-free' },
  dietNone: { tr: 'Farketmez', en: 'No restrictions' },

  qSelfTitle: { tr: 'Bugün kendini nasıl hissediyorsun?', en: 'How are you feeling today?' },
  selfEnergy: { tr: 'Enerjin', en: 'Your energy' },
  selfSleep: { tr: 'Uykun', en: 'Your sleep' },
  selfHydration: { tr: 'Su tüketimin', en: 'Your water intake' },
  scaleLow: { tr: 'Düşük', en: 'Low' },
  scaleHigh: { tr: 'Yüksek', en: 'High' },

  scanIntroTitle: { tr: 'Sağlıklı yaşam taraması', en: 'Wellness scan' },
  scanning: { tr: 'Taranıyor…', en: 'Scanning…' },
  scanLighting: { tr: 'Işık', en: 'Lighting' },
  scanFraming: { tr: 'Konum', en: 'Framing' },
  scanFace: { tr: 'Yüz', en: 'Face' },
  scanSimulated: { tr: 'Simüle tarama (kamera yok)', en: 'Simulated scan (no camera)' },
  scanDisclaimer: {
    tr: 'Sağlıklı yaşam göstergesidir, tıbbi tavsiye değildir.',
    en: 'Wellness indicators only — not medical advice.',
  },

  fbTitle1: { tr: 'Bugün harika görünüyorsun!', en: 'You look great today!' },
  fbTitle2: { tr: 'Bugün çok formdasın!', en: 'You look sharp today!' },
  fbTitle3: { tr: 'Işıl ışıl görünüyorsun!', en: 'Looking fresh today!' },
  fbSub: { tr: 'Taraman tamamlandı', en: 'Scan complete' },
  fbSkin: { tr: 'Cilt tonun dengeli görünüyor', en: 'Your skin tone reads balanced' },
  fbEyes: { tr: 'Göz çevrende hafif yorgunluk izi var', en: 'A hint of tiredness around the eyes' },
  fbHydration: { tr: 'Nem göstergen biraz düşük', en: 'Your hydration indicator reads a touch low' },
  fbStress: { tr: 'Stres göstergen sakin görünüyor', en: 'Your stress indicators look calm' },
  fbVitality: { tr: 'Genel canlılık göstergen iyi', en: 'Overall vitality looks good' },
  fbTuned: { tr: 'Önerin buna göre hazırlanıyor…', en: 'Tuning your match to this…' },

  resultsTitle: { tr: 'Sana özel önerimiz', en: 'Made for you' },
  match: { tr: 'uyum', en: 'match' },
  alsoGreat: { tr: 'Bunlar da harika olur', en: 'Also great for you' },
  order: { tr: 'Sipariş ver', en: 'Order now' },
  back: { tr: 'Geri', en: 'Back' },
  next: { tr: 'Devam', en: 'Next' },
  startOver: { tr: 'Baştan başla', en: 'Start over' },

  confirmTitle: { tr: 'Onaylıyor musun?', en: 'Confirm your order' },
  confirmYes: { tr: 'Evet, hazırla!', en: 'Yes, make it!' },
  dispensing: { tr: 'Hazırlanıyor…', en: 'Preparing your drink…' },
  thanksTitle: { tr: 'Afiyet olsun!', en: 'Enjoy!' },
  thanksSub: { tr: 'İçeceğini alt bölmeden alabilirsin', en: 'Collect your drink from the tray below' },

  muteOn: { tr: 'Sesi aç', en: 'Unmute' },
  muteOff: { tr: 'Sesi kapat', en: 'Mute' },
} as const

export type CopyKey = keyof typeof DICT

export function t(lang: Lang, key: CopyKey): string {
  return DICT[key][lang]
}
