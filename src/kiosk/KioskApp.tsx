import { useEffect, useReducer, useRef, useState } from 'react'
import './kiosk.css'
import { t, type Lang } from './i18n'
import type { Answers, DietChoice, Goal, Recommendation, ScanFeatures } from './engine/types'
import { recommend } from './engine/recommend'
import { bus, nextTxnId, type KioskScreen } from './bus'
import { say, sayResults, cancelSpeech } from './speech'
import { ensureAudio, isMuted, setMuted, sfxChime, sfxPos, sfxSelect, sfxTap } from './sfx'
import { Attract } from './screens/Attract'
import { QGoals, QDiet, QSelf } from './screens/Questions'
import { Scan } from './screens/Scan'
import { Feedback } from './screens/Feedback'
import { Results } from './screens/Results'
import { Confirm, Dispensing, Payment, Thanks } from './screens/Finish'

const IDLE_MS = 180_000
const THANKS_MS = 7_000

interface State {
  screen: KioskScreen
  lang: Lang
  goals: Goal[]
  diet: DietChoice[]
  energy: number
  sleep: number
  hydration: number
  scan: ScanFeatures | null
  feedbackVariant: number
  recs: Recommendation[]
  chosen: number
  txnId: string | null
}

const INITIAL: State = {
  screen: 'ATTRACT',
  lang: 'tr',
  goals: [],
  diet: [],
  energy: 3,
  sleep: 3,
  hydration: 3,
  scan: null,
  feedbackVariant: 0,
  recs: [],
  chosen: 0,
  txnId: null,
}

type Action =
  | { type: 'LANG'; lang: Lang }
  | { type: 'GOTO'; screen: KioskScreen }
  | { type: 'TOGGLE_GOAL'; goal: Goal }
  | { type: 'TOGGLE_DIET'; diet: DietChoice }
  | { type: 'SET_SELF'; field: 'energy' | 'sleep' | 'hydration'; value: number }
  | { type: 'SCAN_DONE'; scan: ScanFeatures; variant: number; pin?: string }
  | { type: 'SCAN_SKIP'; pin?: string }
  | { type: 'FEEDBACK_DONE' }
  | { type: 'CHOOSE'; index: number }
  | { type: 'CONFIRM' }
  | { type: 'PAID' }
  | { type: 'DISPENSED' }
  | { type: 'RESET' }

function buildRecs(state: State, scan: ScanFeatures | null, pin?: string): Recommendation[] {
  const answers: Answers = {
    goals: state.goals,
    diet: state.diet,
    energy: state.energy,
    sleep: state.sleep,
    hydration: state.hydration,
  }
  let recs = recommend(answers, scan, pin ? 24 : 3)
  if (pin) {
    const i = recs.findIndex((r) => r.product.id === pin)
    if (i > 0) recs = [recs[i], ...recs.slice(0, i), ...recs.slice(i + 1)]
    recs = recs.slice(0, 3)
  }
  return recs
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LANG':
      return { ...state, lang: action.lang }
    case 'GOTO':
      return { ...state, screen: action.screen }
    case 'TOGGLE_GOAL': {
      const goals = state.goals.includes(action.goal)
        ? state.goals.filter((g) => g !== action.goal)
        : [...state.goals, action.goal]
      return { ...state, goals }
    }
    case 'TOGGLE_DIET': {
      let diet: DietChoice[]
      if (action.diet === 'none') diet = ['none']
      else {
        const base = state.diet.filter((d) => d !== 'none')
        diet = base.includes(action.diet) ? base.filter((d) => d !== action.diet) : [...base, action.diet]
      }
      return { ...state, diet }
    }
    case 'SET_SELF':
      return { ...state, [action.field]: action.value }
    case 'SCAN_DONE': {
      const recs = buildRecs(state, action.scan, action.pin)
      return { ...state, scan: action.scan, feedbackVariant: action.variant, recs, chosen: 0, screen: 'FEEDBACK' }
    }
    case 'SCAN_SKIP': {
      // no scan data — recommend from the answers alone and go straight to
      // results ("scan complete" feedback would be a lie here)
      const recs = buildRecs(state, null, action.pin)
      return { ...state, scan: null, recs, chosen: 0, screen: 'RESULTS' }
    }
    case 'FEEDBACK_DONE':
      return state.screen === 'FEEDBACK' ? { ...state, screen: 'RESULTS' } : state
    case 'CHOOSE':
      return { ...state, chosen: action.index }
    case 'CONFIRM':
      return { ...state, screen: 'PAYMENT', txnId: nextTxnId() }
    case 'PAID':
      return state.screen === 'PAYMENT' ? { ...state, screen: 'DISPENSING' } : state
    case 'DISPENSED':
      return { ...state, screen: 'THANKS' }
    case 'RESET':
      return { ...INITIAL, lang: state.lang }
    default:
      return state
  }
}

export function KioskApp({
  standalone = false,
  pinFirst,
}: {
  standalone?: boolean
  /** demo determinism: always surface this product as the top recommendation */
  pinFirst?: string
}) {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const [muted, setMutedState] = useState(isMuted())
  const { screen, lang } = state
  const pick = state.recs[state.chosen] ?? null

  // ---- machine bus: state + highlight ----
  useEffect(() => {
    bus.emit('state', { screen })
  }, [screen])

  useEffect(() => {
    const id = screen === 'RESULTS' || screen === 'CONFIRM' ? (pick?.product.id ?? null) : null
    bus.emit('highlight', { productId: id })
  }, [screen, pick])

  // ---- spoken lines per screen ----
  useEffect(() => {
    switch (screen) {
      case 'Q_GOALS':
        say('qGoals', lang)
        break
      case 'Q_DIET':
        say('qDiet', lang)
        break
      case 'Q_SELF':
        say('qSelf', lang)
        break
      case 'SCAN':
        say('scan', lang)
        break
      case 'FEEDBACK':
        say((['feedback1', 'feedback2', 'feedback3'] as const)[state.feedbackVariant] ?? 'feedback1', lang)
        break
      case 'RESULTS':
        if (pick) sayResults(pick.product, lang)
        break
      case 'CONFIRM':
        say('confirm', lang)
        break
      case 'PAYMENT':
        say('payment', lang)
        break
      case 'DISPENSING':
        say('dispensing', lang)
        break
      case 'THANKS':
        say('thanks', lang)
        break
      default:
        cancelSpeech()
    }
    // speak only on screen entry, not on pick change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, lang])

  // ---- payment round-trip: announce on the bus, wait for the card tap ----
  // If nothing answers (standalone kiosk, machine page), reveal the demo
  // tap-card button after a beat so the flow can never dead-end.
  const [showSimPay, setShowSimPay] = useState(false)
  useEffect(() => {
    if (screen !== 'PAYMENT' || !state.txnId || !pick) {
      setShowSimPay(false)
      return
    }
    const txnId = state.txnId
    bus.emit('payment', { txnId, amountCents: pick.product.priceCents, productId: pick.product.id })
    const off = bus.on('payment-result', (r) => {
      if (r.txnId === txnId && r.ok) {
        sfxChime()
        dispatch({ type: 'PAID' })
      }
    })
    const reveal = window.setTimeout(() => setShowSimPay(true), standalone ? 0 : 8000)
    return () => {
      off()
      window.clearTimeout(reveal)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, state.txnId])

  // ---- dispense round-trip ----
  useEffect(() => {
    if (screen !== 'DISPENSING' || !state.txnId || !pick) return
    const txnId = state.txnId
    bus.emit('dispense', { productId: pick.product.id, txnId })
    const off = bus.on('dispense-result', (r) => {
      if (r.txnId === txnId) dispatch({ type: 'DISPENSED' })
    })
    const fallback = window.setTimeout(() => dispatch({ type: 'DISPENSED' }), 4000)
    return () => {
      off()
      window.clearTimeout(fallback)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, state.txnId])

  // ---- thanks → attract ----
  useEffect(() => {
    if (screen !== 'THANKS') return
    const id = window.setTimeout(() => dispatch({ type: 'RESET' }), THANKS_MS)
    return () => window.clearTimeout(id)
  }, [screen])

  // ---- idle reset ----
  const idleRef = useRef<number | null>(null)
  useEffect(() => {
    const arm = () => {
      if (idleRef.current) window.clearTimeout(idleRef.current)
      idleRef.current = window.setTimeout(() => dispatch({ type: 'RESET' }), IDLE_MS)
    }
    arm()
    window.addEventListener('pointerdown', arm)
    window.addEventListener('click', arm)
    return () => {
      window.removeEventListener('pointerdown', arm)
      window.removeEventListener('click', arm)
      if (idleRef.current) window.clearTimeout(idleRef.current)
    }
  }, [])

  const go = (next: KioskScreen) => {
    sfxTap()
    dispatch({ type: 'GOTO', screen: next })
  }

  return (
    <div className={`kiosk ${standalone ? 'kiosk-standalone' : ''}`}>
      <Attract
        lang={lang}
        active={screen === 'ATTRACT'}
        onLang={(l) => {
          ensureAudio()
          sfxSelect()
          dispatch({ type: 'LANG', lang: l })
          // picking a language is a complete answer — go straight in
          dispatch({ type: 'GOTO', screen: 'Q_GOALS' })
        }}
        onStart={() => {
          ensureAudio()
          go('Q_GOALS')
        }}
      />
      <QGoals
        lang={lang}
        active={screen === 'Q_GOALS'}
        goals={state.goals}
        onToggle={(goal) => {
          sfxSelect()
          dispatch({ type: 'TOGGLE_GOAL', goal })
        }}
        onNext={() => go('Q_DIET')}
        onBack={() => go('ATTRACT')}
      />
      <QDiet
        lang={lang}
        active={screen === 'Q_DIET'}
        diet={state.diet}
        onToggle={(diet) => {
          sfxSelect()
          dispatch({ type: 'TOGGLE_DIET', diet })
        }}
        onNext={() => go('Q_SELF')}
        onBack={() => go('Q_GOALS')}
      />
      <QSelf
        lang={lang}
        active={screen === 'Q_SELF'}
        values={{ energy: state.energy, sleep: state.sleep, hydration: state.hydration }}
        onSet={(field, value) => {
          sfxSelect()
          dispatch({ type: 'SET_SELF', field, value })
        }}
        onNext={() => go('SCAN')}
        onBack={() => go('Q_DIET')}
      />
      <Scan
        lang={lang}
        active={screen === 'SCAN'}
        onDone={(scan) => {
          sfxChime()
          dispatch({ type: 'SCAN_DONE', scan, variant: Math.floor(Math.random() * 3), pin: pinFirst })
        }}
        onSkip={() => {
          sfxTap()
          dispatch({ type: 'SCAN_SKIP', pin: pinFirst })
        }}
      />
      <Feedback
        lang={lang}
        active={screen === 'FEEDBACK'}
        variant={state.feedbackVariant}
        scan={state.scan}
        values={{ energy: state.energy, sleep: state.sleep, hydration: state.hydration }}
        goals={state.goals}
        onDone={() => dispatch({ type: 'FEEDBACK_DONE' })}
      />
      <Results
        lang={lang}
        active={screen === 'RESULTS'}
        recs={state.recs}
        chosen={state.chosen}
        onChoose={(index) => {
          sfxSelect()
          dispatch({ type: 'CHOOSE', index })
        }}
        onOrder={() => go('CONFIRM')}
        onStartOver={() => {
          sfxTap()
          dispatch({ type: 'RESET' })
        }}
      />
      <Confirm
        lang={lang}
        active={screen === 'CONFIRM'}
        pick={pick}
        onConfirm={() => {
          sfxSelect()
          dispatch({ type: 'CONFIRM' })
        }}
        onBack={() => go('RESULTS')}
      />
      <Payment
        lang={lang}
        active={screen === 'PAYMENT'}
        pick={pick}
        allowSim={showSimPay}
        onSimPay={() => {
          sfxPos()
          dispatch({ type: 'PAID' })
        }}
        onBack={() => go('CONFIRM')}
      />
      <Dispensing lang={lang} active={screen === 'DISPENSING'} pick={pick} />
      <Thanks lang={lang} active={screen === 'THANKS'} />

      <button
        className="k-mute"
        aria-label={muted ? t(lang, 'muteOn') : t(lang, 'muteOff')}
        onClick={() => {
          const next = !muted
          setMuted(next)
          setMutedState(next)
        }}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  )
}
