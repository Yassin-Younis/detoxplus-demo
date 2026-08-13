// Spoken kiosk lines — single source of truth shared by the app (speech.ts)
// and the clip generation script (scripts/gen-voice.mjs). Plain ESM on purpose
// so Node can import it without a TS toolchain.

export const STATIC_LINES = {
  qGoals: {
    tr: 'Merhaba! Bugün neye ihtiyacın var? Birden fazla seçebilirsin.',
    en: 'Hello! What do you need today? You can pick more than one.',
  },
  qDiet: {
    tr: 'Beslenme tercihin var mı?',
    en: 'Do you have any dietary preferences?',
  },
  qSelf: {
    tr: 'Son birkaç soru. Bugün kendini nasıl hissediyorsun?',
    en: 'A few last questions. How are you feeling today?',
  },
  scan: {
    tr: 'Şimdi kısa bir tarama yapacağım. Lütfen kameraya bak ve sabit dur.',
    en: 'I will now do a quick scan. Please look at the camera and hold still.',
  },
  feedback1: {
    tr: 'Tarama tamam. Bugün harika görünüyorsun!',
    en: 'Scan complete. You look great today!',
  },
  feedback2: {
    tr: 'Tarama tamam. Bugün çok formdasın!',
    en: 'Scan complete. You look sharp today!',
  },
  feedback3: {
    tr: 'Tarama tamam. Işıl ışıl görünüyorsun!',
    en: 'Scan complete. Looking fresh today!',
  },
  confirm: {
    tr: 'Siparişini onaylıyor musun?',
    en: 'Would you like to confirm your order?',
  },
  payment: {
    tr: 'Ödeme için kartını temassız okuyucuya dokundur.',
    en: 'To pay, please tap your card on the contactless reader.',
  },
  dispensing: {
    tr: 'Harika seçim! İçeceğin hazırlanıyor.',
    en: 'Great choice! Your drink is on its way.',
  },
  thanks: {
    tr: 'Afiyet olsun! Tekrar bekleriz.',
    en: 'Enjoy! Come back soon.',
  },
}

/** Sentence template for the per-product recommendation clips. */
export const resultsLine = (lang, productName) =>
  lang === 'tr' ? `Size özel önerimiz: ${productName}.` : `Our recommendation for you: ${productName}.`
