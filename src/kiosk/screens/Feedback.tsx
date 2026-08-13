import { useEffect } from 'react'
import { t, type Lang, type CopyKey } from '../i18n'
import type { Goal, KioskContext, ScanFeatures } from '../engine/types'
import type { Quip } from '../engine/quips'

// How long the feedback moment holds before the recommendation appears.
// Keep in sync with the k-fb-fill animation duration in kiosk.css.
// (Long enough for the spoken mood/weather quip to land.)
export const FEEDBACK_MS = 7000

const TITLES: CopyKey[] = ['fbTitle1', 'fbTitle2', 'fbTitle3']
const SEALS = ['🤩', '😎', '✨']

// The observations shown are the bridge between the scan the user just watched
// and the recommendation that follows — wellness reads, not medical claims.
// A mood read leads, ambient context closes.
function observations(
  scan: ScanFeatures | null,
  ctx: KioskContext | null,
  values: { energy: number; sleep: number; hydration: number },
  goals: Goal[],
): { icon: string; key: CopyKey }[] {
  const out: { icon: string; key: CopyKey }[] = []
  switch (scan?.mood) {
    case 'happy':
      out.push({ icon: '😄', key: 'fbMoodHappy' })
      break
    case 'sad':
      out.push({ icon: '🌈', key: 'fbMoodSad' })
      break
    case 'tired':
      out.push({ icon: '🔋', key: 'fbMoodTired' })
      break
    case 'stressed':
      out.push({ icon: '🧘', key: 'fbMoodStressed' })
      break
  }
  if (scan?.facePresent && scan.lighting > 0.45) out.push({ icon: '✨', key: 'fbSkin' })
  if (values.energy <= 2 || values.sleep <= 2) out.push({ icon: '😴', key: 'fbEyes' })
  if (values.hydration <= 2 || (scan ? scan.warmth < -0.05 : false)) out.push({ icon: '💧', key: 'fbHydration' })
  if (goals.includes('calm') && scan?.mood !== 'stressed') out.push({ icon: '🧘', key: 'fbStress' })
  if (ctx?.weather === 'hot') out.push({ icon: '🥵', key: 'fbWxHot' })
  else if (ctx?.weather === 'cold') out.push({ icon: '🧊', key: 'fbWxCold' })
  else if (ctx?.weather === 'rainy') out.push({ icon: '🌧️', key: 'fbWxRainy' })
  if (out.length < 2) out.push({ icon: '🌿', key: 'fbVitality' })
  return out.slice(0, 3)
}

interface Props {
  lang: Lang
  active: boolean
  variant: number
  scan: ScanFeatures | null
  ctx: KioskContext | null
  quip: Quip | null
  values: { energy: number; sleep: number; hydration: number }
  goals: Goal[]
  onDone: () => void
}

export function Feedback({ lang, active, variant, scan, ctx, quip, values, goals, onDone }: Props) {
  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(onDone, FEEDBACK_MS)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const obs = observations(scan, ctx, values, goals)

  return (
    <section className={`kiosk-page k-center k-feedback ${active ? 'active' : ''}`} onClick={onDone}>
      <div className="k-fb-seal">{quip?.seal ?? SEALS[variant] ?? SEALS[0]}</div>
      <h2 className="k-title">{quip ? quip.title[lang] : t(lang, TITLES[variant] ?? TITLES[0])}</h2>
      <p className="k-sub">✅ {t(lang, 'fbSub')}</p>
      <div className="k-fb-card">
        {obs.map((o, i) => (
          <div key={o.key} className="k-fb-row" style={{ animationDelay: `${400 + i * 350}ms` }}>
            <span className="ico">{o.icon}</span>
            {t(lang, o.key)}
          </div>
        ))}
      </div>
      <div className="k-fb-next">🎯 {t(lang, 'fbTuned')}</div>
      <div className="k-fb-bar">
        <i />
      </div>
    </section>
  )
}
