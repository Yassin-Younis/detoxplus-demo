import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import './landing.css'
import { KioskApp } from '../kiosk/KioskApp'
import { bus } from '../kiosk/bus'
import { detectLang, persistLang, t, type Lang } from './i18n'
import {
  ChevronDownIcon,
  DigestionIcon,
  DropletIcon,
  GymIcon,
  HospitalIcon,
  LeafIcon,
  OfficeIcon,
  SchoolIcon,
  SparkleIcon,
} from './icons'

// multi-line headlines are stored with '\n'; render them with real <br />s
const lines = (s: string) =>
  s.split('\n').map((ln, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {ln}
    </Fragment>
  ))

// ---------- media ----------
// Stills always exist (keyed frames). Scrub clips appear in public/landing/ as
// they are generated + approved; until then scrub segments crossfade stills.

type StillKey = 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6'
type ClipKey = 't1' | 't2' | 't3' | 't4' | 't5'

const STILLS: Record<StillKey, string> = {
  f1: 'landing/f1.png', // lossless master (1920x1080) — crispest, it hosts the live kiosk
  f2: 'landing/f2.jpg',
  f3: 'landing/f3.jpg',
  f4: 'landing/f4.jpg',
  f5: 'landing/f5.jpg',
  f6: 'landing/f6.jpg',
}
const CLIPS: Record<ClipKey, string> = {
  t1: 'landing/t1.mp4', // frame 1 -> 2  (dolly to low angle)
  t2: 'landing/t2.mp4', // frame 2 -> 3  (pull back to wide side view)
  t3: 'landing/t3.mp4', // frame 1 -> 4  (vend: shake + bottle drop) — realtime on dispense
  t4: 'landing/t4.mp4', // frame 4 -> 5  (bottle flies out)
  t5: 'landing/t5.mp4', // frame 5 -> 6  (cap off, splash)
}

// screen panel of the machine in frame 1, in % of the 16:9 stage
const PANEL = { left: 34.25, top: 18.8, width: 8.9, height: 57.9 }

// ---------- scroll timeline ----------

type CopyKey =
  | 'hero'
  | 'options'
  | 'design'
  | 'tryit'
  | 'drink'
  | 'benefits'
  | 'finale'

type Seg =
  | { kind: 'hold'; len: number; media: StillKey; copy?: CopyKey; kiosk?: boolean }
  | {
      kind: 'scrub'
      len: number
      video: ClipKey
      from: number
      to: number
      fromImg: StillKey
      toImg: StillKey
    }

const SEGS: Seg[] = [
  { kind: 'hold', len: 110, media: 'f1', copy: 'hero' },
  { kind: 'scrub', len: 150, video: 't1', from: 0, to: 1, fromImg: 'f1', toImg: 'f2' },
  { kind: 'hold', len: 95, media: 'f2', copy: 'options' },
  { kind: 'scrub', len: 150, video: 't2', from: 0, to: 1, fromImg: 'f2', toImg: 'f3' },
  { kind: 'hold', len: 95, media: 'f3', copy: 'design' },
  { kind: 'scrub', len: 55, video: 't2', from: 1, to: 0, fromImg: 'f3', toImg: 'f2' },
  { kind: 'scrub', len: 55, video: 't1', from: 1, to: 0, fromImg: 'f2', toImg: 'f1' },
  { kind: 'hold', len: 190, media: 'f1', copy: 'tryit', kiosk: true },
  { kind: 'scrub', len: 150, video: 't4', from: 0, to: 1, fromImg: 'f4', toImg: 'f5' },
  { kind: 'hold', len: 90, media: 'f5', copy: 'drink' },
  { kind: 'scrub', len: 150, video: 't5', from: 0, to: 1, fromImg: 'f5', toImg: 'f6' },
  { kind: 'hold', len: 110, media: 'f6', copy: 'benefits' },
  { kind: 'scrub', len: 50, video: 't5', from: 1, to: 0, fromImg: 'f6', toImg: 'f5' },
  { kind: 'scrub', len: 50, video: 't4', from: 1, to: 0, fromImg: 'f5', toImg: 'f4' },
  { kind: 'scrub', len: 60, video: 't3', from: 1, to: 0, fromImg: 'f4', toImg: 'f1' },
  { kind: 'hold', len: 140, media: 'f1', copy: 'finale' },
]

const TOTAL = SEGS.reduce((s, x) => s + x.len, 0)

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

// phones, portrait tablets and very short landscape phones get the compact
// layout — MUST mirror the responsive media query in landing.css
const isCompactLayout = () =>
  window.innerWidth <= 760 ||
  window.innerHeight <= 500 ||
  (window.innerWidth <= 1024 && window.innerHeight > window.innerWidth)

export function Landing() {
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const stillRefs = useRef<Partial<Record<StillKey, HTMLImageElement>>>({})
  const clipRefs = useRef<Partial<Record<ClipKey, HTMLVideoElement>>>({})
  const clipReady = useRef<Partial<Record<ClipKey, boolean>>>({})
  const vendRef = useRef<HTMLVideoElement>(null)
  const [activeCopy, setActiveCopy] = useState<CopyKey | null>('hero')
  const [kioskLive, setKioskLive] = useState(false)
  const vendedRef = useRef(false)
  const [vending, setVending] = useState(false)
  const [touched, setTouched] = useState(false)
  const [assetsLoaded, setAssetsLoaded] = useState(0)
  const [ready, setReady] = useState(false)
  const [lang, setLang] = useState<Lang>(detectLang)

  const switchLang = (next: Lang) => {
    setLang(next)
    persistLang(next)
  }

  // loading gate: 6 stills + 5 scrub clips + the vend clip; 6s hard fallback
  const bumpAsset = () => setAssetsLoaded((n) => n + 1)
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 6000)
    return () => window.clearTimeout(id)
  }, [])
  useEffect(() => {
    if (assetsLoaded >= 12) setReady(true)
  }, [assetsLoaded])

  const bounds = useMemo(() => {
    let acc = 0
    return SEGS.map((s) => {
      const b = { start: acc, end: acc + s.len }
      acc += s.len
      return b
    })
  }, [])

  // ---------- render loop ----------
  useEffect(() => {
    let lastCopy: CopyKey | null = 'hero'
    let lastKiosk = false

    const apply = () => {
      const vh = window.innerHeight / 100
      const p = Math.min(TOTAL - 100, window.scrollY / vh)

      let idx = SEGS.length - 1
      for (let i = 0; i < SEGS.length; i++) {
        if (p < bounds[i].end || i === SEGS.length - 1) {
          idx = i
          break
        }
      }
      const seg = SEGS[idx]
      const frac = Math.min(1, Math.max(0, (p - bounds[idx].start) / seg.len))

      // hero/finale: machine sits small below the headline, full bleed in between
      if (frameRef.current) {
        let scale = 1
        let ty = -50
        if (idx === 0) {
          // machine holds still below the text until the copy has fully faded
          const s = smooth(Math.max(0, (frac - 0.35) / 0.65))
          scale = 0.55 + 0.45 * s
          ty = -37 - 13 * s
        } else if (idx === SEGS.length - 1) {
          // machine finishes shrinking before the closing copy fades in
          const s = smooth(Math.min(1, frac / 0.6))
          scale = 1 - 0.45 * s
          ty = -50 + 13 * s
        }
        // demo section: ease into a closer view of the machine, ease back out
        // before the vend-flight scrub; +ty keeps the sign, tray stays in frame
        let tx = -50
        if (seg.kind === 'hold' && seg.kiosk) {
          const z = smooth(Math.min(1, frac / 0.22)) * (1 - smooth(Math.max(0, (frac - 0.85) / 0.15)))
          if (isCompactLayout()) {
            // small screens: zoom the frame so the machine's screen panel
            // fills most of the viewport — the kiosk must be tappable
            const fr = frameRef.current
            const W = fr.offsetWidth
            const H = fr.offsetHeight
            const vwPx = window.innerWidth
            const vhPx = window.innerHeight
            const sT = Math.min(
              (0.92 * vwPx) / ((PANEL.width / 100) * W),
              (0.78 * vhPx) / ((PANEL.height / 100) * H),
            )
            const pcx = (PANEL.left + PANEL.width / 2) / 100 // panel center, frame fractions
            const pcy = (PANEL.top + PANEL.height / 2) / 100
            const panelY = 0.46 * vhPx // slightly above center; clears the fixed nav
            const txT = -50 - sT * (pcx - 0.5) * 100
            const tyT = -50 + ((panelY - 0.5 * vhPx) / H) * 100 - sT * (pcy - 0.5) * 100
            scale = 1 + (sT - 1) * z
            tx = -50 + (txT + 50) * z
            ty = -50 + (tyT + 50) * z
          } else {
            scale = 1 + 0.35 * z
            tx = -50 + 9.3 * z
            ty = -50 - 1.3 * z
          }
        }
        frameRef.current.style.transform = `translate(${tx}%, ${ty}%) scale(${scale})`
      }

      // resolve what the stage shows
      const wantStill: Partial<Record<StillKey, number>> = {}
      let wantClip: { key: ClipKey; t: number } | null = null

      if (seg.kind === 'hold') {
        const key = seg.kiosk && vendedRef.current ? ('f4' as StillKey) : seg.media
        wantStill[key] = 1
      } else {
        const v = clipRefs.current[seg.video]
        if (v && clipReady.current[seg.video] && v.duration > 0) {
          wantClip = { key: seg.video, t: (seg.from + (seg.to - seg.from) * smooth(frac)) * v.duration }
        } else {
          const a = smooth(frac)
          wantStill[seg.fromImg] = 1 // base layer fully opaque to avoid bg bleed
          wantStill[seg.toImg] = a
        }
      }

      for (const [k, el] of Object.entries(stillRefs.current)) {
        const o = wantStill[k as StillKey]
        el.style.opacity = o !== undefined ? String(o) : '0'
        el.style.zIndex = o !== undefined && o < 1 ? '2' : '1'
      }
      for (const [k, el] of Object.entries(clipRefs.current)) {
        if (wantClip && k === wantClip.key) {
          el.style.opacity = '1'
          const dt = Math.abs(el.currentTime - wantClip.t)
          if (dt > 0.02) el.currentTime = wantClip.t
        } else {
          el.style.opacity = '0'
        }
      }

      let copy: CopyKey | null = null
      if (seg.kind === 'hold' && seg.copy) {
        if (idx === 0) copy = frac < 0.3 ? seg.copy : null
        else if (idx === SEGS.length - 1) copy = frac > 0.65 ? seg.copy : null
        else if (seg.kiosk && isCompactLayout())
          // compact: the copy shows briefly, then clears out before the
          // panel zoom completes so the kiosk gets the whole viewport
          copy = frac > 0.02 && frac < 0.2 ? seg.copy : null
        else copy = frac > 0.08 && frac < 0.92 ? seg.copy : null
      }
      if (copy !== lastCopy) {
        lastCopy = copy
        setActiveCopy(copy)
      }
      const kioskOn = seg.kind === 'hold' && !!seg.kiosk
      if (kioskOn !== lastKiosk) {
        lastKiosk = kioskOn
        setKioskLive(kioskOn)
      }
    }

    // apply synchronously: rAF is starved in backgrounded tabs and scroll
    // events are already frame-aligned in modern browsers
    const onScroll = () => apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    apply()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [bounds])

  // ---------- vend round-trip: kiosk dispenses -> play vend clip / shake ----------
  useEffect(() => {
    const off = bus.on('dispense', ({ txnId }) => {
      setVending(true)
      const finish = () => {
        vendedRef.current = true
        setVending(false)
        bus.emit('dispense-result', { txnId, ok: true })
        window.dispatchEvent(new Event('scroll'))
      }
      const vend = vendRef.current
      if (vend && clipReady.current.t3) {
        vend.style.opacity = '1'
        vend.currentTime = 0
        void vend.play()
        vend.onended = () => {
          vend.style.opacity = '0'
          finish()
        }
      } else {
        // clip t3 not generated yet: CSS shake + crossfade to the vended still
        stageRef.current?.classList.add('l-shake')
        window.setTimeout(() => {
          stageRef.current?.classList.remove('l-shake')
          finish()
        }, 1400)
      }
    })
    const offState = bus.on('state', ({ screen }) => {
      // a fresh session un-vends the tray when the kiosk resets to attract
      if (screen === 'Q_GOALS' && vendedRef.current) {
        vendedRef.current = false
        window.dispatchEvent(new Event('scroll'))
      }
    })
    return () => {
      off()
      offState()
    }
  }, [])

  const scrollToKiosk = () => {
    const vh = window.innerHeight / 100
    const kioskIdx = SEGS.findIndex((s) => s.kind === 'hold' && s.kiosk)
    // compact layouts land past the intro copy, at the fully zoomed-in panel
    const offset = isCompactLayout() ? 55 : 20
    window.scrollTo({ top: (bounds[kioskIdx].start + offset) * vh, behavior: 'smooth' })
  }

  return (
    <div className="landing" style={{ height: `${TOTAL}vh` }}>
      <div className={`l-loader ${ready ? 'l-loader-done' : ''}`} aria-hidden={ready}>
        <span className="wordmark l-loader-brand">DETOX PLUS +</span>
        <div className="l-loader-bar">
          <div style={{ width: `${Math.min(100, Math.round((assetsLoaded / 12) * 100))}%` }} />
        </div>
      </div>

      <header className="l-nav">
        <span className="wordmark l-nav-brand">DETOX PLUS +</span>
        <div className="l-nav-right">
          <a className="l-nav-link" href="?hardware=1">
            {t(lang, 'navHardware')}
          </a>
          <div className="l-lang" role="group" aria-label="Language">
            <button
              className={lang === 'tr' ? 'on' : ''}
              aria-pressed={lang === 'tr'}
              onClick={() => switchLang('tr')}
            >
              TR
            </button>
            <span aria-hidden="true">/</span>
            <button
              className={lang === 'en' ? 'on' : ''}
              aria-pressed={lang === 'en'}
              onClick={() => switchLang('en')}
            >
              EN
            </button>
          </div>
          <button className="l-nav-cta" onClick={scrollToKiosk}>
            {t(lang, 'navCta')}
          </button>
        </div>
      </header>

      <div className={`l-stage${vending ? ' l-vending' : ''}`} ref={stageRef}>
        <div className="l-frame" ref={frameRef}>
          {(Object.keys(STILLS) as StillKey[]).map((k) => (
            <img
              key={k}
              src={STILLS[k]}
              alt=""
              className="l-media"
              onLoad={bumpAsset}
              onError={bumpAsset}
              style={{ opacity: k === 'f1' ? 1 : 0 }}
              ref={(el) => {
                if (el) stillRefs.current[k] = el
              }}
            />
          ))}
          {(Object.keys(CLIPS) as ClipKey[]).map((k) => (
            <video
              key={k}
              src={CLIPS[k]}
              className="l-media"
              style={{ opacity: 0 }}
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={() => {
                clipReady.current[k] = true
                bumpAsset()
                window.dispatchEvent(new Event('scroll'))
              }}
              onError={bumpAsset}
              ref={(el) => {
                if (el) clipRefs.current[k] = el
              }}
            />
          ))}
          {/* realtime vend playback (t3), sits above the scrub media */}
          <video
            ref={vendRef}
            src={CLIPS.t3}
            className="l-media l-vend"
            style={{ opacity: 0 }}
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={() => {
              clipReady.current.t3 = true
              bumpAsset()
            }}
            onError={bumpAsset}
          />

          {/* live kiosk on the machine's screen panel */}
          <div
            className={`l-panel ${kioskLive && !vending ? 'l-panel-live' : ''} ${touched ? 'l-touched' : ''}`}
            onPointerDownCapture={() => setTouched(true)}
            style={{
              left: `${PANEL.left}%`,
              top: `${PANEL.top}%`,
              width: `${PANEL.width}%`,
              height: `${PANEL.height}%`,
            }}
          >
            <div className="l-panel-scale">
              <KioskApp pinFirst="green-detox" />
            </div>
            <div className="l-panel-glare" />
          </div>
          <div
            className={`l-tap-badge ${kioskLive && !vending && !touched ? 'on' : ''}`}
            style={{ left: `${PANEL.left + PANEL.width + 1.4}%`, top: `${PANEL.top + 5}%` }}
          >
            <span className="l-tap-dot" />
            {t(lang, 'tapBadge')}
          </div>
        </div>

        {/* ---------- copy ---------- */}
        <section className={`l-copy l-copy-hero ${activeCopy === 'hero' ? 'on' : ''}`}>
          <p className="l-eyebrow">{t(lang, 'heroEyebrow')}</p>
          <h1>{lines(t(lang, 'heroTitle'))}</h1>
          <p className="l-sub">{t(lang, 'heroSub')}</p>
        </section>
        <p className={`l-scrollcue ${activeCopy === 'hero' ? 'on' : ''}`}>{t(lang, 'scrollCue')}<ChevronDownIcon className="l-cue-ic" /></p>

        <section className={`l-copy l-copy-left ${activeCopy === 'options' ? 'on' : ''}`}>
          <h2>{lines(t(lang, 'optionsTitle'))}</h2>
          <p className="l-sub">{t(lang, 'optionsSub')}</p>
        </section>

        <section className={`l-copy l-copy-right ${activeCopy === 'design' ? 'on' : ''}`}>
          <h2>{lines(t(lang, 'designTitle'))}</h2>
          <p className="l-sub">{t(lang, 'designSub')}</p>
          <ul className="l-chips">
            <li><SchoolIcon className="l-ic" />{t(lang, 'chipSchools')}</li>
            <li><HospitalIcon className="l-ic" />{t(lang, 'chipHospitals')}</li>
            <li><GymIcon className="l-ic" />{t(lang, 'chipGyms')}</li>
            <li><OfficeIcon className="l-ic" />{t(lang, 'chipOffices')}</li>
          </ul>
        </section>

        <section className={`l-copy l-copy-left ${activeCopy === 'tryit' ? 'on' : ''}`}>
          <p className="l-eyebrow">{t(lang, 'tryitEyebrow')}</p>
          <h2>{t(lang, 'tryitTitle')}</h2>
          <p className="l-sub">{t(lang, 'tryitSub')}</p>
          <p className="l-hint">{t(lang, 'tryitHint')}</p>
        </section>

        <section className={`l-copy l-copy-left l-copy-narrow ${activeCopy === 'drink' ? 'on' : ''}`}>
          <h2>{t(lang, 'drinkTitle')}</h2>
          <p className="l-sub">{t(lang, 'drinkSub')}</p>
        </section>

        <section className={`l-copy l-copy-left ${activeCopy === 'benefits' ? 'on' : ''}`}>
          <h2>{lines(t(lang, 'benefitsTitle'))}</h2>
          <ul className="l-stats">
            <li>
              <strong><LeafIcon className="l-ic" />{t(lang, 'stat1Title')}</strong>
              <span>{t(lang, 'stat1Sub')}</span>
            </li>
            <li>
              <strong><DigestionIcon className="l-ic" />{t(lang, 'stat2Title')}</strong>
              <span>{t(lang, 'stat2Sub')}</span>
            </li>
            <li>
              <strong><SparkleIcon className="l-ic" />{t(lang, 'stat3Title')}</strong>
              <span>{t(lang, 'stat3Sub')}</span>
            </li>
            <li>
              <strong><DropletIcon className="l-ic" />{t(lang, 'stat4Title')}</strong>
              <span>{t(lang, 'stat4Sub')}</span>
            </li>
          </ul>
        </section>

        <section className={`l-copy l-copy-hero ${activeCopy === 'finale' ? 'on' : ''}`}>
          <h2>{lines(t(lang, 'finaleTitle'))}</h2>
          <p className="l-sub">{t(lang, 'finaleSub')}</p>
          <div className="l-cta-row">
            <button className="l-cta" onClick={scrollToKiosk}>
              {t(lang, 'finaleCta')}
            </button>
            <a className="l-cta-ghost" href="?kiosk=1">
              {t(lang, 'finaleKiosk')}
            </a>
          </div>
          <p className="l-credit">
            {t(lang, 'credit')}{' '}
            <a href="https://ysnyns.com" target="_blank" rel="noreferrer">
              Yassin Younis
            </a>
            <span className="l-credit-sep">·</span>
            <a href="mailto:yasin@layermark.com">yasin@layermark.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}
