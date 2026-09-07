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
  type AktifCheckIn,
} from '../../../lib/checkin'
import {
  yakinMekanlariYogunlukIleGetir,
  turuGosterilir,
  mekanDurumu,
  ildekiTurleriGetir,
  TEMEL_TUR_GRUPLARI,
  type MekanDurumu,
  type YakinTur,
  KESFET_YARICAP_METRE,
  KESFET_LIMIT,
  type MekanYogunlukIle,
} from '../../../lib/mekan'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { TurSecici } from '../../tasarim/TurSecici'
import {
  HaritaIkonu,
  ListeIkonu,
  SuzgecIkonu,
  YaprakIkonu,
  IgneIkonu,
  CubukIkonu,
  YildizIkonu,
  KisilerIkonu,
  GeriOkIkonu,
} from '../../tasarim/mekan-ikonlari'
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

/**
 * DURUM RENKLERI - marka turuncusundan BAGIMSIZ bir trafik isigi dili.
 *
 * Sebep: bunlar bir eylem degil bir OLCU anlatiyor. Uygulamada turuncu
 * "eylem ya da su an oluyor" demek; uc durumu da turuncunun tonlariyla
 * gostermek o anlami tuketirdi. Referans gorselde de yesil / kirmizi /
 * sari kullaniliyor.
 *
 * Koyu modda ayni degerler kaliyor: uc renk de kendi zeminlerinin
 * (DURUM_ZEMINI) uzerinde duruyor ve o zeminler saydam degil.
 */
const DURUM_RENGI: Record<MekanDurumu, string> = {
  sakin: '#2FBF5B',
  yogun: '#E5484D',
  populer: '#F5A623',
}

const DURUM_ZEMINI: Record<MekanDurumu, string> = {
  sakin: 'rgba(47, 191, 91, 0.12)',
  yogun: 'rgba(229, 72, 77, 0.12)',
  populer: 'rgba(245, 166, 35, 0.14)',
}

export default function KesfetEkrani() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const [cihazKonumu, setCihazKonumu] = useState<{ lat: number; lng: number } | null>(null)
  const [arama, setArama] = useState('')
  /**
   * Haritanin altindaki iki sekme (kullanicinin karari 2026-08-31).
   *
   * VARSAYILAN 'ara' (kullanicinin istegi 2026-09-01: "Checkin sayfasi
   * acildiginda ilk mekan ara butonu uzerinden baslasin, kesfet
   * degil"). Iki sekme iki ayri soruyu cevapliyor: 'ara' "yakinimda ne
   * var" (tur suzgeci YOK), 'kesfet' "su an nereye gidip birileriyle
   * karsilasabilirim" (sosyal turlere daraliyor).
   */
  /**
   * TUR SUZGECI (kullanicinin istegi 2026-09-06). Bos dizi = suzgec
   * yok, yani butun turler.
   *
   * Onceden bu bir SEKME idi ('kesfet' sosyal turlere daraltiyordu);
   * artik kullanici turleri tek tek seciyor. Suzgec yine SUNUCUDA
   * uygulaniyor - 2026-08-31'de olculdu, istemcide suzmek dolu bir
   * cevrede bile listeyi bosaltiyordu.
   */
  const [seciliTurler, setSeciliTurler] = useState<string[]>([])
  const [turSeciciAcik, setTurSeciciAcik] = useState(false)
  const [yakinTurler, setYakinTurler] = useState<YakinTur[]>([])
  const [turlerYukleniyor, setTurlerYukleniyor] = useState(false)

  /**
   * GORUNUM (referans gorseldeki Harita / Liste segmenti).
   * 'liste'de harita hic cizilmiyor ve butun ekran listeye kaliyor -
   * uzun bir listede haritayi her seferinde kaydirip gecmek gerekmesin.
   */
  const [gorunum, setGorunum] = useState<'harita' | 'liste'>('harita')

  /**
   * DURUM SUZGECI (referanstaki dort cip). Tur suzgeci DEGIL - o
   * `sekme` uzerinden ve artik suzgec dugmesinden yonetiliyor.
   */
  const [durum, setDurum] = useState<'tumu' | MekanDurumu>('tumu')

  const [mekanlar, setMekanlar] = useState<MekanYogunlukIle[]>([])
  // AKTIF CHECK-IN (kullanicinin istegi 2026-08-29): check-in yapilmis
  // mekanda kart artik "Check-in yap" demiyor; "Şu an buradasın" deyip
  // Ayrıldım ve Sil sunuyor. Baska bir mekan secilene kadar boyle.
  const [aktifCheckIn, setAktifCheckIn] = useState<AktifCheckIn | null>(null)
  // Silme GERI ALINAMAZ: once onay satiri aciliyor.
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  // Ilk acilis bittikten sonra ekran duzeni bir daha tam ekran
  // durumlara gecmiyor; bkz. asagidaki not.
  const [ilkYuklemeBitti, setIlkYuklemeBitti] = useState(false)
  const istekSirasi = useRef(0)

  /**
   * `aktifSekme` PARAMETRE, cunku `sekmeSec` hemen ardindan yukluyor ve
   * o an `sekme` state'i henuz eski degerinde olur.
   */
  async function yukle(metin = arama, turler: string[] = seciliTurler) {
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
       * ARAMA BOSKEN: yaricap, tur suzgeci ve limit SUNUCUYA
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
      /**
       * TUR SUZGECI YALNIZCA KESFET SEKMESINDE (kullanicinin istegi
       * 2026-08-31: "Butun turleri mekan ara sonuclar kisminda goster").
       * Iki sekme iki ayri soruyu cevapliyor: Kesfet "su an nereye gidip
       * birileriyle karsilasabilirim" (sosyal turler), Mekan ara ise
       * "yakinimda ne var" - orada eczane, banka, oto tamirci de
       * gorunmeli. Mesafe siniri ikisinde de duruyor.
       */
      // ARAMA VARKEN tur suzgeci uygulanmiyor: "eczane" araninca
      // secili turler yuzunden sonuc cikmamasi kullaniciyi sasirtir.
      const turSuzgeci = turler.length > 0 && !aramaVarMi
      const sonuc = await yakinMekanlariYogunlukIleGetir(
        konum.lat,
        konum.lng,
        // YARICAP: arama ya da TUR SUZGECI varken kalkiyor.
        // Kullanicinin kurali (2026-09-06): "Filtrelemede km siniri
        // yok, filtreleme yapan biri bulundugu sehirdeki kayitlara
        // gore sonuclar bulur." Il sinirini SUNUCU uyguluyor.
        aramaVarMi || turSuzgeci ? null : KESFET_YARICAP_METRE,
        metin || undefined,
        turSuzgeci ? turler : null,
        aramaVarMi ? null : KESFET_LIMIT
      )
      /**
       * SINIRSIZ YEDEK ISTEK YOK (kullanicinin karari 2026-09-01).
       * Eskiden yaricap icinde sonuc cikmazsa sinirlar kaldirilip
       * tekrar soruluyordu; bu, listede 500 m'yi asan mekanlar
       * gosterilmesine yol aciyordu - kullanici ekran goruntusuyle
       * yakaladi (200 m sinirli listede 420-530 m kayitlar). Sinir
       * artik kesin; cevrede mekan yoksa liste bos kalir ve bos durum
       * metni gorunur.
       */
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
   * Tur secimi uygulaniyor (secicideki "Kaydet").
   *
   * ARAMA METNI SILINIYOR: tur suzgeci yalnizca arama bosken
   * calisiyor, yani metin dururken secim gorunur bir sey yapmazdi ve
   * kullanici sebebini goremezdi.
   */
  function turleriUygula(yeni: string[]) {
    setSeciliTurler(yeni)
    setTurSeciciAcik(false)
    setArama('')
    // Listeyi HEMEN tazele: `arama` zaten bossa metin degisikligine
    // bagli etki tetiklenmez, o yuzden acikca cagriliyor.
    yukle('', yeni)
  }

  /**
   * Secici acilirken cevredeki turler cekiliyor - HER ACILISTA, cunku
   * kullanici bu arada baska bir yere gitmis olabilir.
   *
   * Liste okunamazsa pencere yine aciliyor ve bos durum metni
   * gosteriyor; suzgeci hic acamamak daha kotu olurdu.
   */
  async function turSeciciyiAc() {
    setTurSeciciAcik(true)
    if (!cihazKonumu) return
    setTurlerYukleniyor(true)
    try {
      setYakinTurler(await ildekiTurleriGetir(cihazKonumu.lat, cihazKonumu.lng))
    } catch {
      // Sayilar gelmezse secici YINE aciliyor: tur listesi istemcide
      // sabit, yalnizca yanlarindaki adet eksik kalir.
      setYakinTurler([])
    } finally {
      setTurlerYukleniyor(false)
    }
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
  // Kesfet'te canlilar ayri bir yatay seritte one cikiyor, bu yuzden
  // alttaki liste yalnizca sakinleri gosteriyor - ayni mekan iki kez
  // cizilmesin. "Mekan ara"da oyle bir serit YOK; orada liste her seyi
  // tasimali, yoksa aranan kalabalik mekan hic gorunmuyor (bu kusur
  // 2026-09-01'de bulundu ve testle kilitlendi).
  /**
   * TEK LISTE (referans gorsel). Onceden Kesfet sekmesinde canlilar
   * ayri bir yatay seritte one cikiyor ve alttaki liste yalnizca
   * sakinleri gosteriyordu; referansta oyle bir ayrim yok - her mekan
   * ayni listede, durumunu ROZETI soyluyor.
   *
   * SIRALAMA DEGISMIYOR: sunucudan gelen yakinlik sirasi korunuyor
   * (sabit kural, 2026-09-01). Durum yalnizca SUZUYOR, siralamiyor.
   */
  const sakinler = liste.filter((m) => durum === 'tumu' || mekanDurumu(m) === durum)
  const toplamKisi = canlilar.reduce((t, m) => t + m.kisiSayisi, 0)

  // Ad'in altindaki satir. TUR YALNIZCA kullanicinin ekledigi
  // mekanlarda gorunuyor (karar 2026-08-24): dis kaynagin tur verisi
  // guvenilmez oldugu icin yanlis tur gostermektense hic gostermemek
  // tercih edildi. Dis kaynakli kayitlarda semt ve uzaklik kaliyor.
  function altSatir(m: MekanYogunlukIle): string {
    const parcalar = turuGosterilir(m) ? [m.tur] : []
    parcalar.push(konumYazisi(m), uzaklik(m), yogunlukYazisi(m))
    return parcalar.filter(Boolean).join(' · ')
  }

  /**
   * Yogunluk artik SAGDAKI AYRI SUTUNDA degil, alt satirda mesafenin
   * yaninda (kullanicinin sectigi tasarim, 2026-09-01): sag taraf
   * check-in dugmesine ayrildi.
   *
   * Kalabalik da burada gosteriliyor, cunku "Mekan ara" listesi artik
   * canli mekanlari da tasiyor - eskiden yalnizca kisiSayisi === 0
   * olanlar listeleniyordu ve canlilar seridi Kesfet'e ozel oldugu icin
   * aranan kalabalik bir mekan sonuclarda HIC gorunmuyordu.
   */
  function yogunlukYazisi(m: MekanYogunlukIle): string {
    return m.kisiSayisi > 0 ? `${m.kisiSayisi} kişi` : t('kesfet.sakin')
  }

  /**
   * Satirdaki konum ibaresi: YALNIZCA ilce ve il.
   *
   * Kullanicinin karari (2026-08-31): "Mahalle adres bilgisi aktarimini
   * durdur ve sil, sadece konumlarin ilce ve il bilgisini gosterecegiz
   * TAM DOGRULUK ADINA."
   *
   * Mahalle uc ayri yoldan denendi ve ucu de yanlis sonuc verdi:
   * (1) OSM yerlesim noktalarindan "en yakin merkez" - komsu mahalleyi
   * seciyordu; (2) mekanin kendi adresinden turetip komsuluga yayma -
   * kullanici turetilmis veri istemedi; (3) yalnizca kendi adresi -
   * kaynagin kendisi kirli cikti ("Bursa Erik mah." gibi alanlari
   * karisik girilmis kayitlar). Ilce ve il ise POLIGON testiyle
   * atandigi icin kesin: nokta hangi sinirin icindeyse o.
   */
  function konumYazisi(m: MekanYogunlukIle): string {
    return [m.semt, m.il].filter(Boolean).join(', ')
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
    {/* UST CUBUK (referans gorsel): baslik ve sagda Harita/Liste
        segmenti. Bu bir sekme ekrani oldugu icin geri oku ANLAMSIZ
        olurdu - alt gezinmeden geliniyor, geri gidilecek yer yok. */}
    <View style={stiller.ustCubuk}>
      {/* GERI OKU referans gorselde var. Bu bir sekme ekrani, yani
          normalde geri gidilecek yer yok - ama kullanici buraya bir
          mekan sayfasindan da gelebiliyor. `canGoBack` yanlissa ok
          hic cizilmiyor: islevi olmayan bir dugme koymuyoruz. */}
      {router.canGoBack() && (
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('checkInHaritasi.geri')}
          hitSlop={10}
          testID="kesfet-geri"
        >
          <GeriOkIkonu renk={renk.metin} />
        </Pressable>
      )}
      <Text style={stiller.ustBaslik}>{t('kesfet.baslik')}</Text>
      <View style={stiller.gorunumSegmenti}>
        <Pressable
          style={[stiller.gorunumDugme, gorunum === 'harita' && stiller.gorunumSecili]}
          onPress={() => setGorunum('harita')}
          accessibilityRole="button"
          testID="gorunum-harita"
        >
          <HaritaIkonu renk={gorunum === 'harita' ? renk.turuncu : renk.metinSoluk} />
          <Text style={[stiller.gorunumYazi, gorunum === 'harita' && stiller.gorunumYaziSecili]}>
            {t('kesfet.harita')}
          </Text>
        </Pressable>
        <Pressable
          style={[stiller.gorunumDugme, gorunum === 'liste' && stiller.gorunumSecili]}
          onPress={() => setGorunum('liste')}
          accessibilityRole="button"
          testID="gorunum-liste"
        >
          <ListeIkonu renk={gorunum === 'liste' ? renk.turuncu : renk.metinSoluk} />
          <Text style={[stiller.gorunumYazi, gorunum === 'liste' && stiller.gorunumYaziSecili]}>
            {t('kesfet.liste')}
          </Text>
        </Pressable>
      </View>
    </View>

    <ScrollView style={stiller.sayfa} contentContainerStyle={stiller.icerik}>
      {/* Liste DOLUYKEN olusan hata (ornegin arama sirasinda ag
          kopmasi) tam ekran hata ekranini tetiklemez; sessizce
          yutulmamasi icin ustte bir serit olarak gorunur. */}
      {hata && <Text style={stiller.hataSeridi}>{hata}</Text>}

      {/* HARITA: merkezde kullanici, cevresinde mekanlar gercek yon ve
          mesafeleriyle. Buyuk iki satirlik baslik KALDIRILDI - harita
          zaten ekranin gorsel capasi, baslik onu asagi itiyordu. */}
      {gorunum === 'harita' && (
        <CanliHarita
          merkez={cihazKonumu}
          mekanlar={suzulmus}
          onMekanSec={(id) => router.push(`/check-in/${id}`)}
        />
      )}

      {/* Aktif check-in karti: nerede oldugunu ve orada kac kisi
          bulundugunu soyleyen bir DURUM karti. Eylem tasimiyor
          (kullanicinin istegi 2026-09-07: "Ayrıldım ve Sil'i kaldir,
          konum ismi, su an buradasin ve kac kisi kalsin").

          ISLEV KAYBI YOK, iki eylem de baska yerde duruyor:
            ayrilma -> mekan sayfasindaki "Buradasın · Ayrıl" cubugu
            silme   -> akis/anilar kartinin uc nokta menusu
          Buradan kalkmalarinin sebebi de bu: ikisi de artik baska
          ekranlarda oldugu icin bu kart tek basina bir eylem yuzeyi
          olmak zorunda degil. */}
      {kartMekani && (
        <View style={stiller.buradaKart}>
          <View style={stiller.buradaUst}>
            <View style={stiller.buradaMetin}>
              <Text style={stiller.buradaAd} numberOfLines={1}>
                {kartMekani.ad}
              </Text>
              {kartMekani.listedeki && (
                <Text style={stiller.buradaAlt} numberOfLines={1}>
                  {[konumYazisi(kartMekani.listedeki), uzaklik(kartMekani.listedeki)]
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
              (kullanicinin istegi 2026-08-29). Yerine yalnizca durum
              seridi kaliyor. Baska bir mekan secilene kadar boyle. */}
          {kartCanli ? (
            <View style={stiller.canliSerit}>
              <View style={stiller.buradaNokta} />
              <Text style={stiller.canliYazi}>Şu an buradasın</Text>
            </View>
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

      {/* ARAMA HER ZAMAN GORUNUR (referans gorsel). Onceden yalnizca
          "Mekan ara" sekmesinde ciziliyordu; artik sekme yok, tek liste
          var ve arama her durumda elinin altinda.

          Yanindaki SUZGEC DUGMESI eski "Kesfet" sekmesinin isini
          goruyor: acikken liste yalnizca sosyal turlere daraliyor
          (kafe, bar, park...). O ayrim kaybolmasin diye korundu -
          kullanicinin 2026-08-31 karariydi. */}
      <View style={stiller.aramaSatiri}>
        {/* Kutu ESNIYOR, suzgec dugmesi sabit genislikte. Ilk halde
            TextInput'a flex verilmemisti ve kutu icerigi kadar dar
            kaliyordu; suzgec de ortada asili duruyordu. */}
        <View style={stiller.aramaKutusu}>
          <BuyutecIkonu renk={renk.turuncu} />
          <TextInput
            style={stiller.arama}
            placeholder="Mekan ara"
            placeholderTextColor={renk.metinIkincil}
            value={arama}
            onChangeText={aramaDegisti}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
        <Pressable
          style={[stiller.suzgecDugmesi, seciliTurler.length > 0 && stiller.suzgecAcik]}
          onPress={turSeciciyiAc}
          accessibilityRole="button"
          accessibilityLabel={t('kesfet.turSuzgeci')}
          accessibilityState={{ selected: seciliTurler.length > 0 }}
          testID="tur-suzgeci"
        >
          <SuzgecIkonu renk={seciliTurler.length > 0 ? '#FFFFFF' : renk.turuncu} />
          {/* Kac tur secili oldugu dugmenin uzerinde: suzgecin ACIK
              oldugunu yalnizca renkten anlamak yetmiyordu - kullanici
              "bu tus neye yariyor" diye sordu (2026-09-06). */}
          {seciliTurler.length > 0 && (
            <View style={stiller.suzgecRozeti}>
              <Text style={stiller.suzgecRozetYazi}>{seciliTurler.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* SECILI TURLER GORUNUR DURUYOR. Suzgec bir pencerenin icinde
          kalirsa kullanici listenin neden kisa oldugunu goremez;
          buradaki cipler hem sebebi soyluyor hem tek dokunusla
          kaldirilabiliyor. */}
      {seciliTurler.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={stiller.seciliSerit}
        >
          {seciliTurler.map((tur) => (
            <Pressable
              key={tur}
              style={stiller.seciliCip}
              onPress={() => turleriUygula(seciliTurler.filter((x) => x !== tur))}
              accessibilityRole="button"
              accessibilityLabel={`${tur} filtresini kaldır`}
              testID={`secili-tur-${tur}`}
            >
              <Text style={stiller.seciliCipYazi}>{tur}</Text>
              <Text style={stiller.seciliCipCarpi}>×</Text>
            </Pressable>
          ))}
          <Pressable
            style={[stiller.seciliCip, stiller.seciliCipTemizle]}
            onPress={() => turleriUygula([])}
            accessibilityRole="button"
            testID="turleri-temizle"
          >
            <Text style={stiller.seciliCipTemizleYazi}>{t('kesfet.filtreyiKaldir')}</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* DURUM CIPLERI (referans gorsel). Ikon ustte, metin altta.
          Suzuyorlar, SIRALAMIYORLAR - yakinlik sirasi sabit kural. */}
      {/* CIPLER EKRANA SIGIYOR (kullanicinin istegi 2026-09-06:
          "Sagdan ve soldanda ekrana sigdir"). Onceden yatay bir
          ScrollView'di ve dordu birden gorunmuyordu; artik dordu esit
          bolusuyor. */}
      <View style={stiller.cipSeridi}>
        {/* CIP IKONLARI (kullanicinin referansi 2026-09-06): uc durum da
            ayni IGNE, yalnizca rengi degisiyor - yesil sakin, kirmizi
            yogun, turuncu tumu; populer tek basina YILDIZ.

            KART ROZETLERINDEN FARKLI ve bu bilerek: orada yaprak /
            cubuk / yildiz var. Cipte igne, kartta simge - referans da
            oyle. Cipler bir HARITA suzgeci gibi okunuyor (hepsi ayni
            bicim, renk ayiriyor), rozet ise satirin icinde tek basina
            durdugu icin kendi simgesini tasiyor. */}
        {([
          { anahtar: 'tumu', etiket: t('kesfet.tumu'), ikon: <IgneIkonu boyut={19} renk={renk.turuncu} /> },
          { anahtar: 'sakin', etiket: t('kesfet.sakin'), ikon: <IgneIkonu boyut={19} renk={DURUM_RENGI.sakin} /> },
          { anahtar: 'yogun', etiket: t('kesfet.yogun'), ikon: <IgneIkonu boyut={19} renk={DURUM_RENGI.yogun} /> },
          { anahtar: 'populer', etiket: t('kesfet.populer'), ikon: <YildizIkonu boyut={19} renk={DURUM_RENGI.populer} /> },
        ] as const).map((c) => (
          <Pressable
            key={c.anahtar}
            style={[stiller.cip, durum === c.anahtar && stiller.cipSecili]}
            onPress={() => setDurum(c.anahtar)}
            accessibilityRole="button"
            accessibilityState={{ selected: durum === c.anahtar }}
            testID={`cip-${c.anahtar}`}
          >
            {c.ikon}
            <Text style={[stiller.cipYazi, durum === c.anahtar && stiller.cipYaziSecili]}>
              {c.etiket}
            </Text>
          </Pressable>
        ))}
      </View>


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

      {/* BOLUM BASLIGI + "Tumunu gor" (referans gorsel). Sagdaki
          baglanti LISTE gorunumune geciyor: harita kalkiyor ve butun
          ekran listeye kaliyor. */}
      <View style={stiller.bolumSatiri}>
        <Text style={stiller.bolumBasligi}>
          {/* Arama BOSKEN liste gercekten yakindakiler. Bir sey
              ARANINCA mesafe siniri kalkiyor ve sonuc baska ilceden de
              gelebiliyor - orada "Yakinindaki" yaniltici olurdu. */}
          {arama.trim().length === 0 ? t('kesfet.yakinindakiMekanlar') : t('kesfet.sonuclar')}
        </Text>
        {gorunum === 'harita' && (
          <Pressable
            style={stiller.tumunuGor}
            onPress={() => setGorunum('liste')}
            accessibilityRole="button"
            testID="tumunu-gor"
          >
            <Text style={stiller.tumunuGorYazi}>{t('kesfet.tumunuGor')}</Text>
            <Text style={stiller.tumunuGorOk}>›</Text>
          </Pressable>
        )}
      </View>
      {sakinler.length === 0 ? (
        <Text style={stiller.bosDurum}>Bu filtreyle yakında mekan yok.</Text>
      ) : (
        sakinler.map((item) => {
          const d = mekanDurumu(item)
          return (
          <View key={item.id} style={stiller.mekanKarti}>
            <View style={stiller.kartGovde}>
              {/* MEKAN ADI BASILABILIR BIR ETIKET (kullanicinin karari
                  2026-08-31): dokununca mekanin KONUM sayfasini
                  aciyor. */}
              <Pressable
                onPress={() => router.push(`/harita/${item.id}` as never)}
                accessibilityRole="button"
                accessibilityLabel={`${item.ad} konumunu gör`}
                hitSlop={6}
              >
                <Text style={stiller.kartMekanAdi} numberOfLines={2}>
                  {item.ad}
                </Text>
              </Pressable>

              <View style={stiller.kartSatir}>
                <IgneIkonu boyut={12} renk={renk.metinSoluk} />
                <Text style={stiller.kartSatirYazi} numberOfLines={1}>
                  {[konumYazisi(item), uzaklik(item)].filter(Boolean).join(' · ')}
                </Text>
              </View>

              {/* Kisi satiri YALNIZCA birileri VARSA. Sifir yazmak
                  bilgi tasimiyor; durumu zaten rozet soyluyor. */}
              {item.kisiSayisi > 0 && (
                <View style={stiller.kartSatir}>
                  <KisilerIkonu boyut={13} />
                  <Text style={stiller.kartKisiYazi}>
                    {t('kesfet.kisiBurada', { sayi: item.kisiSayisi })}
                  </Text>
                </View>
              )}
            </View>

            <View style={stiller.kartSag}>
              {/* UC NOKTA KALDIRILDI (kullanicinin istegi 2026-09-06:
                  "Yanlarindaki 3 noktayi kaldirip oyle duzenle").
                  Icindeki iki islem zaten baska yerde: mekan ADINA
                  basmak konum sayfasini aciyor, buton da check-in'i.
                  Kalkinca sag blok daraldi ve ada yer acildi.

                  ROZET, CHECK-IN'IN SOLUNDA ve ayni satirda
                  (kullanicinin duzeltmesi: "Rozet check-in yazisinin
                  soluna gelicek"). */}
              <View style={stiller.kartAltSatir}>
                <View style={[stiller.rozet, { backgroundColor: DURUM_ZEMINI[d] }]}>
                  {d === 'sakin' ? (
                    <YaprakIkonu boyut={12} />
                  ) : d === 'yogun' ? (
                    <CubukIkonu boyut={12} renk={DURUM_RENGI.yogun} />
                  ) : (
                    <YildizIkonu boyut={12} renk={DURUM_RENGI.populer} />
                  )}
                  <Text style={[stiller.rozetYazi, { color: DURUM_RENGI[d] }]}>
                    {t(`kesfet.${d}`)}
                  </Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    stiller.kartCheckIn,
                    pressed && stiller.kartCheckInBasili,
                  ]}
                  onPress={() => router.push(`/check-in/${item.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.ad} için check-in yap`}
                  testID={`satir-checkin-${item.id}`}
                >
                  <Text style={stiller.kartCheckInYazi} numberOfLines={1}>
                    {t('kesfet.checkIn')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
          )
        })
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

    <TurSecici
      acikMi={turSeciciAcik}
      gruplar={TEMEL_TUR_GRUPLARI}
      adetler={yakinTurler}
      yukleniyor={turlerYukleniyor}
      secili={seciliTurler}
      onKapat={() => setTurSeciciAcik(false)}
      onKaydet={turleriUygula}
    />

    </View>
  )
}

const KART_GENISLIK = 256
const KART_YUKSEKLIK = 316

const stilleriYap = (renk: Renk) => StyleSheet.create({
  // Ikon satirin SOL BASINDA (kullanicinin istegi 2026-08-26);
  // pay da ona gore sagda.

  canliSerit: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  buradaNokta: { width: 8, height: 8, borderRadius: 4, backgroundColor: renk.turuncu },
  canliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.turuncuYazi,
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

  // --- ust cubuk + gorunum segmenti ---
  ustCubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: bosluk.sayfa,
    paddingTop: bosluk.m,
    paddingBottom: bosluk.s,
    gap: bosluk.m,
  },
  ustBaslik: {
    flex: 1,
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  gorunumSegmenti: {
    flexDirection: 'row',
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    padding: 3,
    gap: 3,
  },
  gorunumDugme: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: yuvarlak.hap,
  },
  gorunumSecili: {
    backgroundColor: renk.yuzey,
    borderWidth: 1.2,
    borderColor: renk.turuncu,
  },
  gorunumYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
  },
  gorunumYaziSecili: { color: renk.turuncuYazi },

  // --- arama satiri ---
  aramaSatiri: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  aramaKutusu: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.hap,
    paddingHorizontal: bosluk.m,
    height: 46,
  },
  suzgecDugmesi: {
    width: 46,
    height: 46,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suzgecAcik: { backgroundColor: renk.turuncu },
  suzgecRozeti: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: renk.metin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suzgecRozetYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: 10,
    color: renk.zemin,
  },

  // --- secili tur cipleri ---
  seciliSerit: { gap: 6, paddingVertical: 2 },
  seciliCip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: yuvarlak.hap,
    backgroundColor: renk.turuncuZemin,
  },
  seciliCipYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.minik,
    color: renk.turuncuYazi,
  },
  seciliCipCarpi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.turuncuYazi,
  },
  seciliCipTemizle: { backgroundColor: 'transparent' },
  seciliCipTemizleYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
    textDecorationLine: 'underline',
  },

  // --- durum cipleri ---
  cipSeridi: { flexDirection: 'row', gap: 6, paddingVertical: 2 },
  // Referansta cipler KENARLIKSIZ ve yumusak golgeli; yalnizca SECILI
  // olan turuncu kenarlik ve krem zemin aliyor.
  cip: {
    // FLEX: dort cip yan yana ekrana siginiyor. `minWidth` ile
    // 4x80 + 3x6 = 338 px gerekiyordu, oysa icerik genisligi 310 -
    // serit kayiyordu.
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: yuvarlak.kart,
    borderWidth: 1.4,
    borderColor: 'transparent',
    backgroundColor: renk.yuzey,
    ...golge.kart,
  },
  cipSecili: { borderColor: renk.turuncu, backgroundColor: renk.turuncuZemin },
  cipYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },
  cipYaziSecili: { color: renk.turuncuYazi, fontFamily: yazi.govdeKalin },

  // --- bolum basligi ---
  bolumSatiri: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  tumunuGor: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 3 },
  tumunuGorYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  tumunuGorOk: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metinSoluk,
  },

  // --- mekan karti ---
  mekanKarti: {
    flexDirection: 'row',
    // STRETCH: sag sutun govde yuksekligine yayiliyor, boylece rozet
    // ustte / Check-in altta duruyor (referans gorseldeki hiza).
    // `flex-start` ile ikisi bitisik kaliyor ve buton kartin ortasinda
    // asili gorunuyordu.
    alignItems: 'stretch',
    gap: bosluk.m,
    // TABAN YUKSEKLIK YOK: kart icerigi kadar. Ilk halde `minHeight: 84`
    // vardi ve kisi satiri olmayan (0 kisi) kartlarda buton ile rozet
    // arasinda bos bir bosluk biraktiyordu; referansta kartlar
    // iceriklerine gore uzuyor.
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    padding: bosluk.m,
  },
  kartGovde: { flex: 1, minWidth: 0, gap: 4 },
  kartMekanAdi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.metin,
    letterSpacing: -0.2,
  },
  kartSatir: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  kartSatirYazi: {
    flexShrink: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },
  kartKisiYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.minik,
    color: renk.turuncuYazi,
  },
  // Uc nokta kalkinca sag blokta tek satir kaldi: rozet + buton.
  kartSag: { alignItems: 'flex-end', justifyContent: 'flex-end' },
  // Rozet ve Check-in YAN YANA, rozet solda.
  kartAltSatir: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // Rozet ve buton YAN YANA durdugu icin ikisi de dar tutuluyor:
  // 342 px'lik bir kartta sag blok genisledikce mekan adina yer
  // kalmiyor ve ad iki satira duesuyor.
  rozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: yuvarlak.hap,
  },
  rozetYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.minik },
  /**
   * LISTEDEKI CHECK-IN BUTONU HAYALET (2026-09-07 denetimi).
   *
   * Onceden dolu turuncuydu ve ekranda AYNI ANDA DORT TANE
   * gorunuyordu; yaninda segment, arama ikonu, suzgec, secili cip,
   * "Tumunu gor" ve alt gezinmenin merkez dugmesi de turuncuydu.
   * Kimligin kendi kurali "bir ekranda genelde TEK birincil turuncu
   * eylem olur" diyor; dort ozdes dolu buton o kurali tuketiyordu -
   * turuncu artik "asil eylem bu" demiyordu.
   *
   * Dolu turuncu ekranda TEK kaldi: alt gezinmedeki merkez check-in
   * dugmesi, cunku ekranin asil eylemi o. Buradaki butonlar hala
   * turuncu (yani hala "eylem") ama kenarlikla.
   */
  kartCheckIn: {
    borderWidth: 1.5,
    borderColor: renk.turuncuYazi,
    borderRadius: yuvarlak.hap,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  kartCheckInBasili: { backgroundColor: renk.turuncuZemin },
  kartCheckInYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.turuncuYazi,
  },

  sayfa: { flex: 1, backgroundColor: renk.zemin },
  // Harita EN USTTE. Onceden burada yaricap cipleri vardi ve ust pay
  // onlara ayrilmisti; cipler kalkinca harita bosluga tasindi.
  // YAN PAY BURADA, tek yerde. Onceden her oge kendi
  // `marginHorizontal`ini koyuyordu; arama kutusu sarmalayiciya
  // alininca o margin dustu ve satir ekranin kenarina yapisti.
  // Referansta harita da dahil her sey kenarlardan iceride.
  icerik: {
    paddingTop: bosluk.m,
    paddingBottom: ALT_GEZINME_PAYI,
    paddingHorizontal: bosluk.sayfa,
    gap: bosluk.m,
  },
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
    paddingHorizontal: bosluk.sayfa,
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
  markaNokta: { color: renk.turuncuYazi },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 30,
    lineHeight: 34,
    color: renk.metin,
    letterSpacing: -0.8,
    paddingHorizontal: bosluk.sayfa,
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
    paddingHorizontal: bosluk.sayfa,
    marginTop: bosluk.xs,
  },
  ozetVurgu: { fontFamily: yazi.govdeKalin, color: renk.turuncuYazi },
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
    color: renk.turuncuYazi,
    backgroundColor: renk.turuncuZemin,
    marginTop: bosluk.m,
    paddingVertical: bosluk.s,
    paddingHorizontal: bosluk.m,
    borderRadius: yuvarlak.kart,
  },

  // Kenarlik ve zemin artik SARMALAYICIDA (`aramaKutusu`); burada
  // yalnizca yazi kaliyor.
  arama: {
    flex: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
    paddingVertical: 0,
  },

  turSatiri: { gap: bosluk.s, paddingHorizontal: bosluk.sayfa, paddingTop: bosluk.m },
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

  kartSatiri: { gap: bosluk.m, paddingHorizontal: bosluk.sayfa, paddingTop: bosluk.l },
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
    paddingHorizontal: bosluk.sayfa,
    marginTop: bosluk.xl,
    marginBottom: bosluk.xs,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    paddingHorizontal: bosluk.sayfa,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  satirGorsel: { width: 58, height: 58, borderRadius: 18 },
  satirOrta: {
    minWidth: 0, flex: 1, gap: 3 },
  // Turuncu ve basilabilir: bu bir konum etiketi (kullanicinin
  // karari 2026-08-31).
  // BOYUTLAR kullanicinin sectigi kademe (2026-09-01, gorsel secenek C):
  // ad 19, alt satir 15. Bu ekranda goz IKI bilgiyi tariyor - hangi
  // mekan ve ne kadar uzakta - bu yuzden ikisi birden buyutuldu.
  // Ikisi de temada zaten tanimli jetonlar; yeni punto uretilmedi.
  satirAd: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.altBaslik,
    letterSpacing: -0.2,
    color: renk.turuncuYazi,
  },
  satirAlt: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil },
  satirCheckInDugmesi: {
    // flexShrink SART: satir flexDirection 'row' ve ortadaki bilgi
    // bloku flex:1 ile alani kapiyor. `flex: 0` daralmayi ENGELLEMIYOR -
    // dugme eziliyor ve "Check-in" metni harf harf alt alta sariyordu
    // (gozle dogrulamada yakalandi, testler yesildi).
    flexShrink: 0,
    paddingVertical: bosluk.s,
    paddingHorizontal: bosluk.l,
    borderRadius: yuvarlak.hap,
    backgroundColor: renk.turuncu,
  },
  satirCheckInYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: '#FFFFFF',
  },
  bosDurum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    paddingHorizontal: bosluk.sayfa,
    paddingVertical: bosluk.m,
  },

  ekleButonu: { alignItems: 'center', paddingVertical: bosluk.l, marginTop: bosluk.s },
  ekleButonuYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: renk.turuncuYazi },
  atif: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
    textAlign: 'center',
    paddingHorizontal: bosluk.sayfa,
  },
})
