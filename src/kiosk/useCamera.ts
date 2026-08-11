import { useCallback, useEffect, useRef, useState } from 'react'
import { analyzeFrame, simulatedScan } from './engine/scan'
import type { ScanFeatures } from './engine/types'

// Camera capture for the scan screen. Frames are analyzed on-device only —
// nothing is uploaded or stored. Falls back to a visibly-labeled simulated
// scan when the camera is denied or unavailable.

const FRAME_W = 320
const FRAME_H = 240
const FRAME_INTERVAL_MS = 250

export interface CameraState {
  videoRef: React.RefObject<HTMLVideoElement>
  /** null until we know; then true (live camera) or false (simulated) */
  live: boolean | null
  latest: ScanFeatures | null
  frames: ScanFeatures[]
  start: () => void
  stop: () => void
}

export function useCamera(): CameraState {
  const videoRef = useRef<HTMLVideoElement>(null!)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const framesRef = useRef<ScanFeatures[]>([])
  const [live, setLive] = useState<boolean | null>(null)
  const [latest, setLatest] = useState<ScanFeatures | null>(null)

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const start = useCallback(() => {
    framesRef.current = []
    setLatest(null)

    const beginSimulated = () => {
      setLive(false)
      timerRef.current = window.setInterval(() => {
        const f = simulatedScan(Math.random())
        framesRef.current.push(f)
        setLatest(f)
      }, FRAME_INTERVAL_MS)
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      beginSimulated()
      return
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then((stream) => {
        streamRef.current = stream
        setLive(true)
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          void video.play().catch(() => {})
        }
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas')
          canvasRef.current.width = FRAME_W
          canvasRef.current.height = FRAME_H
        }
        const canvas = canvasRef.current
        const g = canvas.getContext('2d', { willReadFrequently: true })
        timerRef.current = window.setInterval(() => {
          const v = videoRef.current
          if (!v || !g || v.readyState < 2) return
          g.drawImage(v, 0, 0, FRAME_W, FRAME_H)
          const data = g.getImageData(0, 0, FRAME_W, FRAME_H).data
          const f = analyzeFrame(data, FRAME_W, FRAME_H)
          framesRef.current.push(f)
          setLatest(f)
        }, FRAME_INTERVAL_MS)
      })
      .catch(() => beginSimulated())
  }, [])

  useEffect(() => stop, [stop])

  return { videoRef, live, latest, frames: framesRef.current, start, stop }
}
