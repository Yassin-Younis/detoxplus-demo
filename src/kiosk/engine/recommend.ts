import { PRODUCTS } from './catalog'
import { AXES } from './types'
import type {
  Answers,
  Axis,
  BenefitVector,
  KioskContext,
  Product,
  ReasonCode,
  Recommendation,
  ScanFeatures,
} from './types'

// Weighted-match recommender. Deterministic: same inputs → same ranking.
// Signals, strongest first: explicit goals > self reports > mood read >
// weather > time of day / season > scan color heuristics.

interface UserProfile {
  weights: Record<Axis, number>
  /** reason code of the dominant contributor per axis */
  codes: Partial<Record<Axis, ReasonCode>>
}

function buildProfile(answers: Answers, scan: ScanFeatures | null, ctx: KioskContext | null): UserProfile {
  const weights = Object.fromEntries(AXES.map((a) => [a, 0])) as Record<Axis, number>
  const codes: UserProfile['codes'] = {}
  const strongest: Partial<Record<Axis, number>> = {}

  const add = (axis: Axis, amount: number, code: ReasonCode) => {
    if (amount <= 0) return
    weights[axis] += amount
    if (amount > (strongest[axis] ?? 0)) {
      strongest[axis] = amount
      codes[axis] = code
    }
  }

  for (const goal of answers.goals) add(goal, 1, `goal-${goal}`)

  // Self reports are 1..5; low scores raise the matching need.
  add('energy', ((5 - answers.energy) / 4) * 0.8, 'self-energy')
  add('calm', ((5 - answers.sleep) / 4) * 0.7, 'self-sleep')
  add('hydration', ((5 - answers.hydration) / 4) * 0.8, 'self-hydration')

  // Facial expression read — a mid-strength signal: the user just showed us
  // their day on their face, so it should sway the pick without overriding
  // what they explicitly asked for.
  switch (scan?.mood) {
    case 'sad':
      add('calm', 0.3, 'mood-sad')
      add('energy', 0.2, 'mood-sad')
      break
    case 'tired':
      add('energy', 0.35, 'mood-tired')
      break
    case 'stressed':
      add('calm', 0.35, 'mood-stressed')
      break
    case 'happy':
      add('skin', 0.15, 'mood-happy')
      break
  }

  // Ambient context: weather is worth more than the calendar.
  if (ctx) {
    switch (ctx.weather) {
      case 'hot':
        add('hydration', 0.3, 'weather-hot')
        break
      case 'cold':
        add('immunity', 0.3, 'weather-cold')
        break
      case 'rainy':
        add('immunity', 0.15, 'weather-rainy')
        add('calm', 0.15, 'weather-rainy')
        break
      case 'sunny':
        add('skin', 0.1, 'weather-sunny')
        add('energy', 0.1, 'weather-sunny')
        break
    }
    if (ctx.timeOfDay === 'morning') add('energy', 0.2, 'time-morning')
    if (ctx.timeOfDay === 'evening' || ctx.timeOfDay === 'night') add('calm', 0.2, 'time-evening')
    switch (ctx.season) {
      case 'winter':
        add('immunity', 0.2, 'season-winter')
        break
      case 'summer':
        add('hydration', 0.2, 'season-summer')
        break
      case 'spring':
        add('detox', 0.15, 'season-spring')
        break
      case 'autumn':
        add('immunity', 0.1, 'season-autumn')
        break
    }
  }

  // Scan color heuristics nudge only two axes, with small weights —
  // wellness indicators, not diagnosis.
  if (scan) {
    if (scan.lighting < 0.5) add('skin', 0.25, 'scan-skin')
    if (scan.warmth < 0) add('hydration', 0.25, 'scan-hydration')
    if (scan.warmth > 0.35) add('skin', 0.15, 'scan-skin')
  }

  // Guarantee a usable profile even if someone taps through with no goals and 5/5s.
  const total = AXES.reduce((s, a) => s + weights[a], 0)
  if (total < 0.2) {
    add('detox', 0.6, 'goal-detox')
    add('hydration', 0.4, 'goal-hydration')
  }

  return { weights, codes }
}

function passesDiet(product: Product, answers: Answers): boolean {
  const diet = new Set(answers.diet)
  if ((diet.has('vegan') || diet.has('dairyFree')) && product.tags.includes('dairy')) return false
  if (diet.has('caffeineFree') && product.tags.includes('caffeine')) return false
  return true
}

function score(profile: UserProfile, benefits: BenefitVector): number {
  let dot = 0
  let userNorm = 0
  for (const axis of AXES) {
    const u = profile.weights[axis]
    dot += u * (benefits[axis] ?? 0)
    userNorm += u
  }
  return userNorm > 0 ? Math.min(1, dot / userNorm) : 0
}

function reasonsFor(profile: UserProfile, benefits: BenefitVector, answers: Answers): ReasonCode[] {
  const contributions = AXES.map((axis) => ({
    axis,
    value: profile.weights[axis] * (benefits[axis] ?? 0),
  }))
    .filter((c) => c.value > 0.1)
    .sort((a, b) => b.value - a.value || a.axis.localeCompare(b.axis))
    .slice(0, 3)

  const codes: ReasonCode[] = []
  for (const { axis } of contributions) {
    const code = profile.codes[axis]
    if (code) codes.push(code)
  }
  if (answers.diet.length > 0 && !answers.diet.includes('none')) codes.push('diet-ok')
  return [...new Set(codes)]
}

const RECOMMENDABLE: ReadonlySet<Product['category']> = new Set(['juice', 'shot', 'yogurt'])

export function recommend(
  answers: Answers,
  scan: ScanFeatures | null,
  ctx: KioskContext | null = null,
  topN = 3,
): Recommendation[] {
  const profile = buildProfile(answers, scan, ctx)
  return PRODUCTS.filter((p) => RECOMMENDABLE.has(p.category) && passesDiet(p, answers))
    .map((product) => {
      const s = score(profile, product.benefits)
      return {
        product,
        score: s,
        matchPct: Math.min(98, 55 + Math.round(s * 43)),
        reasons: reasonsFor(profile, product.benefits, answers),
      }
    })
    .sort((a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id))
    .slice(0, topN)
}
