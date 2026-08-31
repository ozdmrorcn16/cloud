import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import { cihazKonumunuAl, mesafeMetre } from '../../../lib/konum'
import { useDil } from '../../../lib/dil'
import {
  aktifCheckInimiGetir,
  checkIndenAyril,
  checkIniSil,
  type AktifCheckIn,
} from '../../../lib/checkin'
import {
  yakinMekanlariYogunlukIleGetir,
  turuGosterilir,
  SOSYAL_TURLER,
  KESFET_YARICAP_METRE,
  KESFET_LIMIT,
  type MekanYogunlukIle,
} from '../../../lib/mekan'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { CanliHarita } from '../../tasarim/CanliHarita'

/** Satir sonundaki check-in kisayolu ikonu. */
/** Sekme ikonu: buyutec. Ana sayfadaki arama kutusundaki cizimle ayni. */
function BuyutecIkonu({ renk: cizgi }: { renk: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24">
      <Circle cx={11} cy={11} r={6.5} stroke={cizgi} strokeWidth={2.2} fill="none" />
      <Path d="M16 16l4.6 4.6" stroke={cizgi} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  )
}

/** Sekme ikonu: pusula ibresi. Konum ignesinden ayrilsin diye. */
function PusulaIkonu({ renk: cizgi }: { renk: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={cizgi} strokeWidth={2.2} fill="none" />
      <Path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z" fill={cizgi} />
    </Svg>
  )
}

function CheckInIkonu() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M12 2.6a7.2 7.2 0 0 0-7.2 7.2c0 5.4 7.2 11.6 7.2 11.6s7.2-6.2 7.2-11.6A7.2 7.2 0 0 0 12 2.6z"
        fill={renk.turuncu}
      />
      <Circle cx={12} cy={9.7} r={2.7} fill="#FFFFFF" />
    </Svg>
  )
}

/*
 * YARICAP SECIMI YOK (kullanicinin karari 2026-08-28).
 *
 * Onceden ekranin en ustunde 1 km / 2 km / 5 km cipleri vardi ve
 * liste o mesafeye kirpiliyordu. Kullanici hem ciplerin kalkmasini
 * hem de mesafe sinirinin tamamen kalkmasini istedi: "gorunus olarak
 * bir km siniri olmucak oncelik olarak ama en ustlerde konumuna en
 * yakin yerler gorunecek".
 *
 * Sunucuya artik yaricap GONDERILMIYOR; siralamayi mesafe yapiyor.
 * Tek mesafe kurali check-in'de kaldi ve 1 km (sunucuda zorlaniyor).
 */

/** 240 m / 1,2 km gibi kisa ve okunur mesafe. */
function mesafeYazisi(metre: number): string {
  if (metre < 1000) return `${Math.round(metre / 10) * 10} m`
  return `${(metre / 1000).toFixed(1).replace('.', ',')} km`
}

export default function KesfetEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [cihazKonumu, setCihazKonumu] = useState<{ lat: number; lng: number } | null>(null)
  const [arama, setArama] = useState('')
  /**
   * Haritanin altindaki iki sekme (kullanicinin karari 2026-08-31).
   * 'kesfet' yakindaki mekanlari, 'ara' arama kutusunu gosteriyor.
   * Varsayilan 'kesfet': ekranin asil isi "su an nerede insan var".
   */
  const [sekme, setSekme] = useState<'kesfet' | 'ara'>('kesfet')
  const [mekanlar, setMekanlar] = useState<MekanYogunlukIle[]>([])
  // AKTIF CHECK-IN (kullanicinin istegi 2026-08-29): check-in yapilmis
  // mekanda kart artik "Check-in yap" demiyor; "Şu an buradasın" deyip
  // Ayrıldım ve Sil sunuyor. Baska bir mekan secilene kadar boyle.
  const [aktifCheckIn, setAktifCheckIn] = useState<AktifCheckIn | null>(null)
  // Silme GERI ALINAMAZ: once onay satiri aciliyor.
  const [silOnayi, setSilOnayi] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  // Ilk acilis bittikten sonra ekran duzeni bir daha tam ekran
  // durumlara gecmiyor; bkz. asagidaki not.
  const [ilkYuklemeBitti, setIlkYuklemeBitti] = useState(false)
  const istekSirasi = useRef(0)

  async function yukle(metin = arama) {
    // Yaris korumasi: hizli yazarken istekler sirayla degil paralel
    // doner. Sira numarasi olmadan eski ve yavas bir istek, yeni
    // sonucun uzerine yaziyor ve liste yanlis kaliyordu.
    const sira = ++istekSirasi.current
    setYukleniyor(true)
    setHata(null)
    try {
      const konum = cihazKonumu ?? (await cihazKonumunuAl())
      setCihazKonumu(konum)
      /**
       * ARAMA BOSKEN: 500 m yaricap, sosyal turler ve limit SUNUCUYA
       * gonderiliyor (kullanicinin istegi 2026-08-31).
       *
       * Daraltma once istemcide yapiliyordu ve liste dolu bir cevrede
       * bile bosaliyordu: sunucu tur ayrimi yapmadan en yakin 50 kaydi
       * donduruyor, istemci onlari sosyal turlere suzuyordu. Kullanicinin
       * bolgesinde olculdu - o 50 kaydin 3'u sosyaldi, oysa 500 m icinde
       * 111 sosyal mekan vardi.
       *
       * ARAMA VARKEN: sinir yok. Arama butun veritabanini kapsamali;
       * kullanici baska sehirdeki bir mekani da arayabilir.
       */
      const aramaVarMi = (metin ?? '').trim().length > 0
      let sonuc = await yakinMekanlariYogunlukIleGetir(
        konum.lat,
        konum.lng,
        aramaVarMi ? null : KESFET_YARICAP_METRE,
        metin || undefined,
        aramaVarMi ? null : [...SOSYAL_TURLER],
        aramaVarMi ? null : KESFET_LIMIT
      )
      // Kucuk yerlesimde 500 m icinde hic sosyal mekan olmayabilir.
      // Bos ekran gostermek yerine sinirlari kaldirip tekrar soruyoruz -
      // eski istemci suzgecindeki "hic sosyal yoksa eldekini goster"
      // davranisinin sunucu tarafindaki karsiligi.
      if (!aramaVarMi && sonuc.length === 0) {
        sonuc = await yakinMekanlariYogunlukIleGetir(konum.lat, konum.lng, null, undefined)
      }
      if (sira !== istekSirasi.current) return
      setMekanlar(sonuc)
    } catch (e) {
      if (sira !== istekSirasi.current) return
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    } finally {
      if (sira === istekSirasi.current) {
        setYukleniyor(false)
        setIlkYuklemeBitti(true)
      }
    }
  }

  useEffect(() => {
    yukle()
    // Ilk yukleme; sonrakiler kullanici etkilesimiyle tetikleniyor.
  }, [])

  // Aktif check-in her odaklanmada tazeleniyor: kullanici check-in
  // yapip geri dondugunde kart dogru hali gostermeli.
  useFocusEffect(
    useCallback(() => {
      let iptal = false
      aktifCheckInimiGetir()
        .then((c) => {
          if (!iptal) setAktifCheckIn(c)
        })
        .catch(() => {
          if (!iptal) setAktifCheckIn(null)
        })
      return () => {
        iptal = true
      }
    }, [])
  )

  async function ayril() {
    if (!aktifCheckIn) return
    try {
      await checkIndenAyril(aktifCheckIn.id)
      setAktifCheckIn(null)
      setSilOnayi(false)
      await yukle()
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  async function canliyiSil() {
    if (!aktifCheckIn) return
    try {
      await checkIniSil(aktifCheckIn.id)
      setAktifCheckIn(null)
      setSilOnayi(false)
      await yukle()
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  // Arama kutusu her harfte istek ATMIYOR. Onceki surumde her tusa
  // basista sunucuya gidiliyordu; bu hem agi bosa yoruyor hem de
  // yazmayi tekletiyordu. 300 ms sessizlik bekleniyor.
  useEffect(() => {
    if (!cihazKonumu) return
    const zamanlayici = setTimeout(() => {
      yukle(arama)
    }, 300)
    return () => clearTimeout(zamanlayici)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arama])

  /**
   * Sekme degisince arama metni siliniyor: aksi halde 'kesfet'
   * sekmesindeki "Yakininda" listesi hala arama sonucuyla suzulmus
   * kalir ve kullanici bunun sebebini goremez.
   */
  function sekmeSec(yeni: 'kesfet' | 'ara') {
    setSekme(yeni)
    setArama('')
  }

  function aramaDegisti(metin: string) {
    // Burada yalnizca metin guncelleniyor: istegi yukaridaki
    // bekletmeli etki atiyor. Yazma ile ag istegini ayirmak, yazi
    // kutusunun her tusta yeniden olusmasini engelliyor.
    setArama(metin)
  }

  // Kesfet akisi "su an nereye gidip birileriyle karsilasabilirim"
  // sorusunu cevapliyor; arama ise butun veritabanini kapsiyor. Bu
  // daraltma ARTIK SUNUCUDA yapiliyor (yukaridaki `yukle`), cunku
  // istemcide yapildiginda liste bosaliyordu.
  //
  // ISTEMCIDE BIR DAHA SUZULMEMELI: cevrede hic sosyal mekan yoksa
  // ekran sinirsiz ikinci bir istek atiyor ve o sonuc tur ayrimi
  // tasimiyor; burada tekrar suzmek onu da bosaltirdi.
  const kesfetListesi = mekanlar

  // Tur cipleri KALDIRILDI (karar 2026-08-24): tur artik dis kaynakli
  // mekanlarda gosterilmedigi icin ona gore suzmek de anlamsiz.
  const suzulmus = kesfetListesi

  /**
   * Haritanin altindaki kart YALNIZCA AKTIF CHECK-IN varken cikiyor.
   *
   * Onceden aktif check-in yoksa EN YAKIN mekani secip "Check-in yap"
   * diyordu; kullanicinin karari (2026-08-31): "En yakin yeri otomatik
   * secen sutunu kaldir tamamen". Kart canli halde KALDI, cunku
   * check-in'i bitirmenin (Ayrildim) ve silmenin tek yolu o.
   *
   * Check-in yapilan mekan listede olmayabilir - baska bir sehirde ya
   * da yakinlik siralamasinin disinda kalabilir - o yuzden ad check-in
   * kaydindan aliniyor, semt ve kisi sayisi ise listede varsa oradan.
   */
  const kartMekani = aktifCheckIn
    ? {
        id: aktifCheckIn.mekanId,
        ad: aktifCheckIn.mekanAdi,
        listedeki: suzulmus.find((m) => m.id === aktifCheckIn.mekanId) ?? null,
      }
    : null

  const kartCanli = Boolean(aktifCheckIn)

  // "Buradasin" kartindaki mekan LISTEDE TEKRAR EDILMIYOR: ayni ad
  // ekranda iki kez gorunuyordu. Referans tasarimda da alttaki liste
  // "yakinindaki DIGER mekanlar" anlamina geliyor.
  const liste = kartMekani ? suzulmus.filter((m) => m.id !== kartMekani.id) : suzulmus

  const canlilar = liste.filter((m) => m.kisiSayisi > 0)
  const sakinler = liste.filter((m) => m.kisiSayisi === 0)
  const toplamKisi = canlilar.reduce((t, m) => t + m.kisiSayisi, 0)

  // Ad'in altindaki satir. TUR YALNIZCA kullanicinin ekledigi
  // mekanlarda gorunuyor (karar 2026-08-24): dis kaynagin tur verisi
  // guvenilmez oldugu icin yanlis tur gostermektense hic gostermemek
  // tercih edildi. Dis kaynakli kayitlarda semt ve uzaklik kaliyor.
  function altSatir(m: MekanYogunlukIle): string {
    const parcalar = turuGosterilir(m) ? [m.tur] : []
    // MAHALLE varsa ilcenin yerine o: `semt` ilce tutuyor (Nilufer),
    // mahalle bir kademe daha hassas (Ertugrul). Kullanicinin istegi
    // 2026-08-31.
    parcalar.push(m.mahalle ?? m.semt ?? '', uzaklik(m))
    return parcalar.filter(Boolean).join(' · ')
  }

  function uzaklik(m: MekanYogunlukIle): string {
    // Konum eksikse mesafe hic gosterilmez: yanlis bir mesafe
    // gostermektense hic gostermemek dogru.
    if (!cihazKonumu || !m.konum) return ''
    const metre = mesafeMetre(cihazKonumu.lat, cihazKonumu.lng, m.konum.lat, m.konum.lng)
    return Number.isFinite(metre) ? mesafeYazisi(metre) : ''
  }

  // TAM EKRAN DURUMLAR YALNIZCA ILK ACILISTA.
  //
  // Kullanicinin bildirdigi hata buradaydi: arama sonuc vermeyince
  // liste bosaliyor, bir harf daha yazilinca `yukleniyor && liste bos`
  // kosulu saglaniyor ve EKRANIN TAMAMI yukleme ekraniyla
  // degisiyordu. Yazi kutusu agactan kalkinca klavye kapaniyor,
  // kullanici yazmaya devam edemiyordu.
  //
  // Ilk acilistan sonra yukleme durumu artik yalnizca kutunun
  // yanindaki kucuk gostergeyle anlatiliyor; ekran duzeni sabit
  // kaliyor.
  if (!ilkYuklemeBitti && yukleniyor) {
    return (
      <View style={stiller.ortala}>
        <ActivityIndicator color={renk.turuncu} />
        <Text style={stiller.durumYazi}>Çevren taranıyor…</Text>
      </View>
    )
  }

  // Bos ya da hatali durum bir yon vermeli, yalnizca hata metni degil.
  // Arama YAPILIYORKEN tam ekrana gecilmiyor - ayni klavye sorunu.
  if (hata && mekanlar.length === 0 && !arama.trim()) {
    return (
      <View style={stiller.ortala}>
        <Text style={stiller.hataBaslik}>Çevreni göremiyoruz</Text>
        <Text style={stiller.hataAciklama}>
          {hata === 'Konum izni verilmedi'
            ? 'Yakınındaki mekanları gösterebilmek için konum iznine ihtiyacımız var. Tarayıcı ayarlarından izni açıp tekrar dene.'
            : hata}
        </Text>
        <Pressable style={stiller.birincilButon} onPress={() => yukle()}>
          <Text style={stiller.birincilButonYazi}>Tekrar dene</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={stiller.kok}>
    <ScrollView style={stiller.sayfa} contentContainerStyle={stiller.icerik}>
      {/* Liste DOLUYKEN olusan hata (ornegin arama sirasinda ag
          kopmasi) tam ekran hata ekranini tetiklemez; sessizce
          yutulmamasi icin ustte bir serit olarak gorunur. */}
      {hata && <Text style={stiller.hataSeridi}>{hata}</Text>}

      {/* HARITA: merkezde kullanici, cevresinde mekanlar gercek yon ve
          mesafeleriyle. Buyuk iki satirlik baslik KALDIRILDI - harita
          zaten ekranin gorsel capasi, baslik onu asagi itiyordu. */}
      <CanliHarita
        merkez={cihazKonumu}
        mekanlar={suzulmus}
        onMekanSec={(id) => router.push(`/check-in/${id}`)}
      />

      {/* IKI SEKME: haritanin altinda, yan yana (kullanicinin karari
          2026-08-31, uc tasarim arasindan "sekme cifti" secildi).
          Dugme degil SEKME: alttaki icerigi degistiriyorlar. */}
      <View style={stiller.sekmeCubugu}>
        <Pressable
          style={[stiller.sekme, sekme === 'ara' && stiller.sekmeSecili]}
          onPress={() => sekmeSec('ara')}
          accessibilityRole="tab"
          accessibilityState={{ selected: sekme === 'ara' }}
        >
          <BuyutecIkonu renk={sekme === 'ara' ? renk.turuncu : renk.metinSoluk} />
          <Text style={[stiller.sekmeYazi, sekme === 'ara' && stiller.sekmeYaziSecili]}>
            {t('kesfet.sekmeAra')}
          </Text>
        </Pressable>

        <Pressable
          style={[stiller.sekme, sekme === 'kesfet' && stiller.sekmeSecili]}
          onPress={() => sekmeSec('kesfet')}
          accessibilityRole="tab"
          accessibilityState={{ selected: sekme === 'kesfet' }}
        >
          <PusulaIkonu renk={sekme === 'kesfet' ? renk.turuncu : renk.metinSoluk} />
          <Text style={[stiller.sekmeYazi, sekme === 'kesfet' && stiller.sekmeYaziSecili]}>
            {t('kesfet.sekmeKesfet')}
          </Text>
        </Pressable>
      </View>

      {/* Aktif check-in kartI: check-in'i bitirmenin (Ayrıldım) ve
          silmenin tek yolu bu, o yuzden iki sekmede de duruyor. */}
      {kartMekani && (
        <View style={stiller.buradaKart}>
          <View style={stiller.buradaUst}>
            <View style={stiller.buradaMetin}>
              <Text style={stiller.buradaAd} numberOfLines={1}>
                {kartMekani.ad}
              </Text>
              {kartMekani.listedeki && (
                <Text style={stiller.buradaAlt} numberOfLines={1}>
                  {[kartMekani.listedeki.mahalle ?? kartMekani.listedeki.semt ?? '', uzaklik(kartMekani.listedeki)]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              )}
            </View>
            {(kartMekani.listedeki?.kisiSayisi ?? 0) > 0 && (
              <View style={stiller.buradaSayiAlani}>
                <Text style={stiller.buradaSayi}>{kartMekani.listedeki?.kisiSayisi}</Text>
                <Text style={stiller.buradaSayiEtiket}>kişi burada</Text>
              </View>
            )}
          </View>
          {/* BU MEKANDA ZATEN CHECK-IN VARSA "Check-in yap" YOK
              (kullanicinin istegi 2026-08-29). Yerine durum ve iki
              eylem: Ayrıldım ve Sil. Baska bir mekan secilene kadar
              boyle kaliyor. */}
          {kartCanli ? (
            <>
              <View style={stiller.canliSerit}>
                <View style={stiller.buradaNokta} />
                <Text style={stiller.canliYazi}>Şu an buradasın</Text>
              </View>
              <View style={stiller.canliEylemler}>
                <Pressable
                  style={stiller.ikincilButon}
                  onPress={ayril}
                  accessibilityRole="button"
                >
                  <Text style={stiller.ikincilButonYazi}>Ayrıldım</Text>
                </Pressable>
                <Pressable
                  style={stiller.ikincilButon}
                  onPress={() => setSilOnayi(!silOnayi)}
                  accessibilityRole="button"
                >
                  <Text style={stiller.silYazi}>Sil</Text>
                </Pressable>
              </View>

              {/* SILME GERI ALINAMAZ; ayrilmaktan farki burada yaziyor:
                  ayrilma check-in'i aniya cevirir, silme satiri
                  tamamen kaldirir. */}
              {silOnayi && (
                <View style={stiller.silOnayAlani}>
                  <Text style={stiller.silOnaySoru}>
                    Bu check-in kalıcı olarak silinsin mi? Anılarında da kalmaz.
                  </Text>
                  <View style={stiller.silOnayDugmeleri}>
                    <Pressable onPress={() => setSilOnayi(false)} accessibilityRole="button">
                      <Text style={stiller.vazgecYazi}>Vazgeç</Text>
                    </Pressable>
                    <Pressable onPress={canliyiSil} accessibilityRole="button">
                      <Text style={stiller.silYazi}>Sil</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          ) : (
            <Pressable
              style={stiller.checkInButonu}
              onPress={() => router.push(`/check-in/${kartMekani.id}`)}
              accessibilityRole="button"
            >
              <Text style={stiller.checkInYazi}>Check-in yap</Text>
            </Pressable>
          )}
        </View>
      )}

      {sekme === 'kesfet' && (
      <Text style={stiller.ozet}>
        {toplamKisi > 0 ? (
          <>
            {canlilar.length} mekânda <Text style={stiller.ozetVurgu}>{toplamKisi} kişi</Text> canlı
          </>
        ) : (
          `${suzulmus.length} mekan yakınında`
        )}
      </Text>

      )}

      {sekme === 'ara' && (
        <>
          <TextInput
        style={stiller.arama}
        placeholder="Mekan ara"
        placeholderTextColor={renk.metinSoluk}
        value={arama}
        onChangeText={aramaDegisti}
        autoCorrect={false}
        autoCapitalize="none"
            returnKeyType="search"
          />

      {/* Arama sirasinda ekran duzeni DEGISMIYOR; durum yalnizca bu
          ince seritle anlatiliyor. Boylece yazi kutusu agacta kaliyor
          ve klavye acik kaliyor. */}
      {arama.trim().length > 0 && (
        <View style={stiller.aramaDurumu}>
          {yukleniyor ? (
            <>
              <ActivityIndicator size="small" color={renk.turuncu} />
              <Text style={stiller.aramaDurumYazi}>Aranıyor…</Text>
            </>
          ) : suzulmus.length === 0 ? (
            <Text style={stiller.aramaDurumYazi}>
              “{arama.trim()}” için bir yer bulunamadı. Adın yazılışını
              değiştirmeyi deneyebilirsin.
            </Text>
          ) : (
            <Text style={stiller.aramaDurumYazi}>
              {suzulmus.length} sonuç
            </Text>
          )}
        </View>
      )}

        </>
      )}

      {/* Canli mekanlar one cikiyor: uygulamanin tek sorusu "su an
          nerede insan var". Kimse yoksa bu bolum hic cizilmiyor.
          Yalnizca kesfet sekmesinde: arama sonuclari arasinda "canli"
          vurgusu aramayi bolerdi. */}
      {sekme === 'kesfet' && canlilar.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={canlilar}
          keyExtractor={(m) => m.id}
          contentContainerStyle={stiller.kartSatiri}
          renderItem={({ item }) => (
            <Pressable
              style={stiller.kart}
              onPress={() => router.push(`/check-in/${item.id}`)}
            >
              <View style={stiller.canliRozet}>
                <View style={stiller.canliNokta} />
                <Text style={stiller.canliRozetYazi}>{item.kisiSayisi} kişi burada</Text>
              </View>
              <View style={stiller.kartAlt}>
                <Text style={stiller.kartAd} numberOfLines={2}>
                  {item.ad}
                </Text>
                <Text style={stiller.kartAltYazi}>{altSatir(item)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Text style={stiller.bolumBasligi}>
        {sekme === 'kesfet' ? 'Yakınında' : 'Sonuçlar'}
      </Text>
      {sakinler.length === 0 ? (
        <Text style={stiller.bosDurum}>Bu filtreyle yakında mekan yok.</Text>
      ) : (
        sakinler.map((item) => (
          <Pressable
            key={item.id}
            style={stiller.satir}
            onPress={() => router.push(`/check-in/${item.id}`)}
          >
            {/* Satirin kendisi mekan detayini aciyor; bu igne DOGRUDAN
                check-in'e goturuyor. Iki hedef ayni satirda oldugu
                icin igne ayri bir dugme. */}
            <Pressable
              onPress={() => router.push(`/check-in/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${item.ad} için check-in yap`}
              hitSlop={10}
              style={stiller.satirCheckIn}
            >
              <CheckInIkonu />
            </Pressable>
            <View style={stiller.satirOrta}>
              {/* MEKAN ADI BASILABILIR BIR ETIKET (kullanicinin karari
                  2026-08-31): turuncu ve dokununca KONUM ekranini
                  aciyor. Uygulamanin geri kalaninda da turuncu mekan
                  adi "konum etiketi" demek - akistaki ve profildeki
                  kartlar da oyle. Satirin geri kalani ve soldaki igne
                  check-in'e goturmeye devam ediyor. */}
              <Pressable
                onPress={() => router.push(`/harita/${item.id}` as never)}
                accessibilityRole="button"
                accessibilityLabel={`${item.ad} konumunu gör`}
                hitSlop={6}
              >
                <Text style={stiller.satirAd} numberOfLines={1}>
                  {item.ad}
                </Text>
              </Pressable>
              <Text style={stiller.satirAlt}>{altSatir(item)}</Text>
            </View>
            <Text style={stiller.sakinYazi}>Sakin</Text>
          </Pressable>
        ))
      )}

      <Pressable style={stiller.ekleButonu} onPress={() => router.push('/mekanlar/ekle')}>
        <Text style={stiller.ekleButonuYazi}>Mekan bulamadın mı? Ekle</Text>
      </Pressable>
      {/* ATIF - guncel tutulmasi ZORUNLU. Overture 2026-08-30'da silindi
          (karar 79), mekan verisi artik Foursquare; mahalle ve ilce ise
          OpenStreetMap'ten turetildi. OSM'in lisansi (ODbL) atfi HUKUKEN
          sart kosuyor, Foursquare'inki (Apache 2.0) kosmuyor ama dogru
          kaynagi yazmak zaten gerekli. */}
      <Text style={stiller.atif}>
        Mekan verileri: Foursquare · Mahalle ve ilçe: © OpenStreetMap katkıda bulunanlar
      </Text>
    </ScrollView>
    </View>
  )
}

const KART_GENISLIK = 256
const KART_YUKSEKLIK = 316

const stiller = StyleSheet.create({
  // Ikon satirin SOL BASINDA (kullanicinin istegi 2026-08-26);
  // pay da ona gore sagda.
  satirCheckIn: { paddingRight: 12, paddingVertical: 4 },

  canliSerit: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  buradaNokta: { width: 8, height: 8, borderRadius: 4, backgroundColor: renk.turuncu },
  canliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.turuncuKoyu,
  },
  canliEylemler: { flexDirection: 'row', gap: bosluk.s },
  ikincilButon: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: yuvarlak.hap,
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  ikincilButonYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  silYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: '#C0392B' },
  silOnayAlani: { gap: bosluk.s },
  silOnaySoru: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  silOnayDugmeleri: { flexDirection: 'row', gap: 20 },
  vazgecYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },

  buradaKart: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    padding: bosluk.l,
    marginTop: bosluk.m,
    gap: bosluk.m,
    ...golge.kart,
  },
  buradaUst: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  buradaMetin: { flex: 1 },
  buradaAd: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  buradaAlt: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
  },
  buradaSayiAlani: { alignItems: 'flex-end' },
  buradaSayi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.5,
  },
  buradaSayiEtiket: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },
  checkInButonu: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkInYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },

  kok: { flex: 1, backgroundColor: renk.zemin },
  sayfa: { flex: 1, backgroundColor: renk.zemin },
  // Harita EN USTTE. Onceden burada yaricap cipleri vardi ve ust pay
  // onlara ayrilmisti; cipler kalkinca harita bosluga tasindi.
  icerik: { paddingTop: bosluk.m, paddingBottom: ALT_GEZINME_PAYI },
  ortala: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: bosluk.xl,
    backgroundColor: renk.zemin,
    gap: bosluk.m,
  },
  durumYazi: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },
  hataBaslik: { fontFamily: yazi.ekranBasligi, fontSize: olcek.altBaslik, color: renk.metin },
  hataAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
    textAlign: 'center',
  },
  birincilButon: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: bosluk.m,
    paddingHorizontal: bosluk.xl,
    marginTop: bosluk.s,
  },
  birincilButonYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.yuzey },

  // Marka yazisi kaldirildi (kullanicinin istegi 2026-08-26); geriye
  // yalnizca yaricap cipleri kaldi ve saga hizali duruyor.
  marka: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 22,
    color: renk.metin,
    letterSpacing: -0.6,
  },
  markaNokta: { color: renk.turuncu },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 30,
    lineHeight: 34,
    color: renk.metin,
    letterSpacing: -0.8,
    paddingHorizontal: bosluk.xl,
    marginTop: bosluk.l,
  },
  /**
   * Sekme cubugu: iki sekme tek kabugun icinde, secili olan beyaz ve
   * golgeli. Uc tasarim onerisi arasindan "B - sekme cifti" secildi
   * (kullanici, 2026-08-31).
   */
  sekmeCubugu: {
    flexDirection: 'row',
    backgroundColor: '#F2EFEB',
    borderRadius: yuvarlak.hap,
    padding: 4,
    marginTop: bosluk.l,
  },
  sekme: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: bosluk.s,
    paddingVertical: 11,
    borderRadius: yuvarlak.hap,
  },
  sekmeSecili: {
    backgroundColor: renk.yuzey,
    ...golge.kart,
  },
  sekmeYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
  sekmeYaziSecili: { color: renk.metin },

  ozet: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    paddingHorizontal: bosluk.xl,
    marginTop: bosluk.xs,
  },
  ozetVurgu: { fontFamily: yazi.govdeKalin, color: renk.turuncuKoyu },
  aramaDurumu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    paddingHorizontal: bosluk.l,
    paddingTop: bosluk.s,
  },
  aramaDurumYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
    flexShrink: 1,
  },
  hataSeridi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.turuncuKoyu,
    backgroundColor: renk.turuncuZemin,
    marginHorizontal: bosluk.xl,
    marginTop: bosluk.m,
    paddingVertical: bosluk.s,
    paddingHorizontal: bosluk.m,
    borderRadius: yuvarlak.kart,
  },

  arama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.m,
    marginHorizontal: bosluk.xl,
    marginTop: bosluk.l,
  },

  turSatiri: { gap: bosluk.s, paddingHorizontal: bosluk.xl, paddingTop: bosluk.m },
  turCipi: {
    borderRadius: yuvarlak.hap,
    paddingVertical: 8,
    paddingHorizontal: bosluk.l,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  turCipiSecili: { backgroundColor: renk.metin, borderColor: renk.metin },
  turYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.metinIkincil },
  turYaziSecili: { color: renk.yuzey },

  kartSatiri: { gap: bosluk.m, paddingHorizontal: bosluk.xl, paddingTop: bosluk.l },
  kart: { width: KART_GENISLIK, height: KART_YUKSEKLIK, borderRadius: 28, ...golge.yuzer },
  // Beyaz kapak uzerinde cam rozet gorunmuyordu: dolgu turuncuya
  // gecti. Turuncu burada dogru - "su an canli" bir eylem/canlilik
  // isareti.
  canliRozet: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  canliNokta: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#FFFFFF' },
  canliRozetYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.minik, color: '#FFFFFF' },
  kartAlt: { position: 'absolute', left: 18, right: 18, bottom: 18, gap: 2 },
  kartAd: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 20,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  kartAltYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.metinIkincil },

  bolumBasligi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
    paddingHorizontal: bosluk.xl,
    marginTop: bosluk.xl,
    marginBottom: bosluk.xs,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    paddingHorizontal: bosluk.xl,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  satirGorsel: { width: 58, height: 58, borderRadius: 18 },
  satirOrta: { flex: 1, gap: 3 },
  // Turuncu ve basilabilir: bu bir konum etiketi (kullanicinin
  // karari 2026-08-31).
  satirAd: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.turuncu },
  satirAlt: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },
  sakinYazi: { fontFamily: yazi.govde, fontSize: olcek.minik, color: renk.metinSoluk },
  bosDurum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    paddingHorizontal: bosluk.xl,
    paddingVertical: bosluk.m,
  },

  ekleButonu: { alignItems: 'center', paddingVertical: bosluk.l, marginTop: bosluk.s },
  ekleButonuYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: renk.turuncuKoyu },
  atif: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
    textAlign: 'center',
    paddingHorizontal: bosluk.xl,
  },
})
