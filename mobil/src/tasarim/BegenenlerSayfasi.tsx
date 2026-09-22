import { useDil } from '../../lib/dil'
import { begenenleriGetir } from '../../lib/etkilesim'
import { KisiListesiSayfasi } from './KisiListesiSayfasi'

/**
 * BEGENENLER (kullanicinin istegi 2026-09-22: "begeni kalbin yanindaki
 * sayiya basilinca kimlerin begendigi gorunsun"). Kabuk artik ortak
 * `KisiListesiSayfasi` (hikaye goruntuleyenlerle paylasiliyor).
 *
 * Kim gorunur: `begenenleriGetir` - begeniler RLS + akis_profilleri
 * (engellenen iki yonde de gorunmez).
 */
export function BegenenlerSayfasi({
  acikMi,
  checkInId,
  onKapat,
}: {
  acikMi: boolean
  checkInId: string
  onKapat: () => void
}) {
  const { t } = useDil()
  return (
    <KisiListesiSayfasi
      acikMi={acikMi}
      anahtar={checkInId}
      baslik={t('etkilesim.begenenler')}
      bosMetin={t('etkilesim.begenenYok')}
      yukle={() => begenenleriGetir(checkInId)}
      onKapat={onKapat}
      testIDOnEki="begenenler"
      satirTestIDOnEki="begenen"
    />
  )
}
