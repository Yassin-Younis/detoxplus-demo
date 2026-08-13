import { STATIC_LINES, resultsLine } from './voice/lines.mjs'
import type { Product } from './engine/types'
import type { Quip } from './engine/quips'
import type { Lang } from './i18n'

// Voice output. Prefers pre-generated ElevenLabs clips (warm, human) bundled
// from ./voice/<lang>/<key>.mp3; falls back to browser speechSynthesis when a
// clip is missing (e.g. before generation has been run).

type StaticKey = keyof typeof STATIC_LINES

const CLIPS: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob('./voice/**/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>,
  ).map(([path, url]) => {
    // './voice/tr/qGoals.mp3' → 'tr/qGoals'
    const m = path.match(/voice\/(.+)\.mp3$/)
    return [m ? m[1] : path, url]
  }),
)

const LANG_TAGS: Record<Lang, string> = { tr: 'tr-TR', en: 'en-US' }

let enabled = true
let current: HTMLAudioElement | null = null

export function setSpeechEnabled(on: boolean) {
  enabled = on
  if (!on) cancelSpeech()
}

export function cancelSpeech() {
  if (current) {
    current.pause()
    current = null
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

// ---- speechSynthesis fallback ----

let voices: SpeechSynthesisVoice[] = []

function refreshVoices() {
  if ('speechSynthesis' in window) voices = window.speechSynthesis.getVoices()
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices)
}

function speakFallback(text: string, lang: Lang) {
  if (!('speechSynthesis' in window) || !text) return
  const synth = window.speechSynthesis
  synth.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  const tag = LANG_TAGS[lang]
  const voice =
    voices.find((v) => v.lang === tag && v.localService) ??
    voices.find((v) => v.lang === tag) ??
    voices.find((v) => v.lang.startsWith(tag.slice(0, 2))) ??
    null
  if (voice) utter.voice = voice
  utter.lang = tag
  utter.rate = 1.05
  utter.volume = 0.95
  synth.speak(utter)
}

// ---- public API ----

function playClip(key: string): boolean {
  const url = CLIPS[key]
  if (!url) return false
  cancelSpeech()
  current = new Audio(url)
  current.volume = 0.95
  void current.play().catch(() => {})
  return true
}

export function say(key: StaticKey, lang: Lang) {
  if (!enabled) return
  if (playClip(`${lang}/${key}`)) return
  speakFallback(STATIC_LINES[key][lang], lang)
}

export function sayResults(product: Product, lang: Lang) {
  if (!enabled) return
  if (playClip(`${lang}/results-${product.id}`)) return
  speakFallback(resultsLine(lang, product.name), lang)
}

/**
 * Speak the post-scan quip. Clips are pre-rendered only with the demo's
 * green-detox pick baked into the {product} slot, so any other product (or a
 * {temp} template, which has no clip) falls back to TTS of the resolved text.
 */
export function sayQuip(quip: Quip, productId: string, lang: Lang) {
  if (!enabled) return
  if (productId === 'green-detox' && playClip(`${lang}/quip-${quip.id}`)) return
  speakFallback(quip.spoken[lang], lang)
}

/**
 * Speak a dynamically composed line. No pre-rendered clip; goes straight to
 * the speechSynthesis fallback.
 */
export function sayText(text: string, lang: Lang) {
  if (!enabled) return
  cancelSpeech()
  speakFallback(text, lang)
}
