import { useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Image as HizliImage } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import Svg, { Path, Circle } from 'react-native-svg'
import { useDil } from '../../lib/dil'
import { EN_FAZLA_FOTOGRAF } from '../../lib/checkin'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import { GaleriSayfasi } from './GaleriSayfasi'
import { FotografGezgini } from './FotografGezgini'

/** Izgaradaki bir kare: sunucudaki mevcut fotograf (`yol` dolu) ya da yeni yerel dosya. */
export type FotografKaresi = { uri: string; yol?: string }

/**
 * FOTOGRAF IZGARASI (duzenlenebilir) - check-in formu ve "Check-in'i
 * duzenle" sayfasi ORTAK kullanir (coklu fotograf, referans 2026-09-21):
 *   - fotograf yokken kesikli tam genislik kutu: resim+ ikonu,
 *     "Fotograf ekle", "Kamera veya galeriden sec";
 *   - varken 3 sutun kare izgara: her karede sag ustte beyaz daire x
 *     (kaldir), altta yarim saydam "Degistir" seridi; son kare kesikli
 *     "+ Ekle" (EN_FAZLA_FOTOGRAF'a ulasinca gizlenir).
 * FOTOGRAF SECIMI ALTTAN GELEN GALERI SAYFASINDA (2026-09-23,
 * kullanicinin karari "check-in duzenleme ve yeni check-in kisminda
 * ayni galeri akisini kullanicaz"): eski Kamera/Galeri penceresi yerine
 * `GaleriSayfasi` aciliyor - ilk kare kamera, arkasindan telefonun son
 * fotograflari. Ekle'de coklu secim (kalan yer kadar), Degistir'de
 * tekli. Izgara `expo-media-library` istiyor; modul olmayan eski bir
 * derlemede sayfa sistem secicisine dusuyor (coklu secim orada da var).
 * Sonuclar geri cagrilarla bildirilir; sunucuya hicbir sey gitmez.
 */
export function FotografIzgarasiDuzenle({
  kareler,
  onEklendi,
  onDegistirildi,
  onKaldir,
  onHata,
  pasif = false,
  sutun = 3,
  testID = 'foto',
}: {
  kareler: FotografKaresi[]
  /** Galeriden/kameradan gelen yeni yerel dosyalar (sona eklenir). */
  onEklendi: (uriler: string[]) => void
  /** `indeks`teki kare yeni yerel dosyayla degistirildi. */
  onDegistirildi: (indeks: number, uri: string) => void
  onKaldir: (indeks: number) => void
  /** Izin reddi gibi kullaniciya gosterilecek hatalar. */
  onHata?: (mesaj: string) => void
  pasif?: boolean
  /** Satirdaki kare sayisi (form 3, duzenleme sayfasi 4 - secenek A). */
  sutun?: number
  /** `${testID}-ekle`, `${testID}-<i>`, `${testID}-kaldir-<i>`, `${testID}-degistir-<i>`. */
  testID?: string
}) {
  const stiller = useStiller(stilleriYap)
  const renk = useRenk()
  const { t } = useDil()
  // Galeri sayfasi hangi is icin acik: -1 ekle, >=0 o kareyi degistir.
  const [kaynakIcin, setKaynakIcin] = useState<number | null>(null)
  // Sayfa kamerayi/sistem secicisini KAPANDIKTAN SONRA aciyor (iOS iki
  // pencereyi ust uste sunamiyor), o an `kaynakIcin` null olmus oluyor;
  // hedef bu yuzden ayrica ref'te tasiniyor.
  const hedefRef = useRef(-1)
  function kaynakAc(hedef: number) {
    hedefRef.current = hedef
    setKaynakIcin(hedef)
  }
  // KAREYE DOKUNMAK BUYUK ACAR (kullanicinin istegi 2026-09-22): ortak
  // gezgin, dokunulan kareden; x ve "Degistir" ayri hedefler.
  const [acikIndeks, setAcikIndeks] = useState<number | null>(null)

  const kalanYer = Math.max(0, EN_FAZLA_FOTOGRAF - kareler.length)
  // Kare eni: satir, aradaki 8 px bosluklar dusulerek `sutun`a bolunur
  // (yuzdeyle: bosluk basina ~%2,4).
  const kareEni = {
    flexBasis: `${(100 - (sutun - 1) * 2.4) / sutun}%` as `${number}%`,
    maxWidth: `${100 / sutun}%` as `${number}%`,
  }

  async function kameradanCek() {
    const hedef = hedefRef.current
    // Izin REDDEDILIRSE sessizce gecmiyoruz: kullanici dugmeye basip
    // hicbir sey olmamasini "uygulama bozuk" diye okur.
    const izin = await ImagePicker.requestCameraPermissionsAsync()
    if (!izin.granted) {
      onHata?.(t('checkIn.kameraIzni'))
      return
    }
    const sonuc = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (sonuc.canceled || !sonuc.assets[0]) return
    if (hedef >= 0) onDegistirildi(hedef, sonuc.assets[0].uri)
    else onEklendi([sonuc.assets[0].uri])
  }

  async function galeridenSec() {
    const hedef = hedefRef.current
    const degistirMi = hedef >= 0
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      // Ekle: kalan yer kadar coklu secim; Degistir: tek.
      allowsMultipleSelection: !degistirMi && kalanYer > 1,
      selectionLimit: degistirMi ? 1 : kalanYer,
    })
    if (sonuc.canceled || sonuc.assets.length === 0) return
    if (degistirMi) onDegistirildi(hedef, sonuc.assets[0].uri)
    else onEklendi(sonuc.assets.slice(0, kalanYer).map((a) => a.uri))
  }

  /** Alttan gelen sayfadaki izgaradan secilenler. */
  function izgaradanSecildi(uriler: string[]) {
    const hedef = hedefRef.current
    setKaynakIcin(null)
    if (uriler.length === 0) return
    if (hedef >= 0) onDegistirildi(hedef, uriler[0])
    else onEklendi(uriler.slice(0, kalanYer))
  }

  return (
    <View>
      {kareler.length === 0 ? (
        <Pressable
          style={({ pressed }) => [stiller.bosKutu, pressed && stiller.basili]}
          onPress={() => kaynakAc(-1)}
          disabled={pasif}
          accessibilityRole="button"
          testID={`${testID}-ekle`}
        >
          <ResimEkleIkonu renk={renk.turuncu} />
          <Text style={stiller.bosBaslik}>{t('checkIn.fotografEkle')}</Text>
          <Text style={stiller.bosAlt}>{t('checkIn.kameraVeyaGaleri')}</Text>
        </Pressable>
      ) : (
        <View style={stiller.izgara}>
          {kareler.map((kare, i) => (
            <View key={`${i}-${kare.uri}`} style={[stiller.kare, kareEni]} testID={`${testID}-${i}`}>
              <Pressable
                style={stiller.kareFoto}
                onPress={() => setAcikIndeks(i)}
                accessibilityRole="imagebutton"
                accessibilityLabel={t('anaSayfa.fotografiBuyut')}
                testID={`${testID}-ac-${i}`}
              >
                <HizliImage source={{ uri: kare.uri }} style={stiller.kareFoto} contentFit="cover" />
              </Pressable>
              <Pressable
                style={stiller.kaldir}
                onPress={() => onKaldir(i)}
                disabled={pasif}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('checkIn.fotografKaldir')}
                testID={`${testID}-kaldir-${i}`}
              >
                <Text style={stiller.kaldirYazi}>×</Text>
              </Pressable>
              <Pressable
                style={stiller.degistir}
                onPress={() => kaynakAc(i)}
                disabled={pasif}
                accessibilityRole="button"
                testID={`${testID}-degistir-${i}`}
              >
                <KalemBeyaz />
                <Text style={stiller.degistirYazi}>{t('checkIn.degistir')}</Text>
              </Pressable>
            </View>
          ))}
          {kalanYer > 0 && (
            <Pressable
              style={({ pressed }) => [stiller.kare, kareEni, stiller.ekleKare, pressed && stiller.basili]}
              onPress={() => kaynakAc(-1)}
              disabled={pasif}
              accessibilityRole="button"
              testID={`${testID}-ekle`}
            >
              <Text style={stiller.ekleArti}>+</Text>
              <Text style={stiller.ekleYazi}>{t('checkIn.fotografEkle')}</Text>
            </Pressable>
          )}
        </View>
      )}

      <FotografGezgini
        testID={testID}
        fotograflar={kareler.map((k, i) => ({ id: `${i}-${k.uri}`, url: k.uri }))}
        acikIndeks={acikIndeks}
        onIndeks={setAcikIndeks}
        onKapat={() => setAcikIndeks(null)}
      />

      <GaleriSayfasi
        acikMi={kaynakIcin !== null}
        onKapat={() => setKaynakIcin(null)}
        onKamera={kameradanCek}
        onFotograf={izgaradanSecildi}
        onSistemSecicisi={galeridenSec}
        enFazla={kaynakIcin !== null && kaynakIcin >= 0 ? 1 : Math.max(1, kalanYer)}
      />
    </View>
  )
}

/** Kesikli kutudaki resim + isareti (referans). */
function ResimEkleIkonu({ renk: c }: { renk: string }) {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24">
      <Path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7M20 11v6.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11"
        stroke={c}
        strokeWidth={1.7}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M4 16l4.5-4.5 3 3 2.5-2.5L20 17.5" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={9} cy={9} r={1.4} fill={c} />
      <Path d="M18.5 3.5v5M16 6h5" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  )
}

function KalemBeyaz() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Path
        d="M4 20h4l10-10-4-4L4 16v4z M13.5 6.5l4 4"
        stroke="#FFFFFF"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    bosKutu: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      minHeight: 150,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: renk.turuncu,
      borderRadius: yuvarlak.kart,
      backgroundColor: renk.turuncuZemin,
      paddingVertical: bosluk.l,
    },
    bosBaslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.turuncuYazi, marginTop: bosluk.xs },
    bosAlt: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },
    basili: { opacity: 0.85 },
    izgara: { flexDirection: 'row', flexWrap: 'wrap', gap: bosluk.s },
    // Eni `kareEni` verir (sutun sayisina gore); burada yalnizca bicim.
    kare: {
      flexGrow: 1,
      aspectRatio: 1,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: renk.cizgi,
    },
    kareFoto: { width: '100%', height: '100%' },
    kaldir: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    kaldirYazi: { fontFamily: yazi.govdeKalin, fontSize: 18, lineHeight: 20, color: '#17130F' },
    degistir: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 7,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    degistirYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk - 1, color: '#FFFFFF' },
    ekleKare: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: renk.turuncu,
      backgroundColor: renk.karsilamaZemini,
      gap: 4,
    },
    ekleArti: { fontFamily: yazi.govde, fontSize: 30, lineHeight: 34, color: renk.turuncu },
    ekleYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: renk.turuncuYazi, textAlign: 'center', paddingHorizontal: 4 },
  })
