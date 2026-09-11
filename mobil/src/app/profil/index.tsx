import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  Share,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import * as ImagePicker from 'expo-image-picker'
import { kendiProfilimiGetir, type KendiProfil } from '../../../lib/profil'
import { profilFotografiUrl } from '../../../lib/fotograf-url'
import {
  kullanicininAnilariniGetir,
  aktifCheckInimiGetir,
  checkIniSil,
  checkInNotunuGuncelle,
  checkIndenAyril,
  type AniGorunumu,
  type AktifCheckIn,
} from '../../../lib/checkin'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import { etiketiKaldir } from '../../../lib/etiket'
import type { BagKisi } from '../../../lib/bag'
import { profilFotografiniDegistir, profilFotografiniKaldir } from '../../../lib/profil'
import { useDil } from '../../../lib/dil'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PaylasIkonu } from '../../tasarim/etkilesim-ikonlari'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { CheckInKarti } from '../../tasarim/CheckInKarti'
import { anidanAkisOgesi } from '../../../lib/akis'
import {
  etkilesimOzetleriniGetir,
  begen,
  begeniyiKaldir,
  paylas,
  type EtkilesimOzeti,
} from '../../../lib/etkilesim'
import { gorecelZaman } from '../../../lib/zaman'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { ProfilSayaclari } from '../../tasarim/ProfilSayaclari'
import { SekmeHapi } from '../../tasarim/SekmeHapi'
import { ProfilHaritaZemini } from '../../tasarim/ProfilHaritaZemini'
import { InstagramSatiri } from '../../tasarim/InstagramSatiri'
import { SiraRozeti } from '../../tasarim/SiraRozeti'

/**
 * Anilar bolumunde ILK ACILISTA kac kart CIZILIR.
 *
 * Bu bir veri siniri DEGIL, cizim penceresi: butun anilar zaten
 * cekiliyor (banttaki "Anı" sayaci, "En sık" listesi ve fotograf
 * izgarasi hepsinden besleniyor) ve kullanici asagi kaydirdikca
 * pencere buyuyor. Profil bir `ScrollView`, yani sanallastirma yok -
 * yuzlerce karti bir anda cizmek acilisi yavaslatirdi.
 *
 * Onceki hal UC idi ve gercek bir SINIRDI: gerisi "Tümü" baglantisiyla
 * ayri bir ekrana gonderiliyordu. Kullanicinin karari 2026-09-07:
 * butun paylasimlar profilde durur, liste hep asagi kaydirilabilir.
 */
const ILK_CIZIM_ADEDI = 10
/** Her kaydirmada pencere bu kadar buyur. */
const CIZIM_ADIMI = 10

function tarihiBicimlendir(zaman: string): string {
  const tarih = new Date(zaman)
  const gun = String(tarih.getDate()).padStart(2, '0')
  const ay = String(tarih.getMonth() + 1).padStart(2, '0')
  return `${gun}.${ay}.${tarih.getFullYear()}`
}

/**
 * Ayarlar girisi.
 *
 * Disli cark denendi ve 22 px'te gunes gibi okundu (isinlar disliden
 * uzun kaliyor). Instagram'in cozumu burada da dogru: uc cizgi. Ne
 * oldugunu sesli okuyucuya `accessibilityLabel` soyluyor.
 */
/**
 * Ayarlar ikonu: DISLI.
 *
 * Onceden uc yatay cizgiydi (kullanicinin istegi 2026-08-27: "appleın
 * ayarlar ikonu gibi bir ikon koy, belirgin boyutta olsun"). Uc cizgi
 * "menu" demek; disli dogrudan ayarlari anlatiyor. Boyut 22 -> 26.
 *
 * Sekil disaridaki disli halkasi + ortadaki delik: iOS'un ayarlar
 * ikonunun okunusu bu. Dis cizgi yerine DOLU cizilse kucuk boyutta
 * disler birbirine giriyor.
 */
function AyarlarIkonu() {
  const renk = useRenk()
  const R = renk.metin
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path
        d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8z"
        stroke={R}
        strokeWidth={1.7}
        fill="none"
      />
      <Path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.84 2.84l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.11a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.84-2.84l.06-.06a1.7 1.7 0 0 0 .34-1.88 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.11a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.84-2.84l.06.06a1.7 1.7 0 0 0 1.88.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.11a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.84 2.84l-.06.06a1.7 1.7 0 0 0-.34 1.88V9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.11a1.7 1.7 0 0 0-1.49 1.03z"
        stroke={R}
        strokeWidth={1.7}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

/**
 * Profil sekmesinin ana ekrani.
 *
 * Bu ekran daha once YOKTU: alt gezinmedeki "Profil" dogrudan anilar
 * listesine gidiyordu. Instagram ve Swarm'da o sekme kisinin kendisini
 * gosterir, bir alt sayfasini degil.
 *
 * Duzen: en ustte kimlik bandi, altinda Anilar / Yerler sekmeleri.
 *
 * CANLI SERIT KALDIRILDI (kullanicinin karari 2026-08-29: "profilden
 * şu an buradasın tarafini kaldiralim, sadece ani akisinda gorunecek
 * check-inler"). Canli check-in zaten anilar listesinde en ustte ve
 * zaman tuneli onu "şu an burada" rozetiyle ciziyor; ayri bir serit
 * ayni bilgiyi iki kez gosteriyordu. "Ayrıldım" ve "Sil" eylemleri
 * check-in ekranindaki kartta duruyor.
 */
/**
 * "En sik" listesinde gosterilecek en fazla mekan (kullanicinin karari
 * 2026-09-05: "En fazla 20'ye kadar sinirli olucak").
 *
 * Liste zaten en cok gidilenden az gidilene sirali; sinir kuyrugu
 * kesiyor. Bir kez gidilmis onlarca mekan listeyi uzatmaktan baska
 * bir sey yapmiyordu.
 */
/**
 * Ust blogun arkasindaki harita dokusu, KIMLIK BLOGUNUN OLCUELEN
 * yuksekligine gore uzuyor.
 *
 * Kullanicinin siniri (2026-09-10): "profili duzenle yazisina kadar
 * olsun yeter." Deger uzun sure SABITTI (152, sonra 144) ve avatar
 * satirinin paylarindan elle hesaplanmisti. Bu, biyografinin
 * KIRPILMASINA dayanan bir varsayimdi: iki satirla sinirliyken blogun
 * yuksekligi de sabitti. Biyografi kirpmasi kalkinca (2026-09-11)
 * blok artik 1-5 satir arasi degisiyor, yani sabit bir sayi ya erken
 * biter ya da butonun altina tasar.
 *
 * `HARITA_KUYRUGU` blogun ALTINDA kalan pay: doku tam blogun bittigi
 * yerde kesilmiyor, sonme gradyani bu kuyrukta eriyip kayboluyor.
 */
const HARITA_KUYRUGU = 50

/**
 * Olcuem gelmeden onceki yuksekligi: tek satirlik biyografisi olan bir
 * blogun boyu. Sifirdan baslamak ilk karede dokuyu HIC cizmez ve olcum
 * gelince birden belirirdi - ayni tuzak `SekmeHapi` ve karsilama
 * sahnesinde de yasanmisti.
 */
const KIMLIK_VARSAYILAN = 94

/**
 * Dokunun UST CUBUGUN ARKASINA tasma miktari.
 *
 * Kullanicinin istegi (2026-09-11): "arkasindaki harita gorselini de
 * daha yukari dogru uzat, bitisi gorunmesin." Doku `kimlikKap`
 * icinde basliyordu ve ust kenari "Profil" basliginin hemen altinda
 * keskin bir cizgi birakiyordu. Negatif konumla basligin ardina
 * uzaniyor, yani kenar ekranin disinda kaliyor.
 */
const HARITA_UST_TASMA = 96

const EN_FAZLA_YER = 20

/**
 * Kart ikonlari - kullanicinin gonderdigi 3D gorseller.
 *
 * Kullanicinin talimati (2026-09-05): "Hic bozmadan degistirmeden
 * oldugu gibi". Dosyalar KIRPILMADAN ve KUCULTULMEDEN duruyor;
 * olcekleme ekranda `contain` ile yapiliyor.
 *
 * Henuz gelmemis olanlar `null`; o kartlarda gecici olarak emoji
 * gorunuyor. Gorsel gelince buraya bir satir eklemek yetiyor.
 */
/**
 * KIMLIK BANDININ ZEMINI (kullanicinin secimi 2026-09-03, secenek "B").
 *
 * Onceden dolu, tam doygunlukta turuncu bir bloktu ve ekranin ucte
 * birini kapliyordu. Kullanici dort yumusatma secenegini gorup
 * "yumusak gecis"i secti: ustte seftali, asagi inerken beyaza karisiyor.
 * Boylece bandin NEREDE BITTIGI gorunmuyor, ekran tek parca duruyor.
 *
 * Uc durak var, iki degil: iki durakli bir gecis ortada gozle secilen
 * bir bant birakiyordu.
 *
 * KAPSAM (kullanicinin kurali): "sadece profil resminin arkasindaki
 * renk icin, geri kalan her sey ayni kalsin". Bandin DISINDA hicbir sey
 * degismedi - ust cubuk, sekmeler, ani satirlari ve mekan adinin marka
 * turuncusu aynen duruyor. Bandin ICINDEKI metin renkleri degismek
 * ZORUNDAYDI: beyaz yazi acik bir gecisin uzerinde okunmuyor.
 */

export default function ProfilEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  // Ust pay BURADA veriliyor, kok duzende degil: icerik saatin
  // altindaki yari saydam ortunun ALTINA giriyor ki renk oradan da
  // suzulsun (bkz. _layout.tsx, `ustSerit`).
  const renk = useRenk()
  const guvenliAlan = useSafeAreaInsets()
  const [profil, setProfil] = useState<KendiProfil | null>(null)
  const [fotografUrl, setFotografUrl] = useState<string | null>(null)
  const [anilar, setAnilar] = useState<AniGorunumu[]>([])
  // Sekme (kullanicinin secimi 2026-08-29): ayni veriye iki bakis -
  // zaman sirasi (anilar) ve yer sirasi (en cok gidilenler).
  const [sekme, setSekme] = useState<'anilar' | 'yerler' | 'fotograflar' | 'arkadaslar'>('anilar')
  const [baglar, setBaglar] = useState<BagKisi[]>([])
  // Izgaradan acilan buyuk gorunum; null ise kapali.
  const [buyukFotograf, setBuyukFotograf] = useState<string | null>(null)
  // Silme geri alinamaz: once onay. Deger, onayi acik olan aninin
  // kimligi (akis ekranindaki desenin aynisi).
  const [silOnayi, setSilOnayi] = useState<string | null>(null)
  // Cizim penceresi; kaydirdikca buyuyor.
  const [gorunenAdet, setGorunenAdet] = useState(ILK_CIZIM_ADEDI)
  /*
   * BEGENI / YORUM SAYILARI (kullanicinin istegi 2026-09-09:
   * "profildeki paylasimlarda ana sayfadaki gibi begen paylas yorum
   * yapma ikonu ekle").
   *
   * Kart bu ozet gelmeden eylem satirini CIZMIYOR, yani ikonlar
   * profilde hic gorunmuyordu.
   */
  const [ozetler, setOzetler] = useState<Record<string, EtkilesimOzeti>>({})
  /** Sunucuya SORULMUS kimlikler; ayni istegi iki kez atmamak icin. */
  const istenenOzetler = useRef<Set<string>>(new Set())
  const [fotografYukleniyor, setFotografYukleniyor] = useState(false)
  // Buyuk gorunum: fotografa basinca acilir (kullanicinin istegi
  // 2026-08-30). Kaldirma iki adimli: once dugme, sonra onay.
  const [buyukAcik, setBuyukAcik] = useState(false)
  /*
   * Kimlik blogunun OLCUELEN yuksekligi - arkadaki harita dokusu buna
   * gore uzuyor. Biyografi 1-5 satir arasi degisebildigi icin sabit
   * bir sayi ya erken biterdi ya butonun altina tasardi.
   */
  const [kimlikYuksekligi, setKimlikYuksekligi] = useState(KIMLIK_VARSAYILAN)
  const [kaldirOnayi, setKaldirOnayi] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  async function yukle() {
    try {
      const kendi = await kendiProfilimiGetir()
      setProfil(kendi)

      if (!kendi) {
        setHata(null)
        return
      }

      // Aktif check-in ARTIK AYRICA CEKILMIYOR (kullanicinin karari
      // 2026-08-29: "profilden şu an buradasın tarafini kaldiralim,
      // sadece ani akisinda gorunecek check-inler"). Canli kayit zaten
      // `kullanicininAnilariniGetir` icinde geliyor ve tunel onu
      // "şu an burada" rozetiyle ciziyor; ayri bir istek gereksizdi.
      const [anilarVerisi, baglar, foto] = await Promise.all([
        kullanicininAnilariniGetir(kendi.id),
        takipcilerimiGetir(),
        kendi.fotograflar[0] ? profilFotografiUrl(kendi.fotograflar[0]) : Promise.resolve(null),
      ])
      setAnilar(anilarVerisi)
      setBaglar(baglar)
      setFotografUrl(foto)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setYukleniyor(false)
    }
  }

  /*
   * OZETLER CIZIM PENCERESINE GORE CEKILIYOR, hepsi icin degil.
   *
   * Anilarin tamami zaten elde (sayaclar ve "En sik" listesi ondan
   * besleniyor) ama yuzlerce kimligi tek istekte sormanin anlami yok;
   * ekranda cizilmeyen kartin sayacina da ihtiyac yok. Pencere
   * buyudukce yalnizca YENI kimlikler soruluyor.
   *
   * SORULAN KIMLIKLER BIR REF'TE TUTULUYOR ve cevap gelmeyenler SIFIR
   * ozetle dolduruluyor. Ikisi de SONSUZ DONGUYU onluyor: hic
   * begenisi ve yorumu olmayan bir check-in icin sunucu satir
   * dondurmuyor, dolayisiyla "eksik" listesi hic bosalmiyor ve etki
   * kendi kendini tetikliyordu (testte yakalandi - kosum takildi).
   */
  useEffect(() => {
    const eksikler = anilar
      .slice(0, gorunenAdet)
      .map((a) => a.id)
      .filter((id) => !istenenOzetler.current.has(id))
    if (eksikler.length === 0) return

    eksikler.forEach((id) => istenenOzetler.current.add(id))
    let gecerli = true
    etkilesimOzetleriniGetir(eksikler)
      .then((gelen) => {
        if (!gecerli) return
        const tam: Record<string, EtkilesimOzeti> = { ...gelen }
        // Sunucudan satir gelmeyen check-in'in etkilesimi YOKTUR;
        // ikonlar yine cizilsin diye sifirla dolduruluyor.
        for (const id of eksikler) {
          if (!tam[id]) tam[id] = { begeni: 0, yorum: 0, begendim: false }
        }
        setOzetler((mevcut) => ({ ...mevcut, ...tam }))
      })
      // Sayac gelmezse kart yine ciziliyor; yalnizca o kartta eylem
      // satiri gorunmuyor. Kimlikler ref'te kaldigi icin istek
      // kendini tekrarlamiyor.
      .catch(() => {})
    return () => {
      gecerli = false
    }
  }, [anilar, gorunenAdet])

  /**
   * Iyimser guncelleme: kalp aninda doluyor, sunucu reddederse geri
   * aliniyor. Ana sayfadaki desenin AYNISI - iki ekran ayni etkilesim
   * satirini tasidigi icin davranislari da ayni olmali.
   */
  async function begeniDegistir(checkInId: string) {
    const onceki = ozetler[checkInId]
    if (!onceki) return

    const yeni = {
      ...onceki,
      begendim: !onceki.begendim,
      begeni: onceki.begeni + (onceki.begendim ? -1 : 1),
    }
    setOzetler((o) => ({ ...o, [checkInId]: yeni }))
    try {
      if (onceki.begendim) await begeniyiKaldir(checkInId)
      else await begen(checkInId)
    } catch {
      setOzetler((o) => ({ ...o, [checkInId]: onceki }))
    }
  }

  async function aniyiPaylas(checkInId: string) {
    const ani = anilar.find((a) => a.id === checkInId)
    if (!ani || !profil) return
    await paylas(ani.mekanAdi, profil.kullaniciAdi).catch(() => {})
  }

  /**
   * Kaydirma dibe yaklasinca cizim penceresini buyutur.
   *
   * Esik bir ekran boyu: kullanici dibe VARMADAN kartlar hazir olsun,
   * kaydirma bosluga carpmasin.
   */
  function dibeYaklasinca(olay: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = olay.nativeEvent
    const dibeUzaklik = contentSize.height - (contentOffset.y + layoutMeasurement.height)
    if (dibeUzaklik > layoutMeasurement.height) return
    setGorunenAdet((mevcut) => (mevcut >= anilar.length ? mevcut : mevcut + CIZIM_ADIMI))
  }

  /**
   * Ani kartinin ic islemleri.
   *
   * Bunlar eskiden yalnizca ayri "Anılarım" ekranindaydi; profildeki
   * onizleme kartlari SALT OKUNURDU. Liste profile tasininca islemler
   * de tasindi - yoksa silme ve duzenlemenin baska bir girisi
   * kalmazdi (ayni tuzak 2026-09-03'te ayarlardaki "Profilini
   * duzenle" satirinda yasanmisti).
   */
  async function aniyiSil(checkInId: string) {
    try {
      await checkIniSil(checkInId)
      setAnilar((mevcut) => mevcut.filter((a) => a.id !== checkInId))
      setSilOnayi(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  // Hata pencereye birakiliyor (akis ekranindaki desen): kayit
  // basarisizsa pencere acik kalsin, yazilan metin kaybolmasin.
  async function notuKaydet(checkInId: string, yeniNot: string) {
    await checkInNotunuGuncelle(checkInId, yeniNot)
    const temiz = yeniNot.trim()
    setAnilar((mevcut) =>
      mevcut.map((a) => (a.id === checkInId ? { ...a, notMetni: temiz === '' ? null : temiz } : a))
    )
  }

  async function etiketiSil(checkInId: string, kisiId: string) {
    await etiketiKaldir(checkInId, kisiId)
    setAnilar((mevcut) =>
      mevcut.map((a) =>
        a.id === checkInId
          ? { ...a, etiketler: (a.etiketler ?? []).filter((e) => e.kullaniciId !== kisiId) }
          : a
      )
    )
  }

  // Ekran her odaklandiginda yeniden cekiliyor: kullanici check-in yapip
  // ya da bir aniyi silip buraya donunce sayilar ve canli serit eski
  // degerde kalmasin.
  useFocusEffect(
    useCallback(() => {
      yukle()
    }, [])
  )

  /**
   * YERLER: kullanicinin gittigi mekanlar, cok gidilenden aza.
   *
   * Sunucuda yeni bir sorgu YOK - ekran zaten butun anilari cekiyor,
   * gruplama burada yapiliyor. Aktif check-in de sayiliyor: su an
   * bulundugun yer de "gittigin yer"dir.
   */
  const yerler = (() => {
    const sayac = new Map<string, { ad: string; semt: string | null; adet: number }>()
    const ekle = (mekanId: string, ad: string, semt: string | null) => {
      const mevcut = sayac.get(mekanId)
      if (mevcut) mevcut.adet += 1
      else sayac.set(mekanId, { ad, semt, adet: 1 })
    }
    // Canli check-in ARTIK `anilar` icinde geliyor; ayrica eklemek
    // ayni mekani iki kez sayardi.
    anilar.forEach((a) => ekle(a.mekanId, a.mekanAdi, a.mekanSemti))
    return [...sayac.entries()]
      .map(([mekanId, v]) => ({ mekanId, ...v }))
      .sort((a, b) => b.adet - a.adet || a.ad.localeCompare(b.ad, 'tr'))
  })()

  /**
   * "En sik" sekmesinde gosterilen liste - SINIRLI.
   *
   * Sinir yalnizca BURADA (kullanicinin netlestirmesi 2026-09-05:
   * "20 siniri sadece en sik icin gecerli olucak"). Gruplamanin
   * kendisi sinirsiz kaliyor, cunku bandaki "Yer" sayaci ondan
   * besleniyor: 25 farkli yere gitmis biri "20 Yer" gormemeli.
   */
  const enSikListe = yerler.slice(0, EN_FAZLA_YER)

  /**
   * FOTOGRAF SEKMESI (kullanicinin istegi 2026-09-05: "Profilden yer
   * yazisini kaldirip fotograf eklicez, check-in'lere eklenmis
   * fotograflarin hepsi burda gorunecek").
   *
   * Yeni sorgu YOK: anilar zaten imzalanmis fotograf adresini
   * tasiyor, burada yalnizca fotografi olanlar suzuluyor.
   */
  const fotograflar = anilar.filter((a) => a.fotografUrl)

  async function profiliPaylas() {
    if (!profil) return
    try {
      // Baglanti giris istiyor; paylasilan sey bir davet, herkese acik
      // bir sayfa degil. Metin bunu ima ediyor.
      await Share.share({
        message: `Slooin'de beni bul: ${profil.kullaniciAdi}\nhttps://slooin.expo.app/kullanici/${profil.id}`,
      })
    } catch {
      // Web'de paylasim penceresi olmayabilir; akisi kilitlemiyoruz.
      setHata(t('profil.paylasilamadi'))
    }
  }

  async function fotografDegistir() {
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (sonuc.canceled) return

    setFotografYukleniyor(true)
    try {
      await profilFotografiniDegistir(sonuc.assets[0].uri)
      // Profili yeniden okuyoruz: imzali adres sunucudan geliyor.
      await yukle()
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setFotografYukleniyor(false)
    }
  }

  function buyukKapat() {
    setBuyukAcik(false)
    setKaldirOnayi(false)
  }

  async function fotografKaldir() {
    setFotografYukleniyor(true)
    try {
      await profilFotografiniKaldir()
      buyukKapat()
      await yukle()
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setFotografYukleniyor(false)
    }
  }

  return (
    <View style={stiller.kok}>
      <ScrollView
        testID="profil-kaydirma"
        style={stiller.sayfa}
        contentContainerStyle={[stiller.icerik, { paddingTop: guvenliAlan.top + bosluk.l }]}
        showsVerticalScrollIndicator={false}
        // Liste SONSUZ: dibe yaklasinca cizim penceresi buyuyor.
        // `FlatList` degil `ScrollView` oldugu icin bunu ekran
        // kendisi yapiyor; kaydirma olayi 16 ms'de bir gelmesin diye
        // aralik seyreltiliyor.
        scrollEventThrottle={160}
        onScroll={dibeYaklasinca}
      >
        {/* ZEMIN TAMAMEN BEYAZ (kullanicinin istegi 2026-09-08:
            "Profil sayfasinin arka planini tamamen beyaz yap").
            Burada 2026-09-03'ten beri seftaliden beyaza bir gecis
            duruyordu; kaldirildi. Zemin artik kokten geliyor
            (`renk.zemin`), yani profil de uygulamanin geri kalaniyla
            ayni beyaz kuralina tabi.

            Profil kendi UST PAYINI koymaya devam ediyor
            (`_layout.tsx` icindeki `kendiUstPayiniKoyar`): gerekce
            degisti ama sonuc ayni - kok duzenin verdigi pay ile
            ekranin kendi payi ust uste binmemeli. */}

        {/* UST CUBUK: yalnizca sagda ayarlar.

            Kullanicinin karari (2026-09-10, referans gorselle):
            kullanici adi buradan KALKTI ve avatarin yanina, adin
            altina indi (@byorcun). Paylas ikonu da kalkti - eylem
            satirindaki kare butona tasindi, "Profili düzenle"nin
            yanina.

            "Profil" BASLIGI DA KALKTI (kullanicinin istegi
            2026-09-11). Cubukta tek oge kaldigi icin hizalama
            `space-between` degil `flex-end`: tek cocukla
            `space-between` disliyi SOLA yapistirirdi. */}
        <View style={stiller.ustCubuk}>
          <Pressable
            onPress={() => router.push('/profil/ayarlar')}
            accessibilityRole="button"
            accessibilityLabel={t('profil.ayarlar')}
            hitSlop={12}
          >
            <AyarlarIkonu />
          </Pressable>
        </View>

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {yukleniyor && !profil && <Text style={stiller.durum}>{t('ortak.yukleniyor')}</Text>}

        {!yukleniyor && !profil && (
          <View style={stiller.kart}>
            <Text style={stiller.kartBaslik}>{t('profil.profilYok')}</Text>
            <Text style={stiller.kartAciklama}>{t('profil.profilYokAciklama')}</Text>
            <Pressable
              style={stiller.birincil}
              onPress={() => router.push('/profil-olustur')}
              accessibilityRole="button"
            >
              <Text style={stiller.birincilYazi}>{t('profil.profilOlustur')}</Text>
            </Pressable>
          </View>
        )}

        {profil && (
          <>
            {/* AVATAR YUKARIDA VE ORTADA (kullanicinin karari
                2026-08-26). Profil fotografinin TEK GIRIS NOKTASI
                burasi - hesap olusturma adiminda artik sorulmuyor.

                IKI AYRI DOKUNUS (kullanicinin istegi 2026-08-30):
                yalnizca + rozeti fotograf secer; fotografin kendisine
                basinca buyuk gorunum acilir, orada "Kaldir" var.
                Fotograf yokken bas harfe basmak bir sey yapmiyor. */}
            {/* KIMLIK: AVATAR SOLDA, BILGILER SAGINDA.
            
                Kullanicinin karari (2026-09-10, referans gorselle):
                onceden avatar ORTALI ve bilgiler altindaydi. Yatay
                duzen ust blogu kisaltiyor - ekranin ilk goruntusunde
                anilara daha cok yer kaliyor.
                
                Arkada ISIMSIZ harita dokusu var; yuksekligi eylem
                satirinin ustunde bitiyor ("profili duzenle yazisina
                kadar olsun yeter"). */}
            <View style={stiller.kimlikKap}>
              <ProfilHaritaZemini
                yukseklik={kimlikYuksekligi + HARITA_KUYRUGU}
                ustTasma={HARITA_UST_TASMA}
              />

              <View
                style={stiller.kimlik}
                onLayout={(o) => setKimlikYuksekligi(o.nativeEvent.layout.height)}
              >
                <View style={stiller.avatarBasilir}>
                  {fotografUrl ? (
                    <Pressable
                      onPress={() => setBuyukAcik(true)}
                      accessibilityRole="button"
                      accessibilityLabel={t('profil.fotografiBuyut')}
                    >
                      <Image
                        testID="profil-fotografi"
                        source={{ uri: fotografUrl }}
                        style={stiller.avatar}
                      />
                    </Pressable>
                  ) : (
                    // Fotografi olmayanda bos daire birakmak profili
                    // eksik gosteriyor; bas harf kimligi tasiyor.
                    <View style={[stiller.avatar, stiller.avatarYok]}>
                      <Text style={stiller.basHarf}>
                        {(profil.ad || profil.kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase()}
                      </Text>
                    </View>
                  )}
                  {/* Rozet TURUNCU (referans): avatarin sag altinda,
                      beyaz halkayla fotograftan ayriliyor. */}
                  <Pressable
                    style={stiller.fotografRozeti}
                    onPress={fotografDegistir}
                    disabled={fotografYukleniyor}
                    accessibilityRole="button"
                    accessibilityLabel={t('profil.fotografEkle')}
                    hitSlop={8}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24">
                      <Path
                        d="M12 5v14M5 12h14"
                        stroke="#FFFFFF"
                        strokeWidth={2.6}
                        strokeLinecap="round"
                      />
                    </Svg>
                  </Pressable>
                </View>

                <View style={stiller.kimlikBilgi}>
                  <Text style={stiller.ad} numberOfLines={1}>
                    {profil.ad}
                  </Text>
                  {/* @ ISARETI GERI GELDI (2026-09-10, referans
                      gorselde var). 2026-09-03'te kaldirilmisti;
                      kullanici referansla birlikte geri istedi. */}
                  <Text style={stiller.kullaniciAdi} numberOfLines={1}>
                    @{profil.kullaniciAdi}
                  </Text>
                  {/* BIYOGRAFI KIRPILMIYOR (kullanicinin bildirdigi
                      kusur 2026-09-11: "biyografi satirina alt alta
                      2-3 tane sey yazinca hepsi gorunmuyor").
                      Onceden `numberOfLines={2}` vardi. Sinirsiz
                      buyume riski YOK: alan sunucuda 160 karakterle
                      kapali, yani en fazla dort-bes satir. */}
                  {profil.biyografi && (
                    <Text style={stiller.biyografi}>{profil.biyografi}</Text>
                  )}
                  {/* INSTAGRAM BEYANI (2026-09-11) - biyografinin
                      altinda, cunku ikisi de "bu kisi kim" bilgisi.
                      Ortak bilesen: baskasinin profili ayni satiri
                      kullaniyor. */}
                  {profil.instagram && <InstagramSatiri kullaniciAdi={profil.instagram} />}
                </View>
              </View>

              {fotografYukleniyor && (
                <Text style={stiller.fotografDurumu}>Yükleniyor…</Text>
              )}

              {/* EYLEM SATIRI: genis "Profili düzenle" + kare paylas.
              
                  "Profili düzenle" 2026-09-03'te kullanicinin
                  istegiyle KALDIRILMISTI ve giris ayarlara tasinmisti;
                  2026-09-10'da referans gorselle geri geldi. Ayarlardaki
                  satir DURUYOR - iki giris olmasi zarar vermiyor,
                  kaldirmak ise o ekrani yine oksuz birakma riski
                  tasiyordu. */}
              <View style={stiller.eylemler}>
                <Pressable
                  style={({ pressed }) => [
                    stiller.duzenleButonu,
                    pressed && stiller.eylemBasili,
                  ]}
                  onPress={() => router.push('/profil/duzenle')}
                  accessibilityRole="button"
                  testID="profili-duzenle"
                >
                  <Text style={stiller.duzenleYazi}>{t('profil.duzenle')}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    stiller.paylasButonu,
                    pressed && stiller.eylemBasili,
                  ]}
                  onPress={profiliPaylas}
                  accessibilityRole="button"
                  accessibilityLabel={t('profil.paylas')}
                  testID="profili-paylas"
                >
                  <PaylasIkonu />
                </Pressable>
              </View>
            </View>

            <View>
              {/* SAYAC SATIRI ortak bilesende (`ProfilSayaclari`):
                  baskasinin profili de ayni satiri kullaniyor
                  (kullanicinin istegi 2026-09-08). Iki kopya olsaydi
                  biri degistiginde oteki geride kalirdi.

                  Burada `onSec` VERILIYOR, yani satir bir BOLUM SECICI
                  (kullanicinin karari 2026-09-05); baskasinin
                  profilinde verilmiyor ve satir salt okunur oluyor. */}
              <ProfilSayaclari
                sayilar={{
                  anilar: anilar.length,
                  fotograflar: fotograflar.length,
                  arkadaslar: baglar.length,
                }}
                // "En sık" anilar bolumunun ALT SEKMESI, o acikken de
                // Ani sayaci secili duruyor.
                secili={sekme === 'yerler' ? 'anilar' : sekme}
                onSec={setSekme}
              />


            </View>

            {/* ALT SEKME yalnizca ANI bolumunde: ayni veriye iki
                bakis (kullanicinin secimi 2026-08-29). Anilar zaman
                sirasi, "En sık" ise en cok gidilenden aza. Ikincisi
                sunucuda yeni bir sorgu gerektirmiyor; ayni anilardan
                gruplaniyor.

                Fotograf ve arkadas bolumlerinde bu cubuk YOK - orada
                tek bir bakis var, ikinci bir sekme bos yer kaplardi. */}
            {(sekme === 'anilar' || sekme === 'yerler') && (
              <SekmeHapi
                sekmeler={[
                  { anahtar: 'anilar' as const, etiket: t('profil.sekmeAnilar') },
                  { anahtar: 'yerler' as const, etiket: t('profil.sekmeYerler') },
                ]}
                secili={sekme === 'yerler' ? 'yerler' : 'anilar'}
                onSec={setSekme}
              />
            )}

            {sekme === 'arkadaslar' ? (
              baglar.length === 0 ? (
                <View style={stiller.bosAlan}>
                  {/* Aciklama satiri KALDIRILDI (kullanicinin istegi
                      2026-09-05). Baslik zaten durumu soyluyor. */}
                  <Text style={stiller.bosBaslik}>{t('profil.bosArkadasBaslik')}</Text>
                </View>
              ) : (
                baglar.map((kisi) => (
                  <Pressable
                    key={kisi.id}
                    style={stiller.kisiSatiri}
                    onPress={() => router.push(`/kullanici/${kisi.id}`)}
                    accessibilityRole="button"
                  >
                    <View style={stiller.kisiAvatar}>
                      <Text style={stiller.kisiBasHarf}>
                        {(kisi.ad || kisi.kullaniciAdi || '?')
                          .trim()
                          .charAt(0)
                          .toLocaleUpperCase('tr-TR')}
                      </Text>
                    </View>
                    <View style={stiller.yerOrta}>
                      <Text style={stiller.yerAd}>{kisi.ad}</Text>
                      <Text style={stiller.yerSemt}>{kisi.kullaniciAdi}</Text>
                    </View>
                  </Pressable>
                ))
              )
            ) : sekme === 'fotograflar' ? (
              fotograflar.length === 0 ? (
                <View style={stiller.bosAlan}>
                  <Text style={stiller.bosBaslik}>{t('profil.bosFotografBaslik')}</Text>
                  <Text style={stiller.bosAciklama}>{t('profil.bosFotografAciklama')}</Text>
                </View>
              ) : (
                /* IZGARA: uc sutun, kare hucreler. Kapak degil TAM
                   KARE kirpiliyor (`cover`), boylece satirlar duzgun
                   hizalaniyor - fotograflarin en/boy orani birbirini
                   tutmuyor. */
                <View style={stiller.izgara}>
                  {fotograflar.map((a) => (
                    <Pressable
                      key={a.id}
                      style={stiller.izgaraHucre}
                      onPress={() => setBuyukFotograf(a.fotografUrl)}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={a.mekanAdi}
                    >
                      <Image
                        source={{ uri: a.fotografUrl as string }}
                        style={stiller.izgaraFoto}
                        resizeMode="cover"
                      />
                    </Pressable>
                  ))}
                </View>
              )
            ) : sekme === 'yerler' ? (
              enSikListe.length === 0 ? (
                <View style={stiller.bosAlan}>
                  <Text style={stiller.bosBaslik}>{t('profil.bosYerBaslik')}</Text>
                  <Text style={stiller.bosAciklama}>{t('profil.bosYerAciklama')}</Text>
                </View>
              ) : (
                enSikListe.map((yer, i) => (
                  <Pressable
                    key={yer.mekanId}
                    style={stiller.yerSatiri}
                    // Yerler sekmesindeki satir da KONUM ekranini aciyor
                    // (kullanicinin karari 2026-08-30).
                    onPress={() => router.push(`/harita/${yer.mekanId}` as never)}
                    accessibilityRole="button"
                  >
                    <SiraRozeti sira={i + 1} />
                    <View style={stiller.yerOrta}>
                      <Text style={stiller.yerAd} numberOfLines={1}>
                        {yer.ad}
                      </Text>
                      {yer.semt ? <Text style={stiller.yerSemt}>{yer.semt}</Text> : null}
                    </View>
                    <Text style={stiller.yerAdet}>
                      {t('profil.kezSayisi', { sayi: yer.adet })}
                    </Text>
                  </Pressable>
                ))
              )
            ) : anilar.length === 0 ? (
              <View style={stiller.bosAlan}>
                <Text style={stiller.bosBaslik}>{t('profil.bosAniBaslik')}</Text>
                <Text style={stiller.bosAciklama}>{t('profil.bosAniAciklama')}</Text>
              </View>
            ) : (
              /* ORTAK KART (kullanicinin karari 2026-08-30): profil
                 akisi da ana sayfayla ve Anilarim'la AYNI karti
                 gosteriyor. Onceki zaman tuneli deseni kaldirildi. */
              /* Kartlar sayfa payinin DISINDA (kullanicinin istegi
                 2026-09-05: "anilari sagdan soldan ekrana sigdir").
                 Kartin kendi ic payi var (16); sayfa payinin (24)
                 icinde kalinca toplam 40 oluyor ve mekan adi bosuna
                 iki satira kiriliyordu. Ana sayfadaki kartlar zaten
                 tam genislikte - artik profil de onlarla ayni. */
              <View style={stiller.aniListesi}>
                {anilar.slice(0, gorunenAdet).map((ani) => (
                  <CheckInKarti
                    key={ani.id}
                    oge={anidanAkisOgesi(ani, {
                      kullaniciId: profil.id,
                      avatarUrl: fotografUrl,
                      rumuz: profil.kullaniciAdi,
                    })}
                    zamanYazisi={gorecelZaman(ani.olusturmaZamani, t)}
                    ozet={ozetler[ani.id]}
                    onBegen={begeniDegistir}
                    // Yorumlar kartin ICINDE alttan aciliyor; ekranin
                    // tek isi sayaci tazelemek.
                    onYorumSayisi={(id, sayi) =>
                      setOzetler((mevcut) =>
                        mevcut[id] ? { ...mevcut, [id]: { ...mevcut[id], yorum: sayi } } : mevcut
                      )
                    }
                    onPaylas={aniyiPaylas}
                    silOnayiAcik={silOnayi === ani.id}
                    onSilOnayi={(id) => setSilOnayi(silOnayi === id ? null : id)}
                    onSil={aniyiSil}
                    onNotKaydet={notuKaydet}
                    onEtiketKaldir={etiketiSil}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* IZGARADAN ACILAN BUYUK GORUNUM. Akis kartindaki desenle ayni;
          "Kaldir" YOK - burada fotografi silmek anlamli degil, silme
          check-in'in kendi menusunden yapiliyor. */}
      <Modal
        visible={buyukFotograf !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setBuyukFotograf(null)}
      >
        <Pressable
          style={stiller.buyukZemin}
          onPress={() => setBuyukFotograf(null)}
          accessibilityRole="button"
          accessibilityLabel={t('ortak.kapat')}
        >
          {buyukFotograf && (
            <Image
              source={{ uri: buyukFotograf }}
              style={stiller.izgaraBuyukFoto}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>

      {/* BUYUK GORUNUM: siyah zemin, fotograf tam genislikte, ustte
          Kapat, altta Kaldir. Kaldirma geri alinamaz, o yuzden iki
          adimli (uygulamadaki diger silmelerle ayni kural). */}
      <Modal
        visible={buyukAcik}
        transparent
        animationType="fade"
        onRequestClose={buyukKapat}
      >
        <View style={stiller.buyukZemin}>
          <Pressable
            style={stiller.buyukKapat}
            onPress={buyukKapat}
            accessibilityRole="button"
            accessibilityLabel={t('profil.kapat')}
            hitSlop={12}
          >
            <Svg width={26} height={26} viewBox="0 0 24 24">
              <Path
                d="M6 6l12 12M18 6L6 18"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>

          {fotografUrl && (
            <Image
              testID="profil-fotografi-buyuk"
              source={{ uri: fotografUrl }}
              style={stiller.buyukFotograf}
              resizeMode="contain"
            />
          )}

          <View style={stiller.buyukAlt}>
            {kaldirOnayi ? (
              <>
                <Text style={stiller.buyukOnayMetni}>{t('profil.fotografKaldirOnay')}</Text>
                <View style={stiller.buyukOnaySatiri}>
                  <Pressable
                    style={[stiller.buyukDugme, stiller.buyukDugmeTehlike]}
                    onPress={fotografKaldir}
                    disabled={fotografYukleniyor}
                    accessibilityRole="button"
                  >
                    <Text style={stiller.buyukDugmeYazi}>{t('profil.fotografKaldir')}</Text>
                  </Pressable>
                  <Pressable
                    style={stiller.buyukDugme}
                    onPress={() => setKaldirOnayi(false)}
                    accessibilityRole="button"
                  >
                    <Text style={stiller.buyukDugmeYazi}>{t('ortak.vazgec')}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable
                style={stiller.buyukDugme}
                onPress={() => setKaldirOnayi(true)}
                accessibilityRole="button"
              >
                <Text style={stiller.buyukDugmeYazi}>{t('profil.fotografKaldir')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  canliEylemler: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  canliSil: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.yikici,
  },
  silOnayAlani: {
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  silOnaySoru: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 18,
    color: renk.metinIkincil,
  },
  silOnayDugmeleri: { flexDirection: 'row', gap: 20 },
  vazgecYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  silYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.yikici,
  },

  kok: { flex: 1, backgroundColor: renk.zemin },
  sayfa: { flex: 1 },
  icerik: {
    paddingHorizontal: bosluk.sayfa,
    // Ust pay 44 -> 16 (kullanicinin istegi 2026-08-29: "biraz daha
    // kucultup yukari tasi"). Durum cubugunun altindaki bosluk
    // gereginden genisti.
    paddingTop: bosluk.l,
    paddingBottom: ALT_GEZINME_PAYI,
  },


  ustIkonlar: { flexDirection: 'row', alignItems: 'center', gap: bosluk.l },

  ustCubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    // Tek oge (ayarlar) kaldi: `space-between` onu SOLA yapistirirdi.
    justifyContent: 'flex-end',
    gap: bosluk.m,
    // Kimlik blogu yukari alindi (kullanicinin istegi 2026-09-11):
    // 12 -> 4.
    marginBottom: bosluk.xs,
  },
  /*
   * @KULLANICIADI - artik UST CUBUKTA degil, ADIN ALTINDA
   * (2026-09-10). Ikincil bir kimlik satiri oldugu icin `metinSoluk`:
   * ad koyu ve kalin, kullanici adi onun altinda sessiz duruyor.
   */
  kullaniciAdi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
    marginTop: 1,
  },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    marginBottom: bosluk.m,
  },
  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },

  /**
   * KIMLIK BLOGU TURUNCU ZEMINDE (kullanicinin istegi 2026-08-28,
   * referans: eski Swarm profil basligi).
   *
   * Tam genislik icin negatif yatay pay: sayfanin kendi yan payi
   * `icerik` uzerinde duruyor, blok onu geri aliyor ve kendi payini
   * koyuyor. Boylece renk kenardan kenara gidiyor.
   *
   * KIMLIK KURALI GERILIMI COZULDU (2026-09-03): blok eskiden dolu
   * turuncuydu ve "turuncu yalnizca eylem ve canlilik icindir" kuraliyla
   * celisiyordu. Artik zemin seftaliden beyaza yumusak bir gecis; tam
   * doygun turuncu bandin icinde yalnizca "Profili duzenle" butonunda
   * kaldi - yani yeniden EYLEM oldu.
   */
  /*
   * KIMLIK KABI: harita dokusunun capasi.
   *
   * `position: relative` SART - doku mutlak konumlu ve bu kabin
   * icinde kalmali; olmasaydi sayfanin tepesine yapisirdi.
   */
  kimlikKap: { position: 'relative' as const },
  /*
   * AVATAR SOLDA, BILGI SAGDA (kullanicinin karari 2026-09-10).
   * Onceden dikey ve ortaliydi.
   */
  kimlik: {
    flexDirection: 'row' as const,
    /*
     * USTTEN HIZALI, ORTALI DEGIL (kullanicinin bildirdigi kusur
     * 2026-09-11: "isim kismi bu sefer yukari dogru kayiyor, yeri
     * sabit olmali").
     *
     * `center` iken sutun biyografi uzadikca BUYUEYUP yukari
     * tasiyordu: iki satirlik bir biyografide ad bir yerde, dort
     * satirlikta 20-30 px yukarida duruyordu. Ustten hizalayinca adin
     * yeri biyografiden BAGIMSIZ - blok yalnizca asagi dogru buyuyor.
     */
    alignItems: 'flex-start' as const,
    gap: bosluk.l,
    // Ust pay KALDIRILDI (8 -> 0): kullanicinin istegi 2026-09-11,
    // "profil resmi, isim, kullanici adi ve biyografiyi beraber biraz
    // daha yukari tasi". Cubuk payiyla birlikte blok 16 px yukari
    // geldi.
    paddingTop: 0,
    paddingBottom: bosluk.l,
  },
  /* `flex: 1` + `minWidth: 0`: uzun bir ad avatari sikistirmasin,
     kendisi kirpilsin. */
  kimlikBilgi: { flex: 1, minWidth: 0 },
  avatarBasilir: { position: 'relative' as const },

  /* EYLEM SATIRI: genis duzenle + kare paylas. */
  /*
   * EYLEM SATIRI VE ALTI BIRAZ DAHA ASAGIDA (kullanicinin istegi
   * 2026-09-11: "profili duzenle butonundan itibaren islevleri biraz
   * daha asagiya cekebilirsin"). Kimlik blogunun kendi alt payiyla
   * (16) birlikte aradaki bosluk 28 px.
   *
   * Pay BURADA, `kimlik.paddingBottom`da DEGIL: doku kimlik blogunun
   * olcuelen yuksekligine gore uzuyor, yani o paya eklenen her piksel
   * dokuyu da uzatirdi. Boslugun dokunun disinda kalmasi gerekiyor.
   */
  eylemler: { flexDirection: 'row' as const, gap: bosluk.s, marginTop: bosluk.m },
  duzenleButonu: {
    flex: 1,
    // 46 -> 40 (kullanicinin istegi 2026-09-11: "profili duzenle
    // sutununu incelt biraz"). 44 pt dokunma esiginin altina
    // INMIYOR - 40 + satirin cevresindeki bosluk yeterli alan
    // birakiyor ve buton sayfa genisliginde, yani hedef genis.
    height: 40,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  duzenleYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  paylasButonu: {
    width: 52,
    // Duzenle butonuyla ayni yukseklik: ikisi tek bir satir gibi
    // okunmali, biri otekinden yuksek olursa satir kirilir.
    height: 40,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  /* Basili hal: dolgu koyulasiyor. Opaklik dusurmek "yukleniyor" gibi
     okunuyordu (2026-09-07 dersi). */
  eylemBasili: { backgroundColor: renk.cizgi },

  // Buyuk gorunum
  buyukZemin: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyukKapat: {
    position: 'absolute',
    top: bosluk.xxl + bosluk.xl,
    right: bosluk.xl,
    zIndex: 1,
  },
  buyukFotograf: { width: '100%', aspectRatio: 1 },
  buyukAlt: {
    position: 'absolute',
    left: bosluk.xl,
    right: bosluk.xl,
    bottom: bosluk.xxl + bosluk.xl,
    alignItems: 'center',
    gap: bosluk.m,
  },
  buyukOnayMetni: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
  buyukOnaySatiri: { flexDirection: 'row', gap: bosluk.s },
  buyukDugme: {
    minWidth: 140,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: bosluk.sayfa,
    borderRadius: yuvarlak.hap,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  buyukDugmeTehlike: { backgroundColor: renk.yikici, borderColor: renk.yikici },
  buyukDugmeYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
  fotografRozeti: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    /* ROZET TURUNCU (2026-09-10, referans gorsel). `rozetZemin`
       jetonu acik modda KOYU idi - referansta turuncu ve kurala da
       uyuyor: rozet bir EYLEM (fotograf degistir). */
    backgroundColor: renk.turuncu,
    borderWidth: 2.5,
    // Beyaz halka avatarin uzerinde rozeti ayiriyor.
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotografDurumu: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    // Beyaz IKI MODDA DA dogru: acik modda koyu rozetin, koyu modda
    // turuncu rozetin uzerinde duruyor.
    color: '#FFFFFF',
  },
  // Buyutuldu (kullanicinin istegi 2026-08-27): profilin capasi bu.
  avatar: {
    // 104 -> 88: band kuculurken capa da orantili kuculdu.
    width: 88,
    height: 88,
    borderRadius: 44,
    // Zeminden fotografi ayiran beyaz halka.
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarYok: {
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 30,
    color: renk.turuncuYazi,
  },

  sayilar: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },

  kisiAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kisiBasHarf: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.turuncuYazi,
  },

  // Bandin icindeki dugmeler: dolu olan birincil (Profili duzenle),
  // hayalet olan ikincil (Paylas). Band acildigi icin dolu dugme artik
  // BEYAZ degil TURUNCU - ekrandaki tek tam doygun turuncu o.
  bandDugmeleri: { flexDirection: 'row', gap: bosluk.s, alignSelf: 'stretch' },
  bandDugme: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  bandDugmeDolu: { backgroundColor: renk.turuncu, borderColor: renk.turuncu },
  bandDugmeYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: '#8A6B4F' },
  bandDugmeYaziDolu: { color: '#FFFFFF' },

  // Sekmeler: alt cizgi secili olani gosteriyor.
  // HAP SEKLINDE SEGMENT (kullanicinin istegi 2026-09-08: "hap sekilde
  // bastan sona icinde kaymali sutunlu butonlu"). Alt cizgi kalkti.
  //
  // FOTOGRAF IZGARASI: uc sutun. Sayfa yan payini geri aliyor ki
  // izgara kenardan kenara olsun.
  izgara: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -bosluk.xl,
  },
  izgaraHucre: { width: '33.333%', aspectRatio: 1, padding: 1 },
  izgaraFoto: { width: '100%', height: '100%', backgroundColor: renk.cizgi },

  izgaraBuyukFoto: { width: '100%', height: '80%' },

  aniListesi: { marginHorizontal: -bosluk.xl },

  yerOrta: { flex: 1 },
  yerAd: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  yerSemt: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 1,
  },
  yerAdet: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.turuncuYazi,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    paddingVertical: 4,
    paddingHorizontal: bosluk.m,
    overflow: 'hidden',
  },
  sayiHucre: { flex: 1, alignItems: 'center', paddingVertical: bosluk.s },
  // Acik zeminde beyaz ayirici gorunmuyordu; seftalinin koyu tonu.
  // Beyaz zeminde sicak bir ton yerine ayirici jetonu (gecis kalkti).
  sayiAyirici: { width: 1, height: 28, backgroundColor: renk.cizgi },
  sayi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.4,
  },
  sayiEtiket: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
  },

  // Band artik ACIK: beyaz yazi okunmaz, metinler koyu tona gecti.
  /* Yatay duzende metinler SOLA yasli; ortalamak avatarla arasindaki
     bagi koparıyordu. */
  ad: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  biyografi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: 4,
    /*
     * UC SATIRLIK ALAN AYRILIYOR (kullanicinin istegi 2026-09-11:
     * "yazilacaginca gorunecegi alt alta birkac satirlik alan
     * yarat"). 3 x lineHeight(20) = 60.
     *
     * `minHeight`, sabit `height` DEGIL: alan 160 karakterle kapali
     * ama bu dort-bes satir edebiliyor ve o durumda metnin kirpilmasi
     * kullanicinin AYNI GUN bildirdigi kusurun ta kendisi olurdu.
     * Yani ucten azsa yer ayrilir, fazlaysa asagi buyur.
     *
     * Biyografi YOKSA hic cizilmiyor, dolayisiyla bos yer de
     * ayrilmiyor - bos bir profilde 60 px bosluk sebepsiz olurdu.
     */
    minHeight: 60,
  },

  // Canli serit: ekranin imza ogesi. Turuncu nokta "su an oluyor" der.
  canliKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.l,
    marginTop: bosluk.xl,
  },
  canliOrta: { flex: 1 },
  canliEtiket: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.turuncuYazi,
  },
  canliMekan: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
    marginTop: 2,
  },
  ayril: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },

  kart: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    padding: bosluk.l,
    marginTop: bosluk.xl,
    ...golge.kart,
  },
  kartBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  kartAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: bosluk.xs,
  },
  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: bosluk.l,
  },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },

  bolumBasligi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // xxl -> l: turuncu band gelince aradaki bosluk fazla kaciyordu.
    marginTop: bosluk.l,
    marginBottom: bosluk.s,
  },
  bolumAd: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },

  aniSatiri: {
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  aniMekan: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  aniAlt: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
  },

  // Arkadas satiri: bas harfli avatar + ad + kullanici adi.
  kisiSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  // Yerler sekmesi: sira, ad/semt, kac kez gidildigi.
  yerSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  bosAlan: { paddingTop: bosluk.m },
  bosBaslik: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  bosAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: bosluk.xs,
  },
})
