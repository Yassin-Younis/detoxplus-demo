/* DETOX PLUS + — Hardware page (?hardware=1).
   Static Apple-style spec page presenting HARDWARE.md: the chassis decision,
   bill of materials, wiring, Pi provisioning and Turkey sourcing notes.
   Bilingual TR/EN via the same detectLang/persistLang helpers as the landing;
   part names, model numbers, prices and commands stay verbatim. */

import { useEffect, useState, type ReactNode } from 'react'
import { detectLang, persistLang, type Lang } from './i18n'
import './hardware.css'

type Copy = { en: string; tr: string }
const c = (en: string, tr: string): Copy => ({ en, tr })

/* Inline-code renderer: segments between backticks become <code>. */
function md(s: string): ReactNode {
  return s.split('`').map((seg, i) => (i % 2 ? <code key={i}>{seg}</code> : seg))
}

/* ---------- copy ---------- */

const HERO = {
  eyebrow: c('Hardware guide', 'Donanım rehberi'),
  title: c('From demo to machine.', 'Demodan makineye.'),
  sub: c(
    'What to buy and how to wire it to turn the software in this repo into a working smart vending machine. The kiosk app runs on the machine unchanged — fullscreen Chromium on an embedded computer — and talks to the vending hardware through the same event interface it uses in the demo, carried over a local WebSocket instead of the page bus.',
    'Bu depodaki yazılımı çalışan bir akıllı otomata dönüştürmek için ne alınacağı ve nasıl bağlanacağı. Kiosk uygulaması makinede hiç değişmeden çalışır — gömülü bir bilgisayarda tam ekran Chromium — ve otomat donanımıyla demodaki aynı olay arayüzü üzerinden konuşur; sayfa veri yolu yerine yerel bir WebSocket kullanılır.',
  ),
}

const DECISION = {
  eyebrow: c('Before you buy', 'Satın almadan önce'),
  title: c('One machine, two paths.', 'Tek makine, iki yol.'),
  intro: c(
    'The machine in the vision renders is an open-front grab-and-go cooler (True-style merchandiser). That format has no dispensing mechanism — customers take products themselves — so there are two ways to build it:',
    'Vizyon görsellerindeki makine, önü açık al-git tipi bir soğutucu (True tarzı teşhir dolabı). Bu formatta ürün verme mekanizması yok — ürünleri müşteri kendisi alıyor — bu yüzden makineyi kurmanın iki yolu var:',
  ),
  pathA: {
    badge: c('Recommended for the vision', 'Vizyon için önerilen'),
    name: c('Path A — Real vending chassis', 'A Yolu — Gerçek otomat şasisi'),
    body: c(
      "A refrigerated vending machine with an elevator or spiral delivery and an MDB bus — the vending industry's standard controller protocol. Glass bottles need elevator delivery, not drop. Examples: AMS Sensit combo coolers, Crane/Vendo glass-front refrigerated vendors. This is the biggest cost and lead-time item — price it early.",
      'Asansörlü veya spiralli teslimata ve MDB veri yoluna — otomat sektörünün standart kontrolcü protokolü — sahip soğutmalı bir otomat. Cam şişeler düşerek değil, asansörle teslim edilmeli. Örnekler: AMS Sensit combo soğutucular, Crane/Vendo camlı soğutmalı otomatlar. En büyük maliyet ve tedarik süresi kalemi — fiyatını erkenden araştırın.',
    ),
    price: c('$3,000–7,000 new · much less used', '$3,000–7,000 sıfır · ikinci elde çok daha az'),
  },
  pathB: {
    name: c('Path B — Smart cooler', 'B Yolu — Akıllı soğutucu'),
    body: c(
      'Keep the open cooler; add an electronic door lock and a card reader. The door unlocks after a card tap and purchases are detected by weight sensors or shelf cameras. Simpler mechanically, harder software (product detection); several vendors sell this as a retrofit kit.',
      'Açık soğutucuyu koruyun; elektronik kapı kilidi ve kart okuyucu ekleyin. Kapı, kart okutulunca açılır; satın almalar ağırlık sensörleri veya raf kameralarıyla algılanır. Mekanik olarak daha basit, yazılımı daha zor (ürün algılama); birkaç tedarikçi bunu dönüşüm kiti olarak satıyor.',
    ),
    price: c('Retrofit kit on an existing cooler', 'Mevcut soğutucuya dönüşüm kiti'),
  },
  note: c(
    'The parts below assume Path A and are the same for either path except the MDB interface.',
    "Aşağıdaki parçalar A Yolu'na göre seçildi; MDB arabirimi dışında her iki yol için de aynıdır.",
  ),
}

const BOM_SECTION = {
  eyebrow: c('Parts', 'Parçalar'),
  title: c('Bill of materials.', 'Malzeme listesi.'),
  colPart: c('Part', 'Parça'),
  colExample: c('Example', 'Örnek'),
  colPrice: c('~Price', '~Fiyat'),
  colRole: c('Role', 'Görev'),
  total: c(
    'Total electronics excluding the chassis: roughly $1,000–1,400.',
    'Şasi hariç toplam elektronik: yaklaşık $1,000–1,400.',
  ),
}

const BOM: { part: Copy; example: string; price: Copy; role: Copy }[] = [
  {
    part: c('Embedded computer', 'Gömülü bilgisayar'),
    example: 'Raspberry Pi 5 (4 GB) + 27 W USB-C PSU + 32 GB A2 microSD',
    price: c('$95', '$95'),
    role: c('Runs the kiosk UI + hardware agent', 'Kiosk arayüzünü ve donanım ajanını çalıştırır'),
  },
  {
    part: c('Portrait touchscreen', 'Dikey dokunmatik ekran'),
    example: '21.5" open-frame PCAP monitor (faytech FT215TMCAPOB, Mimo M21580C-OF), portrait-mounted',
    price: c('$350–500', '$350–500'),
    role: c('The BODY SCAN panel', 'BODY SCAN paneli'),
  },
  {
    part: c('Camera', 'Kamera'),
    example: 'Logitech C920 (or Brio for low light), mounted above the screen at face height',
    price: c('$70–150', '$70–150'),
    role: c(
      'Face scan (getUserMedia + MediaPipe, all on-device)',
      'Yüz taraması (getUserMedia + MediaPipe, tamamen cihaz üzerinde)',
    ),
  },
  {
    part: c('MDB interface', 'MDB arabirimi'),
    example: 'Qibixx MDB Pi Hat (VMC variant)',
    price: c('~€130', '~€130'),
    role: c(
      "Lets the Pi drive the vending machine's MDB bus; can power the Pi from the machine's 24 V",
      "Pi'nin otomatın MDB veri yolunu sürmesini sağlar; Pi'yi makinenin 24 V hattından besleyebilir",
    ),
  },
  {
    part: c('Cashless payment', 'Nakitsiz ödeme'),
    example: "MDB Level-3 reader — Nayax VPOS Touch / Onyx (or a local Turkish acquirer's MDB reader)",
    price: c('$200–400 + fees', '$200–400 + komisyon'),
    role: c('Card/NFC payment on the same MDB bus', 'Aynı MDB veri yolunda kart/NFC ödeme'),
  },
  {
    part: c('Vending chassis', 'Otomat şasisi'),
    example: 'Refrigerated glass-front vendor with elevator delivery + MDB VMC',
    price: c('$3,000–7,000', '$3,000–7,000'),
    role: c('The machine itself (see the two paths above)', 'Makinenin kendisi (yukarıdaki iki yola bakın)'),
  },
  {
    part: c('Connectivity', 'Bağlantı'),
    example: 'LTE router (Teltonika RUT241) or venue Wi-Fi; short Ethernet cable',
    price: c('~$120', '~$120'),
    role: c('Payments, telemetry, remote menu updates', 'Ödemeler, telemetri, uzaktan menü güncellemeleri'),
  },
  {
    part: c('Misc', 'Çeşitli'),
    example: 'Powered USB hub, HDMI cable, VESA/mounting brackets, surge-protected strip',
    price: c('~$60', '~$60'),
    role: c('—', '—'),
  },
]

const WIRING = {
  eyebrow: c('Assembly', 'Montaj'),
  title: c('Wiring.', 'Kablolama.'),
  notes: [
    c(
      'Screen: HDMI for video + one USB for touch; portrait rotation is done in software.',
      'Ekran: görüntü için HDMI + dokunmatik için bir USB; dikey döndürme yazılımla yapılır.',
    ),
    c(
      'Camera: USB, mounted above the screen so the customer looks slightly up (matches the scan framing in the kiosk).',
      'Kamera: USB; ekranın üstüne monte edilir, müşteri hafifçe yukarı bakar (kiosktaki tarama kadrajıyla eşleşir).',
    ),
    c(
      "Qibixx hat sits on the Pi's GPIO header; its 6-pin MDB harness tees into the machine's MDB bus alongside the payment reader. The hat can back-power the Pi from the machine's 24 V rail — no separate PSU inside the cabinet.",
      "Qibixx şapkası Pi'nin GPIO başlığına oturur; 6 pinli MDB kablosu, ödeme okuyucusuyla birlikte makinenin MDB veri yoluna bağlanır. Şapka, Pi'yi makinenin 24 V hattından besleyebilir — kabin içinde ayrı güç kaynağı gerekmez.",
    ),
    c(
      'Router: Ethernet to the Pi; SIM with a small data plan for payments + telemetry.',
      "Router: Pi'ye Ethernet; ödemeler ve telemetri için küçük bir veri paketli SIM.",
    ),
  ],
}

const WIRING_DIAGRAM = `                    ┌────────────────────────────┐
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
                     └───────────────────────────┘`

const PROVISIONING = {
  eyebrow: c('Software', 'Yazılım'),
  title: c('Provisioning the Pi.', 'Pi kurulumu.'),
}

const STEPS: { text: Copy; subs?: Copy[] }[] = [
  { text: c('Raspberry Pi OS Bookworm 64-bit Lite.', 'Raspberry Pi OS Bookworm 64-bit Lite.') },
  {
    text: c(
      'Install Chromium + a minimal Wayland kiosk (`cage`) or LXDE autologin.',
      'Chromium + minimal bir Wayland kiosk (`cage`) veya LXDE otomatik oturum kurun.',
    ),
  },
  {
    text: c(
      'Autostart: `chromium --kiosk --noerrdialogs --disable-infobars http://localhost:8080/?kiosk=1` — the kiosk app served locally by the agent.',
      'Otomatik başlatma: `chromium --kiosk --noerrdialogs --disable-infobars http://localhost:8080/?kiosk=1` — kiosk uygulaması ajan tarafından yerel olarak sunulur.',
    ),
  },
  {
    text: c(
      'Camera permission auto-granted via Chromium managed policy (`VideoCaptureAllowedUrls: ["http://localhost:8080"]`) — no permission prompt on boot.',
      'Kamera izni Chromium yönetilen politikasıyla otomatik verilir (`VideoCaptureAllowedUrls: ["http://localhost:8080"]`) — açılışta izin sorulmaz.',
    ),
  },
  {
    text: c(
      'Disable screen blanking; enable the hardware watchdog; run both services under systemd with `Restart=always`:',
      "Ekran kararmasını kapatın; donanım watchdog'unu açın; iki servisi de systemd altında `Restart=always` ile çalıştırın:",
    ),
    subs: [
      c(
        '`detox-agent.service` — serves the built kiosk statics, exposes a WebSocket on `localhost:9600`, and translates `dispense` events to MDB vend commands through the Qibixx hat (their serial/API docs cover the VMC command set).',
        "`detox-agent.service` — derlenmiş kiosk statik dosyalarını sunar, `localhost:9600` üzerinde bir WebSocket açar ve `dispense` olaylarını Qibixx şapkası üzerinden MDB satış komutlarına çevirir (VMC komut seti Qibixx'in seri/API dokümanlarında).",
      ),
      c('`kiosk.service` — the Chromium kiosk.', '`kiosk.service` — Chromium kiosk.'),
    ],
  },
  {
    text: c(
      '`src/kiosk/bus.ts` already supports `?agent=ws://localhost:9600` — the kiosk connects to the agent instead of the demo page bus; no kiosk code changes.',
      '`src/kiosk/bus.ts` zaten `?agent=ws://localhost:9600` destekliyor — kiosk, demo sayfa veri yolu yerine ajana bağlanır; kiosk kodunda değişiklik gerekmez.',
    ),
  },
  {
    text: c(
      'Copy `dist/` + `dist/mediapipe/` to the Pi — the face-scan mesh runs fully on-device (no cloud), same as the demo.',
      "`dist/` + `dist/mediapipe/` dizinlerini Pi'ye kopyalayın — yüz tarama modeli, demodaki gibi tamamen cihaz üzerinde çalışır (bulut yok).",
    ),
  },
]

const SUPPLIERS = {
  eyebrow: c('Sourcing', 'Tedarik'),
  title: c('Suppliers — Turkey notes.', 'Tedarikçiler — Türkiye notları.'),
  items: [
    c(
      'Qibixx sells direct (qibixx.com) and ships EU→TR; budget for customs.',
      "Qibixx doğrudan satıyor (qibixx.com) ve AB'den Türkiye'ye gönderiyor; gümrük için bütçe ayırın.",
    ),
    c(
      'Nayax has a Turkish operation; alternatively, local MDB cashless providers work with Turkish acquirers — worth comparing fees before committing.',
      "Nayax'ın Türkiye operasyonu var; alternatif olarak yerel MDB nakitsiz ödeme sağlayıcıları Türk bankalarıyla çalışıyor — karar vermeden önce komisyonları karşılaştırmaya değer.",
    ),
    c(
      'Used refrigerated vendors with MDB are common on the local second-hand machine market and cut the chassis cost dramatically for a pilot.',
      "MDB'li ikinci el soğutmalı otomatlar yerli ikinci el pazarında yaygın; pilot için şasi maliyetini ciddi biçimde düşürür.",
    ),
  ],
}

const BACK = c('← DETOX PLUS +', '← DETOX PLUS +')

/* ---------- page ---------- */

export function Hardware() {
  const [lang, setLang] = useState<Lang>(detectLang)

  const switchLang = (next: Lang) => {
    setLang(next)
    persistLang(next)
  }

  useEffect(() => {
    document.title = lang === 'tr' ? 'DETOX PLUS + — Donanım' : 'DETOX PLUS + — Hardware'
  }, [lang])

  const T = (copy: Copy) => copy[lang]

  return (
    <div className="hardware">
      <nav className="hw-nav">
        <a className="hw-back" href="./">{T(BACK)}</a>
        <div className="hw-lang" role="group" aria-label="Language">
          <button
            className={lang === 'tr' ? 'on' : ''}
            aria-pressed={lang === 'tr'}
            onClick={() => switchLang('tr')}
          >
            TR
          </button>
          <span>·</span>
          <button
            className={lang === 'en' ? 'on' : ''}
            aria-pressed={lang === 'en'}
            onClick={() => switchLang('en')}
          >
            EN
          </button>
        </div>
      </nav>

      <header className="hw-hero">
        <p className="hw-eyebrow">{T(HERO.eyebrow)}</p>
        <h1>{T(HERO.title)}</h1>
        <p className="hw-lede">{T(HERO.sub)}</p>
      </header>

      <main>
        {/* ---------- the chassis decision ---------- */}
        <section className="hw-section">
          <p className="hw-eyebrow">{T(DECISION.eyebrow)}</p>
          <h2>{T(DECISION.title)}</h2>
          <p className="hw-sub">{T(DECISION.intro)}</p>
          <div className="hw-paths">
            <article className="hw-path hw-path-a">
              <span className="hw-badge">{T(DECISION.pathA.badge)}</span>
              <h3>{T(DECISION.pathA.name)}</h3>
              <p>{T(DECISION.pathA.body)}</p>
              <p className="hw-price">{T(DECISION.pathA.price)}</p>
            </article>
            <article className="hw-path">
              <h3>{T(DECISION.pathB.name)}</h3>
              <p>{T(DECISION.pathB.body)}</p>
              <p className="hw-price">{T(DECISION.pathB.price)}</p>
            </article>
          </div>
          <p className="hw-note">{T(DECISION.note)}</p>
        </section>

        {/* ---------- bill of materials ---------- */}
        <section className="hw-section">
          <p className="hw-eyebrow">{T(BOM_SECTION.eyebrow)}</p>
          <h2>{T(BOM_SECTION.title)}</h2>
          <div className="hw-table-wrap">
            <table className="hw-table">
              <thead>
                <tr>
                  <th>{T(BOM_SECTION.colPart)}</th>
                  <th>{T(BOM_SECTION.colExample)}</th>
                  <th>{T(BOM_SECTION.colPrice)}</th>
                  <th>{T(BOM_SECTION.colRole)}</th>
                </tr>
              </thead>
              <tbody>
                {BOM.map((row) => (
                  <tr key={row.example}>
                    <td className="hw-td-part">{T(row.part)}</td>
                    <td>{row.example}</td>
                    <td className="hw-td-price">{T(row.price)}</td>
                    <td className="hw-td-role">{T(row.role)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hw-total">{T(BOM_SECTION.total)}</p>
        </section>

        {/* ---------- wiring ---------- */}
        <section className="hw-section">
          <p className="hw-eyebrow">{T(WIRING.eyebrow)}</p>
          <h2>{T(WIRING.title)}</h2>
          <div className="hw-diagram" role="img" aria-label="Wiring diagram">
            <pre>{WIRING_DIAGRAM}</pre>
          </div>
          <ul className="hw-list">
            {WIRING.notes.map((note) => (
              <li key={note.en}>{T(note)}</li>
            ))}
          </ul>
        </section>

        {/* ---------- provisioning ---------- */}
        <section className="hw-section">
          <p className="hw-eyebrow">{T(PROVISIONING.eyebrow)}</p>
          <h2>{T(PROVISIONING.title)}</h2>
          <ol className="hw-steps">
            {STEPS.map((step) => (
              <li key={step.text.en}>
                {md(T(step.text))}
                {step.subs && (
                  <ul className="hw-list hw-substeps">
                    {step.subs.map((sub) => (
                      <li key={sub.en}>{md(T(sub))}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- suppliers ---------- */}
        <section className="hw-section">
          <p className="hw-eyebrow">{T(SUPPLIERS.eyebrow)}</p>
          <h2>{T(SUPPLIERS.title)}</h2>
          <ul className="hw-list">
            {SUPPLIERS.items.map((item) => (
              <li key={item.en}>{T(item)}</li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="hw-footer">
        <a href="./">{T(BACK)}</a>
        <p className="hw-credit">
          {lang === 'tr' ? 'Tasarım ve geliştirme:' : 'Designed & created by'}{' '}
          <a href="https://ysnyns.com" target="_blank" rel="noreferrer">
            Yassin Younis
          </a>{' '}
          · <a href="mailto:yasin@layermark.com">yasin@layermark.com</a>
        </p>
      </footer>
    </div>
  )
}
