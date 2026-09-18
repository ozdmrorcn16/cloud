import { useEffect, useState } from 'react'
import { AyarSayfasi, RadyoKarti } from '../../tasarim/AyarSayfasi'
import { profilGizliGetir, profilGizliAyarla } from '../../../lib/ayarlar'
import { useDil } from '../../../lib/dil'
import { Text } from 'react-native'
import { useHataStili } from '../../tasarim/hata-stili'

/**
 * PROFIL GORUNURLUGU (Gizlilik > Gorunurlugun). Iki secenek, radyo kart;
 * secim aninda `profil_gizli`ye yazilir. "Herkese acik" = kapali,
 * "Sadece arkadaslar" = gizli (2026-09-02 modeli: ad/foto acik kalir).
 */
export default function ProfilGorunurluguEkrani() {
  const { t } = useDil()
  const hataStili = useHataStili()
  const [gizli, setGizli] = useState<boolean | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  useEffect(() => {
    profilGizliGetir().then(setGizli).catch((e) => setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu')))
  }, [t])

  async function sec(deger: 'acik' | 'gizli') {
    const onceki = gizli
    setGizli(deger === 'gizli')
    try {
      await profilGizliAyarla(deger === 'gizli')
      setHata(null)
    } catch (e) {
      setGizli(onceki)
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <AyarSayfasi baslik={t('gizlilikEtkilesim.profilGorunurlugu')} altBaslik={t('gizlilikEtkilesim.profilGorunurluguAlt')}>
      {hata && <Text style={hataStili}>{hata}</Text>}
      {gizli !== null && (
        <RadyoKarti
          testIDOneki="profil-gorunurlugu"
          secili={gizli ? 'gizli' : 'acik'}
          onSec={sec}
          secenekler={[
            { deger: 'acik', baslik: t('gizlilikEtkilesim.herkeseAcik'), aciklama: t('gizlilikEtkilesim.profilAcikAciklama') },
            { deger: 'gizli', baslik: t('gizlilikEtkilesim.sadeceArkadaslar'), aciklama: t('gizlilikEtkilesim.profilArkadasAciklama') },
          ]}
        />
      )}
    </AyarSayfasi>
  )
}
