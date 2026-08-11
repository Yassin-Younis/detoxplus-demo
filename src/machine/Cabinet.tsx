import type { ReactNode } from 'react'
import { PRODUCTS, formatPrice } from '../kiosk/engine/catalog'
import type { Product } from '../kiosk/engine/types'
import { JuiceBottle, ShotBottle, YogurtJar } from '../kiosk/Bottles'

// The DETOX PLUS + machine, built to the vision doc (p.16): white lightbox,
// black cabinet, left BODY SCAN panel, shelf rows with white label strips,
// fruit bins with price plaques, tagline strip, louvered grille + hatch.
// Pure demo chrome — everything it shows comes from the kiosk's catalog.

const juices = PRODUCTS.filter((p) => p.category === 'juice')
const shots = PRODUCTS.filter((p) => p.category === 'shot')
const yogurts = PRODUCTS.filter((p) => p.category === 'yogurt')
const fruits = PRODUCTS.filter((p) => p.category === 'fruit')

function shelfClass(highlightId: string | null, p: Product) {
  if (!highlightId) return 'm-item'
  return `m-item ${highlightId === p.id ? 'spot' : 'dim'}`
}

const FRUIT_LABEL_TR: Record<string, string> = {
  'fruit-lemon': 'LEMON',
  'fruit-lime': 'LIME',
  'fruit-apple': 'RED APPLE',
  'fruit-banana': 'BANANA',
}

function FruitBin({ product }: { product: Product }) {
  // a crate of fruits: three rows of simple circles
  const rows = [4, 3, 4]
  return (
    <div className="m-bin">
      <div className="m-bin-fruits">
        {rows.map((count, r) => (
          <div key={r} className="m-bin-row">
            {Array.from({ length: count }).map((_, i) => (
              <span
                key={i}
                className="m-fruit"
                style={{
                  background: `radial-gradient(circle at 32% 28%, ${product.colorSoft}, ${product.color} 68%)`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="m-bin-crate" />
    </div>
  )
}

interface Props {
  highlightId: string | null
  hatchOpen: boolean
  kiosk: ReactNode
}

export function Cabinet({ highlightId, hatchOpen, kiosk }: Props) {
  return (
    <>
      {/* illuminated lightbox */}
      <div className="m-lightbox">
        <span className="wordmark">DETOX PLUS +</span>
      </div>

      {/* cabinet body */}
      <div className="m-cabinet">
        {/* BODY SCAN panel */}
        <div className="m-panel">
          <div className="m-panel-label">BODY SCAN</div>
          <div className="m-screen-mount">
            <div className="m-screen-scale">{kiosk}</div>
            <div className="m-screen-glare" />
          </div>
          <div className="m-panel-dots">
            <i /> <i /> <i />
          </div>
        </div>

        {/* shelves */}
        <div className="m-shelves">
          <div className="m-led" />

          {/* juices */}
          <div className="m-row m-row-juice">
            {juices.map((p) =>
              [0, 1].map((i) => (
                <div key={`${p.id}-${i}`} className={shelfClass(highlightId, p)} data-pid={p.id}>
                  <JuiceBottle product={p} width={58} />
                </div>
              )),
            )}
          </div>
          <div className="m-strip">
            {juices.map((p) => (
              <span key={p.id}>{p.name.toUpperCase()}</span>
            ))}
          </div>

          {/* shots */}
          <div className="m-row m-row-shot">
            {shots.map((p) => (
              <div key={p.id} className={shelfClass(highlightId, p)} data-pid={p.id}>
                <ShotBottle product={p} width={42} />
              </div>
            ))}
          </div>
          <div className="m-strip">
            <span>DETOX SHOTS · COLD PRESSED · 60&nbsp;ml</span>
          </div>

          {/* yogurts */}
          <div className="m-row m-row-yogurt">
            {yogurts.map((p) => (
              <div key={p.id} className={shelfClass(highlightId, p)} data-pid={p.id}>
                <YogurtJar product={p} width={58} />
              </div>
            ))}
          </div>
          <div className="m-strip">
            <span>PROBIOTIC YOGURT · LIVE CULTURE</span>
          </div>

          {/* fruit bins + price plaques */}
          <div className="m-row m-row-fruit">
            {fruits.map((p) => (
              <FruitBin key={p.id} product={p} />
            ))}
          </div>
          <div className="m-plaques">
            {fruits.map((p) => (
              <div key={p.id} className="m-plaque">
                <b>{formatPrice(p.priceCents)}</b>
                <span>{FRUIT_LABEL_TR[p.id] ?? p.name.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* glass over the shelf zone */}
        <div className="m-glass" />
      </div>

      {/* tagline */}
      <div className="m-tagline">Fresh · Natural · Daily Detox</div>

      {/* grille + delivery hatch */}
      <div className="m-grille">
        <div className={`m-hatch ${hatchOpen ? 'open' : ''}`}>
          <div className="m-hatch-recess" />
          <div className="m-hatch-flap" />
          <div className="m-hatch-label">PICK UP</div>
        </div>
      </div>
    </>
  )
}
