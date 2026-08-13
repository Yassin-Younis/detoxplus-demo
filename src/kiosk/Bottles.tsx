import type { Product } from './engine/types'

// Photorealistic renders (transparent PNGs, filename = product id) override the
// vector art wherever ProductArt is used; Vite inlines them into the build.
const ART: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob('./art/*.png', { eager: true, query: '?url', import: 'default' })).map(
    ([path, url]) => [path.replace('./art/', '').replace('.png', ''), url as string],
  ),
)

// Product renderings used by both the kiosk UI and the machine shelves
// (machine → kiosk imports are allowed; never the reverse).

export function JuiceBottle({ product, width = 64 }: { product: Product; width?: number }) {
  const h = width * 2.6
  return (
    <svg width={width} height={h} viewBox="0 0 64 166" aria-hidden="true">
      {/* cap */}
      <rect x="22" y="2" width="20" height="12" rx="2.5" fill="#f3f1ea" />
      <rect x="22" y="6" width="20" height="2" fill="#d8d4c8" />
      {/* neck + shoulders */}
      <path d="M24 14 h16 v8 c6 3 10 8 10 16 v118 a10 10 0 0 1 -10 10 H24 a10 10 0 0 1 -10 -10 V38 c0-8 4-13 10-16 z" fill={product.color} />
      {/* glass highlight */}
      <path d="M20 30 c-2 4 -2 8 -2 12 v112 a6 6 0 0 0 3 5" stroke="rgba(255,255,255,0.45)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* label */}
      <rect x="14" y="62" width="40" height="52" rx="3" fill="#faf8f2" />
      <text x="34" y="78" textAnchor="middle" fontSize="8.5" fontWeight="600" letterSpacing="0.5" fill="#1c1c1a" fontFamily="'Jost Variable', sans-serif">
        DETOX
      </text>
      <text x="34" y="88" textAnchor="middle" fontSize="8.5" fontWeight="600" letterSpacing="0.5" fill="#1c1c1a" fontFamily="'Jost Variable', sans-serif">
        PLUS+
      </text>
      <rect x="19" y="94" width="30" height="1.4" fill={product.color} />
      <text x="34" y="104" textAnchor="middle" fontSize="5.4" fontWeight="500" letterSpacing="0.4" fill={product.color} fontFamily="'Jost Variable', sans-serif">
        {product.name.toUpperCase().slice(0, 14)}
      </text>
    </svg>
  )
}

export function ShotBottle({ product, width = 34 }: { product: Product; width?: number }) {
  const h = width * 2.35
  return (
    <svg width={width} height={h} viewBox="0 0 34 80" aria-hidden="true">
      <rect x="10" y="1" width="14" height="9" rx="2" fill="#f3f1ea" />
      <path d="M11 10 h12 v5 c4 2 7 5 7 10 v45 a9 9 0 0 1 -9 9 H13 a9 9 0 0 1 -9 -9 V25 c0-5 3-8 7-10 z" fill={product.color} />
      <path d="M8 22 c-1 3 -1 5 -1 8 v38" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="6" y="34" width="22" height="26" rx="2" fill="#faf8f2" />
      <text x="17" y="43" textAnchor="middle" fontSize="5.4" fontWeight="600" letterSpacing="0.3" fill="#1c1c1a" fontFamily="'Jost Variable', sans-serif">
        DETOX
      </text>
      <text x="17" y="49" textAnchor="middle" fontSize="5.4" fontWeight="600" letterSpacing="0.3" fill="#1c1c1a" fontFamily="'Jost Variable', sans-serif">
        PLUS+
      </text>
      <rect x="9" y="52" width="16" height="1" fill={product.color} />
      <text x="17" y="57.5" textAnchor="middle" fontSize="3.1" fontWeight="500" fill={product.color} fontFamily="'Jost Variable', sans-serif">
        {product.name.replace(/ ?Shot$/i, '').toUpperCase().slice(0, 16)}
      </text>
    </svg>
  )
}

export function YogurtJar({ product, width = 44 }: { product: Product; width?: number }) {
  const h = width * 1.5
  return (
    <svg width={width} height={h} viewBox="0 0 44 66" aria-hidden="true">
      <rect x="3" y="2" width="38" height="10" rx="4" fill="#f3f1ea" />
      <rect x="3" y="8" width="38" height="2" fill="#d8d4c8" />
      <path d="M6 12 h32 v44 a8 8 0 0 1 -8 8 H14 a8 8 0 0 1 -8 -8 z" fill={product.color} />
      <path d="M9 16 v40 a5 5 0 0 0 2 4" stroke="rgba(255,255,255,0.5)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <rect x="8" y="24" width="28" height="24" rx="2" fill="#faf8f2" />
      <text x="22" y="32" textAnchor="middle" fontSize="5.6" fontWeight="600" letterSpacing="0.3" fill="#1c1c1a" fontFamily="'Jost Variable', sans-serif">
        DETOX
      </text>
      <text x="22" y="38.5" textAnchor="middle" fontSize="5.6" fontWeight="600" letterSpacing="0.3" fill="#1c1c1a" fontFamily="'Jost Variable', sans-serif">
        PLUS+
      </text>
      <rect x="11" y="41.5" width="22" height="4.4" rx="1" fill={product.colorSoft} />
      <text x="22" y="45" textAnchor="middle" fontSize="2.9" fontWeight="600" fill="#fff" fontFamily="'Jost Variable', sans-serif">
        {product.name.replace(/ ?Yogurt$/i, '').toUpperCase()}
      </text>
    </svg>
  )
}

export function ProductArt({ product, width }: { product: Product; width?: number }) {
  const art = ART[product.id]
  if (art) {
    const w = width ?? (product.category === 'shot' ? 34 : product.category === 'yogurt' ? 44 : 64)
    return <img src={art} alt="" width={w} style={{ display: 'block', height: 'auto' }} draggable={false} />
  }
  if (product.category === 'shot') return <ShotBottle product={product} width={width} />
  if (product.category === 'yogurt') return <YogurtJar product={product} width={width} />
  return <JuiceBottle product={product} width={width} />
}
