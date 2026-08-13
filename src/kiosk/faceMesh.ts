// The scan screen's "intelligent analysis" reveal, ported from Depuff's
// face-reveal canvas (components/analyze/face-reveal-canvas.tsx + reveal-shared)
// and recolored to the DETOX PLUS + palette. Runs over LIVE video via Google
// MediaPipe FaceLandmarker (tasks-vision):
//   vignette dims → glow motes drift + scan line sweeps → mesh fades up →
//   5 face zones light up one-by-one (feathered spotlight, glow outline,
//   expanding ping ring, wellness callout label).
// Assets live in /mediapipe; if they can't load, the scan runs without the mesh.

import type { Category, FaceLandmarker as FaceLandmarkerT, NormalizedLandmark } from '@mediapipe/tasks-vision'
import type { ExpressionAverages } from './engine/types'
import type { Lang } from './i18n'

// ---- timeline (ms) — Depuff's orchestrator, gently retimed for the kiosk ----
const VIGNETTE_MS = 600
const SCAN_SWEEP_MS = 1150
const MESH_DELAY_MS = 700
const MESH_FADE_MS = 700
export const ZONE_START_MS = 2000
export const ZONE_PERIOD_MS = 2100
const PING_MS = 820
const PARTICLE_FADE_MS = 700
const PARTICLE_DRIFT_MS = 3200
const PARTICLE_BASELINE = 0.4
const PULSE_MS = 4400
const COMPILE_MS = 1000
export const REVEAL_TOTAL_MS = ZONE_START_MS + 5 * ZONE_PERIOD_MS + COMPILE_MS // 13.5s

// ---- DETOX PLUS + reveal palette (Depuff's violet remapped to brand green) ----
const C = {
  mesh: 'rgba(198, 228, 178, 0.40)',
  glow: 'rgba(242, 250, 232, 0.95)',
  scanCore: 'rgba(198, 232, 162, 0.95)',
  scanTrail: 'rgba(96, 148, 66, 0.32)',
  particle: '#cfe8b8',
  ping: '#7fb069',
  pingOuter: 'rgba(242, 250, 232, 0.9)',
  vignette: 'rgba(6, 9, 4, 0.82)',
  darken: 'rgba(5, 8, 4, 0.55)',
  wash: 'rgba(127, 176, 105, 0.28)',
  washLine: 'rgba(255, 255, 255, 0.95)',
  label: 'rgba(247, 244, 238, 0.95)',
  labelDim: 'rgba(247, 244, 238, 0.55)',
}

// ---- face zones — MediaPipe 468-pt landmark index sets (Depuff lib/analyze/zones.ts) ----
interface ZoneArea {
  kind: 'polygon' | 'line'
  idx: number[]
}

// Wellness zones for a JUICE machine — each highlighted region maps to one of
// the recommendation axes, scanned top of the face downward. The caption names
// the anatomy that's actually lit plus the read taken there.
const ZONES: { areas: ZoneArea[]; label: Record<Lang, string> }[] = [
  {
    // forehead + brow band → stress / calm axis
    areas: [
      { kind: 'polygon', idx: [21, 71, 70, 63, 105, 66, 107, 9, 336, 296, 334, 293, 300, 301, 251, 284, 332, 297, 338, 10, 109, 67, 103, 54, 68] },
    ],
    label: { tr: 'Alın: stres', en: 'Forehead: stress' },
  },
  {
    // under-eye / upper cheeks → fatigue / energy axis
    areas: [
      { kind: 'polygon', idx: [34, 116, 143, 227, 127, 234, 137, 123, 111, 117, 35, 31, 228, 229, 118, 119, 230, 120, 231, 100, 47, 121, 232, 101] },
      { kind: 'polygon', idx: [264, 356, 447, 454, 323, 366, 452, 350, 277, 329, 330] },
    ],
    label: { tr: 'Göz altı: yorgunluk', en: 'Under-eye: fatigue' },
  },
  {
    // lower cheeks → vitality / circulation
    areas: [
      { kind: 'polygon', idx: [58, 93, 116, 117, 123, 132, 137, 138, 147, 172, 177, 187, 192, 213, 215, 227, 234, 50, 205, 207, 216, 135, 136] },
      { kind: 'polygon', idx: [323, 345, 352, 366, 447, 454, 288, 361, 367, 376, 401, 411, 416, 433, 435, 280, 425, 427, 434, 436, 397, 364, 432, 365] },
    ],
    label: { tr: 'Yanaklar: canlılık', en: 'Cheeks: vitality' },
  },
  {
    // lips (outer ring) → hydration axis — the classic dryness read
    areas: [
      { kind: 'polygon', idx: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185] },
    ],
    label: { tr: 'Dudaklar: nem', en: 'Lips: hydration' },
  },
  {
    // chin patch → digestion axis (the wellness skin-mapping trope, on brand here)
    areas: [{ kind: 'polygon', idx: [148, 171, 176, 152, 175, 377, 396, 400, 208, 199, 428] }],
    label: { tr: 'Çene: sindirim', en: 'Chin: digestion' },
  },
]

const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150,
  136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
]

// ---- helpers ----

const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const clamp01 = (t: number) => Math.max(0, Math.min(1, t))

interface Pt {
  x: number
  y: number
}

function convexHull(points: Pt[]): Pt[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  if (pts.length < 3) return pts
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const lower: Pt[] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: Pt[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  upper.pop()
  lower.pop()
  return lower.concat(upper)
}

/** Smooth closed/open path through points via quadratic midpoints. */
function tracePath(ctx: CanvasRenderingContext2D, pts: Pt[], closed: boolean) {
  if (pts.length < 2) return
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2
    const my = (pts[i].y + pts[i + 1].y) / 2
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
  }
  const last = pts[pts.length - 1]
  ctx.lineTo(last.x, last.y)
  if (closed) ctx.closePath()
}

// ---- landmarker loading ----

let landmarkerPromise: Promise<FaceLandmarkerT | null> | null = null

function loadLandmarker(): Promise<FaceLandmarkerT | null> {
  landmarkerPromise ??= (async () => {
    try {
      const { FaceLandmarker } = await import('@mediapipe/tasks-vision')
      return await FaceLandmarker.createFromOptions(
        {
          wasmLoaderPath: 'mediapipe/wasm/vision_wasm_internal.js',
          wasmBinaryPath: 'mediapipe/wasm/vision_wasm_internal.wasm',
        },
        {
          baseOptions: { modelAssetPath: 'mediapipe/face_landmarker.task', delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true, // expression read → post-scan mood
        },
      )
    } catch {
      return null
    }
  })()
  return landmarkerPromise
}

export interface MeshController {
  readonly detected: boolean
  /** Zone currently being inspected (-1 detecting, 0..4, 5+ compiling). */
  readonly zoneIndex: number
  /** Blendshape averages over the scan so far; null before any face frame. */
  expression(): ExpressionAverages | null
  stop(): void
}

// blendshape categoryNames → the coarse channels the mood classifier reads
const EXPRESSION_CHANNELS: Record<keyof ExpressionAverages, string[]> = {
  smile: ['mouthSmileLeft', 'mouthSmileRight'],
  frown: ['mouthFrownLeft', 'mouthFrownRight'],
  browDown: ['browDownLeft', 'browDownRight'],
  browInnerUp: ['browInnerUp'],
  eyeClosed: ['eyeBlinkLeft', 'eyeBlinkRight'],
  eyeSquint: ['eyeSquintLeft', 'eyeSquintRight'],
  jawOpen: ['jawOpen'],
}

export async function startFaceReveal(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  lang: Lang,
): Promise<MeshController | null> {
  const landmarker = await loadLandmarker()
  if (!landmarker) return null
  const { FaceLandmarker } = await import('@mediapipe/tasks-vision')
  const tesselation = FaceLandmarker.FACE_LANDMARKS_TESSELATION

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // fixed particle field, seeded once the face box is first known
  let particles: { x: number; y: number; r: number; phase: number; range: number }[] | null = null

  let raf = 0
  let stopped = false
  let detected = false
  let zoneIndex = -1
  const t0 = performance.now()
  let smoothed: Pt[] | null = null
  let lastSeen = 0

  // running blendshape sums for the expression read
  const exprKeys = Object.keys(EXPRESSION_CHANNELS) as (keyof ExpressionAverages)[]
  const exprSums = Object.fromEntries(exprKeys.map((k) => [k, 0])) as Record<keyof ExpressionAverages, number>
  let exprFrames = 0

  const accumulateExpression = (categories: Category[] | undefined) => {
    if (!categories?.length) return
    const byName = new Map(categories.map((c) => [c.categoryName, c.score]))
    for (const key of exprKeys) {
      const names = EXPRESSION_CHANNELS[key]
      let sum = 0
      for (const n of names) sum += byName.get(n) ?? 0
      exprSums[key] += sum / names.length
    }
    exprFrames++
  }

  const draw = () => {
    if (stopped) return
    raf = requestAnimationFrame(draw)
    if (video.readyState < 2) return

    const now = performance.now()
    const t = now - t0
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const elW = canvas.clientWidth
    const elH = canvas.clientHeight
    if (canvas.width !== Math.round(elW * dpr)) canvas.width = Math.round(elW * dpr)
    if (canvas.height !== Math.round(elH * dpr)) canvas.height = Math.round(elH * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, elW, elH)

    // detect + exponentially smooth landmarks (live video jitters; Depuff had a still)
    let lm: NormalizedLandmark[] | undefined
    try {
      const result = landmarker.detectForVideo(video, now)
      lm = result?.faceLandmarks?.[0]
      if (lm) accumulateExpression(result?.faceBlendshapes?.[0]?.categories)
    } catch {
      /* keep last frame */
    }
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (lm && vw && vh) {
      const scale = Math.max(elW / vw, elH / vh)
      const ox = (elW - vw * scale) / 2
      const oy = (elH - vh * scale) / 2
      // mirror x to match the selfie video (labels stay readable)
      const mapped = lm.map((p) => ({ x: elW - (p.x * vw * scale + ox), y: p.y * vh * scale + oy }))
      if (!smoothed || smoothed.length !== mapped.length) smoothed = mapped
      else {
        const a = 0.35
        for (let i = 0; i < mapped.length; i++) {
          smoothed[i].x += (mapped[i].x - smoothed[i].x) * a
          smoothed[i].y += (mapped[i].y - smoothed[i].y) * a
        }
      }
      lastSeen = now
    }
    detected = now - lastSeen < 600 && !!smoothed
    if (!detected || !smoothed) return
    const pts = smoothed

    // face box from the oval ring, padded (Depuff computeFaceBox)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const i of FACE_OVAL) {
      const p = pts[i]
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    }
    const padX = (maxX - minX) * 0.1
    const padY = (maxY - minY) * 0.08
    const box = {
      x: minX - padX,
      y: minY - padY,
      w: maxX - minX + padX * 2,
      h: maxY - minY + padY * 2,
    }
    const boxC = { x: box.x + box.w / 2, y: box.y + box.h / 2 }
    const glowBlur = Math.max(4, elW * 0.014)

    particles ??= Array.from({ length: 16 }, () => ({
      x: box.x + Math.random() * box.w,
      y: box.y + Math.random() * box.h,
      r: elW * (0.004 + Math.random() * 0.006),
      phase: Math.random(),
      range: box.h * (0.12 + Math.random() * 0.2),
    }))

    // ---- timeline values ----
    const vignette = easeOutQuad(clamp01(t / VIGNETTE_MS))
    const meshAlpha = easeOutQuad(clamp01((t - MESH_DELAY_MS) / MESH_FADE_MS))
    const zoneT = t - ZONE_START_MS
    zoneIndex = zoneT < 0 ? -1 : Math.floor(zoneT / ZONE_PERIOD_MS)
    const scanFade = t < 280 ? t / 280 : zoneT > -450 ? clamp01(1 - (zoneT + 450) / 450) : 1
    const sweep = 0.5 - 0.5 * Math.cos(((t % (SCAN_SWEEP_MS * 2)) / (SCAN_SWEEP_MS * 2)) * Math.PI * 2)
    const particleEnv =
      t < PARTICLE_FADE_MS
        ? easeOutQuad(t / PARTICLE_FADE_MS)
        : zoneT < 0
          ? 1
          : Math.max(PARTICLE_BASELINE, 1 - (zoneT / 700) * (1 - PARTICLE_BASELINE))
    const drift = (t % PARTICLE_DRIFT_MS) / PARTICLE_DRIFT_MS
    const pulse = 0.5 - 0.5 * Math.cos(((t % PULSE_MS) / PULSE_MS) * Math.PI * 2)

    // ---- vignette: radial darken so the face pops ----
    const grad = ctx.createRadialGradient(boxC.x, boxC.y, 0, boxC.x, boxC.y, Math.max(elW, elH) * 0.72)
    grad.addColorStop(0, 'rgba(6,9,4,0)')
    grad.addColorStop(0.55, 'rgba(6,9,4,0)')
    grad.addColorStop(1, C.vignette)
    ctx.globalAlpha = vignette
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, elW, elH)
    ctx.globalAlpha = 1

    // ---- mesh tessellation fade-up ----
    if (meshAlpha > 0.01) {
      ctx.globalAlpha = meshAlpha
      ctx.lineWidth = Math.max(0.5, elW * 0.0016)
      ctx.strokeStyle = C.mesh
      ctx.beginPath()
      for (const e of tesselation) {
        const a = pts[e.start]
        const b = pts[e.end]
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // ---- drifting glow motes ----
    if (particleEnv > 0.01) {
      for (const p of particles) {
        const pt = (drift + p.phase) % 1
        ctx.globalAlpha = Math.sin(pt * Math.PI) * particleEnv * 0.9
        ctx.fillStyle = C.particle
        ctx.shadowColor = C.particle
        ctx.shadowBlur = p.r * 3
        ctx.beginPath()
        ctx.arc(p.x, p.y - pt * p.range, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    // ---- scan line: soft trailing band + bright core ----
    if (scanFade > 0.01) {
      const y = box.y + sweep * box.h
      const band = Math.max(24, box.h * 0.16)
      const bandGrad = ctx.createLinearGradient(0, y - band, 0, y)
      bandGrad.addColorStop(0, 'rgba(96,148,66,0)')
      bandGrad.addColorStop(1, C.scanTrail)
      ctx.globalAlpha = scanFade
      ctx.fillStyle = bandGrad
      ctx.fillRect(box.x, y - band, box.w, band)
      ctx.fillStyle = C.scanCore
      ctx.shadowColor = C.scanCore
      ctx.shadowBlur = glowBlur * 0.6
      ctx.fillRect(box.x, y - 1.5, box.w, 3)
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }

    // ---- zone spotlight (Depuff ZoneFocus): darken all, feather-punch the zone, glow it ----
    if (zoneIndex >= 0 && zoneIndex < ZONES.length) {
      const zone = ZONES[zoneIndex]
      const zt = zoneT - zoneIndex * ZONE_PERIOD_MS
      const intro = easeOutQuad(clamp01(zt / 700))
      const feather = Math.max(4, 18 * (elW / 500))
      const areas = zone.areas.map((a) => {
        const zonePts = a.idx.map((i) => pts[i])
        return { ...a, pts: a.kind === 'polygon' ? convexHull(zonePts) : zonePts }
      })

      // darken + punch-out (feathered via canvas filter blur)
      ctx.save()
      ctx.globalAlpha = intro
      ctx.fillStyle = C.darken
      ctx.fillRect(0, 0, elW, elH)
      ctx.globalCompositeOperation = 'destination-out'
      try {
        ctx.filter = `blur(${feather}px)`
      } catch {
        /* filter unsupported → hard edge */
      }
      for (const a of areas) {
        if (a.kind === 'line') {
          tracePath(ctx, a.pts, false)
          ctx.lineWidth = Math.max(18, elW * 0.05)
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.strokeStyle = '#fff'
          ctx.stroke()
        } else {
          tracePath(ctx, a.pts, true)
          ctx.fillStyle = '#fff'
          ctx.fill()
        }
      }
      ctx.filter = 'none'
      ctx.restore()

      // brand wash + glow outline per area
      const glowAlpha = (0.55 + 0.25 * pulse) * intro
      for (const a of areas) {
        if (a.kind === 'line') {
          ctx.globalAlpha = glowAlpha
          ctx.strokeStyle = C.glow
          ctx.shadowColor = C.ping
          ctx.shadowBlur = glowBlur
          ctx.lineWidth = Math.max(3, elW * 0.008)
          ctx.lineCap = 'round'
          tracePath(ctx, a.pts, false)
          ctx.stroke()
          ctx.shadowBlur = 0
          ctx.globalAlpha = intro
          ctx.strokeStyle = C.washLine
          ctx.lineWidth = Math.max(1.2, elW * 0.003)
          tracePath(ctx, a.pts, false)
          ctx.stroke()
        } else {
          ctx.globalAlpha = (0.4 + 0.2 * pulse) * intro
          ctx.fillStyle = C.wash
          tracePath(ctx, a.pts, true)
          ctx.fill()
          ctx.globalAlpha = glowAlpha
          ctx.strokeStyle = C.ping
          ctx.shadowColor = C.ping
          ctx.shadowBlur = glowBlur
          ctx.lineWidth = Math.max(2, elW * 0.005)
          tracePath(ctx, a.pts, true)
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      }
      ctx.globalAlpha = 1

      // ping ring at lock-on (two concentric rings blooming from the zone centroid)
      const pingT = clamp01(zt / PING_MS)
      if (pingT < 1) {
        const first = areas[0].pts
        const cx = first.reduce((s, p) => s + p.x, 0) / first.length
        const cy = first.reduce((s, p) => s + p.y, 0) / first.length
        const base = Math.min(box.w, box.h) * 0.06
        const expand = Math.min(box.w, box.h) * 0.24
        const env = Math.sin(easeOutCubic(pingT) * Math.PI)
        ctx.lineWidth = Math.max(1.6, elW * 0.004)
        ctx.strokeStyle = C.ping
        ctx.globalAlpha = env * 0.5
        ctx.beginPath()
        ctx.arc(cx, cy, base + easeOutCubic(pingT) * expand * 0.55, 0, Math.PI * 2)
        ctx.stroke()
        ctx.strokeStyle = C.pingOuter
        ctx.globalAlpha = env * 0.9
        ctx.beginPath()
        ctx.arc(cx, cy, base + easeOutCubic(pingT) * expand, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // callout labels — completed zones dim with a ✓, the active one glows
      ctx.font = `500 ${Math.max(11, elW * 0.032)}px "Jost Variable", sans-serif`
      ctx.textAlign = 'left'
      const lx = Math.max(10, box.x - elW * 0.02)
      for (let i = 0; i <= Math.min(zoneIndex, ZONES.length - 1); i++) {
        const done = i < zoneIndex
        const ly = box.y + box.h * 0.12 + i * Math.max(16, elH * 0.034)
        ctx.globalAlpha = done ? 0.65 : intro
        ctx.fillStyle = done ? C.labelDim : C.label
        if (!done) {
          ctx.shadowColor = C.ping
          ctx.shadowBlur = 6
        }
        ctx.fillText(`${done ? '✓' : '◦'} ${ZONES[i].label[lang]}`, lx, ly)
        ctx.shadowBlur = 0
      }
      ctx.globalAlpha = 1
    }

    // ---- compiling tail: whole mesh pulses once, all labels ✓ ----
    if (zoneIndex >= ZONES.length) {
      const ct = clamp01((zoneT - ZONES.length * ZONE_PERIOD_MS) / COMPILE_MS)
      ctx.globalAlpha = Math.sin(ct * Math.PI) * 0.5
      ctx.strokeStyle = C.glow
      ctx.shadowColor = C.ping
      ctx.shadowBlur = glowBlur
      ctx.lineWidth = 0.8
      ctx.beginPath()
      for (const e of tesselation) {
        const a = pts[e.start]
        const b = pts[e.end]
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
      }
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }
  }
  raf = requestAnimationFrame(draw)

  return {
    get detected() {
      return detected
    },
    get zoneIndex() {
      return zoneIndex
    },
    expression() {
      if (exprFrames < 5) return null // too few face frames to call a mood
      return Object.fromEntries(exprKeys.map((k) => [k, exprSums[k] / exprFrames])) as unknown as ExpressionAverages
    },
    stop() {
      stopped = true
      cancelAnimationFrame(raf)
      const g = canvas.getContext('2d')
      g?.clearRect(0, 0, canvas.width, canvas.height)
    },
  }
}
