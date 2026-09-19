import { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, View, Text, Pressable, StyleSheet } from 'react-native'
import MapView, { Marker, type Region } from 'react-native-maps'
import Svg, { Circle, Path } from 'react-native-svg'
import { mesafeMetre } from '../../lib/konum'
import { yazi, olcek, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import { mekanDurumu, type MekanDurumu } from '../../lib/mekan'
import type { HaritaMekani } from './CanliHarita'
import { GOOGLE_HARITA_STILI, bolgeUret } from './harita-ortak'
import { kumele, kumeSiniri } from '../../lib/harita-kumeleme'

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

/**
 * IGNE SAYISI SINIRI KALKTI (kullanicinin istegi 2026-09-09:
 * "yakinindaki mekanlar listesinde gorunen butun yerler haritada o
 * anlik gosterilsin").
 *
 * Once 12'ydi ve listedeki mekanlarin bir kismi haritada hic
 * gorunmuyordu - ekranin iki yarisi farkli seyler soyluyordu. Ust sinir
 * artik listenin kendi siniri (`KESFET_LIMIT` = 100, sunucuda).
 *
 * PERFORMANS: her igne `tracksViewChanges={false}` ile ciziliyor, yani
 * ozel gorunum bir kez bitmap'e aliniyor. Bu bayrak olmadan yuz igne
 * her karede yeniden cizilir ve harita takilir.
 */

/** Cerceve yaricapi bundan kucuk olmasin - her sey bir noktaya toplanmasin. */
import { cevir } from '../../lib/dil'
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

/**
 * Cerceve bu yaricapa kadar acilabiliyor.
 *
 * 1200 -> 25000: kullanici ignesi de cerceveye girdiginden (2026-09-07)
 * secilen mekan baska bir ilcede olabiliyor. 25 km bir sehir icinde
 * makul bir tavan; daha uzagi zaten iki nokta olarak gorunur ve
 * kullanici haritayi kendisi kaydirabiliyor.
 */
const EN_FAZLA_KAPSAMA_METRE = 25000

/**
 * Haritada ayni anda en cok bu kadar etiketli igne.
 *
 * 5'TEN 9'A CIKARILDI (kullanicinin sorusu 2026-09-07: "Haritada
 * sadece 4 tane yesil yer gorunuyor neden"). Cakismayi onleyen IKI
 * kural vardi - sayi siniri ve igneler arasi en az aralik - ve ekran
 * goruntusu asil isi ARALIK kuralinin yaptigini gosterdi: bes ignenin
 * arasi bol bol acikti, yani sayi siniri gereksiz yere bagliyordu.
 *
 * Aralik kurali yerinde durdugu icin sayiyi buyutmek etiketleri yeniden
 * ust uste bindirmiyor: birbirine yakin adaylar zaten eleniyor, sinir
 * yalnizca "kac tanesi sigabilir" sorusunun tavani.
 */
const KAYDIRMA_SURESI_MS = 350


/**
 * IGNE RENKLERI - kesfet listesindeki rozetlerle AYNI degerler.
 *
 * Ikisi ayrilirsa haritada yesil gorunen bir mekan listede kirmizi
 * rozet tasiyabilir; ayni ekranda iki farkli dogruluk olur.
 */
const DURUM_RENGI: Record<MekanDurumu, string> = {
  sakin: '#2FBF5B',
  yogun: '#E5484D',
  populer: '#F5A623',
}

/** `toplamCheckIn` istege bagli oldugu icin kucuk bir sarmalayici. */
function durumu(m: HaritaMekani): MekanDurumu {
  return mekanDurumu({ kisiSayisi: m.kisiSayisi, toplamCheckIn: m.toplamCheckIn ?? 0 })
}

const durumEtiketi = (d: MekanDurumu) =>
  cevir(d === 'sakin' ? 'kesfet.sakin' : d === 'yogun' ? 'kesfet.yogun' : 'kesfet.populer')

/**
 * KULLANICININ KONUM NOKTASI - uygulamada TEK bir "ben buradayim"
 * bicimi olsun diye ayri bir bilesen (kullanicinin kurali 2026-09-09:
 * iki ekranda ayni gorunsun).
 *
 * 2026-09-19 (kullanicinin referans tasarimi): turuncu igne yerine
 * MAVI NOKTA + saydam hale - sistem haritalarinin "sen buradasin"
 * dili. Igne bir MEKANI isaret eder; kullanici bir mekan degil.
 * Renk temadan bagimsiz: harita zemini iki modda da acik.
 */
export const KULLANICI_MAVISI = '#1A7BF2'

function KullaniciNoktasi() {
  return (
    <View style={noktaStilleri.hale}>
      <View style={noktaStilleri.nokta} />
    </View>
  )
}

const noktaStilleri = StyleSheet.create({
  hale: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A7BF233',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nokta: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: KULLANICI_MAVISI,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
})

/** Kucuk turuncu igne (tekil ignenin beyaz dairesi icinde). */
function KucukIgne({ boyut, renk: c }: { boyut: number; renk: string }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M12 2.2a7.6 7.6 0 0 0-7.6 7.6c0 5.7 7.6 12 7.6 12s7.6-6.3 7.6-12A7.6 7.6 0 0 0 12 2.2z"
        fill={c}
      />
      <Circle cx={12} cy={9.7} r={2.9} fill="#FFFFFF" />
    </Svg>
  )
}

/** Konuma don dugmesindeki nisan simgesi. */
function NisanIkonu({ renk: c }: { renk: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={6.5} stroke={c} strokeWidth={1.8} fill="none" />
      <Circle cx={12} cy={12} r={2.2} fill={c} />
      <Path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function CanliHarita({
  merkez,
  mekanlar,
  yukseklik = 260,
  onMekanSec,
  merkezDurumu,
  kullaniciKonumu,
  seciliId = null,
  konumDugmesi = false,
  konumDugmesiAltPayi = 16,
  doldur = false,
  altPay = 0,
  onBosaDokun,
}: {
  merkez: { lat: number; lng: number } | null
  mekanlar: HaritaMekani[]
  yukseklik?: number
  onMekanSec?: (mekanId: string) => void
  /**
   * Merkez ignesinin DURUMU (kullanicinin istegi 2026-09-07: "haritada
   * konumun ignesi yogunluguna ve sakinligine gore renk alsin").
   * Verilmezse merkez KULLANICININ KENDISIDIR ve mavi nokta cizilir.
   */
  merkezDurumu?: MekanDurumu
  /** Kullanicinin o anki konumu (mekan sayfasinda merkez mekandir). */
  kullaniciKonumu?: { lat: number; lng: number } | null
  /**
   * SECILI MEKAN (kullanicinin referans tasarimi 2026-09-19): yalnizca
   * onun ignesi buyuk turuncu ve YALNIZCA onun adi yazili; digerleri
   * beyaz daire icinde kucuk igne, yakin olanlar SAYILI KUME. Kumeye
   * dokununca harita ona yakinlasir; tekil igneye dokununca
   * `onMekanSec` cagrilir - secimi ekran tutar.
   *
   * Bu, 2026-09-09'daki "her ignede ad var" kuralini kullanicinin
   * yeni referansiyla DEGISTIRIYOR: adlar ust uste biniyordu, referans
   * yalnizca secili adi gosteriyor.
   */
  seciliId?: string | null
  /** Sag altta "konuma don" dugmesi. */
  konumDugmesi?: boolean
  /** Dugmenin alt payi: ustune binen panel varsa onun yuksekligi. */
  konumDugmesiAltPayi?: number
  /** Kapsayiciyi doldur (yukseklik yerine flex: 1, kose ve cerceve yok). */
  doldur?: boolean
  /**
   * Haritanin altini orten panelin yuksekligi: merkez (kullanici) ve
   * cerceve GORUNEN alana gore hesaplanir, panelin arkasina dusmez.
   */
  altPay?: number
  /** Haritanin ignesiz bir yerine dokunma (ekran klavyeyi kapatmak icin kullaniyor). */
  onBosaDokun?: () => void
}) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const haritaRef = useRef<MapView>(null)
  // Gorunur bolge ve piksel eni: kumeleme hucresi bunlardan cikar.
  const [gorunurBolge, setGorunurBolge] = useState<Region | null>(null)
  const [enPx, setEnPx] = useState(0)

  /**
   * Cerceve en uzak igneye gore (2026-09-06 duzeltmesi: igneler
   * cizilip gorunur alanin DISINDA kaliyordu). Kullanici noktasi da
   * cerceveye giriyor - mesafe gorsel olarak okunsun (2026-09-07).
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

    const kullaniciMesafesi =
      kullaniciKonumu && merkez
        ? mesafeMetre(merkez.lat, merkez.lng, kullaniciKonumu.lat, kullaniciKonumu.lng)
        : 0

    const enUzak = Math.max(
      mesafeli.length ? Math.max(...mesafeli.map((m) => m.metre)) : 0,
      Number.isFinite(kullaniciMesafesi) ? kullaniciMesafesi : 0
    )
    const gosterim =
      enUzak > 0
        ? Math.min(EN_FAZLA_KAPSAMA_METRE, Math.max(EN_AZ_GOSTERIM_METRE, enUzak * 1.25))
        : EN_FAZLA_GOSTERIM_METRE

    return { igneler: mesafeli.map((m) => m.mekan), bolge: bolgeUret(merkez, gosterim) }
  }, [merkez, mekanlar, kullaniciKonumu])

  // Merkez ya da mekanlar degisince harita yeni cerceveye kayar.
  //
  // `altPay` DA BAGIMLILIK (kullanicinin bildirdigi hata 2026-09-19:
  // "check-in sayfasina girince kullanicinin bulundugu yer ilk etapta
  // gorunmuyor"): panel yuksekligi ilk cizimden SONRA olculuyor;
  // `initialRegion` pay sifirken kuruldugu icin merkez tam haritanin
  // ortasina, yani panelin ARKASINA dusuyordu. Pay gelince (mapPadding
  // degisince) iOS kamerayi kendiliginden kaydirmiyor - burada yeniden
  // hizalaniyor. Web'de merkez zaten `altPay`dan turetiliyor.
  useEffect(() => {
    if (bolge) haritaRef.current?.animateToRegion(bolge, KAYDIRMA_SURESI_MS)
  }, [bolge, altPay])

  // KUMELER: gorunur bolgenin genisligine gore. Bolge henuz
  // bilinmiyorsa (ilk kare) acilis cercevesi kullaniliyor.
  const kumeler = useMemo(() => {
    const b = gorunurBolge ?? bolge
    const noktalar = igneler.map((m) => ({ id: m.id, lat: m.konum!.lat, lng: m.konum!.lng }))
    return kumele(noktalar, b?.longitudeDelta ?? 0, enPx, seciliId)
  }, [igneler, gorunurBolge, bolge, enPx, seciliId])
  const mekanHaritasi = useMemo(() => new Map(igneler.map((m) => [m.id, m])), [igneler])

  function kumeyeYakinlas(uyeler: { lat: number; lng: number }[]) {
    const sinir = kumeSiniri(uyeler)
    haritaRef.current?.fitToCoordinates(
      [
        { latitude: sinir.kuzey, longitude: sinir.dogu },
        { latitude: sinir.guney, longitude: sinir.bati },
      ],
      { edgePadding: { top: 80, right: 60, bottom: 80, left: 60 }, animated: true }
    )
  }

  function konumaDon() {
    const hedef = kullaniciKonumu ?? merkez
    if (!hedef) return
    haritaRef.current?.animateToRegion(bolgeUret(hedef, 150), KAYDIRMA_SURESI_MS)
  }

  const kokStili = doldur ? stiller.kokDolu : [stiller.kok, { height: yukseklik }]

  if (!merkez || !bolge) {
    // Konum henuz yok: ayni yukseklikte bos yuzey, ekran ziplamasin.
    return <View style={kokStili} testID="canli-harita-bos" />
  }

  return (
    <View
      style={kokStili}
      accessibilityLabel={cevir('harita.cevre')}
      onLayout={(o) => setEnPx(o.nativeEvent.layout.width)}
    >
      <MapView
        ref={haritaRef}
        testID="canli-harita"
        style={StyleSheet.absoluteFill}
        initialRegion={bolge}
        mapPadding={{ top: 0, right: 0, bottom: altPay, left: 0 }}
        onPress={onBosaDokun}
        onRegionChangeComplete={setGorunurBolge}
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
        {/* UC TUR IGNE (referans 2026-09-19): sayili KUME (beyaz daire
            + turuncu nokta), TEKIL (beyaz daire icinde kucuk turuncu
            igne), SECILI (buyuk turuncu igne + adi beyaz hapta). */}
        {kumeler.map((k) => {
          if (k.uyeler.length > 1) {
            return (
              <Marker
                key={k.id}
                coordinate={{ latitude: k.lat, longitude: k.lng }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                onPress={() => kumeyeYakinlas(k.uyeler)}
                accessibilityLabel={cevir('harita.kumeEtiketi', { sayi: k.uyeler.length })}
                testID={`kume-${k.id}`}
              >
                <View style={stiller.kume}>
                  <Text style={stiller.kumeSayi}>{k.uyeler.length}</Text>
                  <View style={stiller.kumeNokta} />
                </View>
              </Marker>
            )
          }
          const mekan = mekanHaritasi.get(k.uyeler[0].id)
          if (!mekan) return null
          const secili = mekan.id === seciliId
          const d = durumu(mekan)
          const etiket =
            mekan.kisiSayisi > 0
              ? cevir('harita.kisiBurada', { ad: mekan.ad, sayi: mekan.kisiSayisi })
              : `${mekan.ad}, ${durumEtiketi(d)}`
          return (
            <Marker
              key={mekan.id}
              coordinate={{ latitude: mekan.konum!.lat, longitude: mekan.konum!.lng }}
              anchor={secili ? { x: 0.5, y: 1 } : { x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              onPress={() => onMekanSec?.(mekan.id)}
              accessibilityLabel={etiket}
              accessibilityState={{ selected: secili }}
              testID={`igne-${mekan.id}`}
              zIndex={secili ? 10 : 1}
            >
              {secili ? (
                <View style={stiller.seciliKutu}>
                  <Svg width={40} height={40} viewBox="0 0 24 24">
                    <Path
                      d="M12 2.2a7.6 7.6 0 0 0-7.6 7.6c0 5.7 7.6 12 7.6 12s7.6-6.3 7.6-12A7.6 7.6 0 0 0 12 2.2z"
                      fill={renk.turuncu}
                      stroke="#FFFFFF"
                      strokeWidth={1.4}
                    />
                    <Circle cx={12} cy={9.7} r={2.9} fill="#FFFFFF" />
                  </Svg>
                  {/* YALNIZCA SECILI MEKANIN ADI. Beyaz hap + koyu yazi:
                      olcumle secilmis kontrast (2026-09-10). */}
                  <View style={stiller.igneEtiket}>
                    <Text style={stiller.igneAd} numberOfLines={1}>
                      {mekan.ad}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={stiller.tekil}>
                  <KucukIgne boyut={18} renk={renk.turuncu} />
                </View>
              )}
            </Marker>
          )
        })}

        {/* MERKEZ. `merkezDurumu` varsa merkez BIR MEKANDIR (mekan sayfasi)
            ve durum renkli igne; yoksa merkez kullanicinin kendisi -
            mavi nokta. */}
        <Marker
          coordinate={{ latitude: merkez.lat, longitude: merkez.lng }}
          anchor={{ x: 0.5, y: merkezDurumu ? 1 : 0.5 }}
          tracksViewChanges={false}
          accessibilityLabel={
            merkezDurumu ? cevir('harita.buMekan', { durum: durumEtiketi(merkezDurumu) }) : cevir('harita.buradasin')
          }
        >
          {merkezDurumu ? (
            <Svg width={30} height={30} viewBox="0 0 24 24">
              <Path
                d="M12 2.2a7.6 7.6 0 0 0-7.6 7.6c0 5.7 7.6 12 7.6 12s7.6-6.3 7.6-12A7.6 7.6 0 0 0 12 2.2z"
                fill={DURUM_RENGI[merkezDurumu]}
                stroke="#FFFFFF"
                strokeWidth={1.4}
              />
              <Circle cx={12} cy={9.7} r={2.9} fill="#FFFFFF" />
            </Svg>
          ) : (
            <KullaniciNoktasi />
          )}
        </Marker>

        {/* KULLANICININ KONUMU (mekan sayfasi): ayni mavi nokta. */}
        {kullaniciKonumu && (
          <Marker
            coordinate={{
              latitude: kullaniciKonumu.lat,
              longitude: kullaniciKonumu.lng,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            accessibilityLabel={cevir('harita.buradasin')}
          >
            <KullaniciNoktasi />
          </Marker>
        )}
      </MapView>

      {konumDugmesi && (
        <Pressable
          style={[stiller.konumDugmesi, { bottom: konumDugmesiAltPayi }]}
          onPress={konumaDon}
          accessibilityRole="button"
          accessibilityLabel={cevir('harita.konumaDon')}
          testID="konuma-don"
        >
          <NisanIkonu renk="#17130F" />
        </Pressable>
      )}
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.buyuk,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  kokDolu: { flex: 1, backgroundColor: renk.yuzey, overflow: 'hidden' },
  // Harita ustundeki her sey TEMADAN BAGIMSIZ: zemin iki modda da acik.
  kume: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  kumeSayi: {
    fontFamily: yazi.govdeKalin,
    fontSize: 15,
    lineHeight: 18,
    color: '#17130F',
  },
  kumeNokta: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: renk.turuncu,
  },
  tekil: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  seciliKutu: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  igneEtiket: {
    maxWidth: 160,
    backgroundColor: '#FFFFFFF2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  igneAd: {
    fontFamily: yazi.govdeKalin,
    fontSize: 13,
    lineHeight: 16,
    color: '#17130F',
  },
  konumDugmesi: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
})
