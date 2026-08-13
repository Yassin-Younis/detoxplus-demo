import type { KioskContext, Season, TimeOfDay, WeatherKind } from './types'

// Ambient context for the recommender and the post-scan quips: local time,
// season, and live weather via Open-Meteo (free, no API key). The kiosk must
// never block on the network, so the fetch has a short timeout and falls back
// to a season-based guess flagged `simulated`.

/** Fixed machine location — the kiosk knows where it is installed. */
const KIOSK_COORDS = { lat: 41.015, lon: 28.979 } // Istanbul

const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${KIOSK_COORDS.lat}&longitude=${KIOSK_COORDS.lon}` +
  `&current=temperature_2m,weather_code&timezone=auto`

const FETCH_TIMEOUT_MS = 2500
const REFRESH_MS = 30 * 60_000

export function timeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'midday'
  if (h >= 17 && h < 22) return 'evening'
  return 'night'
}

export function season(date = new Date()): Season {
  const m = date.getMonth() + 1
  if (m === 12 || m <= 2) return 'winter'
  if (m <= 5) return 'spring'
  if (m <= 8) return 'summer'
  return 'autumn'
}

/** WMO weather code + temperature → the coarse kinds the copy banks know. */
function classifyWeather(code: number, tempC: number): WeatherKind {
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 99)) return 'rainy'
  if (code >= 71 && code <= 77) return 'cold' // snow reads as cold
  if (tempC >= 27) return 'hot'
  if (tempC <= 8) return 'cold'
  if (code <= 1) return 'sunny'
  return 'mild'
}

/** Season-based guess for when the weather fetch fails (offline demo). */
function guessedWeather(s: Season): WeatherKind {
  if (s === 'summer') return 'hot'
  if (s === 'winter') return 'cold'
  return 'mild'
}

export function defaultContext(date = new Date()): KioskContext {
  const s = season(date)
  return { timeOfDay: timeOfDay(date), season: s, weather: guessedWeather(s), tempC: null, simulated: true }
}

let cached: { at: number; weather: WeatherKind; tempC: number } | null = null

/** Resolve the full context; live weather when reachable, guess otherwise. */
export async function resolveContext(date = new Date()): Promise<KioskContext> {
  const base = defaultContext(date)
  if (cached && date.getTime() - cached.at < REFRESH_MS) {
    return { ...base, weather: cached.weather, tempC: cached.tempC, simulated: false }
  }
  try {
    const res = await fetch(WEATHER_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!res.ok) return base
    const data = (await res.json()) as { current?: { temperature_2m?: number; weather_code?: number } }
    const tempC = data.current?.temperature_2m
    const code = data.current?.weather_code
    if (typeof tempC !== 'number' || typeof code !== 'number') return base
    const weather = classifyWeather(code, tempC)
    cached = { at: date.getTime(), weather, tempC }
    return { ...base, weather, tempC, simulated: false }
  } catch {
    return base
  }
}
