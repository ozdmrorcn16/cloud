import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  RefreshControl,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
  Platform,
  LayoutAnimation,
  PanResponder,
  ActionSheetIOS,
  Linking,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import { Image } from 'expo-image'
import { cihazKonumunuAl, mesafeMetre } from '../../../lib/konum'
import { useDil } from '../../../lib/dil'
import {
  aktifCheckInimiGetir,
  checkIndenAyril,
  checkIniSil,
  mekanlardaBulunanlariGetir,
  type AktifCheckIn,
  type BulunanKisi,
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
import { OnayPenceresi } from '../../tasarim/OnayPenceresi'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { TurSecici } from '../../tasarim/TurSecici'
import {
  HaritaIkonu,
  ListeIkonu,
  SuzgecIkonu,
  IgneIkonu,
  YildizIkonu,
  NavigasyonIkonu,
  GeriOkIkonu,
} from '../../tasarim/mekan-ikonlari'
import { CanliHarita } from '../../tasarim/CanliHarita'
import { MekanKapakHarita } from '../../tasarim/MekanKapakHarita'
import { turSuzgeciniOku, turSuzgeciniYaz } from '../../../lib/tur-suzgeci-depo'
import { turEtiketi } from '../../../lib/tur-etiketi'
import { avatarlariGetir } from '../../../lib/akis'
import { mekanFotografiUrlleri } from '../../../lib/mekan-duzenleme'
import {
  haritaSecenekleri,
  kuruluHaritalar,
  haritaAdresi,
  type HaritaSecimi,
} from '../../../lib/yol-tarifi'
import { Avatar } from '../../tasarim/Avatar'
import { SecimPenceresi } from '../../tasarim/SecimPenceresi'

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

/**
 * Oneri panelinde en fazla kac satir.
 *
 * Alti, kutunun altini kaplamadan secim yapmaya yetiyor. Daha uzun bir
 * panel altindaki durum ciplerini ve listeyi ekrandan itiyor - panel
 * bir kisayol, ekranin kendisi degil.
 */
const ONERI_ADEDI = 6

/** Karttaki avatar yigininin capi (referans gorsel). */
const BULUNAN_AVATAR_CAPI = 28

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
  /*
   * ONERI PANELI ACIK MI. Bir oneriye dokununca kapaniyor; yeni bir
   * harf yazilinca yeniden aciliyor. Bayrak olmadan panel, kullanici
   * secimini yaptiktan sonra da ekranda kalirdi.
   */
  const [oneriGizli, setOneriGizli] = useState(false)
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
  const [silOnayi, setSilOnayi] = useState(false)
  // Silme GERI ALINAMAZ: once onay satiri aciliyor.
  const [hata, setHata] = useState<string | null>(null)
  const [yenileniyor, setYenileniyor] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  // Ilk acilis bittikten sonra ekran duzeni bir daha tam ekran
  // durumlara gecmiyor; bkz. asagidaki not.
  const [ilkYuklemeBitti, setIlkYuklemeBitti] = useState(false)
  const istekSirasi = useRef(0)

  /*
   * SAYFALAMA (kullanicinin istegi 2026-09-09): "1 km mesafe
   * icerisindeki her tur listelenecek, HEPSI asagi dogru kaydirilinca
   * gorunecek."
   *
   * Onceden liste sunucudan gelen tek sayfada (100 kayit) bitiyordu.
   * Olculdu: 1 km icinde 1.764 mekan var, yani "hepsi" tek istekle
   * gelmiyor.
   *
   * `dahaVar` sunucudan TAM SAYFA geldigi surece acik kaliyor; eksik
   * bir sayfa "son sayfa" demek. Ayri bir toplam sayisi istemek
   * gereksiz ikinci bir sorgu olurdu.
   */
  const [dahaVar, setDahaVar] = useState(false)
  /*
   * KART EKLERI (referans gorsel, 2026-09-14): kapak fotografinin
   * imzali adresi, mekanda su an bulunan (gorunur) kisiler ve onlarin
   * avatarlari. Listeden AYRI ve SONRA yukleniyor - liste onlari
   * beklemiyor; okunamazlarsa kart fotografsiz/avatarsiz cizilir,
   * hata gosterilmez (bildirimlerdeki avatar deseniyle ayni).
   */
  const [kapakUrller, setKapakUrller] = useState<Record<string, string>>({})
  const [bulunanlar, setBulunanlar] = useState<Record<string, BulunanKisi[]>>({})
  const [avatarlar, setAvatarlar] = useState<Record<string, string | null>>({})
  // Yol tarifi secimi (web'de kendi penceremiz; iOS sistem sayfasi).
  const [tarifMekani, setTarifMekani] = useState<MekanYogunlukIle | null>(null)

  /**
   * HANGI KARTLARIN KUCUK HARITASI KURULACAK (2026-09-17).
   *
   * Kartin karesi artik gercek bir harita ve bu liste 100 karta kadar
   * uzayabiliyor; yuz canli harita gorunumu telefonu yorar. Bu yuzden
   * harita YALNIZCA ekrana yakin kartlarda kuruluyor, digerlerinde
   * ayni olcude igneli kutu duruyor - hiza kaymiyor, kart disaridan
   * ayni.
   *
   * Pencere kaydirma konumundan TAHMINLE hesaplaniyor, olcumle degil:
   * yanlis tahminin bedeli yalnizca bir kartin haritasinin gec
   * kurulmasi, o yuzden her karti onLayout ile olcup 100 tane olcum
   * tutmaya degmez. Tahmin iki yonde de TEMKINLI (en kisa / en yuksek
   * kart) ve iki uca da pay ekleniyor.
   */
  const [haritaPenceresi, setHaritaPenceresi] = useState({ bas: 0, son: ILK_HARITALI_KART })

  /*
   * SECILI MEKAN VE PANEL (referans 2026-09-19). `seciliId` null ise en
   * yakin mekan secili sayilir (render'da). Panel LayoutAnimation ile
   * acilip kapaniyor; tutamac yukari/asagi surukleme de ayni isi
   * yapiyor. Arama yazilinca panel KENDILIGINDEN acilir - sonuclar
   * haritanin altinda kaybolmasin.
   */
  const [seciliId, setSeciliId] = useState<string | null>(null)
  const [panelAcik, setPanelAcik] = useState(false)
  const [panelYuksekligi, setPanelYuksekligi] = useState(0)
  const [haritaAlaniYuksekligi, setHaritaAlaniYuksekligi] = useState(0)
  function paneliAyarla(acik: boolean) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setPanelAcik(acik)
  }
  const tutamacSurukleme = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
      onPanResponderRelease: (_, g) => {
        if (g.dy < -30) paneliAyarla(true)
        else if (g.dy > 30) paneliAyarla(false)
      },
    })
  ).current
  const aramaVar = arama.trim().length > 0
  useEffect(() => {
    if (aramaVar) paneliAyarla(true)
    // Arama silinince panel kapanmiyor: kullanici listeyi acik
    // birakmak istemis olabilir.
  }, [aramaVar])
  /** Ilk kartin icerik icindeki y konumu - pencere hesabinin sifiri. */
  const listeBasiY = useRef(0)

  async function kartEkleriniYukle(liste: MekanYogunlukIle[]) {
    const yollar = liste
      .map((m) => m.kapakFotograf)
      .filter((y): y is string => Boolean(y) && !(y! in kapakUrller))
    const kalabalik = liste.filter((m) => m.kisiSayisi > 0).map((m) => m.id)
    try {
      const [urller, kisiler] = await Promise.all([
        mekanFotografiUrlleri(yollar),
        mekanlardaBulunanlariGetir(kalabalik),
      ])
      if (Object.keys(urller).length > 0) setKapakUrller((eski) => ({ ...eski, ...urller }))
      setBulunanlar((eski) => ({ ...eski, ...kisiler }))
      const kimlikler = Array.from(
        new Set(Object.values(kisiler).flat().map((k) => k.kullaniciId))
      ).filter((id) => !(id in avatarlar))
      if (kimlikler.length > 0) {
        const yeni = await avatarlariGetir(kimlikler)
        setAvatarlar((eski) => ({ ...eski, ...yeni }))
      }
    } catch {
      // Ekler okunamazsa kart eksiksiz calismaya devam ediyor.
    }
  }

  /**
   * YOL TARIFI - mekan sayfasindaki dugmeyle ayni akis: kurulu
   * haritalar sorulur; tek secenek varsa dogrudan acilir, iOS'ta
   * sistem ActionSheet'i, web'de kendi secim penceremiz.
   */
  function haritayiAc(secim: HaritaSecimi, mekan: MekanYogunlukIle) {
    setTarifMekani(null)
    Linking.openURL(haritaAdresi(secim, mekan, 'tarif'))
  }

  async function yolTarifiAc(mekan: MekanYogunlukIle) {
    const secenekler = await kuruluHaritalar()
    if (secenekler.length <= 1) {
      haritayiAc(secenekler[0] ?? 'google', mekan)
      return
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...secenekler.map(secenekEtiketi), t('checkInHaritasi.vazgec')],
          cancelButtonIndex: secenekler.length,
        },
        (secilen) => {
          if (secilen < secenekler.length) haritayiAc(secenekler[secilen], mekan)
        }
      )
      return
    }
    setTarifMekani(mekan)
  }

  function secenekEtiketi(secim: HaritaSecimi): string {
    return secim === 'apple'
      ? t('checkInHaritasi.appleHaritalar')
      : t('checkInHaritasi.googleHaritalar')
  }

  const [sonrakiYukleniyor, setSonrakiYukleniyor] = useState(false)

  /**
   * `aktifSekme` PARAMETRE, cunku `sekmeSec` hemen ardindan yukluyor ve
   * o an `sekme` state'i henuz eski degerinde olur.
   */
  /**
   * ASAGI CEKINCE YENILEME (kullanicinin istegi 2026-09-08: "sayfayi
   * asagi dogru cekince sayfayi yenileme ekle bir aksilik oldugunda
   * sayfayi yenileyip duzelebilsin").
   *
   * Ekran zaten odaklandiginda yeniliyor, ama ekrandan CIKMADAN takilan
   * bir istegi (zaman asimi, ag kopmasi) kurtarmanin yolu yoktu.
   */
  async function yenile() {
    setYenileniyor(true)
    try {
      await yukle()
    } finally {
      setYenileniyor(false)
    }
  }

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
        // YARICAP YALNIZCA ARAMADA KALKIYOR.
        //
        // 2026-09-06'daki "filtrelemede km siniri yok, il bazli
        // sonuclar" kurali GERI ALINDI (kullanicinin istegi
        // 2026-09-09): "yakinindaki mekanlar kisminda kullanicinin
        // bulundugu konumdan 1 km mesafe icerisindeki yerler sadece
        // listelenecek, haritada da ayni sekilde listedeki yerler
        // gorunecek." Tur suzgeci artik listeyi DARALTIYOR, sehre
        // yaymiyor - "Yakinindaki Mekanlar" baslıgi bunu zaten
        // soyluyordu.
        //
        // Performans bedeli DEGIL kazanci var, olculdu: tur suzgeci +
        // 1 km yaricap 27 ms (sicak) / 2,5 sn (soguk); il bazli
        // sinirsiz sorgu 946 ms idi.
        //
        // ARAMA baska bir sey: orada sinir yok ve kalmali - kullanici
        // baska sehirdeki mekani arayabiliyor (2026-09-01 karari).
        aramaVarMi ? null : KESFET_YARICAP_METRE,
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
      void kartEkleriniYukle(sonuc)
      // ARAMADA SAYFALAMA YOK: orada limit hic gonderilmiyor, sunucu
      // kendi tavaniyla (200) donuyor ve ikinci sayfa istemek anlamsiz.
      setDahaVar(!aramaVarMi && sonuc.length === KESFET_LIMIT)
    } catch (e) {
      if (sira !== istekSirasi.current) return
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      if (sira === istekSirasi.current) {
        setYukleniyor(false)
        setIlkYuklemeBitti(true)
      }
    }
  }

  /**
   * SONRAKI SAYFA - dibe yaklasilinca cagriliyor.
   *
   * ONEMLI: yaris korumasindaki sira numarasi BURADA DA okunuyor.
   * Kullanici kaydirirken arama yazar ya da suzgec degistirirse
   * `yukle` yeni bir sira acar; bu istek donduegunde eski listenin
   * devami olarak eklenirse ekranda iki ayri sorgunun sonucu birbirine
   * karisir.
   */
  async function sonrakiSayfa() {
    if (sonrakiYukleniyor || !dahaVar || yukleniyor) return
    const konum = cihazKonumu
    // Konum okunamadiysa ilk sayfa da gelmemistir; yeniden konum
    // istemek yerine sessiz kalmak dogru.
    if (!konum) return
    const sira = istekSirasi.current
    const ofset = mekanlar.length
    setSonrakiYukleniyor(true)
    try {
      const sonuc = await yakinMekanlariYogunlukIleGetir(
        konum.lat,
        konum.lng,
        KESFET_YARICAP_METRE,
        undefined,
        seciliTurler.length > 0 ? seciliTurler : null,
        KESFET_LIMIT,
        ofset
      )
      if (sira !== istekSirasi.current) return
      setMekanlar((mevcut) => [...mevcut, ...sonuc])
      void kartEkleriniYukle(sonuc)
      setDahaVar(sonuc.length === KESFET_LIMIT)
    } catch {
      // Sayfalama hatasi listeyi bozmuyor: eldeki kayitlar duruyor,
      // yalnizca devami gelmiyor. Ust seride hata basmak, calisan bir
      // listenin uzerine gereksiz bir uyari koyardi.
      setDahaVar(false)
    } finally {
      if (sira === istekSirasi.current) setSonrakiYukleniyor(false)
    }
  }

  /**
   * "Sona geldim" olayi ScrollView'de hazir gelmiyor; dibe BIR EKRAN
   * BOYU kala tetikleniyor ki kullanici beklemeden okumaya devam
   * etsin. Ayni desen profil ekraninda da var.
   */
  function dibeYaklasinca(olay: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = olay.nativeEvent
    haritaPenceresiniGuncelle(contentOffset.y, layoutMeasurement.height)
    const dibeUzaklik = contentSize.height - (contentOffset.y + layoutMeasurement.height)
    if (dibeUzaklik > layoutMeasurement.height) return
    void sonrakiSayfa()
  }

  /** Ekranda gorunen kart araligini kaydirma konumundan tahmin eder. */
  function haritaPenceresiniGuncelle(kaydirma: number, ekranYuksekligi: number) {
    const ust = kaydirma - listeBasiY.current
    const bas = Math.floor(ust / KART_EN_YUKSEK) - HARITA_PENCERE_PAYI
    const son = Math.ceil((ust + ekranYuksekligi) / KART_EN_KISA) + HARITA_PENCERE_PAYI
    setHaritaPenceresi((onceki) =>
      onceki.bas === bas && onceki.son === son ? onceki : { bas, son }
    )
  }

  /*
   * ILK YUKLEME: once CIHAZDA KAYITLI tur suzgeci okunuyor, liste
   * ondan sonra cekiliyor.
   *
   * Kullanicinin istegi (2026-09-09): "check-in sayfasinda yaptigim
   * filtreyi kaydet yapinca kayitli kalsin, baska sayfada gezsem de
   * uygulamadan ciksam da kayitli dursun" ve "filtreyi kaldir dersem
   * ancak kaldirilsin". Onceden secim yalnizca ekranin state'indeydi;
   * baska bir sekmeye gecip donmek bile sifirliyordu.
   *
   * Liste TEK KEZ cekiliyor: once bos suzgecle cekip sonra kayitliyla
   * tekrar cekmek hem iki istek hem de goz onunde bir zipzip olurdu.
   */
  useEffect(() => {
    let gecerli = true
    turSuzgeciniOku().then((kayitli) => {
      if (!gecerli) return
      if (kayitli.length > 0) setSeciliTurler(kayitli)
      yukle(arama, kayitli)
    })
    return () => {
      gecerli = false
    }
    // Ilk yukleme; sonrakiler kullanici etkilesimiyle tetikleniyor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
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
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
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
   * Tur secimi uygulaniyor (secicideki "Kaydet").
   *
   * ARAMA METNI SILINIYOR: tur suzgeci yalnizca arama bosken
   * calisiyor, yani metin dururken secim gorunur bir sey yapmazdi ve
   * kullanici sebebini goremezdi.
   */
  async function turleriUygula(yeni: string[]) {
    setSeciliTurler(yeni)
    setTurSeciciAcik(false)
    setArama('')
    // CIHAZA YAZILIYOR: secim ekran kapaninca ve uygulamadan cikinca
    // da duruyor. Bos liste anahtari siliyor - "Filtreyi kaldır" ve
    // ciplerdeki carpi da buradan geciyor, yani suzgec YALNIZCA
    // kullanici kaldirdiginda kalkiyor.
    //
    // YAZMA BEKLENIYOR (fire-and-forget DEGIL): yarim kalan bir yazma
    // bir sonraki acilista eski secimi geri getirebilir. Ekran
    // beklemiyor - state zaten guncellendi, liste asagida cekiliyor.
    await turSuzgeciniYaz(yeni)
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
    // Yazmaya devam etmek oneri panelini yeniden aciyor.
    setOneriGizli(false)
  }

  /** Oneriden secim: mekan sayfasi acilir, panel ve klavye kapanir. */
  function oneriyeGit(mekanId: string) {
    setOneriGizli(true)
    Keyboard.dismiss()
    router.push(`/harita/${mekanId}` as never)
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
   * ARAMA ONERILERI - kutunun hemen altinda acilan kisa liste.
   *
   * Kullanicinin istegi (2026-09-10): "mekan arada kelimeler yazmaya
   * baslar baslamaz, mekan ara sutunun hemen altinda yazmaya
   * calistigim kelimenin benzerlerini bana oneren bir sey ciksin."
   *
   * AYRI BIR ISTEK ATILMIYOR: oneriler ZATEN gelmis arama sonucunun
   * ilk birkacindan turetiliyor. Ikinci bir RPC her tusta iki ag
   * istegi demekti ve ayni veriyi iki kez cekerdi. Sonuc yakinlik
   * sirasinda geldigi icin oneriler de en yakindan basliyor.
   *
   * PANELIN ISI LISTEDEN FARKLI: liste bir CHECK-IN yuzeyi (kart,
   * rozet, buton), panel ise bir GEZINME kisayolu - tek satir, dokunun
   * ve mekan sayfasi acilsin. Bu yuzden ayni kayitlari gostermeleri
   * tekrar degil.
   */
  const oneriler =
    arama.trim().length > 0 && !oneriGizli ? suzulmus.slice(0, ONERI_ADEDI) : []

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
  /**
   * DURUM SUZGECI (Tumu / Sakin / Yogun / Populer) HEM LISTEYE HEM
   * HARITAYA uygulaniyor.
   *
   * Once yalnizca listeye uygulaniyordu ve harita suzuelmemis listeyi
   * aliyordu; kullanicinin bildirdigi sey buydu (2026-09-07): "Yogun"
   * secilikken haritada yesil (sakin) igneler duruyordu, yani ekranin
   * iki yarisi farkli seyler soyluyordu.
   *
   * Secili olcuete uyan mekan yoksa harita BOS kaliyor - kullanicinin
   * istegi: "secilen kriter yoksa hic birsey gorunmesin". Kullanicinin
   * kendi ignesi kaliyor; o bir mekan degil, nerede oldugunu soyleyen
   * isaret.
   */
  const durumaUyan = (m: MekanYogunlukIle) => durum === 'tumu' || mekanDurumu(m) === durum

  const sakinler = liste.filter(durumaUyan)

  /**
   * HARITA LISTEYLE AYNI MEKANLARI GOSTERIYOR - 500 m.
   *
   * 2026-09-09'da haritaya AYRI bir 500 m siniri konmus ve ertesi gun
   * geri alinmisti ("sakin yerlerde cok bos kaliyor"): o zaman LISTE
   * 1 km'ydi, yani liste 430/520/560 m'lik yerler gosterirken haritada
   * tek igne kaliyordu ve ekranin iki yarisi birbirini tutmuyordu.
   *
   * 2026-09-10'da kullanici IKISINI BIRDEN 500 m'ye cekti ("yakindaki
   * mekanlar da 500 m mesafedeki yerler gosterilsin, haritada da 500 m
   * mesafe gosterilsin"). Tutarsizlik artik bastan olusmuyor - tek
   * sayi var ve harita listenin aynisini ciziyor.
   *
   * Cakisma sorunu ayri bir yoldan hafifledi: etiketler ayni gun beyaz
   * ve golgeli yapildi, yani ust uste binseler bile okunuyorlar.
   *
   * Harita KART MEKANINI da gosteriyor (`liste` ondan arindirilmis,
   * kart onu ayrica ciziyor); o mekanin ignesi haritada durmali.
   */
  const haritaMekanlari = suzulmus.filter(durumaUyan)
  const toplamKisi = canlilar.reduce((t, m) => t + m.kisiSayisi, 0)

  // Ad'in altindaki satir. TUR YALNIZCA kullanicinin ekledigi
  // mekanlarda gorunuyor (karar 2026-08-24): dis kaynagin tur verisi
  // guvenilmez oldugu icin yanlis tur gostermektense hic gostermemek
  // tercih edildi. Dis kaynakli kayitlarda semt ve uzaklik kaliyor.
  function altSatir(m: MekanYogunlukIle): string {
    const parcalar = turuGosterilir(m) ? [turEtiketi(m.tur)] : []
    // UZAKLIK ONCE (referans 2026-09-19: "50 m · Nilufer, Bursa").
    parcalar.unshift(uzaklik(m))
    parcalar.push(konumYazisi(m))
    return parcalar.filter(Boolean).join(' · ')
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
        <Text style={stiller.durumYazi}>{t('kesfet.taraniyor')}</Text>
      </View>
    )
  }

  // Bos ya da hatali durum bir yon vermeli, yalnizca hata metni degil.
  // Arama YAPILIYORKEN tam ekrana gecilmiyor - ayni klavye sorunu.
  if (hata && mekanlar.length === 0 && !arama.trim()) {
    return (
      <View style={stiller.ortala}>
        <Text style={stiller.hataBaslik}>{t('kesfet.cevreGorunmuyor')}</Text>
        <Text style={stiller.hataAciklama}>
          {hata === 'Konum izni verilmedi' ? t('kesfet.konumIzniAciklama') : hata}
        </Text>
        <Pressable style={stiller.birincilButon} onPress={() => yukle()}>
          <Text style={stiller.birincilButonYazi}>{t('ortak.tekrarDene')}</Text>
        </Pressable>
      </View>
    )
  }

  /*
   * HARITA ANA TUVAL + CEKILEN PANEL (kullanicinin referans tasarimi
   * 2026-09-19: "en onemli degisiklik haritayi okunur hale getirmek").
   *
   *   - Harita ust bloktan (arama + cipler) alt gezinmeye kadar
   *     DOLDURUYOR; kumeler ve secili igne `CanliHarita` icinde.
   *   - SECILI MEKAN: igneye dokununca; haritada yalnizca onun adi,
   *     bilgileri alttaki panelde. Secim yoksa en yakin mekan.
   *   - PANEL: kapaliyken secili mekanin satiri + iki eylem + "Diger
   *     mekanlari goster"; tutamaci yukari cekince (ya da o satira
   *     basinca) acilir ve butun listeyi gosterir. Panelde bir satira
   *     dokunmak onu SECER ve paneli kapatir.
   *   - Harita / Liste gecisi DURUYOR: Liste'de harita yok, ayni
   *     satirlar tam ekran.
   *   - "Mesafeye gore" bir ETIKET (sabit kural: siralama her zaman en
   *     yakindan, 2026-09-01); referanstaki ok BILEREK cizilmiyor - tek
   *     secenekli bir menu olu dugme olurdu.
   */
  const seciliMekan =
    sakinler.find((m) => m.id === seciliId) ?? sakinler[0] ?? null

  function mekaniSec(id: string) {
    setSeciliId(id)
    paneliAyarla(false)
  }

  const rozetCiz = (item: MekanYogunlukIle) => {
    const d = mekanDurumu(item)
    return (
      <View style={[stiller.rozet, { backgroundColor: DURUM_ZEMINI[d] }]}>
        <View style={[stiller.rozetNokta, { backgroundColor: DURUM_RENGI[d] }]} />
        <Text style={[stiller.rozetYazi, { color: DURUM_RENGI[d] }]}>{t(`kesfet.${d}`)}</Text>
      </View>
    )
  }

  /** Secili satirin altindaki iki eylem: Yol tarifi (cerceveli) + Check-in yap (dolu). */
  const eylemlerCiz = (item: MekanYogunlukIle) => (
    <View style={stiller.kartEylemler}>
      <Pressable
        style={({ pressed }) => [stiller.yolTarifi, pressed && stiller.yolTarifiBasili]}
        onPress={() => yolTarifiAc(item)}
        accessibilityRole="button"
        testID={`yol-tarifi-${item.id}`}
      >
        <ArabaIkonu renk={renk.turuncu} />
        <Text style={stiller.yolTarifiYazi}>{t('kesfet.yolTarifi')}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [stiller.kartCheckIn, pressed && stiller.kartCheckInBasili]}
        onPress={() => router.push(`/check-in/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={t('kesfet.checkInEtiketi', { ad: item.ad })}
        testID={`satir-checkin-${item.id}`}
      >
        <IgneIkonu boyut={18} renk="#FFFFFF" />
        <Text style={stiller.kartCheckInYazi} numberOfLines={1}>
          {t('checkIn.gonder')}
        </Text>
      </Pressable>
    </View>
  )

  /**
   * KOMPAKT SATIR (referans): seftali kutuda bina simgesi, ad (2 satir),
   * "50 m · Nilufer, Bursa", durum rozeti; varsa kisi satiri. Simge
   * TURDEN BAGIMSIZ - dis kaynakli mekanda tur gosterilmiyor
   * (2026-08-24), simgeyi ture baglamak o kurali dolanirdi.
   * Ad ve simge MEKAN SAYFASINI acar (2026-08-31 kurali); satirin geri
   * kalani mekani SECER.
   */
  const satirCiz = (item: MekanYogunlukIle, secili: boolean, secilebilir: boolean) => {
    const kisiler = bulunanlar[item.id] ?? []
    const kapak = item.kapakFotograf ? kapakUrller[item.kapakFotograf] : undefined
    return (
      <View
        key={item.id}
        style={[stiller.mekanSatiri, secili && stiller.mekanSatiriSecili]}
        testID={`mekan-karti-${item.id}`}
      >
        <View style={stiller.satirUst}>
          <Pressable
            style={stiller.satirSimge}
            onPress={() => router.push(`/harita/${item.id}` as never)}
            accessibilityRole="button"
            accessibilityLabel={t('kesfet.konumuGorEtiketi', { ad: item.ad })}
          >
            {kapak ? (
              <Image source={{ uri: kapak }} style={stiller.satirKapak} contentFit="cover" transition={120} testID={`kapak-${item.id}`} />
            ) : (
              <View testID={`simge-${item.id}`}>
                <BinaIkonu renk={renk.turuncu} />
              </View>
            )}
          </Pressable>
          <Pressable
            style={stiller.satirGovde}
            onPress={secilebilir ? () => mekaniSec(item.id) : undefined}
            accessibilityRole={secilebilir ? 'button' : undefined}
            accessibilityState={secilebilir ? { selected: secili } : undefined}
            testID={`mekan-sec-${item.id}`}
          >
            <Pressable
              onPress={() => router.push(`/harita/${item.id}` as never)}
              accessibilityRole="button"
              accessibilityLabel={t('kesfet.konumuGorEtiketi', { ad: item.ad })}
              hitSlop={4}
            >
              <Text style={stiller.satirAd} numberOfLines={2}>
                {item.ad}
              </Text>
            </Pressable>
            <View style={stiller.satirAltSatir}>
              <Text style={stiller.satirAlt} numberOfLines={1}>
                {altSatir(item)}
              </Text>
              {rozetCiz(item)}
            </View>
            {item.kisiSayisi > 0 && (
              <View style={stiller.kisiAlani}>
                {kisiler.length > 0 && (
                  <View style={stiller.avatarYigini} testID={`bulunanlar-${item.id}`}>
                    {kisiler.map((k, i) => (
                      <View key={k.kullaniciId} style={[stiller.avatarHalka, i > 0 && stiller.avatarBindirme]}>
                        <Avatar
                          fotografUrl={avatarlar[k.kullaniciId] ?? null}
                          ad={k.kullaniciAdi}
                          kullaniciAdi=""
                          cap={BULUNAN_AVATAR_CAPI}
                          testID={`bulunan-${item.id}-${k.kullaniciId}`}
                        />
                      </View>
                    ))}
                  </View>
                )}
                <Text style={stiller.kartKisiYazi} numberOfLines={1}>
                  {t('kesfet.kisiBurada', { sayi: item.kisiSayisi })}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
        {secili && eylemlerCiz(item)}
      </View>
    )
  }

  /** Aktif check-in karti: nerede oldugun + Ayril / Sil. */
  const buradaKarti = kartMekani && (
    <View style={stiller.buradaKart} testID="burada-karti">
      <View style={stiller.buradaUst}>
        <Pressable
          style={stiller.buradaMetin}
          onPress={() => router.push(`/harita/${kartMekani.id}` as never)}
          accessibilityRole="button"
          accessibilityLabel={t('kesfet.konumuAc', { ad: kartMekani.ad })}
        >
          <Text style={stiller.buradaAd} numberOfLines={1}>
            {kartMekani.ad}
          </Text>
          {kartMekani.listedeki && (
            <Text style={stiller.buradaAlt} numberOfLines={1}>
              {[konumYazisi(kartMekani.listedeki), uzaklik(kartMekani.listedeki)].filter(Boolean).join(' · ')}
            </Text>
          )}
        </Pressable>
        {(kartMekani.listedeki?.kisiSayisi ?? 0) > 0 && (
          <View style={stiller.buradaSayiAlani}>
            <Text style={stiller.buradaSayi}>{kartMekani.listedeki?.kisiSayisi}</Text>
            <Text style={stiller.buradaSayiEtiket}>{t('kesfet.kisiBuradaEtiket')}</Text>
          </View>
        )}
      </View>
      {kartCanli ? (
        <>
          <View style={stiller.canliSerit}>
            <View style={stiller.buradaNokta} />
            <Text style={stiller.canliYazi}>{t('kesfet.suAnBuradasin')}</Text>
            <View style={stiller.canliEylemler}>
              <Pressable onPress={ayril} accessibilityRole="button" hitSlop={10}>
                <Text style={stiller.ayrilYazi}>{t('kesfet.ayrildim')}</Text>
              </Pressable>
              <Pressable onPress={() => setSilOnayi(true)} accessibilityRole="button" hitSlop={10}>
                <Text style={stiller.silYazi}>{t('ortak.sil')}</Text>
              </Pressable>
            </View>
          </View>
          <OnayPenceresi
            acikMi={silOnayi}
            baslik={t('anaSayfa.silOnay')}
            aciklama={t('anaSayfa.silAciklama')}
            eylemEtiketi={t('ortak.sil')}
            onOnay={canliyiSil}
            onVazgec={() => setSilOnayi(false)}
          />
        </>
      ) : (
        <Pressable
          style={stiller.checkInButonu}
          onPress={() => router.push(`/check-in/${kartMekani.id}`)}
          accessibilityRole="button"
        >
          <Text style={stiller.checkInYazi}>{t('checkIn.gonder')}</Text>
        </Pressable>
      )}
    </View>
  )

  /** Arama kutusu + tur suzgeci + oneriler + secili tur cipleri + durum cipleri. */
  // BOS ALANA DOKUNMAK KLAVYEYI KAPATIR (kullanicinin bildirimi
  // 2026-09-19: "mekan araya bastiktan sonra klavye aciliyor, bosluga
  // basinca kapansin"). Ust blok, panel ve haritanin kendisi
  // (`onBosaDokun`) dismiss cagiriyor; icteki dugmeler kendi dokunusunu
  // yakaladigi icin etkilenmiyor. `accessible={false}` sart - ekran
  // okuyucu blogu tek dugme sanmasin (KlavyeKapatan kurali).
  const ustBlok = (
    <Pressable style={stiller.ustBlok} onPress={Keyboard.dismiss} accessible={false}>
      {hata && <Text style={stiller.hataSeridi}>{hata}</Text>}
      <View style={stiller.aramaSatiri}>
        <View style={stiller.aramaKutusu}>
          <BuyutecIkonu renk={renk.turuncu} />
          <TextInput
            style={stiller.arama}
            placeholder={t('kesfet.mekanAra')}
            placeholderTextColor={renk.metinIkincil}
            value={arama}
            onChangeText={aramaDegisti}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => setOneriGizli(true)}
            testID="mekan-arama-kutusu"
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
          {seciliTurler.length > 0 && (
            <View style={stiller.suzgecRozeti}>
              <Text style={stiller.suzgecRozetYazi}>{seciliTurler.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ARAMA ONERILERI - kutunun hemen altinda, akis icinde. */}
      {oneriler.length > 0 && (
        <View style={stiller.oneriPaneli} testID="arama-onerileri">
          {oneriler.map((m, sira) => (
            <Pressable
              key={m.id}
              style={({ pressed }) => [
                stiller.oneriSatiri,
                sira > 0 && stiller.oneriAyirici,
                pressed && stiller.oneriBasili,
              ]}
              onPress={() => oneriyeGit(m.id)}
              accessibilityRole="button"
              accessibilityLabel={t('kesfet.konumuGorEtiketi', { ad: m.ad })}
              testID={`arama-onerisi-${m.id}`}
            >
              <BuyutecIkonu renk={renk.metinSoluk} />
              <View style={stiller.oneriGovde}>
                <Text style={stiller.oneriAd} numberOfLines={1}>
                  {m.ad}
                </Text>
                {konumYazisi(m) ? (
                  <Text style={stiller.oneriKonum} numberOfLines={1}>
                    {konumYazisi(m)}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* SECILI TURLER gorunur duruyor - listenin neden kisa oldugu okunsun. */}
      {seciliTurler.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={stiller.seciliSerit}>
          {seciliTurler.map((tur) => (
            <Pressable
              key={tur}
              style={stiller.seciliCip}
              onPress={() => turleriUygula(seciliTurler.filter((x) => x !== tur))}
              accessibilityRole="button"
              accessibilityLabel={t('kesfet.filtreyiKaldirEtiketi', { tur: turEtiketi(tur) })}
              testID={`secili-tur-${tur}`}
            >
              <Text style={stiller.seciliCipYazi}>{turEtiketi(tur)}</Text>
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

      {/* KOMPAKT DURUM CIPLERI (referans): tek satir hap; Tumu dolu
          turuncu, Sakin yesil nokta, Yogun kirmizi nokta, Populer
          yildiz. Suzuyorlar, SIRALAMIYORLAR. */}
      <View style={stiller.cipSeridi}>
        {([
          { anahtar: 'tumu', etiket: t('kesfet.tumu'), ikon: null },
          { anahtar: 'sakin', etiket: t('kesfet.sakin'), ikon: <View style={[stiller.cipNokta, { backgroundColor: DURUM_RENGI.sakin }]} /> },
          { anahtar: 'yogun', etiket: t('kesfet.yogun'), ikon: <View style={[stiller.cipNokta, { backgroundColor: DURUM_RENGI.yogun }]} /> },
          { anahtar: 'populer', etiket: t('kesfet.populer'), ikon: <YildizIkonu boyut={14} renk={DURUM_RENGI.populer} /> },
        ] as const).map((c) => {
          const secili = durum === c.anahtar
          return (
            <Pressable
              key={c.anahtar}
              style={[stiller.cip, secili && stiller.cipSecili]}
              onPress={() => setDurum(c.anahtar)}
              accessibilityRole="button"
              accessibilityState={{ selected: secili }}
              testID={`cip-${c.anahtar}`}
            >
              {c.ikon}
              <Text style={[stiller.cipYazi, secili && stiller.cipYaziSecili]}>{c.etiket}</Text>
            </Pressable>
          )
        })}
      </View>

      {/* Arama durumu ince serit: duzen degismiyor, klavye acik kaliyor. */}
      {arama.trim().length > 0 && (
        <View style={stiller.aramaDurumu}>
          {yukleniyor ? (
            <>
              <ActivityIndicator size="small" color={renk.turuncu} />
              <Text style={stiller.aramaDurumYazi}>{t('kesfet.araniyor')}</Text>
            </>
          ) : suzulmus.length === 0 ? (
            <Text style={stiller.aramaDurumYazi}>{t('kesfet.aramaBulunamadi', { arama: arama.trim() })}</Text>
          ) : (
            <Text style={stiller.aramaDurumYazi}>{t('kesfet.sonucSayisi', { sayi: suzulmus.length })}</Text>
          )}
        </View>
      )}
    </Pressable>
  )

  const bolumBasligi = (
    <View style={stiller.bolumSatiri}>
      <Text style={stiller.bolumBasligi}>
        {arama.trim().length === 0 ? t('kesfet.yakinindakiMekanlar') : t('kesfet.sonuclar')}
      </Text>
      {arama.trim().length === 0 && (
        <Text style={stiller.siralamaEtiketi} testID="siralama-etiketi">
          {t('kesfet.mesafeyeGore')}
        </Text>
      )}
    </View>
  )

  const bosDurum = (
    <Text style={stiller.bosDurum}>
      {arama.trim()
        ? t('kesfet.bosArama', { arama: arama.trim() })
        : seciliTurler.length > 0
          ? t('kesfet.bosFiltre')
          : t('kesfet.bosCevre')}
    </Text>
  )

  /** Tam liste (panel acikken ve Liste gorunumunde): secili en ustte, eylemleriyle. */
  const tamListe = (
    <>
      {sakinler.length === 0
        ? bosDurum
        : sakinler.map((item) => satirCiz(item, item.id === seciliMekan?.id, true))}
      {sonrakiYukleniyor && (
        <View style={stiller.sayfaGostergesi}>
          <ActivityIndicator size="small" color={renk.turuncu} />
        </View>
      )}
      <Pressable style={stiller.ekleButonu} onPress={() => router.push('/mekanlar/ekle')}>
        <Text style={stiller.ekleButonuYazi}>{t('kesfet.mekanEkle')}</Text>
      </Pressable>
      {/* ATIF - guncel tutulmasi ZORUNLU (OSM ODbL). */}
      <Text style={stiller.atif}>{t('kesfet.atif')}</Text>
    </>
  )

  const ustCubuk = (
    <View style={stiller.ustCubuk}>
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
  )

  const pencereler = (
    <>
      <SecimPenceresi
        acikMi={tarifMekani !== null}
        secimler={haritaSecenekleri().map((secim) => ({
          etiket: secenekEtiketi(secim),
          testID: `harita-secimi-${secim}`,
          onSec: () => tarifMekani && haritayiAc(secim, tarifMekani),
        }))}
        onKapat={() => setTarifMekani(null)}
      />
      <TurSecici
        acikMi={turSeciciAcik}
        gruplar={TEMEL_TUR_GRUPLARI}
        adetler={yakinTurler}
        yukleniyor={turlerYukleniyor}
        secili={seciliTurler}
        onKapat={() => setTurSeciciAcik(false)}
        onKaydet={turleriUygula}
      />
    </>
  )

  if (gorunum === 'liste') {
    return (
      <View style={stiller.kok}>
        {ustCubuk}
        <ScrollView
          style={stiller.sayfa}
          contentContainerStyle={stiller.icerik}
          testID="kesfet-kaydirma"
          onScroll={dibeYaklasinca}
          scrollEventThrottle={160}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={renk.turuncu} />}
        >
          {ustBlok}
          {buradaKarti}
          {bolumBasligi}
          {tamListe}
        </ScrollView>
        {pencereler}
      </View>
    )
  }

  return (
    <View style={stiller.kok}>
      {ustCubuk}
      {ustBlok}
      <View
        style={stiller.haritaAlani}
        onLayout={(o) => setHaritaAlaniYuksekligi(o.nativeEvent.layout.height)}
        testID="kesfet-harita-cercevesi"
      >
        <CanliHarita
          merkez={cihazKonumu}
          mekanlar={haritaMekanlari}
          seciliId={seciliMekan?.id ?? null}
          onMekanSec={mekaniSec}
          doldur
          konumDugmesi
          konumDugmesiAltPayi={panelYuksekligi + 12}
          altPay={panelYuksekligi}
          onBosaDokun={Keyboard.dismiss}
        />

        {/* PANEL: kapaliyken dogal yuksekligi, acikken harita alaninin
            neredeyse tamami. LayoutAnimation gecisi yumusatiyor. */}
        <Pressable
          style={[
            stiller.panel,
            panelAcik && haritaAlaniYuksekligi > 0 && { height: haritaAlaniYuksekligi - PANEL_UST_BOSLUK },
          ]}
          onLayout={(o) => {
            if (!panelAcik) setPanelYuksekligi(o.nativeEvent.layout.height)
          }}
          onPress={Keyboard.dismiss}
          accessible={false}
          testID="mekan-paneli"
        >
          <View style={stiller.tutamacAlani} {...tutamacSurukleme.panHandlers}>
            <Pressable
              onPress={() => paneliAyarla(!panelAcik)}
              accessibilityRole="button"
              accessibilityLabel={panelAcik ? t('kesfet.paneliKapat') : t('kesfet.digerMekanlar')}
              hitSlop={12}
              testID="panel-tutamaci"
            >
              <View style={stiller.tutamac} />
            </Pressable>
          </View>
          {bolumBasligi}

          {panelAcik ? (
            <ScrollView
              style={stiller.panelListe}
              contentContainerStyle={stiller.panelIcerik}
              onScroll={dibeYaklasinca}
              scrollEventThrottle={160}
              keyboardShouldPersistTaps="handled"
              refreshControl={<RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={renk.turuncu} />}
              testID="kesfet-kaydirma"
            >
              {buradaKarti}
              {tamListe}
            </ScrollView>
          ) : (
            <View style={stiller.panelKapaliIcerik}>
              {buradaKarti}
              {seciliMekan ? satirCiz(seciliMekan, true, false) : bosDurum}
              {sakinler.length > 1 && (
                <Pressable
                  style={stiller.digerDugmesi}
                  onPress={() => paneliAyarla(true)}
                  accessibilityRole="button"
                  testID="diger-mekanlar"
                >
                  <YukariOkIkonu renk={renk.metin} />
                  <Text style={stiller.digerYazi}>{t('kesfet.digerMekanlar')}</Text>
                </Pressable>
              )}
            </View>
          )}
        </Pressable>
      </View>
      {pencereler}
    </View>
  )
}

/** Bina simgesi (referans): kompakt satirin seftali kutusunda, ture bagli DEGIL. */
function BinaIkonu({ renk: c }: { renk: string }) {
  return (
    <Svg width={30} height={30} viewBox="0 0 24 24">
      <Path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5V21" stroke={c} strokeWidth={1.8} fill="none" strokeLinejoin="round" />
      <Path d="M14 10h4.5A1.5 1.5 0 0 1 20 11.5V21" stroke={c} strokeWidth={1.8} fill="none" strokeLinejoin="round" />
      <Path d="M2.5 21h19" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M7 8h1.5M10 8h1.5M7 11.5h1.5M10 11.5h1.5M7 15h1.5M10 15h1.5M16.5 14h1.2M16.5 17.5h1.2" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M8.2 21v-3h2.6v3" stroke={c} strokeWidth={1.8} fill="none" strokeLinejoin="round" />
    </Svg>
  )
}

/** Araba (Yol tarifi dugmesi, referans). */
function ArabaIkonu({ renk: c }: { renk: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M5 13l1.6-4.4A2 2 0 0 1 8.5 7.3h7a2 2 0 0 1 1.9 1.3L19 13" stroke={c} strokeWidth={1.8} fill="none" strokeLinejoin="round" />
      <Path d="M4 13h16a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V14a1 1 0 0 1 1-1z" stroke={c} strokeWidth={1.8} fill="none" strokeLinejoin="round" />
      <Circle cx={7.5} cy={15.8} r={1.1} fill={c} />
      <Circle cx={16.5} cy={15.8} r={1.1} fill={c} />
    </Svg>
  )
}

/** "Diger mekanlari goster" satirindaki yukari ok. */
function YukariOkIkonu({ renk: c }: { renk: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M6 14.5l6-6 6 6" stroke={c} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

/** Panel acikken haritadan gorunur kalan serit. */
const PANEL_UST_BOSLUK = 24

const KART_GENISLIK = 256
/** Karttaki kare kapak fotografinin kenari (referans gorsel). */
const KAPAK_OLCUSU = 96

/*
 * KART YUKSEKLIGI TAHMINLERI - yalnizca "hangi kartin kucuk haritasi
 * kurulsun" hesabi icin. Kart: 12 pay + 96 kare + 12 aralik + ~44
 * eylem satiri + 12 pay + 12 kartlar arasi bosluk ~ 190 px; adi iki
 * satira kirilan kartta ~215 px.
 *
 * Alt sinir KISA, ust sinir YUKSEK tutuluyor: boylece pencere iki
 * yonde de gercekten gorunen kartlari kapsiyor, hata yalnizca
 * "gereginden fazla harita" yonunde oluyor.
 */
const KART_EN_KISA = 170
const KART_EN_YUKSEK = 240
/** Pencerenin iki ucuna eklenen kart payi. */
const HARITA_PENCERE_PAYI = 4
/** Ilk cizimde harita kurulan kart sayisi (bir ekran + pay). */
const ILK_HARITALI_KART = 9
const KART_YUKSEKLIK = 316

const stilleriYap = (renk: Renk) => StyleSheet.create({
  // Ikon satirin SOL BASINDA (kullanicinin istegi 2026-08-26);
  // pay da ona gore sagda.

  canliSerit: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  // `marginLeft: 'auto'` eylemleri seridin sagina itiyor; sabit bir
  // genislik verilseydi uzun bir durum metni onlari tasardi.
  canliEylemler: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m, marginLeft: 'auto' },
  ayrilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  silYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: renk.yikici },
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

  // --- HARITA ANA TUVAL + PANEL (referans 2026-09-19) ---
  ustBlok: { paddingHorizontal: bosluk.sayfa, gap: bosluk.s, paddingBottom: bosluk.s },
  haritaAlani: { flex: 1, overflow: 'hidden' },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: renk.zemin,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: bosluk.sayfa,
    paddingBottom: ALT_GEZINME_PAYI,
    ...golge.kart,
    shadowOffset: { width: 0, height: -2 },
  },
  tutamacAlani: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  tutamac: { width: 44, height: 5, borderRadius: 3, backgroundColor: renk.cizgi },
  panelListe: { flex: 1, marginTop: bosluk.s },
  panelIcerik: { paddingBottom: bosluk.m },
  panelKapaliIcerik: { marginTop: bosluk.s },
  digerDugmesi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: bosluk.s,
    paddingVertical: bosluk.m,
    borderTopWidth: 1,
    borderTopColor: renk.cizgi,
    marginTop: bosluk.s,
  },
  digerYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.govde, color: renk.metin },
  mekanSatiri: { paddingVertical: bosluk.s, gap: bosluk.m },
  mekanSatiriSecili: {},
  satirUst: { flexDirection: 'row', gap: bosluk.m, alignItems: 'flex-start' },
  satirSimge: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satirKapak: { width: 72, height: 72, borderRadius: 18 },
  satirGovde: { flex: 1, gap: 4, paddingTop: 2 },
  satirAd: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde + 3,
    lineHeight: 24,
    color: renk.metin,
    letterSpacing: -0.2,
  },
  satirAltSatir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  satirAlt: {
    flexShrink: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },

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

  /*
   * ONERI PANELI. Kart gibi duruyor - sayfa zemini de yuzey de beyaz
   * oldugu icin ayrimi KENARLIK ve GOLGE tasiyor (2026-08-27 kurali:
   * kenarliksiz ve golgesiz bir kart beyaz zeminde gorunmez olur).
   */
  oneriPaneli: {
    marginTop: bosluk.s,
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    overflow: 'hidden',
    ...golge.kart,
  },
  oneriSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    paddingHorizontal: bosluk.m,
    // 44 pt dokunma esigi: iki satirli icerikte zaten asiliyor, tek
    // satirlikta dikey dolgu tamamliyor.
    paddingVertical: 10,
    minHeight: 44,
  },
  oneriAyirici: { borderTopWidth: 1, borderTopColor: renk.cizgi },
  oneriBasili: { backgroundColor: renk.turuncuZemin },
  oneriGovde: { flex: 1 },
  oneriAd: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  oneriKonum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
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
  // KOMPAKT CIPLER (referans 2026-09-19): tek satir hap, ikon solda,
  // secili dolu turuncu + beyaz yazi. Onceki iki satirli kutu kalkti.
  cipSeridi: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  cipNokta: { width: 9, height: 9, borderRadius: 4.5 },
  // Referansta cipler KENARLIKSIZ ve yumusak golgeli; yalnizca SECILI
  // olan turuncu kenarlik ve krem zemin aliyor.
  cip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: yuvarlak.hap,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
  },
  cipSecili: { borderColor: renk.turuncu, backgroundColor: renk.turuncu },
  cipYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },
  cipYaziSecili: { color: '#FFFFFF', fontFamily: yazi.govdeKalin },

  // --- bolum basligi ---
  bolumSatiri: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },

  // --- mekan karti ---
  /**
   * MEKAN KARTI - kullanicinin referans gorseline gore (2026-09-14):
   * solda kare kapak (fotograf yoksa mekanin gercek kucuk haritasi,
   * 2026-09-17), sagda ad + durum rozeti / "Kafe • 120 m" / avatar
   * yigini + "4 kisi burada", altinda "Yol tarifi" + "Check-in yap".
   *
   * BUTUN KARTLAR AYNI (kullanicinin istegi 2026-09-17). Farkli olan
   * tek sey EN YAKIN kartin turuncu cercevesi: o bir bilgi, "en
   * yakini bu" demek - kaldirilsa ya da hepsine verilse liste o
   * bilgiyi kaybeder.
   *
   * Beyaz zemin uzerinde beyaz kart: ayrimi golge + ince cizgi
   * tasiyor (2026-08-27 kurali); one cikan kartta cizgi turuncu.
   */
  mekanKarti: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.buyuk,
    padding: bosluk.m,
    gap: bosluk.m,
    ...golge.kart,
  },
  mekanKartiOneCikan: {
    borderWidth: 1.5,
    borderColor: renk.turuncu,
  },
  kartUst: { flexDirection: 'row', gap: bosluk.m, alignItems: 'flex-start' },
  // Kapak KARE ve sabit: referansta kartin yuksekligini fotograf
  // belirliyor, metin onun yanina siginiyor.
  kapak: {
    width: KAPAK_OLCUSU,
    height: KAPAK_OLCUSU,
    borderRadius: yuvarlak.kart,
  },
  kartGovde: { flex: 1, minWidth: 0, gap: 4, minHeight: KAPAK_OLCUSU },
  kartBaslikSatiri: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: bosluk.s,
  },
  kartAdAlani: { flex: 1, minWidth: 0 },
  kartMekanAdi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  kartAltYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  // Kisi satiri govdenin DIBINE itiliyor (`marginTop: 'auto'`):
  // kare sabit yukseklikte oldugu icin satir referanstaki gibi
  // karenin alt kenariyla hizalaniyor.
  //
  // 2026-09-17: Check-in butonu bu satirdan cikti (artik her kartta
  // alttaki eylem satirinda), yani satirda yalnizca avatarlar ve sayi
  // kaldi - eski "sigmazsa sar" kurali da gereksizlesti.
  kartKisiSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    marginTop: 'auto',
    paddingTop: bosluk.s,
  },
  kisiAlani: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s, flexShrink: 1 },
  avatarYigini: { flexDirection: 'row', alignItems: 'center' },
  // Beyaz halka: bindirilmis avatarlar birbirinden ayrilsin.
  avatarHalka: {
    borderWidth: 2,
    borderColor: renk.yuzey,
    borderRadius: yuvarlak.hap,
  },
  avatarBindirme: { marginLeft: -10 },
  kartKisiYazi: {
    flexShrink: 1,
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  // Rozet: renkli nokta + yazi, acik zeminli hap (referans).
  rozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: yuvarlak.hap,
  },
  rozetNokta: { width: 8, height: 8, borderRadius: 4 },
  rozetYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.minik },
  kartEylemler: { flexDirection: 'row', gap: bosluk.s },
  // Yol tarifi: turuncu cerceveli, ici bos, ikonlu (referans).
  yolTarifi: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 11,
  },
  yolTarifiBasili: { backgroundColor: renk.turuncuZemin },
  yolTarifiYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.turuncuYazi,
  },
  /**
   * CHECK-IN BUTONU: DOLU TURUNCU (kullanicinin karari 2026-09-09,
   * "check-in butonlarinin icini dolu turuncu yap"; 2026-09-07'deki
   * hayalet hali geri alindi). Beyaz yazi marka turuncusu uzerinde
   * 2,65:1 - bilinen ve kabul edilmis odun (`marka-turuncusu-
   * degistirilmez`), yazi kalin oldugu icin okunuyor.
   */
  kartCheckIn: {
    // Yol tarifi ile satiri paylasiyor; genis olan bu (referans
    // gorseldeki oran). Igne simgesi + yazi (referans 2026-09-19).
    flex: 1.3,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Basili hal DOLGUYU KOYULASTIRIYOR: dolu bir butonda opaklik
  // dusurmek "pasif" okunuyor.
  kartCheckInBasili: { backgroundColor: renk.turuncuBasili },
  kartCheckInYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
  // Bolum basliginin sagindaki "Mesafeye göre" etiketi.
  siralamaEtiketi: {
    marginLeft: 'auto',
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
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
  haritaCercevesi: {
    marginHorizontal: -bosluk.sayfa,
    overflow: 'hidden',
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

  bolumBasligi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
    /*
     * YAN PAY YOK - `icerik` onu ZATEN veriyor.
     *
     * Kullanicinin bildirdigi kusur (2026-09-10): "Yakınındaki
     * Mekanlar yazisini sol basa hizala." Burada ayrica
     * `paddingHorizontal: bosluk.sayfa` duruyordu ve sayfanin kendi
     * payiyla TOPLANIYORDU: baslik 32 px iceride, arama kutusu ve
     * kartlar 16 px'te - yani ekranda tek hizasiz oge oydu.
     *
     * Ayni tuzak 2026-09-06'da da yasanmisti: yan pay her ogede ayri
     * ayri veriliyordu ve `bosluk.sayfa` jetonu tam bunu bitirmek icin
     * cikarilmisti. Bu satir o temizlikten arta kalmis.
     */
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
  // (eski satirAd/satirAlt 2026-09-19'da kompakt satir stilleriyle degistirildi)
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

  sayfaGostergesi: { alignItems: 'center', paddingVertical: bosluk.l },
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
