import { ScrollView, Text, View, StyleSheet } from 'react-native'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'
import { yazi, olcek, bosluk, type Renk } from '../tasarim/tema'
import { useStiller } from '../tasarim/tema-baglami'
import { UstCubuk } from '../tasarim/UstCubuk'
import { useDil } from '../../lib/dil'
import { gizlilikBolumleri } from '../../lib/hukuki'
import tr from '../../lib/hukuki/tr'

/**
 * GIZLILIK METNI - YEDI DILDE (i18n E asamasi, 2026-09-13).
 *
 * Icerik `lib/hukuki/<dil>.ts` dosyalarinda; kaynak metin
 * `docs/gizlilik-metni.md` ve onun birebir karsiligi `lib/hukuki/tr.ts`.
 * Icerik uzak bir kaynaktan CEKILMEZ, kod icinde sabit tutulur -
 * gizlilik metni ag baglantisi olmadan da okunabilmeli.
 *
 * TURKCE METIN ESASTIR: Turkce disindaki dillerde belgenin basinda
 * bunu soyleyen bir not var (`hukuki.ustunlukNotu`).
 *
 * `BOLUMLER` disa aktarimi DURUYOR (testler ve `_layout` onu okuyor):
 * Turkce kaynak dizinin ta kendisi.
 *
 * Duzeltme gecmisi: docs/gizlilik-metni.md basindaki "Duzeltme
 * gecmisi" notuna bak (tur 1 ve tur 2, kod incelemesi).
 */
export const BOLUMLER = tr.gizlilik

export default function GizlilikEkrani() {
  const stiller = useStiller(stilleriYap)
  const { t, dil } = useDil()
  const bolumler = gizlilikBolumleri(dil)
  return (
    <ScrollView style={stiller.kaydirici} contentContainerStyle={stiller.icerik}>
      <UstCubuk baslik={t('hukuki.gizlilikBaslik')} geriEtiketi={t('ortak.geri')} />
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

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kaydirici: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.sayfa,
    gap: bosluk.s,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  /* "Turkce metin esastir" notu: ikincil tonda, belgeden once. */
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
