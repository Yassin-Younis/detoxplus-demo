import { useEffect, useRef, useState } from 'react'
import './machine.css'
import { KioskApp } from '../kiosk/KioskApp'
import { bus, type KioskScreen } from '../kiosk/bus'
import { byId } from '../kiosk/engine/catalog'
import type { Product } from '../kiosk/engine/types'
import { ProductArt } from '../kiosk/Bottles'
import { Cabinet } from './Cabinet'
import { CANVAS, HATCH, rigTransform, type Shot } from './layout'
import { ensureAudio } from '../kiosk/sfx'
import { sfxClack, sfxMotorWhirr, sfxThud, sfxWhoosh, startAmbientHum } from './sfx'

interface DispenseAnim {
  product: Product
  txnId: string
  from: { x: number; y: number; w: number; h: number }
  to: { x: number; y: number }
}

const shotFor = (screen: KioskScreen): Shot =>
  screen === 'ATTRACT' ? 'WIDE' : screen === 'DISPENSING' || screen === 'THANKS' ? 'HATCH' : 'SCREEN'

function FallingBottle({ anim, onLanded }: { anim: DispenseAnim; onLanded: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const dx = anim.to.x - anim.from.x
    // fall: upright, bottom touches the tray floor
    const dyStand = HATCH.y + HATCH.h - anim.from.h - 10 - anim.from.y
    // settle: lie down centered in the tray (bottles are taller than the recess)
    const dyLie = HATCH.y + HATCH.h / 2 - anim.from.h / 2 - 6 - anim.from.y
    sfxMotorWhirr(0.7)
    el.animate(
      [
        { transform: 'translate(0px, 0px) rotate(0deg)' },
        { transform: `translate(${dx * 0.25}px, ${dyStand * 0.14}px) rotate(-4deg)`, offset: 0.22 },
        { transform: `translate(${dx * 0.55}px, ${dyStand * 0.6}px) rotate(7deg)`, offset: 0.62 },
        { transform: `translate(${dx}px, ${dyStand}px) rotate(0deg)` },
      ],
      { duration: 880, easing: 'cubic-bezier(0.5, 0, 0.85, 0.55)', fill: 'forwards' },
    )
    // Sequence on timers, not onfinish: animation finish events stall in
    // backgrounded tabs, and the kiosk must get its dispense-result regardless.
    const tipTimer = window.setTimeout(() => {
      sfxThud()
      el.animate(
        [
          { transform: `translate(${dx}px, ${dyStand}px) rotate(0deg)` },
          { transform: `translate(${dx}px, ${dyStand - 10}px) rotate(24deg)`, offset: 0.3 },
          { transform: `translate(${dx}px, ${dyLie + 8}px) rotate(80deg)`, offset: 0.7 },
          { transform: `translate(${dx}px, ${dyLie}px) rotate(90deg)` },
        ],
        { duration: 520, easing: 'cubic-bezier(0.45, 0, 0.7, 1.2)', fill: 'forwards' },
      )
    }, 900)
    const landedTimer = window.setTimeout(onLanded, 1500)
    return () => {
      window.clearTimeout(tipTimer)
      window.clearTimeout(landedTimer)
      el.getAnimations().forEach((a) => a.cancel())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div
      ref={ref}
      className="m-falling"
      style={{ left: anim.from.x, top: anim.from.y, width: anim.from.w, height: anim.from.h }}
    >
      <ProductArt product={anim.product} width={anim.from.w} />
    </div>
  )
}

export function MachinePage() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [shot, setShot] = useState<Shot>('WIDE')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [screenLive, setScreenLive] = useState(false)
  const [anim, setAnim] = useState<DispenseAnim | null>(null)
  const machineRef = useRef<HTMLDivElement>(null)
  const shotRef = useRef<Shot>('WIDE')
  const lingerRef = useRef<number | null>(null)

  const isMobile = vp.w < 720

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ambient fridge hum after the first interaction (autoplay policy)
  useEffect(() => {
    const unlock = () => {
      ensureAudio()
      startAmbientHum()
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  // camera rig follows kiosk state
  useEffect(() => {
    const changeShot = (next: Shot) => {
      if (shotRef.current !== next) {
        shotRef.current = next
        setShot(next)
        sfxWhoosh()
      }
    }
    const offState = bus.on('state', ({ screen }) => {
      if (lingerRef.current) {
        window.clearTimeout(lingerRef.current)
        lingerRef.current = null
      }
      setScreenLive(screen !== 'ATTRACT')
      const next = shotFor(screen)
      if (screen === 'THANKS') {
        // linger on the vended bottle, then pull back wide
        changeShot('HATCH')
        lingerRef.current = window.setTimeout(() => changeShot('WIDE'), 2200)
      } else {
        changeShot(next)
      }
      if (screen === 'ATTRACT') setAnim(null)
    })
    const offHighlight = bus.on('highlight', ({ productId }) => setHighlightId(productId))
    const offDispense = bus.on('dispense', ({ productId, txnId }) => {
      const product = byId(productId)
      const machineEl = machineRef.current
      if (!product || !machineEl) {
        bus.emit('dispense-result', { txnId, ok: false })
        return
      }
      const shelfEl = machineEl.querySelector(`[data-pid="${productId}"]`)
      const machineRect = machineEl.getBoundingClientRect()
      const scale = machineRect.width / CANVAS.w
      let from = { x: CANVAS.w / 2 - 30, y: 300, w: 58, h: 151 }
      if (shelfEl) {
        const r = shelfEl.getBoundingClientRect()
        from = {
          x: (r.left - machineRect.left) / scale,
          y: (r.top - machineRect.top) / scale,
          w: r.width / scale,
          h: r.height / scale,
        }
      }
      const to = {
        x: HATCH.x + (HATCH.w - from.w) / 2,
        y: HATCH.y + HATCH.h - from.h - 6,
      }
      setAnim({ product, txnId, from, to })
    })
    return () => {
      offState()
      offHighlight()
      offDispense()
    }
  }, [])

  // hatch flap clack when it closes (anim cleared on ATTRACT)
  const prevAnimRef = useRef<DispenseAnim | null>(null)
  useEffect(() => {
    if (prevAnimRef.current && !anim) sfxClack()
    prevAnimRef.current = anim
  }, [anim])

  if (isMobile) {
    return (
      <div className="mpage mpage-mobile">
        <header className="m-header">
          <span className="wordmark m-header-brand">DETOX PLUS +</span>
          <a className="m-header-link" href="?kiosk=1">
            Kiosk ↗
          </a>
        </header>
        <div className="m-mobile-kiosk">
          <KioskApp standalone />
        </div>
      </div>
    )
  }

  return (
    <div className="mpage">
      <header className="m-header">
        <span className="wordmark m-header-brand">DETOX PLUS +</span>
        <span className="m-header-tag">Smart Vending · Proof of Concept</span>
        <a className="m-header-link" href="?kiosk=1">
          Open kiosk fullscreen ↗
        </a>
      </header>

      <div className="m-stage">
        <div className="m-rig" style={{ transform: rigTransform(shot, vp.w, vp.h) }}>
          <div className="m-floor-shadow" />
          <div className="machine" ref={machineRef} data-screen-live={screenLive}>
            <Cabinet highlightId={highlightId} hatchOpen={anim !== null} kiosk={<KioskApp />} />
            {anim && (
              <FallingBottle
                key={anim.txnId}
                anim={anim}
                onLanded={() => bus.emit('dispense-result', { txnId: anim.txnId, ok: true })}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
