import { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Linking,
  Modal,
  Platform,
  ActionSheetIOS,
  StyleSheet,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { mekaniGetir, mekanDurumu, type Mekan } from '../../../lib/mekan'
import {
  mekanIstatistikleriniGetir,
  mekanLiderligiGetir,
  mekanSonCheckInleriGetir,
  type MekanIstatistikleri,
  type LiderlikSatiri,
  type SonCheckIn,
} from '../../../lib/mekan-sayfasi'
import {
  suAnBurdakileriGetir,
  aktifCheckInimiGetir,
  checkIndenAyril,
  CHECK_IN_YARICAP_METRE,
  type CheckInGorunumu,
  type AktifCheckIn,
} from '../../../lib/checkin'
import { profilOzetleriniGetir } from '../../../lib/akis'
import { gorecelZaman } from '../../../lib/zaman'
import { cihazKonumunuAl, mesafeMetre } from '../../../lib/konum'
import { hataMetni } from '../../../lib/hata-metni'
import { useDil } from '../../../lib/dil'
import { CanliHarita } from '../../tasarim/CanliHarita'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { mekanFotografiUrl } from '../../../lib/mekan-duzenleme'
import { SiraRozeti } from '../../tasarim/SiraRozeti'
import { MekanFotografGalerisi } from '../../tasarim/MekanFotografGalerisi'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import {
  KisilerIkonu,
  CubukIkonu,
  YildizIkonu,
  KupaIkonu,
  SaatIkonu,
  FotografIkonu,
  ArabaIkonu,
  NavigasyonIkonu,
  NisangahIkonu,
  TacIkonu,
  OkIkonu,
} from '../../tasarim/mekan-ikonlari'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'

/**
 * MEKAN SAYFASI.
 *
 * Akistaki ya da profildeki bir check-in'in mekan adina basilinca
 * aciliyor. Onceden yalnizca harita + ad + "Yol tarifi al" tasiyordu;
 * kullanicinin istegi (2026-09-06, referans gorselle): sayfa mekanin
 * KENDISINI anlatsin - kac kisi orada, bugun kac check-in olmus,
 * ilcesinde kacinci, kimler orada ve kimler en cok gelmis.
 *
 * IKI FARKLI GORUNURLUK REJIMI VAR, bilerek:
 *
 *   SAYILAR herkese ayni. `mekan_istatistikleri` `security definer` -
 *   bir sayi kimseyi tanimlamiyor, mevcut yogunluk sayaciyla ayni
 *   sinifta (karar 71).
 *
 *   KISI LISTELERI cagirana gore. `check_inler` RLS'i isliyor: canli
 *   bir check-in'de "herkese acik" bile ancak AYNI MEKANDA CANLIYSAN ya
 *   da ARKADASINSA gorunuyor.
 *
 * Yani ustte "7 kisi burada" yazarken asagida 2 avatar gorunebilir.
 * Bu bir kusur DEGIL: fark "+5" rozetiyle anlatiliyor, sayi sizmaya
 * devam ediyor ama kimlikler sizmiyor.
 *
 * AVATARLAR GERCEK PROFIL FOTOGRAFI, akistaki ve bildirimlerdeki
 * desenin aynisi: `profilOzetleriniGetir` (yani `akis_profilleri`
 * RPC'si) hem "kim gorunur" kuralini hem de imzali adresi tek yerde
 * tutuyor. Fotografi olmayan kisi ADININ BAS HARFINE duesuyor.
 *
 * "Haritada yuz yok" kurali BURAYI KAPSAMIYOR: o kural yogunluk
 * sayacinin kimlik sizdirmamasi icin - haritada yalnizca SAYI var.
 * Buradaki kisiler zaten RLS'ten gecmis, yani adlari da gorunuyor;
 * adi gosterilen birinin fotografini gizlemenin bir korumasi olmaz.
 *
 * HARITA DOKUNMATIK DEGIL, BIR DUGME. Ustune basinca hangi harita
 * uygulamasiyla acilacagi soruluyor (kullanicinin istegi 2026-08-30);
 * bu yuzden kaydirma ve yakinlastirma kapali.
 *
 * Kullanicinin kendi konumu BURADA KULLANILMIYOR: check-in baska bir
 * gun baska bir yerde yapilmis olabilir, "sana uzakligi" yaniltici
 * olurdu.
 */

/** Secim penceresi: iOS'ta Apple Haritalar da var, diger yerlerde yok. */
function haritaSecenekleri(): ('apple' | 'google')[] {
  return Platform.OS === 'ios' ? ['apple', 'google'] : ['google']
}

/**
 * Uygulamanin KURULU olup olmadigini sormak icin kullanilan semalar.
 *
 * iOS'ta `canOpenURL` yalnizca Info.plist'teki
 * LSApplicationQueriesSchemes listesinde BEYAN EDILEN semalari
 * sorabiliyor (app.json > ios.infoPlist). Beyan edilmezse cagri hata
 * vermeden HER ZAMAN false doner - yani beyan olmadan butun secenekler
 * gizlenirdi. Bu beyan NATIVE bir ayar: OTA ile gitmez, yeni derleme
 * ister.
 */
const SEMA: Record<'apple' | 'google', string> = {
  apple: 'maps://',
  google: 'comgooglemaps://',
}

/**
 * Yalnizca CIHAZDA KURULU olan haritalari dondurur (kullanicinin istegi
 * 2026-09-01: kurulu olmayan harita listede gorunmesin).
 *
 * `canOpenURL` bir nedenle patlarsa (web, izin, beklenmeyen durum) o
 * secenek ELENMIYOR, listede kaliyor: yol tarifi bulunmaz bir uygulama
 * icin gosterilse bile en fazla tarayicida acilir, ama yanlislikla
 * hepsini eleyip kullaniciyi yolsuz birakmak daha kotu olurdu.
 */
async function kuruluHaritalar(): Promise<('apple' | 'google')[]> {
  const adaylar = haritaSecenekleri()
  const sonuclar = await Promise.all(
    adaylar.map((secim) => Linking.canOpenURL(SEMA[secim]).catch(() => true))
  )
  const kurulular = adaylar.filter((_, i) => sonuclar[i])

  // HICBIRI cikmadiysa suzgeci UYGULAMIYORUZ, hepsini donduruyoruz.
  //
  // Sebep somut: Info.plist beyani NATIVE bir ayar ve OTA ile gitmiyor.
  // Bu kod beyansiz bir derlemeye OTA ile inerse canOpenURL her sema
  // icin false doner; suzgeci korumasiz uygulasaydik butun harita
  // secenekleri kaybolur ve yol tarifi hep tarayicida acilirdi - yani
  // calisan bir ozelligi bozmus olurduk.
  return kurulular.length > 0 ? kurulular : adaylar
}

/**
 * Harita adresleri. IKI KIP var ve ikisi gercekten farkli:
 *   'tarif'  -> yol tarifi acilir (hedef verilir)
 *   'goster' -> yalnizca konum haritada isaretlenir, rota cizilmez
 * Haritanin uzerindeki iki yuvarlak dugme bu ikisine karsilik geliyor.
 */
function haritaAdresi(secim: 'apple' | 'google', mekan: Mekan, kip: 'tarif' | 'goster') {
  const { lat, lng } = mekan.konum
  const ad = encodeURIComponent(mekan.ad)
  if (kip === 'goster') {
    return secim === 'apple'
      ? `https://maps.apple.com/?ll=${lat},${lng}&q=${ad}`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }
  if (secim === 'apple') {
    return `https://maps.apple.com/?daddr=${lat},${lng}&q=${ad}`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

/**
 * Avatar seridindeki ad: YALNIZCA ILK KELIME.
 *
 * `check_inler.kullanici_adi` tam adi tasiyor ("Orçun Özdemir") ve
 * 50 px'lik bir avatar kutusunda tam ad her zaman kirpiliyor. Referans
 * gorselde de tek isim var. Listelerde (liderlik / son check-inler) tam
 * ad duruyor - orada satir genis.
 */
function ilkAd(ad: string | null): string | null {
  if (!ad) return null
  return ad.trim().split(/\s+/)[0] || null
}

/** Bas harf: ad yoksa kullanici adi, o da yoksa soru isareti. */
function basHarf(ad: string | null): string {
  return (ad || '?').trim().charAt(0).toLocaleUpperCase('tr-TR') || '?'
}

type Sekme = 'liderlik' | 'son' | 'fotograf'

export default function MekanSayfasi() {
  const stiller = useStiller(stilleriYap)
  const renk = useRenk()
  const router = useRouter()
  const { t } = useDil()
  const { mekanId } = useLocalSearchParams<{ mekanId: string }>()

  const [mekan, setMekan] = useState<Mekan | null>(null)
  const [istatistik, setIstatistik] = useState<MekanIstatistikleri | null>(null)
  const [burdakiler, setBurdakiler] = useState<CheckInGorunumu[]>([])
  // Kimlik -> imzali profil fotografi. Akis ve bildirimler de ayni
  // yardimciyi kullaniyor; "kim gorunur" kurali RPC'de kaliyor.
  const [avatarlar, setAvatarlar] = useState<Record<string, string | null>>({})
  const avatarlariEkleRef = useRef<(kimlikler: string[]) => Promise<void> | undefined>(() => undefined)
  const [liderlik, setLiderlik] = useState<LiderlikSatiri[]>([])
  const [sonlar, setSonlar] = useState<SonCheckIn[]>([])
  const [sekme, setSekme] = useState<Sekme>('liderlik')
  const [hata, setHata] = useState<string | null>(null)
  const [secimAcik, setSecimAcik] = useState(false)
  const [sayfaKayabilir, setSayfaKayabilir] = useState(true)

  // ALT BUTONUN UC HALI (kullanicinin sectigi tasarim B, 2026-09-06).
  // Hangi hal gosterilecegi iki seye bagli: bu mekanda aktif check-in'in
  // var mi, ve mekana kac metre uzaktasin.
  const [aktif, setAktif] = useState<AktifCheckIn | null>(null)
  const [uzaklik, setUzaklik] = useState<number | null>(null)
  // Haritada TURUNCU noktayla ciziliyor: kullanici secilen mekana
  // olan mesafesini gorsel olarak da gorsun (istegi 2026-09-07).
  const [benimKonumum, setBenimKonumum] = useState<{ lat: number; lng: number } | null>(null)
  /*
   * ONAYLANMIS KAPAK FOTOGRAFI (2026-09-09). Kova private oldugu icin
   * imzali adres gerekiyor; gelmezse ekran fotografsiz ciziliyor -
   * kirik resim gostermektense hic gostermemek dogru.
   */
  const [kapakUrl, setKapakUrl] = useState<string | null>(null)
  const [ayriliyor, setAyriliyor] = useState(false)

  useEffect(() => {
    let gecerli = true

    // CEVRE MEKANLARI ARTIK CEKILMIYOR: harita yalnizca bu mekanin
    // ignesini gosteriyor (kullanicinin istegi 2026-09-07), yani o
    // istek bosa gidiyordu.
    mekaniGetir(mekanId)
      .then((bulunan) => {
        if (bulunan?.kapakFotograf) {
          mekanFotografiUrl(bulunan.kapakFotograf).then((url) => {
            if (gecerli) setKapakUrl(url)
          })
        }
        if (gecerli) setMekan(bulunan)
      })
      .catch((e) => {
        if (gecerli) setHata(hataMetni(e))
      })

    // Sayfanin geri kalani BAGIMSIZ yukleniyor: biri patlarsa digerleri
    // yine geliyor. Mekanin kendisi olmadan sayfa cizilemez, ama
    // istatistik olmadan cizilebilir - bu yuzden hatalari yutuyorlar.
    // Aktif check-in: bu mekandaysa buton "Ayril"a donuyor.
    aktifCheckInimiGetir().then((d) => gecerli && setAktif(d)).catch(() => {})

    mekanIstatistikleriniGetir(mekanId).then((d) => gecerli && setIstatistik(d)).catch(() => {})
    suAnBurdakileriGetir(mekanId)
      .then((d) => {
        if (!gecerli) return
        setBurdakiler(d)
        return avatarlariEkle(d.map((k) => k.kullaniciId))
      })
      .catch(() => {})
    mekanLiderligiGetir(mekanId)
      .then((d) => {
        if (!gecerli) return
        setLiderlik(d)
        return avatarlariEkle(d.map((k) => k.kullaniciId))
      })
      .catch(() => {})
    mekanSonCheckInleriGetir(mekanId)
      .then((d) => {
        if (!gecerli) return
        setSonlar(d)
        return avatarlariEkle(d.map((k) => k.kullaniciId))
      })
      .catch(() => {})

    // Uc liste de ayni kisileri tasiyabiliyor; avatarlar TEK bir
    // sozlukte birikiyor ve ayni kimlik icin ikinci kez cekilmiyor.
    // Fotograf galerisi de ayni yolu kullaniyor (ref uzerinden).
    avatarlariEkleRef.current = avatarlariEkle
    async function avatarlariEkle(kimlikler: string[]) {
      const yeniler = [...new Set(kimlikler)]
      if (yeniler.length === 0) return
      const ozetler = await profilOzetleriniGetir(yeniler).catch(() => ({}))
      if (!gecerli) return
      setAvatarlar((onceki) => {
        const sonuc = { ...onceki }
        for (const [id, o] of Object.entries(ozetler)) sonuc[id] = o.avatarUrl
        return sonuc
      })
    }

    return () => {
      gecerli = false
    }
  }, [mekanId])

  /**
   * MEKANA UZAKLIK - yalnizca butonun hali icin.
   *
   * Bu ekranin eski kurali "kullanicinin kendi konumu BURADA
   * KULLANILMIYOR" idi ve gerekcesi soyleydi: check-in baska bir gun
   * baska bir yerde yapilmis olabilir, "sana uzakligi" yaniltici olur.
   * O gerekce METIN icin hala gecerli - uzaklik listede ya da baslikta
   * GOSTERILMIYOR; yalnizca basilamayacak bir butonu onceden soluk
   * gostermek icin okunuyor.
   *
   * Konum alinamazsa (izin yok, ag yok, web'de reddedildi) uzaklik
   * `null` kaliyor ve buton NORMAL gorunuyor - bilmedigimiz bir sey
   * yuzunden kullaniciyi engellemek yanlis olurdu; o durumda kurali
   * yine sunucu uyguluyor.
   */
  useEffect(() => {
    if (!mekan) return
    let gecerli = true
    cihazKonumunuAl()
      .then((k) => {
        if (!gecerli) return
        setBenimKonumum(k)
        setUzaklik(mesafeMetre(k.lat, k.lng, mekan.konum.lat, mekan.konum.lng))
      })
      .catch(() => {})
    return () => {
      gecerli = false
    }
  }, [mekan])

  const buradayim = Boolean(aktif && aktif.mekanId === mekanId)
  const uzakta = uzaklik !== null && uzaklik > CHECK_IN_YARICAP_METRE

  /** "2,4 km" ya da "820 m" - buton metnindeki mesafe. */
  function mesafeYazisi(metre: number): string {
    return metre >= 1000
      ? `${(metre / 1000).toFixed(1).replace('.', ',')} km`
      : `${Math.round(metre)} m`
  }

  async function ayril() {
    if (!aktif) return
    setAyriliyor(true)
    try {
      await checkIndenAyril(aktif.id)
      setAktif(null)
      // Sayfa artik "0 kisi burada" gostermeli; sayilar ve liste
      // yeniden cekiliyor.
      mekanIstatistikleriniGetir(mekanId).then(setIstatistik).catch(() => {})
      suAnBurdakileriGetir(mekanId).then(setBurdakiler).catch(() => {})
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setAyriliyor(false)
    }
  }

  // Hangi kip icin secim yapiliyor: pencere kapandiginda hangi
  // adresin acilacagini bu belirliyor.
  const [kip, setKip] = useState<'tarif' | 'goster'>('tarif')

  function ac(secim: 'apple' | 'google', hangi: 'tarif' | 'goster' = kip) {
    setSecimAcik(false)
    if (!mekan) return
    Linking.openURL(haritaAdresi(secim, mekan, hangi))
  }

  /** Ustteki yuvarlak dugme: konumu haritada goster. */
  async function haritayiAc(hangi: 'tarif' | 'goster') {
    setKip(hangi)
    const secenekler = await kuruluHaritalar()
    if (secenekler.length <= 1) {
      ac(secenekler[0] ?? 'google', hangi)
      return
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...secenekler.map(secenekEtiketi), t('checkInHaritasi.vazgec')],
          cancelButtonIndex: secenekler.length,
        },
        (secilen) => {
          if (secilen < secenekler.length) ac(secenekler[secilen], hangi)
        }
      )
      return
    }
    setSecimAcik(true)
  }

  function secenekEtiketi(secim: 'apple' | 'google'): string {
    return secim === 'apple'
      ? t('checkInHaritasi.appleHaritalar')
      : t('checkInHaritasi.googleHaritalar')
  }

  /**
   * Secim penceresi PLATFORMA GORE (kullanicinin karari 2026-09-01):
   *
   *   iOS      -> sistemin KENDI ActionSheet'i. Kullanicinin telefonun
   *               her yerinde gordugu pencerenin aynisi.
   *   Android  -> Apple Haritalar zaten yok, yani secenek TEK; pencere
   *               hic acilmiyor, dogrudan Google Haritalar aciliyor.
   *   web      -> yerel karsiligi yok, kendi Modal'imiz kaliyor.
   */
  async function haritayaDokunuldu() {
    setKip('tarif')
    const secenekler = await kuruluHaritalar()

    // Hicbir harita uygulamasi yoksa yol tarifi TARAYICIDA aciliyor.
    if (secenekler.length === 0) {
      ac('google')
      return
    }

    if (secenekler.length === 1) {
      ac(secenekler[0])
      return
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...secenekler.map(secenekEtiketi), t('checkInHaritasi.vazgec')],
          cancelButtonIndex: secenekler.length,
        },
        (secilen) => {
          if (secilen < secenekler.length) ac(secenekler[secilen])
        }
      )
      return
    }

    setSecimAcik(true)
  }

  /**
   * KAYITLI ADRES - varsa gosteriliyor (kullanicinin karari
   * 2026-09-10).
   *
   * `mekanlar.adres` 2.311.583 kayitta (%39,6) dolu ve bugune kadar
   * HICBIR EKRANDA kullanilmiyordu. 2026-08-31'deki "yalnizca ilce ve
   * il, TAM DOGRULUK ADINA" karari bu alani da kullanim disi
   * birakmisti - ama o kararin gerekcesi TURETILMIS mahalleydi
   * (en yakin OSM noktasi, komsuluga yayma, kirli kaynak; ucu de
   * yanlis sonuc vermisti).
   *
   * BU ALAN TURETILMIS DEGIL ve dort ayri olcumle dogrulandi
   * (2026-09-10):
   *   1. `fsq-indir.py` Foursquare'in `address` sutununu DOGRUDAN
   *      aliyor; depoda ters cografi kodlama yalnizca yeni mekan
   *      EKLEME ekraninda ve orada kullanici onayliyor.
   *   2. Doluluk %35,6 - koordinattan turetilseydi %100 olurdu,
   *      cunku her kaydin koordinati var.
   *   3. Ayni koordinatta birden fazla kayit olan 5.823 noktanin
   *      %63'unde adresler FARKLI - makine ureten olsa ayni olurdu.
   *   4. Yazim bicimleri insan izi tasiyor: 'Mahallesi' 257.394,
   *      'Mah.' 208.632, 'mahallesi' 78.122, 'Mh.' 44.838...
   *
   * IKI SATIR, cunku ikisi FARKLI SEY soyluyor: adres bir BEYAN
   * (serbest metin, eksik ya da kisa olabilir), ilce/il ise
   * koordinatin hangi resmi sinir poligonuna duestuegue - kesin.
   * Adres "Ada Sk. No:1" gibi kisa oldugunda ikinci satir olmasa
   * kullanici hangi sehirde oldugunu bilemezdi.
   */
  const kayitliAdres = mekan?.adres?.trim() || null
  const idariSatir =
    [mekan?.mahalle, mekan?.semt, mekan?.il].filter(Boolean).join(', ') || null

  /*
   * TEKRARI ONLE: bazi adresler ilceyi zaten iceriyor ("... Merkez
   * Osmangazi -Bursa/Türkiye"). O durumda ikinci satir ayni bilgiyi
   * ikinci kez yazardi.
   */
  const idariGoster =
    idariSatir !== null &&
    !(
      kayitliAdres !== null &&
      mekan?.semt != null &&
      kayitliAdres.toLocaleLowerCase('tr').includes(mekan.semt.toLocaleLowerCase('tr'))
    )

  // Avatar seridinde en fazla ALTI kisi; gerisi "+N" rozetine giriyor.
  // Sayi ustteki istatistikten geliyor, listeden DEGIL - liste RLS ile
  // suzuldugu icin daha kisa olabilir ve "+N" o farki da kapsiyor.
  const GORUNEN_AVATAR = 6
  const gorunenler = burdakiler.slice(0, GORUNEN_AVATAR)
  const toplamBurada = istatistik?.suAnKisi ?? burdakiler.length
  const kalanBurada = Math.max(0, toplamBurada - gorunenler.length)

  return (
    <View style={stiller.kok}>
      {/* UST CUBUKTA MEKAN ADI YOK (kullanicinin istegi 2026-09-06):
          "Konum isimleri ustte yazmasin, altlarinda yaziyor zaten."
          Ad haritanin hemen altinda ve orada TAM haliyle duruyor;
          ustte ayrica gostermek hem tekrar hem de uzun adlarda
          kirpiliyordu ("Nilüfer Tüvtürk Araç ..."). Baslik bos
          kalinca cubuk da kompaktlasiyor ve sayfa yukari geliyor. */}
      {/* UC NOKTA KALDIRILDI (kullanicinin istegi 2026-09-09: "en
          ustte sagda uc nokta var onu kaldir").

          ISLEV KAYBI YOK, once kontrol edildi: menude tek bir secim
          vardi ("Haritada ac") ve o secim `haritayaDokunuldu`
          cagiriyordu - baslik satirindaki "Yol tarifi al" dugmesinin
          CAGIRDIGI FONKSIYONUN AYNISI. Yani ayni eylemin iki girisi
          vardi; biri kalkti. */}
      <UstCubuk baslik="" geriEtiketi={t('checkInHaritasi.geri')} />

      {/* HARITA KAYDIRILIRKEN SAYFA KILITLENIYOR. Ikisi de dikey
          kayabildigi icin tek parmak hareketi ikisini birden
          oynatiyordu; ayni cakisma kesfet ekraninda da yasanmisti
          (2026-08-30) ve orada harita kaydirmasi kapatilarak
          cozulmustu. Burada harita kaydirilabilir olmak zorunda, o
          yuzden sayfa geri cekiliyor. */}
      <ScrollView
        contentContainerStyle={stiller.icerik}
        showsVerticalScrollIndicator={false}
        scrollEnabled={sayfaKayabilir}
      >
        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {mekan && (
          <>
            <View>
              {/* HARITA ARTIK ETKILESIMLI (kullanicinin istegi
                  2026-09-07: "haritayi kipirdatabiliyim yakinlastirip
                  uzaklastirabiliyim").

                  Onceki kural "harita dokunmatik degil, bir dugme"ydi
                  (2026-08-30) ve gerekcesi soyleydi: ayni alan hem
                  kaydirilip hem "basilinca acilan" bir dugme olamaz.
                  Kullanici kaydirmayi sectigi icin harita uygulamasini
                  acma isi TAMAMEN sagdaki iki yuvarlak dugmeye ve
                  "Yol tarifi al"a kaldi - islev kaybolmadi.

                  YALNIZCA BU MEKANIN IGNESI: `mekanlar={[]}`. Cevre
                  mekanlari da ciziliyordu ve sayfa "bu mekan nerede"
                  sorusunu cevaplarken ekranda alti ad birden
                  duruyordu. Igne listesi bos olunca `CanliHarita`
                  cerceveyi en dar haline (100 m) aliyor, yani sokak ve
                  cadde adlari okunur oluyor - kullanicinin istedigi
                  yakinlik. */}
              <View
                style={stiller.haritaCercevesi}
                onTouchStart={() => setSayfaKayabilir(false)}
                onTouchEnd={() => setSayfaKayabilir(true)}
                onTouchCancel={() => setSayfaKayabilir(true)}
              >
                <CanliHarita
                  merkez={mekan.konum}
                  mekanlar={[]}
                  yukseklik={210}
                  merkezDurumu={mekanDurumu({
                    kisiSayisi: istatistik?.suAnKisi ?? 0,
                    toplamCheckIn: istatistik?.toplamCheckIn ?? 0,
                  })}
                  kullaniciKonumu={benimKonumum}
                />
              </View>

              {/* IKI YUVARLAK DUGME KALDIRILDI (kullanicinin istegi
                  2026-09-09: "harita uzerinde sagda iki tane ikon var
                  onlari kaldir").

                  ISLEV KAYBI KONTROL EDILDI: "Yol tarifi" ayni ekranda
                  baslik satirindaki butonda duruyor. "Haritada goster"
                  icin ayri bir giris kalmadi, ama harita zaten ekranda
                  ve etkilesimli - yakinlastirip kaydirilabiliyor.

                  Yerlerine MESAFE GOSTERGESI geldi (ayni gun, "bulundugu
                  adresten sectigi konuma mesafe gostergesi olsun").
                  Konum okunamazsa hic cizilmiyor: bilmedigimiz bir seyi
                  yazmak yerine sessiz kalmak dogru. */}
              {uzaklik !== null && (
                <View style={stiller.mesafeHapi} pointerEvents="none">
                  <Text style={stiller.mesafeYazisi}>{mesafeYazisi(uzaklik)}</Text>
                </View>
              )}
            </View>

            {/* KAPAK FOTOGRAFI - onaylanmis bir duzenleme talebinden
                geliyor (2026-09-09). Yoksa hic cizilmiyor: bos bir
                gorsel kutusu sayfayi uzatmaktan baska bir sey yapmaz. */}
            {kapakUrl && (
              <Image
                source={{ uri: kapakUrl }}
                style={stiller.kapak}
                resizeMode="cover"
                accessibilityRole="image"
                accessibilityLabel={`${mekan.ad} fotoğrafı`}
                testID="mekan-kapak"
              />
            )}

            <View style={stiller.baslikSatiri}>
              <View style={stiller.bilgi}>
                <Text style={stiller.ad}>{mekan.ad}</Text>
                {kayitliAdres && (
                  <Text style={stiller.adres} testID="mekan-adresi">
                    {kayitliAdres}
                  </Text>
                )}
                {idariGoster && (
                  <Text
                    style={[stiller.adres, kayitliAdres != null && stiller.adresIdari]}
                    testID="mekan-idari"
                  >
                    {idariSatir}
                  </Text>
                )}
                {/* DUZENLEME TALEBI GIRISI (kullanicinin istegi
                    2026-09-09). Ikincil ve kucuk: sayfanin asil eylemi
                    check-in, bu bir duzeltme kapisi. Ust cubuktaki uc
                    nokta ayni gun kaldirildigi icin giris buraya,
                    duzeltilecek bilginin YANINA kondu. */}
                <Pressable
                  onPress={() => router.push(`/mekanlar/duzenle/${mekanId}` as never)}
                  accessibilityRole="button"
                  hitSlop={8}
                  testID="duzenleme-talebi"
                >
                  <Text style={stiller.duzeltYazi}>Bilgileri düzelt</Text>
                </Pressable>
              </View>
              <Pressable
                style={stiller.tarifDugmesi}
                onPress={haritayaDokunuldu}
                accessibilityRole="button"
                testID="yol-tarifi-al"
              >
                <ArabaIkonu boyut={22} />
                <Text style={stiller.tarifYazi}>{t('mekanSayfasi.yolTarifi')}</Text>
              </Pressable>
            </View>

            {/* KAPANDI SERIDI (2026-09-11).

                Mekan listelerden ve aramadan duesueyor ama SAYFASI
                aciliyor: eski bir check-in kartindan buraya gelinebilir
                ve o ani silinmemeli (`check_inler.mekan_id` cascade -
                mekani silmek insanlarin gecmisini goturur).

                SEBEBI YAZIYOR: alttaki cubuk sessizce calismasaydi
                kullanici "uygulama bozuk" diye okurdu (ayni ders
                2026-09-08'de galeri izninde ogrenildi). */}
            {mekan.kapali && (
              <View style={stiller.kapandiSerit} testID="mekan-kapandi">
                <Text style={stiller.kapandiBaslik}>{t('mekanSayfasi.kapandi')}</Text>
                <Text style={stiller.kapandiMetin}>{t('mekanSayfasi.kapandiAciklama')}</Text>
              </View>
            )}

            {/* UC SAYI. Sayfanin tek amaci bu serit: "burasi canli mi,
                bugun hareket var mi, cevrede ne kadar one cikiyor".

                UCU DE AYNI YAPIDA: ikon ustte, buyuk sayi ortada, kucuk
                etiket altta. Ilk denemede orta kutu farkli kurulmustu
                ("Bugun" ustte, "23 check-in" altta) ve 390 px'lik bir
                ekranda ikiye bolunuyordu - uc sutuna bolunmus bir seritte
                yan yana yazi icin yer yok. */}
            <View style={stiller.olcuSeridi}>
              <View style={stiller.olcu}>
                <KisilerIkonu boyut={21} />
                <View style={stiller.olcuMetin}>
                  <View style={stiller.olcuSayiSatiri}>
                    <Text style={stiller.olcuSayi}>{toplamBurada}</Text>
                    {toplamBurada > 0 && <View style={stiller.canliNokta} />}
                  </View>
                  <Text style={stiller.olcuEtiket} numberOfLines={1}>
                    {t('mekanSayfasi.kisiBurada')}
                  </Text>
                </View>
              </View>

              <View style={stiller.olcuAyirac} />

              <View style={stiller.olcu}>
                <CubukIkonu boyut={20} />
                <View style={stiller.olcuMetin}>
                  <Text style={stiller.olcuUst} numberOfLines={1}>
                    {t('mekanSayfasi.bugun')}
                  </Text>
                  <Text style={stiller.olcuSayi} numberOfLines={1}>
                    {t('mekanSayfasi.checkInSayisi', { sayi: istatistik?.bugunCheckIn ?? 0 })}
                  </Text>
                </View>
              </View>

              <View style={stiller.olcuAyirac} />

              <View style={[stiller.olcu, stiller.olcuGenis]}>
                <YildizIkonu boyut={21} />
                <View style={stiller.olcuMetin}>
                  {/* Sira YOKSA (ilce bilinmiyor ya da hic check-in yok)
                      uydurma bir "#1" gostermiyoruz - cizgi koyuyoruz. */}
                  <Text style={stiller.olcuSayi}>
                    {istatistik?.ilceSirasi ? `#${istatistik.ilceSirasi}` : '—'}
                  </Text>
                  {/* IKI SATIRA izin veriliyor: 390 px'lik ekranda uc
                      sutuna bolununce "Nilüfer'deki yerler" tek satira
                      sigmiyor ve kirpiliyordu. Referansta tek satir ama
                      orada gorsel daha genis - kirpmak yerine sarmak
                      dogru. */}
                  <Text style={stiller.olcuEtiket} numberOfLines={2}>
                    {istatistik?.ilce
                      ? t('mekanSayfasi.ilcedekiYerler', { ilce: istatistik.ilce })
                      : t('mekanSayfasi.siralamaYok')}
                  </Text>
                </View>
              </View>
            </View>

            {/* SU AN BURADA. Kimse gorunmuyorsa bolum HIC cizilmiyor -
                bos bir serit "burada kimse yok" demek degil, "senin
                gorme hakkin yok" da demek olabilir; ikisini birbirine
                karistiran bir bosluk gostermektense hic gostermiyoruz.
                Sayi zaten ustteki seritte duruyor. */}
            {gorunenler.length > 0 && (
              <View style={stiller.bolum}>
                <View style={stiller.bolumBasligi}>
                  <View style={stiller.canliNoktaBuyuk} />
                  <Text style={stiller.bolumBaslikYazi}>{t('mekanSayfasi.suAnBurada')}</Text>
                  <Text style={stiller.bolumSag}>
                    {t('mekanSayfasi.kisiSayisi', { sayi: toplamBurada })}
                  </Text>
                  <OkIkonu boyut={15} />
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={stiller.avatarSeridi}
                >
                  {gorunenler.map((kisi) => (
                    <Pressable
                      key={kisi.id}
                      style={stiller.avatarKutu}
                      onPress={() => router.push(`/kullanici/${kisi.kullaniciId}` as never)}
                      accessibilityRole="button"
                      accessibilityLabel={kisi.kullaniciAdi ?? t('mekanSayfasi.biri')}
                    >
                      <View style={stiller.avatar}>
                        {avatarlar[kisi.kullaniciId] ? (
                          <Image
                            testID={`avatar-${kisi.kullaniciId}`}
                            source={{ uri: avatarlar[kisi.kullaniciId] as string }}
                            style={stiller.avatarGorsel}
                          />
                        ) : (
                          <Text style={stiller.avatarHarf}>{basHarf(kisi.kullaniciAdi)}</Text>
                        )}
                        <View style={stiller.avatarCanli} />
                      </View>
                      <Text style={stiller.avatarAd} numberOfLines={1}>
                        {ilkAd(kisi.kullaniciAdi) ?? t('mekanSayfasi.biri')}
                      </Text>
                    </Pressable>
                  ))}

                  {kalanBurada > 0 && (
                    <View style={stiller.avatarKutu}>
                      <View style={[stiller.avatar, stiller.avatarKalan]}>
                        <Text style={stiller.avatarKalanYazi}>+{kalanBurada}</Text>
                      </View>
                      <Text style={stiller.avatarAd}>{t('mekanSayfasi.diger')}</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

            {/* IKI SEKME */}
            <View style={stiller.sekmeler}>
              <Pressable
                style={[stiller.sekme, sekme === 'liderlik' && stiller.sekmeAktif]}
                onPress={() => setSekme('liderlik')}
                accessibilityRole="button"
                testID="sekme-liderlik"
              >
                <KupaIkonu boyut={15} renk={sekme === 'liderlik' ? '#FFFFFF' : renk.metinIkincil} />
                <Text style={[stiller.sekmeYazi, sekme === 'liderlik' && stiller.sekmeYaziAktif]}>
                  {t('mekanSayfasi.liderlik')}
                </Text>
              </Pressable>
              <Pressable
                style={[stiller.sekme, sekme === 'son' && stiller.sekmeAktif]}
                onPress={() => setSekme('son')}
                accessibilityRole="button"
                testID="sekme-son"
              >
                <SaatIkonu boyut={15} renk={sekme === 'son' ? '#FFFFFF' : renk.metinIkincil} />
                <Text style={[stiller.sekmeYazi, sekme === 'son' && stiller.sekmeYaziAktif]}>
                  {t('mekanSayfasi.sonCheckInler')}
                </Text>
              </Pressable>
              {/* FOTOGRAFLAR (kullanicinin istegi 2026-09-13): check-in'lere
                  konan fotograflar. */}
              <Pressable
                style={[stiller.sekme, sekme === 'fotograf' && stiller.sekmeAktif]}
                onPress={() => setSekme('fotograf')}
                accessibilityRole="button"
                testID="sekme-fotograf"
              >
                <FotografIkonu boyut={15} renk={sekme === 'fotograf' ? '#FFFFFF' : renk.metinIkincil} />
                <Text style={[stiller.sekmeYazi, sekme === 'fotograf' && stiller.sekmeYaziAktif]}>
                  {t('mekanSayfasi.fotograflar')}
                </Text>
              </Pressable>
            </View>

            <View style={[stiller.liste, sekme === 'fotograf' && stiller.listeGaleri]}>
              {sekme === 'fotograf' ? (
                <MekanFotografGalerisi
                  mekanId={mekanId}
                  mekanAdi={mekan.ad}
                  avatarlar={avatarlar}
                  onKimlikler={(k) => void avatarlariEkleRef.current(k)}
                />
              ) : sekme === 'liderlik' ? (
                liderlik.length === 0 ? (
                  <Text style={stiller.bos}>{t('mekanSayfasi.liderlikBos')}</Text>
                ) : (
                  liderlik.map((satir, sira) => (
                    <Pressable
                      key={satir.kullaniciId}
                      style={[stiller.listeSatiri, sira > 0 && stiller.listeAyirac]}
                      onPress={() => router.push(`/kullanici/${satir.kullaniciId}` as never)}
                      accessibilityRole="button"
                    >
                      {/* PROFILDEKI "En sik" listesiyle AYNI ROZET
                          (kullanicinin istegi 2026-09-09). Onceden
                          burada duz SVG daireler vardi ve ayni sira
                          iki ekranda iki turlu gorunuyordu. */}
                      <SiraRozeti sira={sira + 1} boyut={34} />
                      <View style={stiller.kucukAvatar}>
                        {avatarlar[satir.kullaniciId] ? (
                          <Image
                            source={{ uri: avatarlar[satir.kullaniciId] as string }}
                            style={stiller.kucukAvatarGorsel}
                          />
                        ) : (
                          <Text style={stiller.kucukAvatarHarf}>
                            {basHarf(satir.kullaniciAdi)}
                          </Text>
                        )}
                      </View>
                      <View style={stiller.listeOrta}>
                        <Text style={stiller.listeAd} numberOfLines={1}>
                          {satir.kullaniciAdi ?? t('mekanSayfasi.biri')}
                        </Text>
                        <Text style={stiller.listeAlt}>
                          {t('mekanSayfasi.checkInSayisi', { sayi: satir.checkInSayisi })}
                        </Text>
                      </View>
                      {/* Tac YALNIZCA birincide: referanstaki gibi.
                          Ikinci ve ucuncude madalya zaten sirayi
                          soyluyor, tac orada anlamsiz tekrar olurdu. */}
                      {sira === 0 && <TacIkonu boyut={17} />}
                      <Text style={stiller.listeSayi}>{satir.checkInSayisi}</Text>
                    </Pressable>
                  ))
                )
              ) : sonlar.length === 0 ? (
                <Text style={stiller.bos}>{t('mekanSayfasi.sonBos')}</Text>
              ) : (
                sonlar.map((satir, sira) => (
                  <Pressable
                    key={satir.id}
                    style={[stiller.listeSatiri, sira > 0 && stiller.listeAyirac]}
                    onPress={() => router.push(`/kullanici/${satir.kullaniciId}` as never)}
                    accessibilityRole="button"
                  >
                    <View style={stiller.kucukAvatar}>
                      {avatarlar[satir.kullaniciId] ? (
                        <Image
                          source={{ uri: avatarlar[satir.kullaniciId] as string }}
                          style={stiller.kucukAvatarGorsel}
                        />
                      ) : (
                        <Text style={stiller.kucukAvatarHarf}>{basHarf(satir.kullaniciAdi)}</Text>
                      )}
                      {satir.canliMi && <View style={stiller.avatarCanli} />}
                    </View>
                    <View style={stiller.listeOrta}>
                      <Text style={stiller.listeAd} numberOfLines={1}>
                        {satir.kullaniciAdi ?? t('mekanSayfasi.biri')}
                      </Text>
                      {/* Not VARSA gosteriliyor - o da RLS'ten gecmis
                          bir icerik, yani gormeye hakkimiz var.
                          Not yoksa satir HIC cizilmiyor: ilk halde
                          oraya gorece zaman konuyordu ve sagdaki zamanla
                          birebir ayni metni tekrar ediyordu. */}
                      {satir.notMetni && (
                        <Text style={stiller.listeAlt} numberOfLines={1}>
                          {satir.notMetni}
                        </Text>
                      )}
                    </View>
                    <Text style={stiller.listeZaman}>
                      {satir.canliMi
                        ? t('mekanSayfasi.suAn')
                        : gorecelZaman(satir.olusturmaZamani, t)}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* ALTA YAPISIK CHECK-IN CUBUGU (kullanicinin sectigi tasarim B).
          ScrollView'in DISINDA duruyor: React Native'de `position:
          sticky` yok, bu yuzden "kaydirsan da altta kalan" bir oge
          ancak kaydirilan alanin disina konarak yapiliyor. Alt gezinme
          cubugunun hemen ustunde.

          UC HALI VAR:
            buradayim -> "Buradasın · Ayrıl"   (aktif check-in bu mekanda)
            uzakta    -> soluk, mesafeyi yazar (1 km kurali)
            digeri    -> "Buraya check-in yap"

          Uzaklik BILINMIYORSA (konum izni yok, web'de reddedildi)
          buton normal gorunuyor - bilmedigimiz bir sey yuzunden
          engellemek yerine kurali sunucuya birakiyoruz.

          KAPANMIS MEKANDA CUBUK HIC CIZILMIYOR (2026-09-11) - sebep
          zaten yukaridaki seritte yaziyor, basilamayan bir buton
          gostermek tekrar olurdu. TEK ISTISNA: kisi SU AN oradaysa
          "Ayril" duruyor, yoksa check-in'ini bitirmenin yolu kalmazdi.
          Kural ayrica SUNUCUDA: `check_in_yap` kapali mekani
          reddediyor. */}
      {mekan && (buradayim || !mekan.kapali) && (
        <View style={stiller.sabitCubuk} pointerEvents="box-none">
          {buradayim ? (
            <Pressable
              style={[stiller.cubukDugme, stiller.cubukBuradayim]}
              onPress={ayril}
              disabled={ayriliyor}
              accessibilityRole="button"
              testID="checkin-cubugu"
            >
              <Text style={stiller.cubukBuradayimYazi}>
                {t('mekanSayfasi.buradasinAyril')}
              </Text>
            </Pressable>
          ) : uzakta ? (
            <View style={[stiller.cubukDugme, stiller.cubukUzak]} testID="checkin-cubugu">
              <Text style={stiller.cubukUzakYazi}>
                {t('mekanSayfasi.yaklas', { mesafe: mesafeYazisi(uzaklik as number) })}
              </Text>
            </View>
          ) : (
            <Pressable
              style={[stiller.cubukDugme, stiller.cubukBirincil]}
              onPress={() => router.push(`/check-in/${mekanId}` as never)}
              accessibilityRole="button"
              testID="checkin-cubugu"
            >
              <Text style={stiller.cubukBirincilYazi}>
                {t('mekanSayfasi.buradaCheckIn')}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Harita secim penceresi ekranin ALTINDAN geliyor.
          `Alert.alert` kullanilmadi: react-native-web'de calismiyor ve
          uygulama tarayicidan da aciliyor.
          MODAL kullanildi cunku alt gezinme cubugu kokte `<Slot />`den
          SONRA ciziliyor; ekranin kendi icine konan bir pencere cubugun
          ALTINDA kaliyor ve ust uste biniyordu (2026-08-30). */}
      <Modal
        visible={secimAcik}
        transparent
        animationType="fade"
        onRequestClose={() => setSecimAcik(false)}
      >
        <View style={stiller.modalKok}>
          <Pressable
            style={stiller.perde}
            onPress={() => setSecimAcik(false)}
            accessibilityRole="button"
            accessibilityLabel={t('checkInHaritasi.vazgec')}
          />
          <View style={stiller.sayfa}>
            <Text style={stiller.sayfaBaslik}>{t('checkInHaritasi.secimBaslik')}</Text>

            {haritaSecenekleri().map((secenek) => (
              <Pressable
                key={secenek}
                style={stiller.secenek}
                onPress={() => ac(secenek)}
                accessibilityRole="button"
              >
                <Text style={stiller.secenekYazi}>{secenekEtiketi(secenek)}</Text>
              </Pressable>
            ))}

            <Pressable
              style={stiller.vazgec}
              onPress={() => setSecimAcik(false)}
              accessibilityRole="button"
            >
              <Text style={stiller.vazgecYazi}>{t('checkInHaritasi.vazgec')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

/** Sabit cubugun kapladigi dikey yer (dugme + alt/ust payi). */
const CUBUK_YERI = 62

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.sayfa,
    // Sabit cubuk icerigin USTUNE biniyor; alt pay onun yuksekligini de
    // kapsamali, yoksa listenin son satiri butonun altinda kaliyor.
    paddingBottom: ALT_GEZINME_PAYI + CUBUK_YERI,
    gap: 14,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
  },
  haritaCercevesi: {
    borderRadius: yuvarlak.kart,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  // Iki dugme dikey dizili, referanstaki gibi. Konteyner mutlak,
  // dugmelerin kendisi akista - boylece aralarindaki bosluk `gap` ile
  // veriliyor ve ikisini ayri ayri konumlandirmak gerekmiyor.
  /**
   * MESAFE GOSTERGESI - haritanin sag altinda kucuk bir hap.
   *
   * Konumun kendisi degil ARADAKI UZAKLIK yaziyor; kullanicinin
   * sordugu soru "buraya ne kadar var". Beyaz zemin ve koyu yazi
   * SABIT: harita iki modda da acik, dolayisiyla uzerindeki her sey
   * acik zemine gore secilir (ayni kural igne etiketlerinde de var).
   */
  mesafeHapi: {
    position: 'absolute',
    right: bosluk.m,
    bottom: bosluk.m,
    backgroundColor: '#FFFFFF',
    borderRadius: yuvarlak.hap,
    paddingHorizontal: bosluk.m,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  mesafeYazisi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: '#17130F',
  },

  kapak: {
    width: '100%',
    height: 150,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.cizgi,
    marginBottom: bosluk.m,
  },
  duzeltYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.turuncuYazi,
    marginTop: 2,
  },
  baslikSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
  },
  /* KAPANDI SERIDI notr bir yuzey, turuncu DEGIL: turuncu bu uygulamada
     "eylem ya da su an oluyor" demek (kimlik kurali) ve burada
     anlatilan sey tam tersi - artik hicbir sey olmuyor. */
  kapandiSerit: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    padding: bosluk.m,
    marginTop: bosluk.m,
    gap: bosluk.xs,
  },
  kapandiBaslik: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  kapandiMetin: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  bilgi: { flex: 1, gap: 2 },
  ad: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 17,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  adres: {
    fontFamily: yazi.govde,
    fontSize: 12,
    lineHeight: 17,
    color: renk.metinIkincil,
  },
  /*
   * Ilce/il satiri, KAYITLI ADRESIN ALTINDA daha soluk.
   *
   * Ikisi ayni tonda olsaydi iki satir tek bir adres bloguymus gibi
   * okunurdu; oysa ustteki bir BEYAN, alttaki kesin bir hesap.
   * Hiyerarsi tonla anlatiliyor - adres yokken satir tek basina
   * kaliyor ve normal tonunu koruyor.
   */
  adresIdari: { color: renk.metinSoluk },
  // Turuncu KENARLIKLI, dolu degil: sayfadaki tek dolu turuncu alt
  // gezinmedeki check-in dugmesi ve o baska bir eylem. Ikisi de dolu
  // olsaydi hangisinin asil eylem oldugu belirsizlesirdi.
  tarifDugmesi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.4,
    borderColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  tarifYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.turuncuYazi,
  },

  // OLCULER SIKI, cunku 390 px'lik bir ekranda uc sutuna bolununce
  // her kutuya ~95 px kaliyor ve "23 check-in" oraya ancak siginin
  // sinirinda oturuyor. Ilk denemede once ucuncu kutu ("Nilüfer'deki
  // yerler") kirpildi, pay verilince bu kez ORTA kutu kirpildi
  // ("0 check…"). Ikisini birden kurtaran sey yalnizca ikonu, bosluklari
  // ve ic payi kismak oldu. Referans gorsel ~914 px genislikte
  // uretildigi icin orada bu sikisma gorunmuyor.
  olcuSeridi: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.kart,
    paddingVertical: 13,
    paddingHorizontal: bosluk.s,
  },
  // Referans duzeni: ikon SOLDA, yaninda iki satir. 390 px'lik ekranda
  // uc sutuna bolununce yer dar - bu yuzden sayi `govde` boyutunda
  // (altBaslik degil) ve etiketler tek satira kilitli.
  olcu: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  olcuAyirac: {
    width: 1,
    height: 34,
    backgroundColor: renk.cizgi,
  },
  // Ucuncu kutu digerlerinden GENIS: ilce adi en uzun metin.
  olcuGenis: { flex: 1.22 },
  olcuMetin: { flex: 1, minWidth: 0 },
  olcuSayiSatiri: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  olcuSayi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.kucuk,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  olcuUst: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },
  olcuEtiket: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    lineHeight: 14,
    color: renk.metinIkincil,
  },
  canliNokta: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2FBF5B',
  },

  bolum: { gap: bosluk.s },
  bolumBasligi: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  canliNoktaBuyuk: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: renk.turuncu,
  },
  bolumBaslikYazi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 15,
    color: renk.metin,
  },
  bolumSag: {
    marginLeft: 'auto',
    fontFamily: yazi.govdeOrta,
    fontSize: 12,
    color: renk.metinIkincil,
  },

  // Oge basina ~56 px: alti tanesi 342 px'lik icerik genisligine
  // siginiyor, yedincisi kayiyor. Ilk olcude 70 px'ti ve BES avatar
  // bile tasiyordu.
  // Referansta avatarlar neredeyse bitisik: merkez araligi 107 px,
  // cap 104 px - yani aradaki bosluk 3 px'e denk geliyor. Boylece
  // alti avatar + "+1" tek ekrana siginiyor.
  avatarSeridi: { gap: 3, paddingVertical: 2, paddingRight: bosluk.m },
  avatarKutu: { alignItems: 'center', width: 47, gap: 4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.turuncuZemin,
    borderWidth: 1.8,
    borderColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHarf: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.turuncuYazi,
  },
  // Fotograf cemberin ICINE oturuyor: kenarlik disarida kaliyor, yani
  // turuncu halka gorselin uzerine binmiyor.
  avatarGorsel: { width: '100%', height: '100%', borderRadius: 20 },
  // Yesil nokta "su an burada" demek; turuncu cemberin uzerinde ayri
  // bir renk olmasi lazim ki halkayla karismasin.
  avatarCanli: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#2FBF5B',
    borderWidth: 2,
    borderColor: renk.zemin,
  },
  avatarKalan: { borderColor: 'transparent' },
  avatarKalanYazi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.turuncuYazi,
  },
  avatarAd: {
    fontFamily: yazi.govde,
    fontSize: 10,
    color: renk.metinIkincil,
    maxWidth: 47,
  },

  sekmeler: {
    flexDirection: 'row',
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    padding: 3,
    gap: 3,
  },
  sekme: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: yuvarlak.hap,
  },
  sekmeAktif: { backgroundColor: renk.turuncu },
  sekmeYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  sekmeYaziAktif: { color: '#FFFFFF' },

  liste: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    paddingHorizontal: bosluk.m,
  },
  // Fotograf izgarasi kenardan kenara; kartin ic payi ve kenarligi
  // ona dar gelir.
  listeGaleri: { paddingHorizontal: 0, borderWidth: 0, backgroundColor: 'transparent', overflow: 'hidden' },
  listeSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 9,
  },
  listeAyirac: { borderTopWidth: 1, borderTopColor: renk.cizgi },
  kucukAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: renk.turuncuZemin,
    borderWidth: 1.5,
    borderColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kucukAvatarHarf: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.kucuk,
    color: renk.turuncuYazi,
  },
  kucukAvatarGorsel: { width: '100%', height: '100%', borderRadius: 15 },
  listeOrta: { flex: 1, minWidth: 0 },
  listeAd: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },
  listeAlt: {
    fontFamily: yazi.govde,
    fontSize: 10,
    color: renk.metinIkincil,
  },
  listeSayi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.turuncuYazi,
  },
  listeZaman: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },
  bos: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    paddingVertical: bosluk.l,
    textAlign: 'center',
  },

  // Cubuk alt gezinmenin USTUNDE duruyor.
  //
  // OLCULDU: ilk denemede `ALT_GEZINME_PAYI - 26` yazilmisti ve buton
  // gezinme cubugunun ALTINDA kaliyordu - yarisi orutuluyordu.
  // `ALT_GEZINME_PAYI` (104 + guvenli alan) gezinme cubugunun ust
  // kenarindan yalnizca birkac piksel yukarisi; cubugun ustunde
  // durabilmesi icin ondan CIKARMAK degil EKLEMEK gerekiyor.
  sabitCubuk: {
    position: 'absolute',
    left: bosluk.sayfa,
    right: bosluk.sayfa,
    bottom: ALT_GEZINME_PAYI + 8,
  },
  cubukDugme: {
    borderRadius: yuvarlak.hap,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cubukBirincil: {
    backgroundColor: renk.turuncu,
    ...golge.yuzer,
  },
  cubukBirincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
  // UZAK hali basilamiyor ve bunu RENKLE soyluyor: dolgu notr, yazi
  // soluk. Turuncu birakip yalnizca opaklik dusurmek "yukleniyor" gibi
  // okunurdu.
  cubukUzak: {
    backgroundColor: renk.cizgi,
  },
  cubukUzakYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
  // BURADASIN hali hayalet: eylem artik "gel" degil "ayril", yani
  // tesvik edilen bir sey degil.
  cubukBuradayim: {
    backgroundColor: renk.yuzey,
    borderWidth: 1.5,
    borderColor: renk.turuncu,
    ...golge.yuzer,
  },
  cubukBuradayimYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.turuncuYazi,
  },

  modalKok: { flex: 1, justifyContent: 'flex-end' },
  perde: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(23, 19, 15, 0.35)',
  },
  sayfa: {
    marginHorizontal: bosluk.m,
    marginBottom: bosluk.xl,
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.buyuk,
    padding: bosluk.l,
    gap: bosluk.s,
    ...golge.yuzer,
  },
  sayfaBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.metin,
    textAlign: 'center',
    marginBottom: bosluk.xs,
  },
  secenek: {
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secenekYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.turuncuYazi,
  },
  vazgec: { paddingVertical: 12, alignItems: 'center' },
  vazgecYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
})
