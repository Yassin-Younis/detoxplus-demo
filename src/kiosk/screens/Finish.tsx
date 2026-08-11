import { t, type Lang } from '../i18n'
import { formatPrice } from '../engine/catalog'
import type { Recommendation } from '../engine/types'
import { ProductArt } from '../Bottles'

interface ConfirmProps {
  lang: Lang
  active: boolean
  pick: Recommendation | null
  onConfirm: () => void
  onBack: () => void
}

export function Confirm({ lang, active, pick, onConfirm, onBack }: ConfirmProps) {
  return (
    <section className={`kiosk-page k-center ${active ? 'active' : ''}`}>
      <h2 className="k-title">
        <span className="k-title-ico">🧾</span>
        {t(lang, 'confirmTitle')}
      </h2>
      {pick && (
        <>
          <div className="k-big-bottle">
            <ProductArt product={pick.product} width={130} />
          </div>
          <div className="k-hero-name" style={{ fontSize: '7.2cqw', fontWeight: 600 }}>
            {pick.product.name}
          </div>
          <div className="k-price" style={{ margin: 0 }}>
            🏷️ {formatPrice(pick.product.priceCents)}
          </div>
        </>
      )}
      <div className="k-footer" style={{ width: '100%' }}>
        <button className="k-btn k-btn-ghost" onClick={onBack}>
          <span className="k-btn-arrow">‹</span> {t(lang, 'back')}
        </button>
        <button className="k-btn k-btn-primary" onClick={onConfirm}>
          ✅ {t(lang, 'confirmYes')}
        </button>
      </div>
    </section>
  )
}

export function Dispensing({ lang, active, pick }: { lang: Lang; active: boolean; pick: Recommendation | null }) {
  return (
    <section className={`kiosk-page k-center ${active ? 'active' : ''}`}>
      <div className="k-spin-wrap">
        <div className="k-spin" />
        <span className="k-spin-ico">🧃</span>
      </div>
      <h2 className="k-title">{t(lang, 'dispensing')}</h2>
      {pick && <p className="k-sub">{pick.product.name}</p>}
    </section>
  )
}

export function Thanks({ lang, active }: { lang: Lang; active: boolean }) {
  return (
    <section className={`kiosk-page k-center ${active ? 'active' : ''}`}>
      <div className="k-thanks-check">✓</div>
      <h2 className="k-title">🎉 {t(lang, 'thanksTitle')}</h2>
      <p className="k-sub">{t(lang, 'thanksSub')}</p>
      <div className="k-thanks-down">👇</div>
    </section>
  )
}
