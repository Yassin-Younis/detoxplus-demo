import type { ScanFeatures } from './types'

// Honest demo-grade frame analysis: single pass over RGBA pixels, no ML claims.
// Everything here runs on-device; results are presented as "wellness indicators",
// never as medical measurements.

export function analyzeFrame(rgba: Uint8ClampedArray, width: number, height: number): ScanFeatures {
  const n = width * height
  let lumaSum = 0
  let lumaSqSum = 0
  let warmSum = 0
  let skinCount = 0
  let skinX = 0
  let skinY = 0

  for (let i = 0; i < n; i++) {
    const o = i * 4
    const r = rgba[o]
    const g = rgba[o + 1]
    const b = rgba[o + 2]
    const luma = 0.299 * r + 0.587 * g + 0.114 * b
    lumaSum += luma
    lumaSqSum += luma * luma
    warmSum += r - b
    // Cheap skin-tone heuristic: warm, mid-bright pixels with r > g > b ordering.
    if (r > 60 && r > g && g > b && r - g > 12 && r - g < 110 && luma > 40 && luma < 240) {
      skinCount++
      skinX += i % width
      skinY += (i / width) | 0
    }
  }

  const meanLuma = lumaSum / n
  const variance = Math.max(0, lumaSqSum / n - meanLuma * meanLuma)
  const stdDev = Math.sqrt(variance)

  // Lighting: best around mid luma with decent contrast; crushed or blown → low.
  const midness = 1 - Math.min(1, Math.abs(meanLuma - 128) / 128)
  const contrast = Math.min(1, stdDev / 64)
  const lighting = Math.max(0, Math.min(1, midness * 0.7 + contrast * 0.3))

  const coverage = skinCount / n
  let centered = 0
  let facePresent = false
  if (skinCount > 0) {
    const cx = skinX / skinCount / width // 0..1
    const cy = skinY / skinCount / height
    const dist = Math.hypot(cx - 0.5, cy - 0.42) // faces sit slightly above center
    centered = Math.max(0, 1 - dist / 0.5)
    facePresent = coverage > 0.05 && coverage < 0.75 && centered > 0.35
  }

  const warmth = Math.max(-1, Math.min(1, warmSum / n / 96))

  return { facePresent, coverage, centered, lighting, warmth, contrast, simulated: false }
}

/** Plausible canned features for the no-camera fallback (visibly labeled in the UI). */
export function simulatedScan(seed = Math.random()): ScanFeatures {
  const jitter = (base: number, spread: number) => base + (seed * 7919) % 1 * spread - spread / 2
  return {
    facePresent: true,
    coverage: 0.22,
    centered: Math.min(1, Math.max(0.6, jitter(0.8, 0.2))),
    lighting: Math.min(1, Math.max(0.5, jitter(0.72, 0.25))),
    warmth: Math.max(-0.4, Math.min(0.6, jitter(0.15, 0.3))),
    contrast: 0.55,
    simulated: true,
  }
}

/** Median-combine per-frame features captured during the scan window. */
export function aggregateScans(frames: ScanFeatures[]): ScanFeatures | null {
  const good = frames.filter((f) => f.facePresent)
  const pool = good.length >= 3 ? good : frames
  if (pool.length === 0) return null
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b)
    return s[(s.length / 2) | 0]
  }
  return {
    facePresent: good.length >= Math.max(2, frames.length * 0.3),
    coverage: median(pool.map((f) => f.coverage)),
    centered: median(pool.map((f) => f.centered)),
    lighting: median(pool.map((f) => f.lighting)),
    warmth: median(pool.map((f) => f.warmth)),
    contrast: median(pool.map((f) => f.contrast)),
    simulated: pool.some((f) => f.simulated),
  }
}
