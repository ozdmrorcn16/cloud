import { useEffect, useMemo, useRef } from 'react'
import { Platform, View, Text, StyleSheet } from 'react-native'
import MapView, { Marker, type Region } from 'react-native-maps'
import Svg, { Circle, Path } from 'react-native-svg'
import { mesafeMetre } from '../../lib/konum'
import { yazi, olcek, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import { mekanDurumu, type MekanDurumu } from '../../lib/mekan'
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
const EN_FAZLA_ETIKET = 9

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

const DURUM_ETIKETI: Record<MekanDurumu, string> = {
  sakin: 'Sakin',
  yogun: 'Yoğun',
  populer: 'Popüler',
}

export function CanliHarita({
  merkez,
  mekanlar,
  yukseklik = 260,
  onMekanSec,
  merkezDurumu,
  kullaniciKonumu,
}: {
  merkez: { lat: number; lng: number } | null
  mekanlar: HaritaMekani[]
  yukseklik?: number
  onMekanSec?: (mekanId: string) => void
  /**
   * Merkez ignesinin DURUMU (kullanicinin istegi 2026-09-07: "haritada
   * konumun ignesi yogunluguna ve sakinligine gore renk alsin").
   *
   * Verilmezse igne TURUNCU kaliyor - kesfet ekraninda merkez
   * kullanicinin KENDISI, orada bir "durum" yok.
   */
  merkezDurumu?: MekanDurumu
  /**
   * Kullanicinin o anki konumu; verilirse ayri bir TURUNCU igneyle
   * ciziliyor ve cerceve ikisini birden kapsiyor - boylece secilen
   * mekana olan mesafe GORSEL olarak okunuyor (kullanicinin istegi
   * 2026-09-07).
   */
  kullaniciKonumu?: { lat: number; lng: number } | null
}) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
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

    // CERCEVE IGNELERI KAPSAR.
    //
    // Olculerek bulunan kusur (2026-09-06): `EN_FAZLA_GOSTERIM_METRE`
    // 100 m'ydi ve cerceve HER ZAMAN o degerle sinirlaniyordu. Cevredeki
    // mekanlar 420-530 m uzakta oldugu icin igneler ciziliyor ama
    // gorunur alanin DISINDA kaliyordu - harita bombos gorunuyordu.
    // Kusur onceden fark edilmemisti cunku o gunlerde yalnizca KALABALIK
    // mekanlarin ignesi ciziliyordu ve cevrede kalabalik mekan yoktu.
    //
    // Kullanicinin "daha yakin baslasin" karari (2026-09-01) KORUNUYOR
    // ama artik yalnizca IGNE YOKKEN: gosterilecek bir sey olmadiginda
    // harita yakin basliyor, igne varsa cerceve onlari kapsayacak kadar
    // aciliyor. Iki kural da ayni seyi istiyor - harita DOLU gorunsun.
    // KULLANICI IGNESI de cerceveye giriyor: mesafenin gorsel olarak
    // okunabilmesi icin ikisi de ekranda olmali.
    //
    // BURADA BIR GERILIM VAR ve kabul ediliyor: kullanici uzaktaysa
    // cerceve genisliyor ve sokak adlari kuculuyor - oysa ayni gun
    // "yakin goruntu, sokak cadde anlasilir" da istenmisti. Harita
    // artik ETKILESIMLI oldugu icin kullanici yakinlastirabiliyor;
    // acilis cercevesi "iki noktayi da goster" tarafini seciyor.
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

  /**
   * HARITADA ETIKETLI GOSTERILECEK IGNELER.
   *
   * Ikisi birden gerekiyordu: en cok BES igne (390 px'lik bir haritada
   * fazlasi sigmiyor) ve aralarinda EN AZ BIR MESAFE.
   *
   * Mesafe kurali kullanicinin ekran goruntusunden cikti: bes igne
   * secilmisti ama ikisi birbirine 40 m uzaktaydi ve etiketleri ust
   * uste biniyordu ("Gentaş Aspendos Evleri" ile "Hadim erikli
   * subesi" ic ice gecmisti). Igne KENDISI kucuk, cakisan sey ADI.
   *
   * Esik cerceveye ORANLI: yakinlastirilmis bir haritada 60 m bile
   * ayri gorunur, genis bir cercevede 200 m bile bitisik. `gosterim`
   * cerceve yaricapi oldugu icin onun %22'si iyi bir yaklasim.
   */
  const etiketliIgneler = useMemo(() => {
    if (!merkez) return [] as HaritaMekani[]

    const gosterim = bolge
      ? (bolge.latitudeDelta * 110540) / 2
      : EN_FAZLA_GOSTERIM_METRE
    // ARALIK ESIGINE UST SINIR: cerceve kullanici ignesi yuzunden
    // kilometrelerce acilabiliyor (2026-09-07) ve oransal esik o zaman
    // saçma buyuyordu - 25 km'lik bir cercevede 5,5 km'lik aralik
    // neredeyse butun igneleri eler. 300 m, etiketlerin ust uste
    // binmedigi en dar degerin epey ustunde.
    const enAzAralik = Math.min(300, Math.max(50, gosterim * 0.22))

    const sirali = igneler.slice().sort((a, b) => {
      const oncelik = (m: HaritaMekani) =>
        m.kisiSayisi > 0 ? 2 : durumu(m) === 'populer' ? 1 : 0
      return oncelik(b) - oncelik(a)
    })

    const secilen: HaritaMekani[] = []
    for (const aday of sirali) {
      if (secilen.length >= EN_FAZLA_ETIKET) break
      const cakisiyor = secilen.some(
        (s) =>
          mesafeMetre(s.konum!.lat, s.konum!.lng, aday.konum!.lat, aday.konum!.lng) <
          enAzAralik
      )
      if (!cakisiyor) secilen.push(aday)
    }
    return secilen
  }, [igneler, bolge, merkez])

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
        {/* SAKIN MEKANLAR CIZILMIYOR (kullanicinin istegi 2026-09-01:
            "Harita uzerinde bu gri noktalari kaldir, mekan konumlarini
            gosteren turuncu ikon kalsin").

            Gri noktalar haritayi dolduruyor ama hicbir sey anlatmiyordu:
            cevrede mekan OLDUGUNU soyluyorlardi, oysa uygulamanin sorusu
            "su an nerede INSAN var". Kalabalik mekanin turuncu sayili
            ignesi ve merkez ignesi KALIYOR. */}
        {/* IGNELER AD VE DURUM TASIYOR (kullanicinin istegi 2026-09-06,
            referans gorselle). Onceden yalnizca kalabalik mekanlar
            cizilip icine sayi yaziliyordu; artik her igne renkli ve
            yaninda adi ile durumu duruyor.

            EN COK BES IGNE: referansta da bes tane var ve daha
            fazlasi 390 px'lik bir haritada etiketleri ust uste
            bindiriyor. Once POPULER ve YOGUN olanlar seciliyor -
            haritanin cevaplamasi gereken soru "su an nerede hareket
            var". */}
        {etiketliIgneler.map((mekan) => {
            const d = durumu(mekan)
            return (
              <Marker
                key={mekan.id}
                coordinate={{ latitude: mekan.konum!.lat, longitude: mekan.konum!.lng }}
                anchor={{ x: 0.5, y: 1 }}
                onPress={() => onMekanSec?.(mekan.id)}
                accessibilityLabel={
                  mekan.kisiSayisi > 0
                    ? `${mekan.ad}, ${mekan.kisiSayisi} kişi burada`
                    : `${mekan.ad}, ${DURUM_ETIKETI[d]}`
                }
              >
                <View style={stiller.igneKutu}>
                  <Svg width={26} height={26} viewBox="0 0 24 24">
                    <Path
                      d="M12 2.2a7.6 7.6 0 0 0-7.6 7.6c0 5.7 7.6 12 7.6 12s7.6-6.3 7.6-12A7.6 7.6 0 0 0 12 2.2z"
                      fill={DURUM_RENGI[d]}
                      stroke="#FFFFFF"
                      strokeWidth={1.6}
                    />
                    <Circle cx={12} cy={9.4} r={2.8} fill="#FFFFFF" />
                  </Svg>
                  <View style={stiller.igneEtiket}>
                    <Text style={stiller.igneAd} numberOfLines={2}>
                      {mekan.ad}
                    </Text>
                    <Text style={[stiller.igneDurum, { color: DURUM_RENGI[d] }]}>
                      {DURUM_ETIKETI[d]}
                    </Text>
                  </View>
                </View>
              </Marker>
            )
        })}

        {/* MERKEZ IGNESI. Ucu tam koordinata basiyor.
            Rengi `merkezDurumu` ile geliyor; verilmezse turuncu kaliyor
            (kesfet ekraninda merkez kullanicinin kendisi, orada durum
            yok). */}
        <Marker
          coordinate={{ latitude: merkez.lat, longitude: merkez.lng }}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={false}
          accessibilityLabel={
            merkezDurumu ? `Bu mekan, ${DURUM_ETIKETI[merkezDurumu]}` : 'Buradasın'
          }
        >
          {/* OLCU MERKEZIN NE OLDUGUNA BAGLI (kullanicinin istegi
              2026-09-09: "kullanicinin konum ignesi daha buyuk,
              konumun adresinin ignesi daha kucuk olsun").
              `merkezDurumu` varsa merkez BIR MEKANDIR (mekan sayfasi);
              yoksa merkez KULLANICININ KENDISIDIR (kesfet ekrani) ve
              orada kucultmek yanlis olurdu. */}
          <Svg
            width={merkezDurumu ? 30 : 38}
            height={merkezDurumu ? 30 : 38}
            viewBox="0 0 24 24"
          >
            <Path
              d="M12 2.2a7.6 7.6 0 0 0-7.6 7.6c0 5.7 7.6 12 7.6 12s7.6-6.3 7.6-12A7.6 7.6 0 0 0 12 2.2z"
              fill={merkezDurumu ? DURUM_RENGI[merkezDurumu] : renk.turuncu}
              stroke="#FFFFFF"
              strokeWidth={1.4}
            />
            <Circle cx={12} cy={9.7} r={2.9} fill="#FFFFFF" />
          </Svg>
        </Marker>

        {/* KULLANICININ KONUMU - alt gezinme cubugundaki CHECK-IN
            ikonunun aynisi (kullanicinin istegi 2026-09-07: "turuncu
            checkin ikonu olucak"). Duz bir turuncu noktaydi ve neyi
            anlattigi belli degildi; check-in ikonu "sen buradasin, buraya
            check-in yapabilirsin" demeyi tek bicimle yapiyor.

            Mekan ignesi durum rengi tasidigi icin ikisi karismiyor:
            mekan RENKLI BIR IGNE, kullanici TURUNCU BIR DAIRE. */}
        {kullaniciKonumu && (
          <Marker
            coordinate={{
              latitude: kullaniciKonumu.lat,
              longitude: kullaniciKonumu.lng,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            accessibilityLabel="Buradasın"
          >
            <View style={stiller.kullaniciDaire}>
              <Svg width={19} height={19} viewBox="0 0 24 24">
                <Path
                  d="M12 2.4a7.3 7.3 0 0 0-7.3 7.3c0 5.5 7.3 11.9 7.3 11.9s7.3-6.4 7.3-11.9A7.3 7.3 0 0 0 12 2.4z"
                  fill="#FFFFFF"
                />
                <Circle cx={12} cy={9.6} r={2.8} fill={renk.turuncu} />
              </Svg>
            </View>
          </Marker>
        )}
      </MapView>
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
  // Igne + yanindaki etiket tek bir Marker icinde: `Marker` cocugunu
  // oldugu gibi ciziyor, yani etiketi ayri bir katman yapmaya gerek yok.
  // Kullanici: alt gezinmedeki check-in dugmesinin kucuk hali - turuncu
  // dolu daire, icinde beyaz igne. Beyaz halka alt gezinmede YOK ama
  // burada sart: harita zemini bej/gri ve halka olmadan daire zemine
  // yapisiyor.
  //
  // 18 -> 26 (kullanicinin istegi 2026-09-07: "cok az daha buyuk").
  kullaniciDaire: {
    // 26 -> 34 (kullanicinin istegi 2026-09-09): kullanicinin kendi
    // konumu mekan ignesinden BUYUK olmali - haritada once "ben
    // neredeyim" okunuyor.
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: renk.turuncu,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  igneKutu: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  igneEtiket: { maxWidth: 108 },
  // MEKAN ADI TEMAYA BAGLI (kullanicinin bildirdigi kusur 2026-09-08:
  // "koyu modda haritadaki gorunen yer isimleri beyaz renk olsun").
  // Ad sabit koyu bir tondaydi; harita da koyu moda gecince yazi
  // okunmaz oluyordu.
  //
  // Golge de temayla donuyor: yazinin TERSI renkte olmali, yoksa
  // beyaz yazinin arkasindaki beyaz golge onu bulaniklastirir.
  // `zemin + 'F2'` sekiz haneli hex, yani jetonun %95 opak hali.
  igneAd: {
    fontFamily: yazi.govdeKalin,
    fontSize: 10,
    lineHeight: 12,
    color: renk.metin,
    textShadowColor: renk.zemin + 'F2',
    textShadowRadius: 3,
  },
  igneDurum: {
    fontFamily: yazi.govdeOrta,
    fontSize: 9,
    lineHeight: 11,
    textShadowColor: renk.zemin + 'F2',
    textShadowRadius: 3,
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
