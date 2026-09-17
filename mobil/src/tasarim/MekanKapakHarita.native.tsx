import { View, StyleSheet, Platform } from 'react-native'
import MapView from 'react-native-maps'
import { yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import { IgneIkonu } from './mekan-ikonlari'
import { GOOGLE_HARITA_STILI, bolgeUret } from './harita-ortak'
import type { MekanKapakHaritaProps } from './MekanKapakHarita'

export type { MekanKapakHaritaProps } from './MekanKapakHarita'

/**
 * MEKAN KARTININ KARE KUCUK HARITASI - iOS ve Android (GERCEK harita).
 *
 * Kullanicinin istegi (2026-09-17): "butun konumlar ilk sutundaki gibi
 * yap, kucuk map goruntusunde de gercek haritadaki yeri gorunsun".
 * Kartin karesi artik mekanin GERCEK cevresini gosteriyor: iOS'ta
 * Apple, Android'de Google Haritalar - buyuk haritayla ayni motor,
 * ayni stil (`harita-ortak`). Ucuncu bir servis, anahtar ya da
 * tekrarlayan gider YOK.
 *
 * KARE MEKANIN UZERINDE MERKEZLI, IGNE BIZIM: harita tam koordinatta
 * merkezlendigi icin `Marker` gerekmiyor - ignenin kendisi ortaya
 * ciziliyor. Marker her kartta ayri bir native gorunum demekti;
 * cizilen SVG hem daha ucuz hem kimlige uygun (buyuk haritadaki
 * igneyle ayni cizim).
 *
 * PERFORMANS - bu ekranda kart sayisi 100'e cikabiliyor:
 *   - `liteMode` (Android): harita canli gorunum degil tek bir
 *     bitmap; Google bu kipi tam da listedeki kucuk haritalar icin
 *     veriyor.
 *   - `cacheEnabled` (iOS): harita bir kez cizilip goruntu olarak
 *     tutuluyor.
 *   - Butun hareketler kapali ve `pointerEvents="none"`: dokunus
 *     karta gidiyor, yani kareye basinca mekan sayfasi aciliyor.
 *   - `cizilsin` false geldiginde harita HIC kurulmuyor (ekran
 *     disindaki kartlar). Karsiliginda ayni olcude igneli kutu
 *     duruyor, yani kartin hizasi kaymiyor.
 */

/**
 * Karenin kapsadigi yaricap (metre). 120 m sokak olceginde bir kadraj
 * veriyor: cevre yollar ve yapi adalari secilyor ama 96 px'lik karede
 * her sey noktaya donusmuyor. Buyuk haritanin cerceve kurali
 * (`EN_FAZLA_GOSTERIM_METRE` = 100) ile ayni mertebede.
 */
const KAPAK_GOSTERIM_METRE = 120

export function MekanKapakHarita({
  konum,
  olcu,
  cizilsin = true,
  testID,
}: MekanKapakHaritaProps) {
  const renk = useRenk()
  const stiller = useStiller(stilleriUret)
  const igneBoyutu = Math.round(olcu * 0.27)

  if (!konum || !cizilsin) {
    return (
      <View style={[stiller.kutu, { width: olcu, height: olcu }]} testID={testID}>
        <IgneIkonu boyut={igneBoyutu} renk={renk.turuncu} />
      </View>
    )
  }

  return (
    <View style={[stiller.kutu, { width: olcu, height: olcu }]} testID={testID}>
      <MapView
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        initialRegion={bolgeUret(konum, KAPAK_GOSTERIM_METRE)}
        /*
         * Iki platformun kendi "kucuk harita" kipi var ve ikisi ayni
         * anda verilmiyor - Android'de lite kip zaten tek bir bitmap
         * ciziyor, ustune onbellek goruntusu istemek gereksiz bir
         * ikinci yol acardi.
         */
        liteMode={Platform.OS === 'android'}
        cacheEnabled={Platform.OS === 'ios'}
        // Harita hazir olana kadar kutunun rengi: ayni kare, ayni
        // zemin - yuklenirken beyaz bir delik acilmiyor.
        loadingBackgroundColor={renk.turuncuZemin}
        loadingIndicatorColor={renk.turuncu}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        customMapStyle={Platform.OS === 'android' ? GOOGLE_HARITA_STILI : undefined}
        testID={testID ? `${testID}-harita` : undefined}
      />
      {/* Ignenin UCU merkeze gelsin: cizimde uc alt kenara yakin
          (viewBox 24 icinde y~21,7), yani igne yarim boyunun ~%40'i
          kadar yukari kaydiriliyor. Kaydirma olmazsa gosterilen nokta
          gercek koordinattan asagida kalirdi. */}
      <View style={[stiller.igne, { transform: [{ translateY: -igneBoyutu * 0.4 }] }]}>
        <IgneIkonu boyut={igneBoyutu} renk={renk.turuncu} />
      </View>
    </View>
  )
}

const stilleriUret = (renk: Renk) =>
  StyleSheet.create({
    kutu: {
      borderRadius: yuvarlak.kart,
      backgroundColor: renk.turuncuZemin,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    igne: { position: 'absolute' },
  })
