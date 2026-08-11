import { t, type Lang } from '../i18n'

const ORBS = [
  { color: '#4a7c2f', top: '6%', left: '-8%', delay: '0s' },
  { color: '#e8871e', top: '38%', left: '68%', delay: '-5s' },
  { color: '#8e2043', top: '72%', left: '-4%', delay: '-9s' },
  { color: '#f2c53d', top: '86%', left: '58%', delay: '-13s' },
]

interface Props {
  lang: Lang
  active: boolean
  onLang: (lang: Lang) => void
  onStart: () => void
}

export function Attract({ lang, active, onLang, onStart }: Props) {
  return (
    <section className={`kiosk-page k-attract ${active ? 'active' : ''}`} onClick={onStart}>
      <div className="k-attract-orbs">
        {ORBS.map((o, i) => (
          <span
            key={i}
            className="k-orb"
            style={{ background: o.color, top: o.top, left: o.left, animationDelay: o.delay }}
          />
        ))}
      </div>
      <div className="k-brand">
        DETOX PLUS <span className="k-attract-plus">+</span>
      </div>
      <h1 className="k-attract-title">{t(lang, 'attractTitle')}</h1>
      <div className="k-start-pill">
        <span className="k-start-hand">👆</span>
        <span>
          Başlamak için dokun
          <small>Touch to begin</small>
        </span>
      </div>
      <div className="k-lang" onClick={(e) => e.stopPropagation()}>
        <button className={lang === 'tr' ? 'on' : ''} onClick={() => onLang('tr')}>
          <span className="flag">🇹🇷</span> TÜRKÇE
        </button>
        <button className={lang === 'en' ? 'on' : ''} onClick={() => onLang('en')}>
          <span className="flag">🇬🇧</span> ENGLISH
        </button>
      </div>
    </section>
  )
}
