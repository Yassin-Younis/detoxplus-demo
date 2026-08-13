import type { ExpressionAverages, Mood } from './types'

// Blendshape averages → coarse mood. Pure and threshold-based on purpose:
// deterministic, tunable, and honest about being a vibe read, not affect
// science. Averages come from MediaPipe FaceLandmarker blendshapes collected
// over the whole scan window (~13s), so momentary blinks wash out.

export const NEUTRAL_EXPRESSION: ExpressionAverages = {
  smile: 0,
  frown: 0,
  browDown: 0,
  browInnerUp: 0,
  eyeClosed: 0,
  eyeSquint: 0,
  jawOpen: 0,
}

export function classifyMood(e: ExpressionAverages | null | undefined): Mood {
  if (!e) return 'neutral'
  // A held smile dominates everything else — happy people squint too.
  if (e.smile > 0.22) return 'happy'
  // Mouth-corner droop, or raised inner brows without a smile (classic sad brow).
  if (e.frown > 0.08 || (e.browInnerUp > 0.3 && e.smile < 0.08 && e.jawOpen < 0.2)) return 'sad'
  // Sustained brow furrow reads as tension.
  if (e.browDown > 0.22) return 'stressed'
  // Heavy lids: eyes part-closed or squinting through most of the scan.
  if (e.eyeClosed > 0.32 || e.eyeSquint > 0.38) return 'tired'
  return 'neutral'
}
