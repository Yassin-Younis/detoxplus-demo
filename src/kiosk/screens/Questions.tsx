import { useEffect, useRef, useState } from 'react'
import { t, type Lang, type CopyKey } from '../i18n'
import type { DietChoice, Goal } from '../engine/types'

const GOAL_META: { goal: Goal; key: CopyKey; color: string; icon: string }[] = [
  { goal: 'energy', key: 'goalEnergy', color: '#a4193d', icon: '⚡' },
  { goal: 'immunity', key: 'goalImmunity', color: '#e8871e', icon: '🛡️' },
  { goal: 'detox', key: 'goalDetox', color: '#4a7c2f', icon: '🍃' },
  { goal: 'skin', key: 'goalSkin', color: '#7fb069', icon: '✨' },
  { goal: 'digestion', key: 'goalDigestion', color: '#d9b382', icon: '🥝' },
  { goal: 'hydration', key: 'goalHydration', color: '#5aa7c4', icon: '💧' },
  { goal: 'calm', key: 'goalCalm', color: '#7d6b9e', icon: '🧘' },
]

const DIET_META: { diet: DietChoice; key: CopyKey; color: string; icon: string }[] = [
  { diet: 'vegan', key: 'dietVegan', color: '#4a7c2f', icon: '🌱' },
  { diet: 'dairyFree', key: 'dietDairyFree', color: '#5aa7c4', icon: '🥛' },
  { diet: 'caffeineFree', key: 'dietCaffeineFree', color: '#a0703c', icon: '☕' },
  { diet: 'none', key: 'dietNone', color: '#9d9888', icon: '👌' },
]

const STEP_COLORS = ['#7fb069', '#5aa7c4', '#e8871e']

function Progress({ step }: { step: number }) {
  return (
    <div className="k-progress">
      {STEP_COLORS.map((c, i) => (
        <i key={i} className={i <= step ? 'done' : ''} style={{ '--seg': c } as React.CSSProperties} />
      ))}
    </div>
  )
}

// Nav sits right under the content (not at the bottom edge) so it lands in the
// comfortable reach zone of a tall portrait kiosk — see .k-footer.
function Nav({
  lang,
  onBack,
  onNext,
  nextDisabled,
}: {
  lang: Lang
  onBack: () => void
  onNext: () => void
  nextDisabled?: boolean
}) {
  return (
    <div className="k-footer">
      <button className="k-btn k-btn-ghost" onClick={onBack}>
        <span className="k-btn-arrow">‹</span> {t(lang, 'back')}
      </button>
      <button className="k-btn k-btn-primary" disabled={nextDisabled} onClick={onNext}>
        {t(lang, 'next')} <span className="k-btn-arrow">›</span>
      </button>
    </div>
  )
}

interface QProps {
  lang: Lang
  active: boolean
  onNext: () => void
  onBack: () => void
}

export function QGoals({ lang, active, goals, onToggle, onNext, onBack }: QProps & { goals: Goal[]; onToggle: (g: Goal) => void }) {
  return (
    <section className={`kiosk-page ${active ? 'active' : ''}`}>
      <Progress step={0} />
      <h2 className="k-title">
        <span className="k-title-ico">🎯</span>
        {t(lang, 'qGoalsTitle')}
      </h2>
      <p className="k-sub">{t(lang, 'qGoalsSub')}</p>
      <div className="k-chips">
        {GOAL_META.map(({ goal, key, color, icon }) => (
          <button
            key={goal}
            className={`k-chip ${goals.includes(goal) ? 'on' : ''}`}
            style={{ '--chip': color } as React.CSSProperties}
            onClick={() => onToggle(goal)}
          >
            <span className="ico">{icon}</span>
            <span className="lbl">{t(lang, key)}</span>
            <span className="chk">✓</span>
          </button>
        ))}
      </div>
      <Nav lang={lang} onBack={onBack} onNext={onNext} nextDisabled={goals.length === 0} />
    </section>
  )
}

export function QDiet({ lang, active, diet, onToggle, onNext, onBack }: QProps & { diet: DietChoice[]; onToggle: (d: DietChoice) => void }) {
  // "No restrictions" is a complete answer — advance on its own, but cancel if
  // the user taps anything else before the beat is over.
  const autoRef = useRef<number | null>(null)
  const cancelAuto = () => {
    if (autoRef.current) {
      window.clearTimeout(autoRef.current)
      autoRef.current = null
    }
  }
  useEffect(() => {
    if (!active) cancelAuto()
  }, [active])
  const handleToggle = (d: DietChoice) => {
    cancelAuto()
    onToggle(d)
    if (d === 'none' && !diet.includes('none')) {
      autoRef.current = window.setTimeout(onNext, 550)
    }
  }
  return (
    <section className={`kiosk-page ${active ? 'active' : ''}`}>
      <Progress step={1} />
      <h2 className="k-title">
        <span className="k-title-ico">🥗</span>
        {t(lang, 'qDietTitle')}
      </h2>
      <p className="k-sub">{t(lang, 'qDietSub')}</p>
      <div className="k-chips k-chips-1col">
        {DIET_META.map(({ diet: d, key, color, icon }) => (
          <button
            key={d}
            className={`k-chip ${diet.includes(d) ? 'on' : ''}`}
            style={{ '--chip': color } as React.CSSProperties}
            onClick={() => handleToggle(d)}
          >
            <span className="ico">{icon}</span>
            <span className="lbl">{t(lang, key)}</span>
            <span className="chk">✓</span>
          </button>
        ))}
      </div>
      <Nav lang={lang} onBack={onBack} onNext={onNext} nextDisabled={diet.length === 0} />
    </section>
  )
}

const SELF_ROWS: { field: 'energy' | 'sleep' | 'hydration'; key: CopyKey; color: string; icon: string }[] = [
  { field: 'energy', key: 'selfEnergy', color: '#e8871e', icon: '⚡' },
  { field: 'sleep', key: 'selfSleep', color: '#7d6b9e', icon: '😴' },
  { field: 'hydration', key: 'selfHydration', color: '#5aa7c4', icon: '💧' },
]

export function QSelf({
  lang,
  active,
  values,
  onSet,
  onNext,
  onBack,
}: QProps & {
  values: { energy: number; sleep: number; hydration: number }
  onSet: (field: 'energy' | 'sleep' | 'hydration', value: number) => void
}) {
  // Once every row has been answered the screen is done — advance after a
  // short beat so the last tap is still seen landing.
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  useEffect(() => {
    if (active) setTouched({})
  }, [active])
  useEffect(() => {
    if (!active || !SELF_ROWS.every(({ field }) => touched[field])) return
    const id = window.setTimeout(onNext, 550)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touched, active])
  const handleSet = (field: 'energy' | 'sleep' | 'hydration', value: number) => {
    onSet(field, value)
    setTouched((prev) => ({ ...prev, [field]: true }))
  }
  return (
    <section className={`kiosk-page ${active ? 'active' : ''}`}>
      <Progress step={2} />
      <h2 className="k-title">
        <span className="k-title-ico">😊</span>
        {t(lang, 'qSelfTitle')}
      </h2>
      <div className="k-scales">
        {SELF_ROWS.map(({ field, key, color, icon }) => (
          <div key={field} style={{ '--row': color } as React.CSSProperties}>
            <div className="k-scale-label">
              <span className="k-scale-name">
                <span className="k-scale-ico">{icon}</span>
                {t(lang, key)}
              </span>
              <small>
                {t(lang, 'scaleLow')} → {t(lang, 'scaleHigh')}
              </small>
            </div>
            <div className="k-scale">
              {[1, 2, 3, 4, 5].map((v) => (
                <button key={v} className={values[field] === v ? 'on' : ''} onClick={() => handleSet(field, v)}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Nav lang={lang} onBack={onBack} onNext={onNext} />
    </section>
  )
}
