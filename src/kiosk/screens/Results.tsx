import { t, type Lang } from '../i18n'
import { REASON_COPY } from '../engine/reasons'
import { formatPrice } from '../engine/catalog'
import type { Recommendation, ReasonCode } from '../engine/types'
import { ProductArt } from '../Bottles'

const REASON_ICON: Record<ReasonCode, string> = {
  'goal-energy': '⚡',
  'goal-immunity': '🛡️',
  'goal-detox': '🍃',
  'goal-skin': '✨',
  'goal-digestion': '🥝',
  'goal-hydration': '💧',
  'goal-calm': '🧘',
  'self-energy': '🔋',
  'self-sleep': '😴',
  'self-hydration': '💧',
  'scan-skin': '📸',
  'scan-hydration': '📸',
  'mood-happy': '😄',
  'mood-sad': '🌈',
  'mood-tired': '🔋',
  'mood-stressed': '🧘',
  'weather-hot': '🥵',
  'weather-cold': '🧊',
  'weather-rainy': '🌧️',
  'weather-sunny': '☀️',
  'time-morning': '🌅',
  'time-evening': '🌆',
  'season-winter': '❄️',
  'season-spring': '🌸',
  'season-summer': '🏖️',
  'season-autumn': '🍂',
  'diet-ok': '✅',
}

interface Props {
  lang: Lang
  active: boolean
  recs: Recommendation[]
  chosen: number
  onChoose: (index: number) => void
  onOrder: () => void
  onStartOver: () => void
}

export function Results({ lang, active, recs, chosen, onChoose, onOrder, onStartOver }: Props) {
  if (recs.length === 0) return <section className={`kiosk-page ${active ? 'active' : ''}`} />
  const pick = recs[chosen] ?? recs[0]
  const runners = recs.map((r, i) => ({ r, i })).filter(({ i }) => i !== chosen)

  return (
    <section className={`kiosk-page ${active ? 'active' : ''}`}>
      <h2 className="k-title">
        <span className="k-title-ico">🎁</span>
        {t(lang, 'resultsTitle')}
      </h2>
      <div
        className="k-hero"
        key={pick.product.id}
        style={{ '--accent-soft': pick.product.colorSoft } as React.CSSProperties}
      >
        <div className="k-hero-bottle">
          <ProductArt product={pick.product} width={110} />
        </div>
        <div className="k-hero-info">
          <div className="k-match">
            {pick.matchPct}% <small>{t(lang, 'match')}</small>
          </div>
          <h3 className="k-hero-name">{pick.product.name}</h3>
          <p className="k-hero-blurb">{pick.product.blurb[lang]}</p>
          <div className="k-price">🏷️ {formatPrice(pick.product.priceCents)}</div>
        </div>
      </div>
      <ul className="k-reasons" key={`r-${pick.product.id}`}>
        {pick.reasons.slice(0, 3).map((code) => (
          <li key={code}>
            <span className="rico">{REASON_ICON[code]}</span>
            {REASON_COPY[code][lang]}
          </li>
        ))}
      </ul>
      <div className="k-section-label">{t(lang, 'alsoGreat')}</div>
      <div className="k-runners">
        {runners.map(({ r, i }) => (
          <button key={r.product.id} className="k-runner" onClick={() => onChoose(i)}>
            <ProductArt product={r.product} width={30} />
            <span>
              <span className="k-runner-name">{r.product.name}</span>
              <br />
              <span className="k-runner-pct">
                {r.matchPct}% {t(lang, 'match')}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="k-footer">
        <button className="k-btn k-btn-ghost" onClick={onStartOver}>
          ↺ {t(lang, 'startOver')}
        </button>
        <button className="k-btn k-btn-primary" onClick={onOrder}>
          🧃 {t(lang, 'order')}
        </button>
      </div>
    </section>
  )
}
