# DETOX PLUS + — Real-Machine Hardware Guide

What to buy and how to wire it to turn the software in this repo into a working
smart vending machine. The kiosk app in `src/kiosk/` runs on the machine
unchanged — fullscreen Chromium on an embedded computer — and talks to the
vending hardware through the same event interface it uses in the demo
(`src/kiosk/bus.ts`), carried over a local WebSocket instead of the page bus.

## Important flag before buying anything

The machine in the vision renders is an **open-front grab-and-go cooler**
(True-style merchandiser). That format has no dispensing mechanism — customers
take products themselves, which means either:

- **Path A — real vending chassis (recommended for the vision):** a refrigerated
  vending machine with an elevator or spiral delivery and an **MDB bus**
  (the vending industry's standard controller protocol). Glass bottles need
  elevator delivery, not drop. Examples: AMS Sensit combo coolers,
  Crane/Vendo glass-front refrigerated vendors. This is the biggest cost and
  lead-time item — price it early (typically $3,000–7,000 new, much less used).
- **Path B — smart cooler:** keep the open cooler, add an electronic door lock +
  a card reader; the door unlocks after a card tap and purchases are detected
  by weight sensors or shelf cameras. Simpler mechanically, harder software
  (product detection); several vendors sell this as a retrofit kit.

The parts below assume **Path A** and are the same for either path except the
MDB interface.

## Bill of materials

| # | Part | Example | ~Price | Role |
|---|------|---------|--------|------|
| 1 | Embedded computer | Raspberry Pi 5 (4 GB) + 27 W USB-C PSU + 32 GB A2 microSD | $95 | Runs the kiosk UI + hardware agent |
| 2 | Portrait touchscreen | 21.5" open-frame PCAP monitor (faytech FT215TMCAPOB, Mimo M21580C-OF), portrait-mounted | $350–500 | The BODY SCAN panel |
| 3 | Camera | Logitech C920 (or Brio for low light), mounted above the screen at face height | $70–150 | Face scan (getUserMedia + MediaPipe, all on-device) |
| 4 | MDB interface | **Qibixx MDB Pi Hat (VMC variant)** | ~€130 | Lets the Pi drive the vending machine's MDB bus; can power the Pi from the machine's 24 V |
| 5 | Cashless payment | MDB Level-3 reader — Nayax VPOS Touch / Onyx (or a local Turkish acquirer's MDB reader) | $200–400 + fees | Card/NFC payment on the same MDB bus |
| 6 | Vending chassis | Refrigerated glass-front vendor with elevator delivery + MDB VMC | $3,000–7,000 | The machine itself (see flag above) |
| 7 | Connectivity | LTE router (Teltonika RUT241) or venue Wi-Fi; short Ethernet cable | ~$120 | Payments, telemetry, remote menu updates |
| 8 | Misc | Powered USB hub, HDMI cable, VESA/mounting brackets, surge-protected strip | ~$60 | |

Total electronics excluding the chassis: **roughly $1,000–1,400**.

## Wiring

```
                    ┌────────────────────────────┐
 21.5" touchscreen ─┤ HDMI  (video)              │
                    │ USB   (touch)              │
 Logitech C920 ─────┤ USB   (camera)     Pi 5    │
 LTE router ────────┤ Ethernet                   │
                    │ GPIO ──► Qibixx MDB Pi Hat │
                    └──────────────┬─────────────┘
                                   │ 6-pin MDB harness
                     ┌─────────────┴─────────────┐
                     │  Machine VMC (MDB bus)    │
                     │  ├─ elevator/motors       │
                     │  ├─ refrigeration ctrl    │
                     │  └─ Nayax cashless reader │
                     └───────────────────────────┘
```

- Screen: HDMI for video + one USB for touch, portrait rotation done in software.
- Camera: USB, mounted above the screen so the customer looks slightly up
  (matches the scan framing in the kiosk).
- Qibixx hat sits on the Pi's GPIO header; its 6-pin MDB harness tees into the
  machine's MDB bus alongside the payment reader. The hat can back-power the Pi
  from the machine's 24 V rail (no separate PSU inside the cabinet).
- Router: Ethernet to the Pi; SIM with a small data plan for payments + telemetry.

## Software provisioning (Pi)

1. Raspberry Pi OS Bookworm 64-bit Lite.
2. Install Chromium + a minimal Wayland kiosk (`cage`) or LXDE autologin.
3. Autostart: `chromium --kiosk --noerrdialogs --disable-infobars
   http://localhost:8080/?kiosk=1` (the kiosk app served locally by the agent).
4. Camera permission auto-granted via Chromium managed policy
   (`VideoCaptureAllowedUrls: ["http://localhost:8080"]`) — no permission prompt
   on boot.
5. Disable screen blanking; enable the hardware watchdog; both services under
   systemd with `Restart=always`:
   - `detox-agent.service` — serves the built kiosk statics, exposes a WebSocket
     on `localhost:9600`, and translates `dispense` events to MDB vend commands
     through the Qibixx hat (their serial/API docs cover the VMC command set).
   - `kiosk.service` — the Chromium kiosk.
6. `src/kiosk/bus.ts` already supports `?agent=ws://localhost:9600` — the kiosk
   connects to the agent instead of the demo page bus; no kiosk code changes.
7. Copy `dist/` + `dist/mediapipe/` to the Pi — the face-scan mesh runs fully
   on-device (no cloud), same as the demo.

## Suppliers (Turkey notes)

- Qibixx sells direct (qibixx.com) and ships EU→TR; budget for customs.
- Nayax has a Turkish operation; alternatively local MDB cashless providers
  work with Turkish acquirers — worth comparing fees before committing.
- Used refrigerated vendors with MDB are common on the local second-hand
  machine market and cut the chassis cost dramatically for a pilot.
