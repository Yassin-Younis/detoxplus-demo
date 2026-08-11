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
}

export type ReasonCode =
  | `goal-${Goal}`
  | 'self-energy'
  | 'self-sleep'
  | 'self-hydration'
  | 'scan-skin'
  | 'scan-hydration'
  | 'diet-ok'

export interface Recommendation {
  product: Product
  /** raw 0..1 */
  score: number
  /** presentation mapping, capped at 98 */
  matchPct: number
  reasons: ReasonCode[]
}
