import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { AyarSayfasi, RadyoKarti } from '../../tasarim/AyarSayfasi'
import { aramadaGorunsunGetir, aramadaGorunsunAyarla } from '../../../lib/ayarlar'
import { useDil } from '../../../lib/dil'
import { useHataStili } from '../../tasarim/hata-stili'

/** ARAMADA GORUNURLUK (Gizlilik > Gorunurlugun): acik / kapali, radyo kart. */
export default function AramaGorunurluguEkrani() {
  const { t } = useDil()
  const hataStili = useHataStili()
  const [acik, setAcik] = useState<boolean | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  useEffect(() => {
    aramadaGorunsunGetir().then(setAcik).catch((e) => setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu')))
  }, [t])

  async function sec(deger: 'acik' | 'kapali') {
    const onceki = acik
    setAcik(deger === 'acik')
    try {
      await aramadaGorunsunAyarla(deger === 'acik')
      setHata(null)
    } catch (e) {
      setAcik(onceki)
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <AyarSayfasi baslik={t('gizlilikEtkilesim.aramaGorunurlugu')} altBaslik={t('gizlilikEtkilesim.aramaGorunurluguAlt')}>
      {hata && <Text style={hataStili}>{hata}</Text>}
      {acik !== null && (
        <RadyoKarti
          testIDOneki="arama-gorunurlugu"
          secili={acik ? 'acik' : 'kapali'}
          onSec={sec}
          secenekler={[
            { deger: 'acik', baslik: t('gizlilikEtkilesim.acik'), aciklama: t('gizlilikEtkilesim.aramaAcikAciklama') },
            { deger: 'kapali', baslik: t('gizlilikEtkilesim.kapali'), aciklama: t('gizlilikEtkilesim.aramaKapaliAciklama') },
          ]}
        />
      )}
    </AyarSayfasi>
  )
}
