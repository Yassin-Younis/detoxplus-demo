import { noise, tone, out, ensureAudio } from '../kiosk/sfx'

// Mechanical sound design for the demo machine (machine → kiosk import is the
// allowed direction). All synthesized; respects the global mute.

export function sfxWhoosh() {
  noise({ duration: 0.45, gain: 0.08, filter: 'bandpass', freq: 300, freqEnd: 1400 })
}

export function sfxMotorWhirr(duration = 0.7) {
  tone({ freq: 95, freqEnd: 130, type: 'sawtooth', duration, gain: 0.05 })
  noise({ duration, gain: 0.03, filter: 'lowpass', freq: 500 })
}

export function sfxThud() {
  noise({ duration: 0.14, gain: 0.4, filter: 'lowpass', freq: 200, freqEnd: 60 })
  tone({ freq: 70, freqEnd: 45, type: 'sine', duration: 0.16, gain: 0.3 })
}

export function sfxClack() {
  noise({ duration: 0.06, gain: 0.18, filter: 'highpass', freq: 1800 })
}

let humNodes: { osc: OscillatorNode; gain: GainNode } | null = null

/** Faint refrigerator hum — starts after first user gesture, loops quietly. */
export function startAmbientHum() {
  const c = ensureAudio()
  const dest = out()
  if (!c || !dest || humNodes) return
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'sawtooth'
  osc.frequency.value = 50
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 120
  g.gain.value = 0.012
  osc.connect(filter).connect(g).connect(dest)
  osc.start()
  humNodes = { osc, gain: g }
}
