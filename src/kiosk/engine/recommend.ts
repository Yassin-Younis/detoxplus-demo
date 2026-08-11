import { PRODUCTS } from './catalog'
import { AXES } from './types'
import type { Answers, Axis, BenefitVector, Product, ReasonCode, Recommendation, ScanFeatures } from './types'

// Weighted-match recommender. Deterministic: same inputs → same ranking.

type AxisSource = 'goal' | 'self' | 'scan'

interface UserProfile {
  weights: Record<Axis, number>
  /** dominant contributor per axis, for reason codes */
  sources: Partial<Record<Axis, AxisSource>>
}

function buildProfile(answers: Answers, scan: ScanFeatures | null): UserProfile {
  const weights = Object.fromEntries(AXES.map((a) => [a, 0])) as Record<Axis, number>
  const sources: UserProfile['sources'] = {}
  const strongest: Partial<Record<Axis, number>> = {}

  const add = (axis: Axis, amount: number, source: AxisSource) => {
    if (amount <= 0) return
    weights[axis] += amount
    if (amount > (strongest[axis] ?? 0)) {
      strongest[axis] = amount
      sources[axis] = source
    }
  }

  for (const goal of answers.goals) add(goal, 1, 'goal')

  // Self reports are 1..5; low scores raise the matching need.
  add('energy', ((5 - answers.energy) / 4) * 0.8, 'self')
  add('calm', ((5 - answers.sleep) / 4) * 0.7, 'self')
  add('hydration', ((5 - answers.hydration) / 4) * 0.8, 'self')

  // Scan nudges only two axes, with small weights — wellness indicators, not diagnosis.
  if (scan) {
    if (scan.lighting < 0.5) add('skin', 0.25, 'scan')
    if (scan.warmth < 0) add('hydration', 0.25, 'scan')
    if (scan.warmth > 0.35) add('skin', 0.15, 'scan')
  }

  // Guarantee a usable profile even if someone taps through with no goals and 5/5s.
  const total = AXES.reduce((s, a) => s + weights[a], 0)
  if (total < 0.2) {
    add('detox', 0.6, 'goal')
    add('hydration', 0.4, 'goal')
  }

  return { weights, sources }
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
    const source = profile.sources[axis] ?? 'goal'
    if (source === 'goal' && axis !== 'protein') codes.push(`goal-${axis}`)
    else if (source === 'self') {
      if (axis === 'energy') codes.push('self-energy')
      else if (axis === 'calm') codes.push('self-sleep')
      else if (axis === 'hydration') codes.push('self-hydration')
    } else if (source === 'scan') {
      codes.push(axis === 'skin' ? 'scan-skin' : 'scan-hydration')
    }
  }
  if (answers.diet.length > 0 && !answers.diet.includes('none')) codes.push('diet-ok')
  return [...new Set(codes)]
}

const RECOMMENDABLE: ReadonlySet<Product['category']> = new Set(['juice', 'shot', 'yogurt'])

export function recommend(answers: Answers, scan: ScanFeatures | null, topN = 3): Recommendation[] {
  const profile = buildProfile(answers, scan)
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
