// Fixed design canvas for the machine (matches the vision doc's proportions).
// Every cabinet element and every camera-rig shot is defined in these coordinates.

export const CANVAS = { w: 940, h: 1300 }

/** BODY SCAN panel (bezel included) */
export const PANEL = { x: 34, y: 118, w: 296, h: 982 }

/** Kiosk screen mount inside the panel */
export const SCREEN = { x: 48, y: 172, w: 268, h: 842 }

/** Delivery hatch (inside the grille zone) */
export const HATCH = { x: 470, y: 1168, w: 260, h: 104 }

export type Shot = 'WIDE' | 'SCREEN' | 'HATCH'

/** What each shot frames, in canvas coordinates. */
export const SHOT_FOCUS: Record<Shot, { x: number; y: number; w: number; h: number; maxScale?: number }> = {
  WIDE: { x: -30, y: -20, w: CANVAS.w + 60, h: CANVAS.h + 60 },
  // panel plus a slice of shelves so the frame stays balanced on wide viewports
  SCREEN: { x: PANEL.x - 14, y: PANEL.y - 14, w: PANEL.w + 320, h: PANEL.h + 28 },
  HATCH: { x: 360, y: 1030, w: 480, h: 300, maxScale: 1.9 },
}

export function rigTransform(shot: Shot, vw: number, vh: number): string {
  const f = SHOT_FOCUS[shot]
  const pad = 24
  let s = Math.min((vw - pad) / f.w, (vh - pad) / f.h)
  if (f.maxScale) s = Math.min(s, f.maxScale)
  const tx = vw / 2 - s * (f.x + f.w / 2)
  const ty = vh / 2 - s * (f.y + f.h / 2)
  return `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(4)})`
}
