import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { aniGorunurlugunuAyarla } from '../../../lib/ayarlar'
import type { AniGorunurlugu } from '../../../lib/checkin'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk } from '../../tasarim/tema'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { Bolum, SecenekSatiri } from '../../tasarim/Liste'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'

/**
 * Gecmis anilarin gorunurlugu.
 *
 * Bu bir TERCIH DEGIL, TOPLU EYLEM: RPC her cagrildiginda butun anilara
 * uygulaniyor. Bu yuzden sunucudan okunan bir baslangic degeri yok ve
 * ekran acildiginda hicbir secenek secili gorunmuyor - son basarili
 * secim yalnizca bu ekran acik kaldigi surece isaretli kalir.
 */
export default function AniGorunurluguEkrani() {
  const { t } = useDil()
  const [secim, setSecim] = useState<AniGorunurlugu | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  const SECENEKLER: { deger: AniGorunurlugu; etiket: string }[] = [
    { deger: 'herkese_acik', etiket: t('ayarlar.aniHerkeseAcik') },
    { deger: 'takipcilerim', etiket: t('ayarlar.aniTakipcilerim') },
    { deger: 'kimse', etiket: t('ayarlar.aniKimse') },
  ]

  async function degistir(deger: AniGorunurlugu) {
    const onceki = secim
    setSecim(deger)
    try {
      await aniGorunurlugunuAyarla(deger)
      setHata(null)
    } catch (e) {
      setSecim(onceki)
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik={t('aniGorunurlugu.baslik')} geriEtiketi={t('aniGorunurlugu.geri')} />

      <View style={stiller.icerik}>
        <Text style={stiller.aciklama}>{t('aniGorunurlugu.aciklama')}</Text>
        {hata && <Text style={stiller.hata}>{hata}</Text>}

        <Bolum>
          {SECENEKLER.map((secenek, sira) => (
            <SecenekSatiri
              key={secenek.deger}
              etiket={secenek.etiket}
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
