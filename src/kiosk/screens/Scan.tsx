import { useEffect, useRef, useState } from 'react'
import { t, type Lang } from '../i18n'
import { aggregateScans } from '../engine/scan'
import type { ScanFeatures } from '../engine/types'
import { useCamera } from '../useCamera'
import { startFaceReveal, REVEAL_TOTAL_MS, type MeshController } from '../faceMesh'
import { sfxScanStart, sfxScanStop, sfxTick } from '../sfx'

// Without a camera the reveal can't run, so the simulated scan is shorter.
const SIM_SCAN_MS = 7000

interface Props {
  lang: Lang
  active: boolean
  onDone: (scan: ScanFeatures) => void
  onSkip: () => void
}

export function Scan({ lang, active, onDone, onSkip }: Props) {
  const camera = useCamera()
  // The camera only opens after an explicit tap — never on screen entry.
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [meshLive, setMeshLive] = useState(false)
  const doneRef = useRef(false)
  const meshRef = useRef<MeshController | null>(null)
  const meshCanvasRef = useRef<HTMLCanvasElement>(null!)
  const meshFramesRef = useRef(0)
  const endAtRef = useRef(0)
  const lastZoneRef = useRef(-1)

  // Depuff-style reveal once the camera is live; the scan window stretches to
  // fit the full reveal from the moment the landmarker is ready.
  useEffect(() => {
    if (!active) setScanning(false)
  }, [active])

  useEffect(() => {
    if (!active || !scanning || camera.live !== true) return
    let cancelled = false
    const video = camera.videoRef.current
    const canvas = meshCanvasRef.current
    if (!video || !canvas) return
    void startFaceReveal(video, canvas, lang).then((mesh) => {
      if (cancelled || !mesh) return
      meshRef.current = mesh
      endAtRef.current = performance.now() + REVEAL_TOTAL_MS + 200
      setMeshLive(true)
    })
    return () => {
      cancelled = true
      meshRef.current?.stop()
      meshRef.current = null
      setMeshLive(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, scanning, camera.live])

  useEffect(() => {
    if (!active || !scanning) return
    doneRef.current = false
    meshFramesRef.current = 0
    lastZoneRef.current = -1
    setProgress(0)
    camera.start()
    sfxScanStart()
    const t0 = performance.now()
    endAtRef.current = t0 + SIM_SCAN_MS
    const interval = window.setInterval(() => {
      const now = performance.now()
      const p = Math.min(1, (now - t0) / (endAtRef.current - t0))
      setProgress(p)
      const mesh = meshRef.current
      if (mesh) {
        if (mesh.detected) meshFramesRef.current++
        // soft tick as each zone locks on
        if (mesh.zoneIndex !== lastZoneRef.current) {
          lastZoneRef.current = mesh.zoneIndex
          if (mesh.zoneIndex >= 0) sfxTick()
        }
      }
      if (p >= 1 && !doneRef.current) {
        doneRef.current = true
        window.clearInterval(interval)
        camera.stop()
        sfxScanStop()
        const scan = aggregateScans(camera.frames) ?? {
          facePresent: false,
          coverage: 0,
          centered: 0,
          lighting: 0.5,
          warmth: 0,
          contrast: 0.5,
          simulated: true,
        }
        // landmark detection is a far stronger face signal than the color heuristic
        if (meshFramesRef.current >= 4) {
          scan.facePresent = true
          scan.centered = Math.max(scan.centered, 0.6)
        }
        onDone(scan)
      }
    }, 120)
    return () => {
      window.clearInterval(interval)
      camera.stop()
      sfxScanStop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, scanning])

  const f = camera.latest
  const faceOk = (f?.facePresent ?? false) || (meshRef.current?.detected ?? false)
  const readout = (label: string, ok: boolean) => (
    <span className={ok ? 'ok' : ''}>
      {label} {ok ? '✓' : '·'}
    </span>
  )

  return (
    <section className={`kiosk-page k-scan ${active ? 'active' : ''}`}>
      <h2 className="k-title">
        <span className="k-title-ico">📸</span>
        {t(lang, 'scanIntroTitle')}
      </h2>
      {!scanning && <p className="k-sub">{t(lang, 'scanAskSub')}</p>}
      <div className="k-scan-stage">
        <div className="k-scan-video-wrap">
          {camera.live !== true && (
            <div className="k-scan-sil">
              <svg viewBox="0 0 100 130" fill="currentColor" aria-hidden="true">
                <circle cx="50" cy="38" r="22" />
                <path d="M50 66 c-26 0 -38 18 -38 42 v22 h76 v-22 c0 -24 -12 -42 -38 -42 z" />
              </svg>
            </div>
          )}
          <video ref={camera.videoRef} playsInline muted style={{ display: camera.live ? undefined : 'none' }} />
          <canvas ref={meshCanvasRef} className="k-scan-mesh" style={{ opacity: meshLive ? 1 : 0 }} />
          {scanning && !meshLive && <div className="k-scan-line" />}
          {scanning && camera.live === false && <div className="k-badge-sim">{t(lang, 'scanSimulated')}</div>}
        </div>
        <svg className="k-scan-ring" viewBox="0 0 100 133" preserveAspectRatio="none" aria-hidden="true">
          <rect x="2" y="2" width="96" height="129" rx="7" fill="none" className="track" strokeWidth="1.6" />
          <rect
            x="2"
            y="2"
            width="96"
            height="129"
            rx="7"
            fill="none"
            className="arc"
            strokeWidth="1.6"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 - progress * 100}
            strokeLinecap="round"
          />
        </svg>
      </div>
      {scanning ? (
        <div className="k-scan-readouts">
          {f ? (
            <>
              {readout(t(lang, 'scanLighting'), f.lighting > 0.45)}
              {readout(t(lang, 'scanFraming'), f.centered > 0.4 || faceOk)}
              {readout(t(lang, 'scanFace'), faceOk)}
            </>
          ) : (
            <span>{t(lang, 'scanning')}</span>
          )}
        </div>
      ) : (
        <div className="k-footer k-scan-actions">
          <button className="k-btn k-btn-ghost" onClick={onSkip}>
            {t(lang, 'scanSkip')}
          </button>
          <button className="k-btn k-btn-primary" onClick={() => setScanning(true)}>
            📸 {t(lang, 'scanStart')}
          </button>
        </div>
      )}
      <div className="k-disclaimer">{t(lang, 'scanDisclaimer')}</div>
    </section>
  )
}
