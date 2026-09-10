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
function KullaniciIgnesi({ renk }: { renk: string }) {
  return (
    <Svg width={38} height={38} viewBox="0 0 24 24">
      <Path
        d="M12 2.2a7.6 7.6 0 0 0-7.6 7.6c0 5.7 7.6 12 7.6 12s7.6-6.3 7.6-12A7.6 7.6 0 0 0 12 2.2z"
        fill={renk}
        stroke="#FFFFFF"
        strokeWidth={1.4}
      />
      <Circle cx={12} cy={9.7} r={2.9} fill="#FFFFFF" />
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
  useEffect(() => {
    if (bolge) haritaRef.current?.animateToRegion(bolge, KAYDIRMA_SURESI_MS)
  }, [bolge])

  if (!merkez || !bolge) {
    // Konum henuz yok: ayni yukseklikte bos yuzey, ekran ziplamasin.
    return <View style={[stiller.kok, { height: yukseklik }]} testID="canli-harita-bos" />
  }

  return (
    <View
      style={[stiller.kok, { height: yukseklik }]}
      accessibilityLabel="Çevrendeki mekanlar"
    >
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
        {igneler.map((mekan) => {
            const d = durumu(mekan)
            return (
              <Marker
                key={mekan.id}
                coordinate={{ latitude: mekan.konum!.lat, longitude: mekan.konum!.lng }}
                anchor={{ x: 0.5, y: 1 }}
                // Ozel gorunumlu igne her karede yeniden cizilmesin:
                // sinir kalkinca sayi yuze cikabiliyor.
                tracksViewChanges={false}
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
                  {/* HER IGNEDE AD VAR (kullanicinin kurali 2026-09-09:
                      "igneler bir konumu gosteriyor, isimleri olmasi
                      gerek").

                      Eleme kurali TAMAMEN KALKTI. Once sayi siniri,
                      sonra metre esigi, sonra piksel kutusu denendi;
                      ucunde de bazi igneler adsiz kaliyordu ve
                      kullanici uc kez bildirdi. Adsiz bir igne
                      haritada "burada bir sey var ama ne oldugunu
                      soylemiyorum" demek - bu, ignenin var olma
                      sebebine aykiri.

                      Cakisma riski KABUL EDILDI ve azaltildi: ad tek
                      satir, en fazla 84 px, arkasinda zemin renginde
                      halo var; harita etkilesimli oldugu icin
                      yakinlastirinca adlar birbirinden ayriliyor. */}
                  <View style={stiller.igneEtiket}>
                      {/* DURUM SATIRI KALDIRILDI (kullanicinin
                          bildirdigi hata 2026-09-09: "isimsiz igneler
                          var hala"). Etiket iki satirdi ve kutusu
                          130x26 px'e cikiyordu; 1 km'lik bir cercevede
                          130 px ~730 metre demek, yani neredeyse butun
                          adlar birbirini eliyordu - otuz igneden
                          yalnizca dordu adliydi.

                          Bilgi KAYBOLMUYOR: durumu IGNENIN RENGI zaten
                          soyluyor (yesil sakin / kirmizi yogun / sari
                          populer) ve haritanin hemen altindaki cipler
                          o rengi ogretiyor. Ayni seyi iki kez yazmak
                          adlarin yerini yiyordu. */}
                    <Text style={stiller.igneAd} numberOfLines={1}>
                      {mekan.ad}
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
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            accessibilityLabel="Buradasın"
          >
            <KullaniciIgnesi renk={renk.turuncu} />
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
