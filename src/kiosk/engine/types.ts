// Pure domain types — no React/DOM. This module is the portable core that
// would run unchanged on the real machine (Chromium kiosk / Android WebView / Node).

export const AXES = [
  'energy',
  'immunity',
  'detox',
  'skin',
  'digestion',
  'hydration',
  'calm',
  'protein',
] as const

export type Axis = (typeof AXES)[number]

/** 0..1 per axis; missing axes mean 0. */
export type BenefitVector = Partial<Record<Axis, number>>

export type Category = 'juice' | 'shot' | 'yogurt' | 'fruit'

export type Tag = 'vegan' | 'dairy' | 'caffeine'

export interface Localized {
  tr: string
  en: string
}

export interface Product {
  id: string
  /** Brand product name (English on the label, as in the vision doc). */
  name: string
  category: Category
  priceCents: number
  /** Label/liquid color — drives bottle tint in both kiosk and machine UIs. */
  color: string
  /** Lighter companion tone for gradients/labels. */
  colorSoft: string
  benefits: BenefitVector
  tags: Tag[]
  blurb: Localized
}

export type Goal = Exclude<Axis, 'protein'>

export type DietChoice = 'vegan' | 'dairyFree' | 'caffeineFree' | 'none'

export interface Answers {
  goals: Goal[]
  diet: DietChoice[]
  /** 1..5 self reports */
  energy: number
  sleep: number
  hydration: number
}

/** Facial expression read from MediaPipe blendshapes, averaged over the scan. */
export type Mood = 'happy' | 'sad' | 'tired' | 'stressed' | 'neutral'

/** Raw 0..1 blendshape averages the mood was derived from (for tuning/debug). */
export interface ExpressionAverages {
  smile: number
  frown: number
  browDown: number
  browInnerUp: number
  eyeClosed: number
  eyeSquint: number
  jawOpen: number
}

export interface ScanFeatures {
  facePresent: boolean
  /** 0..1 fraction of frame covered by skin-tone foreground */
  coverage: number
  /** 0..1 how well the subject is centered */
  centered: number
  /** 0..1 lighting quality */
  lighting: number
  /** -1..1 warm/cool color balance */
  warmth: number
  /** 0..1 luma contrast */
  contrast: number
  /** true when produced by the no-camera fallback */
  simulated: boolean
  /** dominant facial expression over the scan window; absent when no landmarks */
  mood?: Mood
  expression?: ExpressionAverages
}

// ---- ambient context: time, season, weather ----

export type TimeOfDay = 'morning' | 'midday' | 'evening' | 'night'

export type Season = 'winter' | 'spring' | 'summer' | 'autumn'

export type WeatherKind = 'hot' | 'cold' | 'rainy' | 'sunny' | 'mild'

export interface KioskContext {
  timeOfDay: TimeOfDay
  season: Season
  weather: WeatherKind
  /** current outside temperature, when the weather fetch succeeded */
  tempC: number | null
  /** true when weather is a season-based guess (offline / fetch failed) */
  simulated: boolean
}

export type ReasonCode =
  | `goal-${Goal}`
  | 'self-energy'
  | 'self-sleep'
  | 'self-hydration'
  | 'scan-skin'
  | 'scan-hydration'
  | 'mood-happy'
  | 'mood-sad'
  | 'mood-tired'
  | 'mood-stressed'
  | 'weather-hot'
  | 'weather-cold'
  | 'weather-rainy'
  | 'weather-sunny'
  | 'time-morning'
  | 'time-evening'
  | 'season-winter'
  | 'season-spring'
  | 'season-summer'
  | 'season-autumn'
  | 'diet-ok'

export interface Recommendation {
  product: Product
  /** raw 0..1 */
  score: number
  /** presentation mapping, capped at 98 */
  matchPct: number
  reasons: ReasonCode[]
}
