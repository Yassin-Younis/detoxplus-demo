import type { Localized, ReasonCode } from './types'

export const REASON_COPY: Record<ReasonCode, Localized> = {
  'goal-energy': { tr: 'Enerji hedefinle birebir uyumlu', en: 'Matches your energy goal' },
  'goal-immunity': { tr: 'Bağışıklık hedefini destekliyor', en: 'Supports your immunity goal' },
  'goal-detox': { tr: 'Arınma hedefin için ideal', en: 'Ideal for your detox goal' },
  'goal-skin': { tr: 'Cilt sağlığı hedefine katkı sağlıyor', en: 'Contributes to your skin goal' },
  'goal-digestion': { tr: 'Sindirim hedefini destekliyor', en: 'Supports your digestion goal' },
  'goal-hydration': { tr: 'Nem dengesi hedefine uygun', en: 'Fits your hydration goal' },
  'goal-calm': { tr: 'Sakinlik hedefine iyi geliyor', en: 'Good for your calm goal' },
  'self-energy': { tr: 'Bugün düşük enerjini toparlamak için', en: 'To lift your low energy today' },
  'self-sleep': { tr: 'Az uyuduğun için dengeleyici seçim', en: 'A balancing pick after little sleep' },
  'self-hydration': { tr: 'Az su içtiğin için nem takviyesi', en: 'Hydration support for a low-water day' },
  'scan-skin': { tr: 'Tarama: cilt görünümüne destek olabilir', en: 'Scan: may support your skin appearance' },
  'scan-hydration': { tr: 'Tarama: nem göstergen düşük görünüyor', en: 'Scan: your hydration indicator looks low' },
  'diet-ok': { tr: 'Beslenme tercihlerinle uyumlu', en: 'Compatible with your dietary choices' },
}
