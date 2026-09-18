import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { AyarSayfasi, RadyoKarti } from '../../tasarim/AyarSayfasi'
import { mesajIzniGetir, mesajIzniAyarla, type MesajIzni } from '../../../lib/ayarlar'
import { useDil } from '../../../lib/dil'
import { useHataStili } from '../../tasarim/hata-stili'

/**
 * MESAJ IZINLERI (kullanicinin referans gorseli 2026-09-18): Herkes /
 * Yalnizca arkadaslarim / Hic kimse. Kural sunucuda (`mesaj_gonder`).
 */
export default function MesajIzinleriEkrani() {
  const { t } = useDil()
  const hataStili = useHataStili()
  const [izin, setIzin] = useState<MesajIzni | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  useEffect(() => {
    mesajIzniGetir().then(setIzin).catch((e) => setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu')))
  }, [t])

  async function sec(deger: MesajIzni) {
    const onceki = izin
    setIzin(deger)
    try {
      await mesajIzniAyarla(deger)
      setHata(null)
    } catch (e) {
      setIzin(onceki)
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <AyarSayfasi baslik={t('gizlilikEtkilesim.mesajIzinleri')} altBaslik={t('gizlilikEtkilesim.mesajIzinleriAlt')}>
      {hata && <Text style={hataStili}>{hata}</Text>}
      {izin !== null && (
        <RadyoKarti<MesajIzni>
          testIDOneki="mesaj-izni"
          secili={izin}
          onSec={sec}
          secenekler={[
            { deger: 'herkes', baslik: t('gizlilikEtkilesim.herkes'), aciklama: t('gizlilikEtkilesim.herkesAciklama') },
            { deger: 'arkadaslar', baslik: t('gizlilikEtkilesim.yalnizcaArkadaslarim'), aciklama: t('gizlilikEtkilesim.yalnizcaArkadaslarimAciklama') },
            { deger: 'hic_kimse', baslik: t('gizlilikEtkilesim.hicKimse'), aciklama: t('gizlilikEtkilesim.hicKimseAciklama') },
          ]}
        />
      )}
    </AyarSayfasi>
  )
}
