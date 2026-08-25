import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import {
  varsayilanBulunurluguGetir,
  varsayilanBulunurluguAyarla,
} from '../../../lib/ayarlar'
import type { Bulunurluk } from '../../../lib/checkin'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk } from '../../tasarim/tema'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { Bolum, SecenekSatiri } from '../../tasarim/Liste'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'

/**
 * Yeni check-in'lerin varsayilan bulunurlugu.
 *
 * Ayarlar listesinden ayri bir ekrana alindi: uc kademenin her birinin
 * bir aciklamasi var ve o aciklamalar tek satira sigmiyordu.
 */
export default function CheckInGorunurluguEkrani() {
  const { t } = useDil()
  const [secim, setSecim] = useState<Bulunurluk | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  const SECENEKLER: { deger: Bulunurluk; etiket: string; aciklama: string }[] = [
    {
      deger: 'herkese_acik',
      etiket: t('ayarlar.bulunurlukHerkeseAcik'),
      aciklama: t('checkInGorunurlugu.herkeseAcikAciklama'),
    },
    {
      deger: 'takipcilerim',
      etiket: t('ayarlar.bulunurlukTakipcilerim'),
      aciklama: t('checkInGorunurlugu.takipcilerimAciklama'),
    },
    {
      deger: 'gizli',
      etiket: t('ayarlar.bulunurlukGizli'),
      aciklama: t('checkInGorunurlugu.gizliAciklama'),
    },
  ]

  useEffect(() => {
    varsayilanBulunurluguGetir()
      .then(setSecim)
      .catch((e) => setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu')))
  }, [])

  async function degistir(deger: Bulunurluk) {
    const onceki = secim
    setSecim(deger)
    try {
      await varsayilanBulunurluguAyarla(deger)
      setHata(null)
    } catch (e) {
      // Kaydedilemeyen bir secim, secilmis gibi durmamali.
      setSecim(onceki)
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <View style={stiller.kok}>
      <UstCubuk
        baslik={t('checkInGorunurlugu.baslik')}
        geriEtiketi={t('checkInGorunurlugu.geri')}
      />

      <View style={stiller.icerik}>
        <Text style={stiller.aciklama}>{t('checkInGorunurlugu.aciklama')}</Text>
        {hata && <Text style={stiller.hata}>{hata}</Text>}

        <Bolum>
          {SECENEKLER.map((secenek, sira) => (
            <SecenekSatiri
              key={secenek.deger}
              etiket={secenek.etiket}
              aciklama={secenek.aciklama}
              secili={secim === secenek.deger}
              sonuncu={sira === SECENEKLER.length - 1}
              onPress={() => degistir(secenek.deger)}
            />
          ))}
        </Bolum>
      </View>
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: { paddingHorizontal: bosluk.xl, paddingBottom: ALT_GEZINME_PAYI },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginTop: bosluk.m,
  },
})
