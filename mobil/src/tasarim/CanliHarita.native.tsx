import { useEffect, useMemo, useRef } from 'react'
import { Platform, View, Text, StyleSheet } from 'react-native'
import MapView, { Marker, type Region } from 'react-native-maps'
import Svg, { Circle, Path } from 'react-native-svg'
import { mesafeMetre } from '../../lib/konum'
import { renk, yazi, olcek, yuvarlak } from './tema'
import type { HaritaMekani } from './CanliHarita'

export type { HaritaMekani } from './CanliHarita'

/**
 * CANLI HARITA - iOS ve Android surumu (GERCEK harita).
 *
 * Kullanicinin karari (2026-08-30): "gercek konumu gosteren harita,
 * iosta ve androidde calisan". iOS'ta Apple Haritalar (anahtarsiz),
 * Android'de Google Haritalar (anahtar app.config.js uzerinden cevre
 * degiskeninden gelir). Web'de `CanliHarita.tsx` radar cizimi kaliyor;
 * Metro platforma gore dogru dosyayi seciyor, ekranlar farki bilmiyor.
 *
 * Arayuz web surumuyle AYNI: merkez, mekanlar, yukseklik, onMekanSec.
 *
 * YUZ YOK (mevcut karar): igneler yalnizca kisi SAYISI tasiyor.
 *
 * Kaydirma ve yakinlastirma ACIK (kullanicinin TestFlight'taki ilk
 * geri bildirimi 2026-08-30: "kaydirmakta zorlaniyorum"). Ilk surumde
 * kaydirma kapaliydi - sayfa kaydirmasiyla cakisir diye - ama gercek
 * bir haritanin parmakla kaymamasi bozuk hissettiriyor. Parmak
 * haritadayken harita, disindayken sayfa kayar; Instagram ve Google
 * uygulamalarindaki kart haritalar da boyle.
 */

/** Haritada en fazla kac mekan ignesi cizilir. */
const EN_FAZLA_IGNE = 12

/** Cerceve yaricapi bundan kucuk olmasin - her sey bir noktaya toplanmasin. */
const EN_AZ_GOSTERIM_METRE = 100

/**
 * Cerceve yaricapi bundan BUYUK olmasin (kullanicinin istegi
 * 2026-08-30: "harita cok uzaktan, biraz daha adrese yakin baslasin").
 *
 * 2026-09-01'de 200 -> 100 m: "haritada daha yakin goster, konumumu
 * gosteren yere daha yakin baslasin". Bu YALNIZCA HARITA CERCEVESI
 * icindir - kullanici ayrica netlestirdi. Listenin yaricapi 200 m'de
 * KALIYOR; olculdu, 100 m'ye indirilseydi kullanicinin bolgesinde
 * listede 34 yerine 1 mekan kalirdi.
 *
 * Oncesinde cerceve EN UZAK igneye gore aciliyordu; liste 10 km oteye
 * kadar mekan tasiyabildigi icin harita bazen sehir olceginde
 * basliyordu ve merkezdeki mekan bir nokta kaliyordu. Check-in kurali
 * zaten 1 km, yani ekranda islem yapilabilir her yer bu cercevenin
 * icinde. Daha uzaktakiler kadraj disinda kaliyor; kullanici isterse
 * uzaklastirabiliyor.
 */
const EN_FAZLA_GOSTERIM_METRE = 100

const KAYDIRMA_SURESI_MS = 350

/**
 * Google'in kendi ilgi noktasi etiketleri kapatiliyor: bizim mekan
 * ignelerimizle ayni yerde ikinci bir isim gorunuyordu. Yalnizca
 * Android'de gecerli (Google saglayici); iOS bunu prop ile yapiyor.
 */
const GOOGLE_HARITA_STILI = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

/** Merkez ve gosterim yaricapindan (metre) harita bolgesi uretir. */
function bolgeUret(merkez: { lat: number; lng: number }, gosterimMetre: number): Region {
  const enlemRadyan = (merkez.lat * Math.PI) / 180
  return {
    latitude: merkez.lat,
    longitude: merkez.lng,
    latitudeDelta: (gosterimMetre * 2) / 110540,
    longitudeDelta: (gosterimMetre * 2) / (111320 * Math.cos(enlemRadyan)),
  }
}

export function CanliHarita({
  merkez,
  mekanlar,
  yukseklik = 260,
  onMekanSec,
}: {
  merkez: { lat: number; lng: number } | null
  mekanlar: HaritaMekani[]
  yukseklik?: number
  onMekanSec?: (mekanId: string) => void
}) {
  const haritaRef = useRef<MapView>(null)

  /**
   * Igne secimi web'deki kuralin aynisi: once kalabaliklar, sonra en
   * yakinlar, en fazla 12. Cerceve en uzak igneye gore.
   */
  const { igneler, bolge } = useMemo(() => {
    if (!merkez) return { igneler: [] as HaritaMekani[], bolge: null as Region | null }

    const mesafeli = mekanlar
      .filter((m) => m.konum)
      .map((m) => ({
        mekan: m,
        metre: mesafeMetre(merkez.lat, merkez.lng, m.konum!.lat, m.konum!.lng),
      }))
      .filter((m) => Number.isFinite(m.metre))
      .sort((a, b) => b.mekan.kisiSayisi - a.mekan.kisiSayisi || a.metre - b.metre)
      .slice(0, EN_FAZLA_IGNE)

    const enUzak = mesafeli.length ? Math.max(...mesafeli.map((m) => m.metre)) : 0
    const gosterim = Math.min(
      EN_FAZLA_GOSTERIM_METRE,
      Math.max(EN_AZ_GOSTERIM_METRE, enUzak * 1.12)
    )

    return { igneler: mesafeli.map((m) => m.mekan), bolge: bolgeUret(merkez, gosterim) }
  }, [merkez, mekanlar])

  // Merkez ya da mekanlar degisince harita yeni cerceveye kayar. Ilk
  // cizim initialRegion ile; bu efekt ilk cizimde de calisir ama
  // ayni bolgeye kaydirmak gorunur bir sey yapmiyor.
  useEffect(() => {
    if (bolge) haritaRef.current?.animateToRegion(bolge, KAYDIRMA_SURESI_MS)
  }, [bolge])

  if (!merkez || !bolge) {
    // Konum henuz yok: ayni yukseklikte bos yuzey, ekran ziplamasin.
    return <View style={[stiller.kok, { height: yukseklik }]} testID="canli-harita-bos" />
  }

  return (
    <View style={[stiller.kok, { height: yukseklik }]} accessibilityLabel="Çevrendeki mekanlar">
      <MapView
        ref={haritaRef}
        testID="canli-harita"
        style={StyleSheet.absoluteFill}
        initialRegion={bolge}
        scrollEnabled
        zoomEnabled
        moveOnMarkerPress={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        customMapStyle={Platform.OS === 'android' ? GOOGLE_HARITA_STILI : undefined}
      >
        {igneler.map((mekan) => {
          const canli = mekan.kisiSayisi > 0
          return (
            <Marker
              key={mekan.id}
              coordinate={{ latitude: mekan.konum!.lat, longitude: mekan.konum!.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => onMekanSec?.(mekan.id)}
              accessibilityLabel={
                canli ? `${mekan.ad}, ${mekan.kisiSayisi} kişi burada` : mekan.ad
              }
            >
              {canli ? (
                <View style={stiller.canliIgne}>
                  <Text style={stiller.canliSayi}>{mekan.kisiSayisi}</Text>
                </View>
              ) : (
                <View style={stiller.sakinIgne} />
              )}
            </Marker>
          )
        })}

        {/* Merkez: bizim turuncu igne. Ucu tam koordinata basiyor. */}
        <Marker
          coordinate={{ latitude: merkez.lat, longitude: merkez.lng }}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={false}
          accessibilityLabel="Buradasın"
        >
          <Svg width={44} height={44} viewBox="0 0 24 24">
            <Path
              d="M12 2.2a7.6 7.6 0 0 0-7.6 7.6c0 5.7 7.6 12 7.6 12s7.6-6.3 7.6-12A7.6 7.6 0 0 0 12 2.2z"
              fill={renk.turuncu}
              stroke="#FFFFFF"
              strokeWidth={1.4}
            />
            <Circle cx={12} cy={9.7} r={2.9} fill="#FFFFFF" />
          </Svg>
        </Marker>
      </MapView>
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.buyuk,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  canliIgne: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 5,
    borderRadius: 13,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  canliSayi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    lineHeight: 14,
    color: '#FFFFFF',
  },
  sakinIgne: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: renk.metinSoluk,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
})
