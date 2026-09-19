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
 * KULLANICININ KONUM IGNESI - uygulamada TEK bir "ben buradayim"
 * bicimi olsun diye ayri bir bilesen.
 *
 * Kesfet ekraninda kullanici haritanin MERKEZI, mekan sayfasinda ise
 * ayri bir igne; ikisi ayri ayri cizildigi surece farklilasiyorlardi
 * (kullanicinin bildirdigi kusur 2026-09-09). Artik ayni bilesen.
 *
 * Beyaz kontur SART: harita zemini bej/yesil ve kontursuz turuncu
 * zemine yapisiyor.
 */
/**
 * 2026-09-19 gece (kullanicinin istegi "kullanici mavi nokta gibi
 * gorunsun"): MAVI NOKTA + saydam hale - sistem haritalarinin "sen
 * buradasin" dili. Igne bir MEKANI isaret eder; kullanici mekan degil.
 * Renk temadan bagimsiz: harita zemini iki modda da acik. Iki ekranda
 * da (kesfet merkezi, mekan sayfasi) ayni bilesen.
 */
export const KULLANICI_MAVISI = '#1A7BF2'

function KullaniciIgnesi(_: { renk?: string }) {
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

/**
 * Ad etiketi isaretcisi: 12 px sol bosluk + hap; 26 px yuksek (igne ile
 * ayni). Igne govdesi 26'lik kutuda 16,5 pt genis, sag kenari koordinatin
 * 8 pt otesinde; 12 ile arada ~4 pt kalir (16 idi, kullanici
 * 2026-09-20 "biraz yaklastir" dedi). iOS'ta hap genisligi onLayout ile
 * olculuyor; ilk kare icin varsayilan.
 */
const ETIKET_SOL_BOSLUK = 12
const ETIKET_KUTU_BOY = 26
const ETIKET_VARSAYILAN_EN = 80

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

/*
 * IGNE GORUNUMU ESKI HALINDE (kullanicinin karari 2026-09-19 gece:
 * "haritada konumlarin gorunumunu de eski haline cevir"). Ayni gun
 * referansla gelen kumeler / beyaz daireli tekil igne / yalnizca secili
 * adda etiket / mavi kullanici noktasi GERI ALINDI: her igne durum
 * renginde ve ADLI (2026-09-09 kurali), kullanici turuncu igne.
 * `lib/harita-kumeleme.ts` duruyor ama burada kullanilmiyor.
 * Kalanlar: doldur, altPay (mapPadding), konuma don dugmesi,
 * onBosaDokun, seciliId (yalnizca erisilebilirlik durumu).
 */
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
  /** Secili mekan: yalnizca erisilebilirlik durumu (gorunum degismiyor). */
  seciliId?: string | null
  /** Sag altta "konuma don" dugmesi. */
  konumDugmesi?: boolean
  /** Dugmenin alt payi: ustune binen panel varsa onun yuksekligi. */
  konumDugmesiAltPayi?: number
  /** Kapsayiciyi doldur (yukseklik yerine flex: 1, kose ve cerceve yok). */
  doldur?: boolean
  /** Haritanin altini orten panelin yuksekligi (mapPadding). */
  altPay?: number
  /** Haritanin ignesiz bir yerine dokunma (ekran klavyeyi kapatmak icin). */
  onBosaDokun?: () => void
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
  // AD ETIKETI GENISLIKLERI (yalnizca iOS): Apple isaretci cercevesini
  // hapin olculen boyutundan kuruyor; hapin gercek genisligi onLayout
  // ile okunup centerOffset ondan hesaplaniyor (bkz. etiket isaretcisi).
  const [etiketEnleri, setEtiketEnleri] = useState<Record<string, number>>({})
  /**
   * Once kalabaliklar, sonra en yakinlar. Siralama ETIKET secimini
   * besliyor (adi yazilacak olanlar bastan seciliyor); igneler artik
   * eksiksiz ciziliyor. Cerceve en uzak igneye gore.
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

  /*
   * ETIKET ELEMESI YOK - TARIHSEL NOT.
   *
   * Adlarin bir kismini gizleyen kural UC KEZ denendi ve ucuende de
   * kullanici "isimsiz igneler var" diye bildirdi:
   *   1) en cok 5/9 etiket + metre araligi
   *   2) yalnizca metre araligi (yakin kumelerde 12 mekandan 2'si)
   *   3) piksel kutusu (130x26; 1 km cercevede 130 px ~730 m demek)
   *
   * Son karar kullanicinin: "igneler bir konumu gosteriyor, isimleri
   * olmasi gerek". Artik HER IGNEDE AD VAR; cakisma riski kabul
   * edildi ve adin tek satir + dar olmasiyla azaltildi. Harita
   * etkilesimli oldugu icin yakinlastirmak adlari ayiriyor.
   */

  // Merkez ya da mekanlar degisince harita yeni cerceveye kayar. Ilk
  // cizim initialRegion ile; bu efekt ilk cizimde de calisir ama
  // ayni bolgeye kaydirmak gorunur bir sey yapmiyor.
  // `altPay` DA BAGIMLILIK (2026-09-19): panel yuksekligi ilk cizimden
  // sonra olculuyor; pay gelince iOS kamerayi kendiligininden kaydirmiyor.
  useEffect(() => {
    if (bolge) haritaRef.current?.animateToRegion(bolge, KAYDIRMA_SURESI_MS)
  }, [bolge, altPay])

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
    >
      <MapView
        ref={haritaRef}
        testID="canli-harita"
        style={StyleSheet.absoluteFill}
        initialRegion={bolge}
        mapPadding={{ top: 0, right: 0, bottom: altPay, left: 0 }}
        // APPLE LOGOSU VE "YASAL" KOSEDE (kullanicinin istegi 2026-09-19
        // gece: "yasal yazisi yukarda kalmis, koseye sabitle"). mapPadding
        // MKMapView'in layoutMargins'ini degistiriyor ve Apple etiketi
        // padding + guvenli alan + kendi payiyla yukari kaciyordu. Bu
        // iki prop etiketin cercevesini haritanin kendi cercevesine gore
        // MUTLAK yerlestiriyor: panelin hemen ustunde, sol altta.
        // Yalnizca iOS; Android'de Google logosu mapPadding'e uyuyor.
        // Yalnizca `bottom` veriliyor: sifir olan kenar DOKUNULMAZ demek,
        // yani logo ile "Yasal" yatayda Apple'in kendi hizasinda kalir
        // (yan yana), ikisine ayni left verilse ust uste binerdi.
        // Yasal ile logo arasindaki 12'lik fark ikisini ayni satira
        // getiriyor (olculdu). Apple etiketin altina ~13 pt kendi payini
        // ekliyor: `altPay + 8` logo altini panelin 21 pt ustune koyuyordu
        // (kullanicinin 00:20 goruntusu, 3 px/pt). Kullanici "asagiya cek"
        // dedi (2026-09-20): 14 pt indi, logo alti panelin ~7 pt ustunde.
        legalLabelInsets={{ left: 0, bottom: altPay + 6, top: 0, right: 0 }}
        appleLogoInsets={{ left: 0, bottom: altPay - 6, top: 0, right: 0 }}
        onPress={onBosaDokun}
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
        {igneler.map((mekan) => {
            const d = durumu(mekan)
            return (
              <Marker
                key={mekan.id}
                coordinate={{ latitude: mekan.konum!.lat, longitude: mekan.konum!.lng }}
                /* IKI PLATFORM IKI PROP (react-native-maps belgesi):
                   `anchor` yalnizca Android/Google, `centerOffset` yalnizca
                   iOS/Apple. Apple ozel gorunumu koordinata ORTALAR;
                   ucun noktaya basmasi icin yarim yukseklik yukari. */
                anchor={{ x: 0.5, y: 1 }}
                centerOffset={{ x: 0, y: -13 }}
                // Ozel gorunumlu igne her karede yeniden cizilmesin:
                // sinir kalkinca sayi yuze cikabiliyor.
                tracksViewChanges={false}
                onPress={() => onMekanSec?.(mekan.id)}
                accessibilityState={{ selected: mekan.id === seciliId }}
                accessibilityLabel={
                  mekan.kisiSayisi > 0
                    ? cevir('harita.kisiBurada', { ad: mekan.ad, sayi: mekan.kisiSayisi })
                    : `${mekan.ad}, ${durumEtiketi(d)}`
                }
              >
                {/* YALNIZCA IGNE. Onceden igne + ad tek gorunumdu ve iOS
                    gorunumu koordinata ORTALADIGI icin igne gercek
                    noktanin soluna kayiyordu (ad genisliginin yarisi
                    kadar) - kullanicinin "etiketler kaymis" bildirimi
                    2026-09-19/20. Ad artik asagidaki ayri isaretcide. */}
                <Svg width={26} height={26} viewBox="0 0 24 24">
                  <Path
                    d="M12 2.2a7.6 7.6 0 0 0-7.6 7.6c0 5.7 7.6 12 7.6 12s7.6-6.3 7.6-12A7.6 7.6 0 0 0 12 2.2z"
                    fill={DURUM_RENGI[d]}
                    stroke="#FFFFFF"
                    strokeWidth={1.6}
                  />
                  <Circle cx={12} cy={9.4} r={2.8} fill="#FFFFFF" />
                </Svg>
              </Marker>
            )
        })}
        {igneler.map((mekan) => (
          <Marker
            key={`etiket-${mekan.id}`}
            coordinate={{ latitude: mekan.konum!.lat, longitude: mekan.konum!.lng }}
            /* IKI PLATFORM IKI GOVDE. Android: 12 px sol boslukli, 26 px
               yuksek kab + anchor (0,1) -> kabin sol alt kosesi
               koordinatta, hap ignenin sagina/ortasina duser. iOS: kab
               YOK, isaretcinin cocugu dogrudan hap - kullanicinin iki
               ekran goruntusu (2026-09-20 00:09 ve 00:20) ayni modeli
               dogruladi: Apple isaretci cercevesini kabin degil HAPIN
               boyutundan kuruyor ve kabi sol ust koseden ciziyordu;
               sabit 136 kutuda +29, olculen kabda +8 pt sag kayma tam
               bu modelin ongorusu. Cerceve = hap olunca centerOffset
               x = 12 + hap/2 (sol kenar koordinatin 12 sagi),
               y = -13 (igne govdesinin ortasi). */
            anchor={{ x: 0, y: 1 }}
            centerOffset={{
              x: ETIKET_SOL_BOSLUK + (etiketEnleri[mekan.id] ?? ETIKET_VARSAYILAN_EN) / 2,
              y: -ETIKET_KUTU_BOY / 2,
            }}
            tracksViewChanges={false}
            onPress={() => onMekanSec?.(mekan.id)}
            accessibilityLabel={cevir('harita.adEtiketi', { ad: mekan.ad })}
            testID={`igne-etiket-${mekan.id}`}
          >
            {Platform.OS === 'ios' ? (
              <View
                style={[stiller.igneEtiket, stiller.igneEtiketAyri]}
                onLayout={(o) => {
                  const en = Math.round(o.nativeEvent.layout.width)
                  setEtiketEnleri((eski) => (eski[mekan.id] === en ? eski : { ...eski, [mekan.id]: en }))
                }}
              >
                <Text style={stiller.igneAd} numberOfLines={1}>
                  {mekan.ad}
                </Text>
              </View>
            ) : (
              <View style={stiller.etiketKabi} pointerEvents="box-none">
                <View style={[stiller.igneEtiket, stiller.igneEtiketAyri]}>
                  <Text style={stiller.igneAd} numberOfLines={1}>
                    {mekan.ad}
                  </Text>
                </View>
              </View>
            )}
          </Marker>
        ))}

        {/* MERKEZ IGNESI. Ucu tam koordinata basiyor.
            Rengi `merkezDurumu` ile geliyor; verilmezse turuncu kaliyor
            (kesfet ekraninda merkez kullanicinin kendisi, orada durum
            yok). */}
        <Marker
          coordinate={{ latitude: merkez.lat, longitude: merkez.lng }}
          anchor={{ x: 0.5, y: merkezDurumu ? 1 : 0.5 }}
          centerOffset={{ x: 0, y: merkezDurumu ? -15 : 0 }}
          tracksViewChanges={false}
          accessibilityLabel={
            merkezDurumu ? cevir('harita.buMekan', { durum: durumEtiketi(merkezDurumu) }) : cevir('harita.buradasin')
          }
        >
          {/* OLCU MERKEZIN NE OLDUGUNA BAGLI (kullanicinin istegi
              2026-09-09: "kullanicinin konum ignesi daha buyuk,
              konumun adresinin ignesi daha kucuk olsun").
              `merkezDurumu` varsa merkez BIR MEKANDIR (mekan sayfasi);
              yoksa merkez KULLANICININ KENDISIDIR (kesfet ekrani) ve
              orada kucultmek yanlis olurdu. */}
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
            <KullaniciIgnesi renk={renk.turuncu} />
          )}
        </Marker>

        {/* KULLANICININ KONUMU - KESFET EKRANINDAKIYLE BIREBIR AYNI
            IGNE (kullanicinin istegi 2026-09-09: "konumun icine
            girincede turuncu kullanicinin ikonu ayni gorunsun").

            Onceden burada TURUNCU BIR DAIRE, kesfet ekraninda ise
            TURUNCU BIR IGNE ciziliyordu; yani "ben neredeyim" iki
            ekranda iki bicimde okunuyordu. Artik tek bicim var ve
            `KullaniciIgnesi` iki yerde de ayni bileseni kullaniyor -
            biri degistirilirse oteki de degisir. */}
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
            <KullaniciIgnesi renk={renk.turuncu} />
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
  igneKutu: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  // Punto 9,5'ten 11'e cikinca ayni kutuda daha az harf siginiyor;
  // kirpilma artmasin diye kutu da genisledi.
  /**
   * MEKAN ADI BEYAZ HAPIN ICINDE, KOYU YAZIYLA.
   *
   * Kullanicinin bildirdigi kusur (2026-09-10): "haritada konumlarin
   * isimleri yine zor gorunuyor, daha gorunur bir hale getir" -
   * ardindan "ona gore rengini ayarla".
   *
   * ONCEKI HAL BEYAZ YAZI + KOYU GOLGEYDI ve ekran goruntusundeki
   * GERCEK PIKSELLER olcuIdue - sonuc carpiciydi:
   *
   *     harita zemini       beyaz yazi   koyu yazi
   *     bina bloklari       1,21         15,24
   *     bej zemin           1,12         16,52
   *     yollar (beyaz)      1,00         18,48
   *
   * Yani beyaz yazi harita zeminine karsi PRATIKTE GORUNMEZ; okunurlugu
   * tamamen golge tasiyordu ve golge yumusak bir hale, keskin bir kenar
   * degil. 2026-09-09'daki "beyaz yap" istegi koyu bir harita
   * varsayiyordu, ama Apple Haritalar iki modda da ACIK zemin veriyor.
   *
   * Cozum iki katmanli: yazi KOYU (18:1) ve arkasinda NEREDEYSE OPAK
   * BEYAZ HAP. Hap yalnizca kontrast icin degil - haritanin karmasik
   * dokusundan (yol cizgileri, bina bloklari, sokak adlari) ayiriyor ve
   * ust uste binen iki etiketin hangisinin nerede bittigini gosteriyor.
   *
   * DEGERLER KARSILAMA SAHNESINDEN: orada da harita uzerindeki haplar
   * `#FFFFFF` zemin + `#17130F` yazi (`HARITA.hap` / `hapYazi`). Ayni
   * isi yapan iki yuzeyin iki farkli gorunusu olmasin.
   *
   * TEMADAN BAGIMSIZ ve bu SART: harita iki modda da acik, dolayisiyla
   * temayla donen bir jeton koyu modda hapi siyaha, yaziyi beyaza
   * cevirir ve okunurluk yine kaybolurdu.
   */
  igneEtiket: {
    maxWidth: 104,
    backgroundColor: '#FFFFFFF2',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    // Hapin kendisi de harita zemininden ayrilmali: beyaz yollarin
    // uzerinde kenari kayboluyordu.
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  igneEtiketGorunmez: { opacity: 0 },
  igneEtiketAyri: { maxWidth: 120 },
  // Etiket isaretcisinin kabi - YALNIZCA ANDROID: sol bosluk ve sabit
  // yukseklik, anchor (0,1) ile konumlandirmayi tasiyor. iOS'ta kab
  // kullanilmiyor (cerceve hapin boyutu; bosluk centerOffset'te).
  etiketKabi: {
    height: ETIKET_KUTU_BOY,
    paddingLeft: ETIKET_SOL_BOSLUK,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  igneAd: {
    fontFamily: yazi.govdeKalin,
    fontSize: 11,
    lineHeight: 14,
    color: '#17130F',
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
