// The kiosk's only interface to the physical machine. In this demo the "machine"
// is the animated shell on the same page (it subscribes to these events). On real
// hardware this module is swapped for a WebSocket transport to the local hardware
// agent that drives the vending controller (MDB) — the kiosk code never changes.

export type KioskScreen =
  | 'ATTRACT'
  | 'Q_GOALS'
  | 'Q_DIET'
  | 'Q_SELF'
  | 'SCAN'
  | 'FEEDBACK'
  | 'RESULTS'
  | 'CONFIRM'
  | 'PAYMENT'
  | 'DISPENSING'
  | 'THANKS'

export interface BusEvents {
  /** kiosk → machine: current UI state (drives screen glow + camera rig) */
  state: { screen: KioskScreen }
  /** kiosk → machine: spotlight a product on the shelf */
  highlight: { productId: string | null }
  /** kiosk → machine: awaiting card tap on the contactless reader */
  payment: { txnId: string; amountCents: number; productId: string }
  /** machine → kiosk: the reader approved (or declined) the payment */
  'payment-result': { txnId: string; ok: boolean }
  /** kiosk → machine: vend this product */
  dispense: { productId: string; txnId: string }
  /** machine → kiosk: vend finished (animation landed / motor completed) */
  'dispense-result': { txnId: string; ok: boolean }
}

type Handler<K extends keyof BusEvents> = (payload: BusEvents[K]) => void

class Bus {
  private target = new EventTarget()

  emit<K extends keyof BusEvents>(type: K, payload: BusEvents[K]) {
    this.target.dispatchEvent(new CustomEvent(type, { detail: payload }))
  }

  on<K extends keyof BusEvents>(type: K, handler: Handler<K>): () => void {
    const listener = (e: Event) => handler((e as CustomEvent).detail)
    this.target.addEventListener(type, listener)
    return () => this.target.removeEventListener(type, listener)
  }
}

export const bus = new Bus()

let txnCounter = 0
export const nextTxnId = () => `txn-${Date.now()}-${++txnCounter}`
