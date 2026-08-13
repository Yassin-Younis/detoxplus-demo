# DETOX PLUS + — Smart Vending Machine POC

Proof-of-concept demo for Ali's smart juice vending machine: a web page showing
the branded machine with a working touchscreen kiosk in its BODY SCAN panel.
The kiosk asks a few questions, runs a face scan (Google MediaPipe face
landmarks, animated analysis overlay, all on-device), speaks to the customer
(pre-generated ElevenLabs voices, Turkish + English), recommends a drink, and
"vends" it with a cinematic camera zoom + bottle drop.

## Run

```bash
npm install
npm run dev        # → http://localhost:5199 (camera works on localhost)
```

- Parallax landing (default): `http://localhost:5173/` — Apple-style scroll
  story built from fal.ai (Kling 2.1 Pro) transition clips of the machine
  renders, with the live kiosk mounted on the machine's screen in the
  "Say hello" section. The demo always vends Green Detox (`pinFirst` prop).
- Machine demo (original POC page): append `?machine=1`
- Kiosk alone (what would ship on real hardware): append `?kiosk=1`
- Sound starts after the first tap (browser autoplay policy); mute button is on
  the kiosk's top-right.
- No camera / permission denied → the scan falls back to a labeled simulated mode.

## Build / share

```bash
npm run build      # → dist/index.html (single file) + dist/mediapipe/
```

`dist/index.html` is self-contained (app, fonts, all voice clips inlined —
~2 MB) and can be sent as a single file; the face-mesh scan additionally needs
the `dist/mediapipe/` folder served next to it (zip both, or host the dist
folder). Opened without it, the scan gracefully runs without the mesh.

## Structure — the isolation story

```
src/kiosk/     THE PRODUCT — ships to real hardware unchanged
  engine/        pure-TS recommendation engine (catalog, scan features, scoring)
  screens/       attract → questions → scan → results → dispense
  faceMesh.ts    MediaPipe FaceLandmarker reveal (mesh, zone spotlights, pings)
  voice/         ElevenLabs clips (tr/en) + the line manifest
  bus.ts         the ONLY interface to the machine (events; WebSocket on real HW)
src/machine/   DEMO ONLY — cabinet render, camera-rig zooms, bottle-drop, SFX
```

`src/machine/` imports from `src/kiosk/` (catalog drives the shelves), never
the reverse — the kiosk stays extractable for the real machine (see HARDWARE.md).

## Voice clips

Spoken lines live in `src/kiosk/voice/lines.mjs`. To (re)generate audio:

```bash
ELEVENLABS_API_KEY=... \
VOICE_ID_TR=PdYVUd1CAGSXsTvZZTNn \   # Mia — native Turkish, warm
VOICE_ID_EN=EST9Ui6982FZPSi7gCHi \   # Elise — warm English
node scripts/gen-voice.mjs --force
```

Without clips the kiosk falls back to browser speechSynthesis.

## MediaPipe assets

`public/mediapipe/` holds the FaceLandmarker wasm + model, staged by:

```bash
cp node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.{js,wasm} public/mediapipe/wasm/
curl -L -o public/mediapipe/face_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
```

## Honesty notes

The scan computes real on-device signals (lighting, framing, face presence via
landmarks, color balance) but they are presented as *wellness indicators*, with
an explicit "not medical advice" disclaimer — the questionnaire dominates the
recommendation. Match % is a presentation mapping of the raw score (≤98%).
