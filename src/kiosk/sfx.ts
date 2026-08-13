import { setSpeechEnabled } from './speech'

// WebAudio-synthesized sound design — zero audio assets, tiny bundle.
// The shared context/mute core also serves machine/sfx.ts (machine → kiosk
// imports are allowed; never the reverse).

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false

export function ensureAudio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as any).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 1
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function isMuted() {
  return muted
}

export function setMuted(on: boolean) {
  muted = on
  if (master) master.gain.value = on ? 0 : 1
  setSpeechEnabled(!on)
}

export function out(): GainNode | null {
  return ensureAudio() ? master : null
}

/** Short enveloped oscillator blip. */
export function tone(opts: {
  freq: number
  freqEnd?: number
  type?: OscillatorType
  duration?: number
  gain?: number
  delay?: number
}) {
  const c = ensureAudio()
  const dest = out()
  if (!c || !dest) return
  const { freq, freqEnd, type = 'sine', duration = 0.12, gain = 0.15, delay = 0 } = opts
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + duration)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(g).connect(dest)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

/** White-noise burst through a filter — thuds, clacks, whooshes. */
export function noise(opts: {
  duration?: number
  gain?: number
  filter?: BiquadFilterType
  freq?: number
  freqEnd?: number
  delay?: number
}) {
  const c = ensureAudio()
  const dest = out()
  if (!c || !dest) return
  const { duration = 0.2, gain = 0.2, filter = 'lowpass', freq = 800, freqEnd, delay = 0 } = opts
  const t0 = c.currentTime + delay
  const frames = Math.max(1, Math.floor(c.sampleRate * duration))
  const buffer = c.createBuffer(1, frames, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buffer
  const biquad = c.createBiquadFilter()
  biquad.type = filter
  biquad.frequency.setValueAtTime(freq, t0)
  if (freqEnd) biquad.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + duration)
  const g = c.createGain()
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  src.connect(biquad).connect(g).connect(dest)
  src.start(t0)
}

// ---- Kiosk UI sounds ----

export const sfxTap = () => tone({ freq: 660, freqEnd: 520, type: 'triangle', duration: 0.07, gain: 0.12 })

export const sfxSelect = () => {
  tone({ freq: 520, type: 'triangle', duration: 0.06, gain: 0.1 })
  tone({ freq: 780, type: 'triangle', duration: 0.09, gain: 0.1, delay: 0.05 })
}

export const sfxTick = () => tone({ freq: 1250, type: 'square', duration: 0.03, gain: 0.035 })

export const sfxChime = () => {
  tone({ freq: 523, type: 'sine', duration: 0.35, gain: 0.14 })
  tone({ freq: 659, type: 'sine', duration: 0.35, gain: 0.12, delay: 0.12 })
  tone({ freq: 784, type: 'sine', duration: 0.5, gain: 0.12, delay: 0.24 })
}

/** classic contactless-terminal double beep */
export const sfxPos = () => {
  tone({ freq: 1560, type: 'square', duration: 0.08, gain: 0.06 })
  tone({ freq: 1560, type: 'square', duration: 0.28, gain: 0.06, delay: 0.14 })
}

let scanNodes: { osc: OscillatorNode; gain: GainNode } | null = null

export function sfxScanStart() {
  const c = ensureAudio()
  const dest = out()
  if (!c || !dest || scanNodes) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(70, c.currentTime)
  osc.frequency.linearRampToValueAtTime(110, c.currentTime + 4)
  g.gain.setValueAtTime(0, c.currentTime)
  g.gain.linearRampToValueAtTime(0.05, c.currentTime + 0.4)
  osc.connect(g).connect(dest)
  osc.start()
  scanNodes = { osc, gain: g }
}

export function sfxScanStop() {
  const c = ctx
  if (!c || !scanNodes) return
  scanNodes.gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.25)
  scanNodes.osc.stop(c.currentTime + 0.3)
  scanNodes = null
}
