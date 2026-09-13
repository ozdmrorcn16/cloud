import { ScrollView, Text, View, StyleSheet } from 'react-native'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'
import { yazi, olcek, bosluk, type Renk } from '../tasarim/tema'
import { useStiller } from '../tasarim/tema-baglami'
import { UstCubuk } from '../tasarim/UstCubuk'
import { useDil } from '../../lib/dil'
import { kosulBolumleri } from '../../lib/hukuki'
import tr from '../../lib/hukuki/tr'

/**
 * KULLANIM KOSULLARI - YEDI DILDE (2026-09-13).
 *
 * Kaynak metin: `site/src/pages/[...dil]/kosullar.astro` (7 Eylul 2026
 * surumu); uygulama icindeki karsiligi `lib/hukuki/tr.ts`, cevirileri
 * `lib/hukuki/<dil>.ts`. Hesap olusturma ekranindaki "Kullanim
 * kosullarini" baglantisi buraya geliyor; onceden uygulama icinde
 * boyle bir belge YOKTU. Gizlilik metni gibi OTURUMSUZ da acilabiliyor
 * (`_layout`).
 *
 * Icerik kod icinde sabit: ag olmadan da okunabilmeli. Site metni
 * degisirse Turkce dizi ve alti ceviri AYNI TURDA guncellenmeli.
 * TURKCE METIN ESASTIR; diger dillerde basta not var.
 */
export const KOSUL_BOLUMLERI = tr.kosullar

/** Kosullarin son guncelleme tarihi (site surumu). */
const SON_GUNCELLEME = new Date(2026, 8, 7)

export default function KosullarEkrani() {
  const stiller = useStiller(stilleriYap)
  const { t, dil } = useDil()
  const bolumler = kosulBolumleri(dil)
  const tarih = SON_GUNCELLEME.toLocaleDateString(dil, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return (
    <ScrollView style={stiller.kaydirici} contentContainerStyle={stiller.icerik}>
      <UstCubuk baslik={t('hukuki.kosullarBaslik')} geriEtiketi={t('ortak.geri')} />
      <Text style={stiller.guncelleme}>{t('hukuki.sonGuncelleme', { tarih })}</Text>
      {dil !== 'tr' && (
        <Text style={stiller.ustunlukNotu} testID="ustunluk-notu">
          {t('hukuki.ustunlukNotu')}
        </Text>
      )}
      {bolumler.map((bolum) => (
        <View key={bolum.baslik} style={stiller.bolum}>
          <Text style={stiller.bolumBasligi}>{bolum.baslik}</Text>
          {bolum.paragraflar.map((paragraf) => (
            <Text key={paragraf} style={stiller.paragraf}>
              {paragraf}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kaydirici: { flex: 1, backgroundColor: renk.zemin },
    icerik: {
      paddingHorizontal: bosluk.sayfa,
      gap: bosluk.s,
      paddingBottom: ALT_GEZINME_PAYI,
    },
    guncelleme: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metinSoluk,
    },
    ustunlukNotu: {
      fontFamily: yazi.govdeOrta,
      fontSize: olcek.kucuk,
      lineHeight: 20,
      color: renk.metinIkincil,
    },
    bolum: { marginTop: bosluk.l, gap: bosluk.xs },
    bolumBasligi: {
      fontFamily: yazi.ekranBasligi,
      fontSize: olcek.altBaslik,
      color: renk.metin,
      letterSpacing: -0.3,
    },
    paragraf: {
      fontFamily: yazi.govde,
      fontSize: olcek.govde,
      lineHeight: 23,
      color: renk.metinIkincil,
    },
  })
