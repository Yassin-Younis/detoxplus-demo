// Generate warm voice clips for every kiosk line via the ElevenLabs API.
// Usage: ELEVENLABS_API_KEY=... node scripts/gen-voice.mjs [--force]
// Optional: VOICE_ID=... to pin a specific voice.
// Idempotent: existing clips are skipped unless --force.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { STATIC_LINES, resultsLine } from '../src/kiosk/voice/lines.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src/kiosk/voice')
const API = 'https://api.elevenlabs.io/v1'
const KEY = process.env.ELEVENLABS_API_KEY
const FORCE = process.argv.includes('--force')
if (!KEY) {
  console.error('ELEVENLABS_API_KEY not set')
  process.exit(1)
}

// Recommendable products, parsed from the engine catalog (id + name pairs).
const catalogSrc = readFileSync(join(ROOT, 'src/kiosk/engine/catalog.ts'), 'utf8')
const products = [...catalogSrc.matchAll(/id: '([^']+)',\s*\n\s*name: '([^']+)',\s*\n\s*category: '(juice|shot|yogurt)'/g)].map(
  (m) => ({ id: m[1], name: m[2] }),
)
if (products.length < 10) {
  console.error(`catalog parse looks wrong (found ${products.length} products)`)
  process.exit(1)
}

// Pick a warm female voice unless VOICE_ID is given.
async function pickVoice() {
  if (process.env.VOICE_ID) return process.env.VOICE_ID
  const res = await fetch(`${API}/voices`, { headers: { 'xi-api-key': KEY } })
  if (!res.ok) throw new Error(`voices: ${res.status}`)
  const { voices } = await res.json()
  const preferred = ['Matilda', 'Rachel', 'Sarah', 'Alice', 'Lily', 'Jessica']
  for (const name of preferred) {
    const v = voices.find((v) => v.name === name)
    if (v) return v.voice_id
  }
  const warm = voices.find((v) => JSON.stringify(v.labels ?? {}).toLowerCase().includes('warm'))
  return (warm ?? voices[0]).voice_id
}

async function tts(voiceId, text, outFile) {
  if (existsSync(outFile) && !FORCE) {
    console.log(`skip   ${outFile.replace(OUT + '/', '')}`)
    return
  }
  const res = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.3 },
    }),
  })
  if (!res.ok) throw new Error(`tts ${outFile}: ${res.status} ${await res.text()}`)
  writeFileSync(outFile, Buffer.from(await res.arrayBuffer()))
  console.log(`wrote  ${outFile.replace(OUT + '/', '')}`)
}

const defaultVoice = await pickVoice()
// Per-language voice override — Turkish needs a native Turkish voice or the
// accent is off (VOICE_ID_TR / VOICE_ID_EN).
const voiceFor = (lang) => process.env[`VOICE_ID_${lang.toUpperCase()}`] ?? defaultVoice
console.log(`voices: tr=${voiceFor('tr')} en=${voiceFor('en')}, products: ${products.length}`)

for (const lang of ['tr', 'en']) {
  mkdirSync(join(OUT, lang), { recursive: true })
  for (const [key, line] of Object.entries(STATIC_LINES)) {
    await tts(voiceFor(lang), line[lang], join(OUT, lang, `${key}.mp3`))
  }
  for (const p of products) {
    await tts(voiceFor(lang), resultsLine(lang, p.name), join(OUT, lang, `results-${p.id}.mp3`))
  }
}
console.log('done')
