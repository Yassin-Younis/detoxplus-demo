import { createRoot } from 'react-dom/client'
import '@fontsource-variable/jost'
import './styles/base.css'
import { KioskApp } from './kiosk/KioskApp'
import { MachinePage } from './machine/MachinePage'
import { Landing } from './landing/Landing'
import { Hardware } from './landing/Hardware'

// default        → parallax landing (frames + fal clips + live kiosk)
// ?machine=1     → original machine POC page
// ?kiosk=1       → the product software alone, exactly as it would run
//                  fullscreen on the real machine's touchscreen.
// ?hardware=1    → real-machine hardware guide (HARDWARE.md as a spec page)
const params = new URLSearchParams(window.location.search)
const standalone = params.has('kiosk')
const machine = params.has('machine')
const hardware = params.has('hardware')

// standalone kiosk sits on a dark backdrop so the letterbox bars beside the
// portrait column disappear on phones and small windows
if (standalone) document.body.style.background = '#0c0d0a'

createRoot(document.getElementById('root')!).render(
  standalone ? <KioskApp standalone /> : machine ? <MachinePage /> : hardware ? <Hardware /> : <Landing />,
)
