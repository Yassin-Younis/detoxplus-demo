import type { KioskContext, Localized, Mood } from './types'

// The kiosk's sense of humor. After the scan, one quip is chosen from the
// banks below — mood first (a sad face beats a hot day), then weather, then
// time of day, then a generic charmer. `{product}` is the actual top
// recommendation, so the machine teases the drink it is about to reveal.
// Turkish copy avoids attaching suffixes to English product names.

export interface Quip {
  /** big emoji shown on the feedback screen */
  seal: string
  title: Localized
  spoken: Localized
}

interface QuipTemplate {
  seal: string
  title: Localized
  spoken: Localized // may contain {product} and {temp}
}

const MOOD_QUIPS: Record<Exclude<Mood, 'neutral'>, QuipTemplate[]> = {
  sad: [
    {
      seal: '🌈',
      title: { tr: 'Bugün biraz buruk musun?', en: 'Feeling a little gray today?' },
      spoken: {
        tr: 'Bugün biraz üzgün görünüyorsun. İyi haber: sana tam moralini düzeltecek bir şey buldum — {product}. Şişelenmiş mutluluk gibi.',
        en: 'You look a little down today. Good news — I found you just the thing: a {product}. Basically happiness, cold-pressed.',
      },
    },
    {
      seal: '🫂',
      title: { tr: 'Zor gün mü? Doğru makineye geldin.', en: 'Rough day? You came to the right machine.' },
      spoken: {
        tr: 'Zor bir gün galiba. Söz veriyorum: {product} biterken yüzün gülüyor olacak. Makine sözü.',
        en: 'Rough day, huh? By the last sip of this {product}, you will be smiling again. Machine promise.',
      },
    },
  ],
  tired: [
    {
      seal: '🔋',
      title: { tr: 'Şarjın yüzde birde mi?', en: 'Running on one percent battery?' },
      spoken: {
        tr: 'Gözlerin beş dakika daha diyor. Ertelemeyi bırak — {product} doğal bir yeniden başlatma gibidir.',
        en: 'Those eyes say five more minutes. Skip the snooze — a {product} is a natural reboot.',
      },
    },
    {
      seal: '🥱',
      title: { tr: 'Esnemek bulaşıcıdır, haberin olsun.', en: 'Yawning is contagious, you know.' },
      spoken: {
        tr: 'Ben bir makineyim ve o esnemeyi ben bile hissettim. Hadi bunu bir {product} ile düzeltelim.',
        en: 'I am a machine, and even I felt that yawn. Let us fix that with a {product}.',
      },
    },
  ],
  stressed: [
    {
      seal: '🧘',
      title: { tr: 'O kaşlar bugün fazla mesai yapmış.', en: 'That brow has been working overtime.' },
      spoken: {
        tr: 'Derin bir nefes al... ve bırak. Endişelenme işini artık {product} devralıyor.',
        en: 'Deep breath in... and out. From here, the {product} does the worrying for you.',
      },
    },
    {
      seal: '🍃',
      title: { tr: 'Omuzlar aşağı, tarama tamam.', en: 'Shoulders down. Scan complete.' },
      spoken: {
        tr: 'Gergin bir gün gibi duruyor. Neyse ki elimde tam kıvamında bir çözüm var: {product}.',
        en: 'Looks like a tense one. Lucky for you, I keep a fix in stock: the {product}.',
      },
    },
  ],
  happy: [
    {
      seal: '😄',
      title: { tr: 'Şu gülümsemeye bak!', en: 'Look at that smile!' },
      spoken: {
        tr: 'Birileri bugün ışıl ışıl! O gülümseme hiç solmasın — önerim hazır: {product}.',
        en: 'Someone is glowing today! Let us keep that smile going — {product}, coming right up.',
      },
    },
    {
      seal: '✨',
      title: { tr: 'İyi enerji tespit edildi.', en: 'Good vibes detected.' },
      spoken: {
        tr: 'Sensörlerim harika bir enerji algılıyor. Bir {product} bunu daha da yukarı taşır.',
        en: 'My sensors detect excellent vibes. A {product} will take them even higher.',
      },
    },
  ],
}

const WEATHER_QUIPS: Partial<Record<KioskContext['weather'], QuipTemplate[]>> = {
  hot: [
    {
      seal: '🥵',
      title: { tr: 'Dışarısı resmen fırın.', en: 'It is a scorcher out there.' },
      spoken: {
        tr: 'Dışarısı {temp} derece. İçilebilir klima diye bir şey var mı? Var: {product}.',
        en: 'It is {temp} degrees out there. This {product} is basically air conditioning you can drink.',
      },
    },
    {
      seal: '🧊',
      title: { tr: 'Serinlemeye geldin, biliyorum.', en: 'You came here to cool down. I know.' },
      spoken: {
        tr: 'Bu sıcakta en doğru karar buz gibi bir {product}. Güneş bile kıskanacak.',
        en: 'On a day this hot, the only sensible decision is an ice-cold {product}. Even the sun will be jealous.',
      },
    },
  ],
  cold: [
    {
      seal: '🧣',
      title: { tr: 'Dışarısı buz gibi.', en: 'Baby, it is cold outside.' },
      spoken: {
        tr: 'Dışarısı buz gibi, değil mi? Al sana şişelenmiş kış zırhı: {product}.',
        en: 'Freezing out there, is it not? Here is your winter armor, bottled: the {product}.',
      },
    },
  ],
  rainy: [
    {
      seal: '🌦️',
      title: { tr: 'Dışarıda yağmur, burada güneş.', en: 'Rain outside, sunshine in here.' },
      spoken: {
        tr: 'Dışarıda yağmur var diye sana biraz güneş şişeledim. Tanıştırayım: {product}.',
        en: 'It is pouring outside, so I bottled some sunshine for you. Say hello to the {product}.',
      },
    },
  ],
  sunny: [
    {
      seal: '☀️',
      title: { tr: 'Hava kadar parlak görünüyorsun.', en: 'You look as bright as the weather.' },
      spoken: {
        tr: 'Güneşli bir gün, parlak bir yüz. Bu ikiliye tek eksik bir {product}.',
        en: 'Sunny day, bright face. The only thing missing from that picture is a {product}.',
      },
    },
  ],
}

const TIME_QUIPS: Partial<Record<KioskContext['timeOfDay'], QuipTemplate[]>> = {
  morning: [
    {
      seal: '🌅',
      title: { tr: 'Günaydın!', en: 'Good morning, sunshine.' },
      spoken: {
        tr: 'Günaydın! Kahve güzel de, {product} öğleden sonra seni yarı yolda bırakmaz.',
        en: 'Good morning! Coffee is fine, but a {product} does not come with a three PM crash.',
      },
    },
  ],
  evening: [
    {
      seal: '🌆',
      title: { tr: 'Günün sonu geldi. Son bir iyi karar?', en: 'Almost done. One last good decision?' },
      spoken: {
        tr: 'Uzun bir gündü ve bitmek üzere. Günü güzel kapatmanın yolu belli: {product}.',
        en: 'Long day, nearly done. End it on a high note with a {product}.',
      },
    },
  ],
  night: [
    {
      seal: '🌙',
      title: { tr: 'Gece kuşları da detoks yapar.', en: 'Night owls detox too.' },
      spoken: {
        tr: 'Bu saatte buradaysan sebebini sormayacağım — ama {product} tam gece vardiyalık.',
        en: 'I will not ask why you are here at this hour — but a {product} is perfect night-shift fuel.',
      },
    },
  ],
}

const GENERIC_QUIPS: QuipTemplate[] = [
  {
    seal: '🤩',
    title: { tr: 'Bugün harika görünüyorsun!', en: 'You look great today!' },
    spoken: {
      tr: 'Tarama tamam. Harika görünüyorsun — ve bu {product} elinde daha da iyi duracak.',
      en: 'Scan complete. You look great — and this {product} will look even better in your hand.',
    },
  },
  {
    seal: '😎',
    title: { tr: 'Bugün çok formdasın!', en: 'You look sharp today!' },
    spoken: {
      tr: 'Tarama tamam. Formdasın; formda kalmanın sırrı da hazır: {product}.',
      en: 'Scan complete. You are in form — and the secret to staying that way is ready: the {product}.',
    },
  },
]

const fill = (tpl: Localized, product: string, tempC: number | null): Localized => {
  const temp = tempC == null ? '' : String(Math.round(tempC))
  const sub = (s: string) => s.replace(/\{product\}/g, product).replace(/\{temp\}/g, temp)
  return { tr: sub(tpl.tr), en: sub(tpl.en) }
}

const pick = <T>(xs: T[], seed: number): T => xs[Math.abs(Math.floor(seed)) % xs.length]

/**
 * Choose the post-scan quip. Priority: a readable mood always wins (that is
 * the moment of magic), then notable weather, then time of day, then charm.
 */
export function makeQuip(mood: Mood, ctx: KioskContext, productName: string, seed: number): Quip {
  let bank: QuipTemplate[] | undefined
  if (mood !== 'neutral') bank = MOOD_QUIPS[mood]
  else {
    // {temp} quips need a real temperature reading
    const weatherBank = WEATHER_QUIPS[ctx.weather]?.filter((q) => ctx.tempC != null || !q.spoken.en.includes('{temp}'))
    bank = weatherBank?.length ? weatherBank : TIME_QUIPS[ctx.timeOfDay]
  }
  const chosen = pick(bank?.length ? bank : GENERIC_QUIPS, seed)
  return { seal: chosen.seal, title: chosen.title, spoken: fill(chosen.spoken, productName, ctx.tempC) }
}
