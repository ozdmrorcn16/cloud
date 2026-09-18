import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import Constants from 'expo-constants'
import { AyarSayfasi, AyarBolumBasligi, IkonKutusu } from '../../tasarim/AyarSayfasi'
import { Bolum, Satir } from '../../tasarim/Liste'
import { KalpElIkonu, KilitliBelgeIkonu, BelgeIkonu } from '../../tasarim/uygulama-ikonlari'
import { useDil } from '../../../lib/dil'
import { yazi, olcek, bosluk, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'

/**
 * SLOOIN HAKKINDA (kullanicinin referans gorseli 2026-09-19): "Birlikte
 * daha iyi" basligi altinda uc satir - Topluluk kurallari (yeni ekran),
 * Gizlilik politikasi (`/gizlilik`), Kullanim kosullari (`/kosullar`).
 * Altta kucuk surum satiri (magaza incelemesinde "hangi surum"
 * sorusunun cevabi; app.json'dan okunur).
 */
export default function HakkindaEkrani() {
  const { t } = useDil()
  const stiller = useStiller(stilleriYap)
  const surum = Constants.expoConfig?.version ?? ''

  return (
    <AyarSayfasi baslik={t('uygulama.hakkinda')} altBaslik={t('uygulama.hakkindaAlt')}>
      <AyarBolumBasligi>{t('uygulama.birlikteDahaIyi')}</AyarBolumBasligi>
      <Bolum>
        <Satir
          ikon={<IkonKutusu><KalpElIkonu /></IkonKutusu>}
          etiket={t('uygulama.toplulukKurallari')}
          aciklama={t('uygulama.toplulukAciklama')}
          onPress={() => router.push('/topluluk-kurallari')}
        />
        <Satir
          ikon={<IkonKutusu><KilitliBelgeIkonu /></IkonKutusu>}
          etiket={t('uygulama.gizlilikPolitikasi')}
          aciklama={t('uygulama.gizlilikPolitikasiAciklama')}
          onPress={() => router.push('/gizlilik')}
        />
        <Satir
          ikon={<IkonKutusu><BelgeIkonu /></IkonKutusu>}
          etiket={t('uygulama.kullanimKosullari')}
          aciklama={t('uygulama.kullanimKosullariAciklama')}
          sonuncu
          onPress={() => router.push('/kosullar')}
        />
      </Bolum>
      {surum !== '' && (
        <View style={stiller.surumKabi}>
          <Text style={stiller.surum} testID="surum">{t('uygulama.surum', { surum })}</Text>
        </View>
      )}
    </AyarSayfasi>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  surumKabi: { alignItems: 'center', marginTop: bosluk.xl },
  surum: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinSoluk },
})
