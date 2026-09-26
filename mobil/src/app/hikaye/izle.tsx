import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { Image } from 'expo-image'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler'
import Svg, { Path, Circle } from 'react-native-svg'
import { useDil } from '../../../lib/dil'
import {
  hikayeAkisiniGetir,
  hikayeGoruntulendi,
  hikayeEmojisiBirak,
  sikEmojileriGetir,
  hikayeGoruntuleyenleriGetir,
  hikayeSil,
  hikayeyeYanitVer,
  ANI_KART_ORANI,
  anlikArsiviniGetir,
  anlikAktifMi,
  type HikayeGrubu,
  seritOnbelleginiOku,
} from '../../../lib/hikaye'
import { gorecelZaman } from '../../../lib/zaman'
import { konumuDuzelt, VARSAYILAN_KONUM } from '../../../lib/hikaye'
import { EGRI, useHareket } from '../../tasarim/hareket'
import { Avatar } from '../../tasarim/Avatar'
import { UcNoktaIkonu } from '../../tasarim/SecimPenceresi'
import { HareketliDugme } from '../../tasarim/HareketliDugme'
import { AnlikMenusu, type AnlikMenuSecimi } from '../../tasarim/AnlikMenusu'
import { AnlikSilOnayi } from '../../tasarim/AnlikSilOnayi'
import { KisiListesiSayfasi } from '../../tasarim/KisiListesiSayfasi'
import { IfadeCipi } from '../../tasarim/IfadeSecici'
import { EmojiSayfasi } from '../../tasarim/EmojiSayfasi'
import { HikayeOgesi } from '../../tasarim/HikayeOgesi'
import { KonumHapi } from '../../tasarim/KonumHapi'
import { ifadeBul } from '../../../lib/ifadeler'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'

/** Dikey surukleme kapatma esikleri - FotografGezgini ile ayni. */
const KAPATMA_MESAFESI = 120
const KAPATMA_HIZI = 900

/** Komsu kareler bu kadar sonra indirilir - gorunen kareyi geciktirmesin. */
const ON_YUKLEME_GECIKMESI_MS = 600

/** Yatay kaydirmada kisi degistirme esikleri (Instagram: sola = sonraki hesap). */
const KISI_GECIS_MESAFESI = 70
const KISI_GECIS_HIZI = 650

/** Kartin ustundeki (ilerleme + kimlik) ve altindaki (ifade seridi /
 *  gorenler) bloklarin guvenli alan disindaki boylari. */
const UST_BLOK_BOYU = 84
const ALT_BLOK_BOYU = 96

/**
 * HIKAYE IZLEYICI (2026-09-22). `/hikaye/izle?kullanici=<id>`: seridin
 * verdigi kisiden baslar; kisi bitince sonraki kisiye gecer, son kisi
 * bitince kapanir. Ustte kisi basina ilerleme cubuklari (5 sn), sag
 * dokunus ileri, sol dokunus geri, basili tutmak durdurur, dikey
 * surukleme kapatir (FotografGezgini deseni).
 *
 * Veriyi KENDISI ceker (`hikayeAkisiniGetir`): seritten parametreyle
 * gruplari tasimak yerine taze okur - baska ekranda gecen surede
 * hikaye silinmis ya da suresi dolmus olabilir.
 *
 * Goruntuleme: baskasinin hikayesi ekrana gelince `hikaye_goruntulendi`
 * (sunucu kendi hikayemi ve gorunmeyeni zaten atliyor). Sahibi altta
 * "N kisi gordu" -> KisiListesiSayfasi (kim hangi ifadeyi atti); baskasi
 * altta IFADE SERIDI - yalnizca ifade atabilir, mesaj/kalp yok
 * (2026-09-24, kullanicinin karari). Fotograf paylasanin gordugu AYNI
 * kartta (ANI_KART_ORANI, cover) - izleyen tam o kareyi gorur. Uc nokta: sahibiyse Sil (onayli), degilse
 * Sikayet et (mevcut sikayet ekrani, hedef 'hikaye').
 *
 * Alt gezinme bu rotada gizli (`_layout.tsx`).
 */
export default function HikayeIzleEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const guvenliAlan = useSafeAreaInsets()
  const hareket = useHareket()
  // `arsiv=<id>`: ANLIK ARSIVI (2026-09-24) - kisinin kendi butun
  // anliklari tek grup, verilen anliktan acilir.
  const { kullanici, arsiv } = useLocalSearchParams<{ kullanici?: string; arsiv?: string }>()

  const [gruplar, setGruplar] = useState<HikayeGrubu[] | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [konum, setKonum] = useState<{ g: number; h: number }>({ g: 0, h: 0 })
  const [menuAcik, setMenuAcik] = useState(false)
  const [silOnayi, setSilOnayi] = useState(false)
  const [gorenlerAcik, setGorenlerAcik] = useState(false)
  const [yanitDurumu, setYanitDurumu] = useState<string | null>(null)
  /** Baskasinin anliklarina biraktigim emoji (anlik id -> emoji | null);
   *  gorme kaydi sunucudan doner, secim yerelde aninda yazilir. */
  const [emojilerim, setEmojilerim] = useState<Record<string, string | null>>({})
  const emojilerimRef = useRef(emojilerim)
  emojilerimRef.current = emojilerim
  const [sikEmojiler, setSikEmojiler] = useState<string[]>(VARSAYILAN_EMOJILER)
  const [emojiSayfasiAcik, setEmojiSayfasiAcik] = useState(false)
  useEffect(() => {
    // 18: satirda ilk 6, emoji sayfasinin "Onerilenler"inde 18.
    sikEmojileriGetir(18)
      .then((l) => {
        if (l.length > 0) setSikEmojiler(l)
      })
      .catch(() => {})
  }, [])
  const [mesaj, setMesaj] = useState('')
  const { width: ekranEni, height: ekranBoyu } = useWindowDimensions()
  /** Fotograf alaninin olcusu: etiketler oransal konumlarindan piksele
   *  bu olcuyle cevriliyor (2026-09-23). */
  const [ogeAlani, setOgeAlani] = useState({ en: 0, boy: 0 })
  // Basili tutulurken arayuz gizlenir (Instagram): fotografin onunde
  // hicbir sey kalmaz. Yalnizca gorsel - zamanlayici zaten duruyor.
  const [basiliTutuluyor, setBasiliTutuluyor] = useState(false)

  const grup = gruplar?.[konum.g] ?? null
  const hikaye = grup?.hikayeler[konum.h] ?? null

  // ---- Yukleme ----
  /**
   * SERIDIN VERISIYLE ANINDA AC (kullanicinin bildirimi 2026-09-22:
   * "hikayeler arasi gecis cok kotu surekli yeniden yukleniyor").
   *
   * Izleyici acilirken `hikaye_akisi` + `akis_profilleri` + imzalama
   * bastan kosuyordu; olculdu, ilk fotograf 1581 ms sonra geliyordu.
   * Oysa ana sayfadaki serit AYNI veriyi saniyeler once cekip
   * onbellege yazmisti. Artik once o veriyle aciliyor (dokunuldugu an
   * kare hazir), tazeleme ARKADA kosuyor ve yalnizca liste degistiyse
   * yaziyor.
   */
  function konumuSec(g: HikayeGrubu[]) {
    const baslangic = Math.max(0, g.findIndex((x) => x.kullaniciId === kullanici))
    // Baslangic hikayesi: ilk GORULMEMIS, hepsi gorulmusse ilk.
    const ilkGorulmemis = g[baslangic]?.hikayeler.findIndex((h) => !h.gordum) ?? -1
    return { g: baslangic, h: ilkGorulmemis >= 0 ? ilkGorulmemis : 0 }
  }

  useEffect(() => {
    let gecerli = true
    if (arsiv) {
      anlikArsiviniGetir()
        .then((g) => {
          if (!gecerli) return
          const liste = g && g.hikayeler.length > 0 ? [g] : []
          setGruplar(liste)
          setKonum({ g: 0, h: Math.max(0, g?.hikayeler.findIndex((h) => h.id === arsiv) ?? 0) })
        })
        .catch((e) => {
          if (gecerli) setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
        })
      return () => {
        gecerli = false
      }
    }
    const onbellekli = seritOnbelleginiOku()?.gruplar
    if (onbellekli && onbellekli.length > 0) {
      setGruplar(onbellekli)
      setKonum(konumuSec(onbellekli))
    }
    hikayeAkisiniGetir()
      .then((g) => {
        if (!gecerli) return
        setGruplar(g)
        // Konum YALNIZCA ilk yuklemede seciliyor: onbellekten acildiysa
        // kullanici bu arada ilerlemis olabilir, onu geri sarmayiz.
        if (!onbellekli || onbellekli.length === 0) setKonum(konumuSec(g))
      })
      .catch((e) => {
        if (gecerli && !onbellekli) setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
      })
    return () => {
      gecerli = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kullanici, arsiv])

  // ---- Kapatma / gezinme ----
  function kapat() {
    if (router.canGoBack()) router.back()
    else router.replace('/' as never)
  }
  const kapatRef = useRef(kapat)
  kapatRef.current = kapat

  const konumRef = useRef(konum)
  konumRef.current = konum
  const gruplarRef = useRef(gruplar)
  gruplarRef.current = gruplar

  const ileri = useCallback(() => {
    const g = gruplarRef.current
    const k = konumRef.current
    if (!g || !g[k.g]) return
    if (k.h + 1 < g[k.g].hikayeler.length) setKonum({ g: k.g, h: k.h + 1 })
    else if (k.g + 1 < g.length) setKonum({ g: k.g + 1, h: 0 })
    else kapatRef.current()
  }, [])

  const geri = useCallback(() => {
    const g = gruplarRef.current
    const k = konumRef.current
    if (!g) return
    if (k.h > 0) setKonum({ g: k.g, h: k.h - 1 })
    else if (k.g > 0) setKonum({ g: k.g - 1, h: 0 })
    else setKonum({ g: 0, h: 0 })
  }, [])

  /**
   * KISI GECISI (Instagram: sola kaydir = sonraki hesap, saga kaydir =
   * onceki hesap). Dokunustan FARKLI: dokunus ayni kisinin hikayeleri
   * arasinda gezer, kaydirma kisiyi atlar. Son kisiden ileri kaydirmak
   * izleyiciyi kapatir (Instagram da boyle).
   */
  const sonrakiKisi = useCallback(() => {
    const g = gruplarRef.current
    const k = konumRef.current
    if (!g) return
    if (k.g + 1 < g.length) setKonum({ g: k.g + 1, h: 0 })
    else kapatRef.current()
  }, [])

  const oncekiKisi = useCallback(() => {
    const k = konumRef.current
    if (k.g > 0) setKonum({ g: k.g - 1, h: 0 })
    else setKonum({ g: 0, h: 0 })
  }, [])

  // ---- Zamanlayici YOK (2026-09-24, kullanicinin karari) ----
  // "Sureli olmayacaklar; uzerine basilirsa ya da kaydirilirsa gecilecek,
  // ustteki dolma ibaresini kaldir." Anliklar kendiliginden GECMEZ;
  // dokunus ve kaydirma gezinir, cubuk cizilmez. `ilerleme` ve
  // duraklatma kancalari zararsiz kaldi (basili tutunca arayuz gizlenmesi
  // hala onlara bagli).
  const ilerleme = useRef(new Animated.Value(0)).current
  const duraklatildi = menuAcik || silOnayi || gorenlerAcik
  const duraklatildiRef = useRef(duraklatildi)
  duraklatildiRef.current = duraklatildi
  const basiliRef = useRef(false)

  const oynat = useCallback(
    (baslangicDegeri: number) => {
      ilerleme.stopAnimation()
      ilerleme.setValue(baslangicDegeri)
    },
    [ilerleme]
  )

  const durdur = useCallback(() => {
    ilerleme.stopAnimation()
  }, [ilerleme])

  // Hikaye degisince: sifirdan baslat + goruntuleme kaydi.
  useEffect(() => {
    if (!hikaye || !grup) return
    if (!duraklatildiRef.current && !basiliRef.current) oynat(0)
    else ilerleme.setValue(0)
    // Kendi anligimda da (2026-09-26): sunucu sahibi Gorenler'e yazmaz,
    // yalnizca `sahip_gordu` bayragini koyar.
    // Baskasinin anliginda HER acilista (sunucu tekrari yok sayar): donen
    // deger bu anliga daha once biraktigim emoji - satir secili acilsin.
    if (!arsiv && !grup.benimMi && !(hikaye.id in emojilerimRef.current)) {
      const id = hikaye.id
      hikayeGoruntulendi(id)
        .then((emoji) => setEmojilerim((m) => (id in m ? m : { ...m, [id]: emoji ?? null })))
        .catch(() => {})
    }
    if (!hikaye.gordum && !arsiv) {
      if (grup.benimMi) hikayeGoruntulendi(hikaye.id).catch(() => {})
      // Yerelde isaretle: geri gelince tekrar kaydetmesin, serit dogru cizsin.
      setGruplar((g) =>
        g
          ? g.map((x) =>
              x.kullaniciId !== grup.kullaniciId
                ? x
                : { ...x, hikayeler: x.hikayeler.map((h) => (h.id === hikaye.id ? { ...h, gordum: true } : h)) }
            )
          : g
      )
    }
    return () => {
      ilerleme.stopAnimation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hikaye?.id])

  /**
   * ON YUKLEME (Instagram deseni). Olculdu: her ileri gecisinde yeni bir
   * medya istegi gidiyor ve kare ~390 ms sonra beliriyordu; geri
   * donuste (dosya artik onbellekte) 66 ms. Yani gecikme indirmenin
   * kendisi. Artik gorunen karenin KOMSULARI onceden indiriliyor:
   * ayni kisinin sonraki iki ve onceki bir hikayesi + SONRAKI KISININ
   * ilk hikayesi (yatay kaydirma oraya gidiyor).
   */
  const komsuAdreslerRef = useRef<string[]>([])
  function komsulariIndir() {
    const adresler = komsuAdreslerRef.current
    if (adresler.length > 0) Image.prefetch(adresler, { cachePolicy: 'memory-disk' })
  }

  useEffect(() => {
    if (!gruplar) return
    const adresler: string[] = []
    const grupSimdi = gruplar[konum.g]
    if (grupSimdi) {
      for (const i of [konum.h + 1, konum.h + 2, konum.h - 1]) {
        const url = grupSimdi.hikayeler[i]?.fotografUrl
        if (url) adresler.push(url)
      }
    }
    const sonrakiGrup = gruplar[konum.g + 1]?.hikayeler[0]?.fotografUrl
    if (sonrakiGrup) adresler.push(sonrakiGrup)
    if (adresler.length === 0) return

    /*
     * GORUNEN KARENIN ONUNE GECMESIN. Ilk yazimda on yukleme kare
     * cizilirken basliyordu ve olcumde acilis 1581 -> 3683 ms'ye
     * CIKTI: ayni bant genisligini paylasan uc indirme, bakilan
     * fotografi geciktiriyordu. Artik kisa bir gecikmeyle, yani
     * gorunen kare indikten sonra basliyor.
     */
    komsuAdreslerRef.current = adresler
    // Asil tetikleyici gorunen karenin `onLoadEnd`i; bu zamanlayici
    // yalnizca YEDEK (kare onbellekten geldiyse ya da hic yuklenmezse
    // olay gelmeyebilir). `prefetch` ayni adres icin zararsiz.
    const zamanlayici = setTimeout(komsulariIndir, ON_YUKLEME_GECIKMESI_MS)
    return () => clearTimeout(zamanlayici)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gruplar, konum])

  // Pencere acilinca dur, kapaninca kaldigi yerden devam.
  useEffect(() => {
    if (!hikaye) return
    if (duraklatildi) durdur()
    else if (!basiliRef.current) ilerleme.stopAnimation((deger) => oynat(deger))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duraklatildi])

  // Ekrandan ayrilinca (sikayet, profil) dur; donunce devam.
  useFocusEffect(
    useCallback(() => {
      if (hikaye && !duraklatildiRef.current) ilerleme.stopAnimation((deger) => oynat(deger))
      return () => durdur()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hikaye?.id])
  )

  function basiliBasladi() {
    basiliRef.current = true
    setBasiliTutuluyor(true)
    durdur()
  }
  function basiliBitti() {
    basiliRef.current = false
    setBasiliTutuluyor(false)
    if (!duraklatildiRef.current) ilerleme.stopAnimation((deger) => oynat(deger))
  }

  // ---- Surukleme: Instagram'in dort yonu ----
  /*
   * Instagram'in izleyicisinde tek bir surukleme DORT sonuc verir ve
   * hangisi oldugu parmagin BASKIN YONUYLE belirlenir:
   *   asagi  -> kapat
   *   yukari -> izleyenler (kendi hikayen; baskasininkinde bos)
   *   sola   -> SONRAKI KISI      saga -> ONCEKI KISI
   * Dokunus ile karistirilmamali: dokunus AYNI kisinin hikayeleri
   * arasinda gezer, kaydirma kisiyi atlar.
   *
   * Onceden yalnizca dikey vardi ve YUKARI da kapatiyordu (fotograf
   * gezgininden gelen desen). Instagram'da yukari kaydirma kapatmaz -
   * yanit/izleyen acar; kullanicinin istegi uzerine (2026-09-22,
   * "Instagram'in hikaye isleyisini tam ogren ve aynisini yap") bu
   * ekranda Instagram davranisi gecerli. Fotograf gezginindeki
   * "yukari da kapatir" kurali DEGISMEDI, o ayri bir ekran.
   */
  const surukleme = useRef(new Animated.Value(0)).current
  // Menu acikken arkadaki anlik %94'e geri cekilir (Secenek A, 2026-09-26).
  const menuGeriCekme = useRef(new Animated.Value(1)).current
  useEffect(() => {
    Animated.spring(menuGeriCekme, { toValue: menuAcik ? 0.94 : 1, speed: 16, bounciness: menuAcik ? 4 : 6, useNativeDriver: true }).start()
  }, [menuAcik, menuGeriCekme])
  const yatay = useRef(new Animated.Value(0)).current
  const solma = surukleme.interpolate({ inputRange: [-320, 0, 320], outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' })

  /**
   * Yukari kaydirma: KENDI hikayende izleyen listesini acar. Baskasinin
   * hikayesinde artik bir sey yapmiyor - yanit yazma kutusu kullanicinin
   * istegiyle kaldirildi (2026-09-22), tepki icin alttaki emojiler var.
   */
  const yukariAc = useCallback(() => {
    const g = gruplarRef.current?.[konumRef.current.g]
    const h = g?.hikayeler[konumRef.current.h]
    if (g?.benimMi && h && anlikAktifMi(h.bitis)) setGorenlerAcik(true)
  }, [])

  function suruklemeyiYerineOturt() {
    if (hareket) {
      Animated.spring(surukleme, { toValue: 0, speed: 22, bounciness: 4, useNativeDriver: true }).start()
      Animated.spring(yatay, { toValue: 0, speed: 22, bounciness: 4, useNativeDriver: true }).start()
    } else {
      surukleme.setValue(0)
      yatay.setValue(0)
    }
  }

  const suruklemeHareketi = useMemo(
    () =>
      Gesture.Pan()
        .withTestId('hikaye-surukleme')
        .maxPointers(1)
        .minDistance(12)
        // ARAYUZ YALNIZCA SURUKLEME BASLAYINCA (12 px) GIZLENIR. Onceden
        // `onBegin`deydi: parmak ekrana DEGDIGI AN (yanit kutusu, Gonder,
        // emoji dahil) arayuz gizlenip pointerEvents 'none' oluyor ve o
        // dokunus gecersiz kaliyordu - "Yanit ver calismiyor" (2026-09-26).
        // Basili tutunca gizleme sol/sag dokunma bolgelerinde (basiliBasladi).
        .onStart(() => {
          basiliRef.current = true
          setBasiliTutuluyor(true)
          durdur()
        })
        .onUpdate((e) => {
          // Parmak hangi yonde baskinsa yalnizca o eksen kayar; ikisi
          // birden kayarsa hareket "hangi karar verilecek" belirsizlesir.
          if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
            yatay.setValue(e.translationX)
            surukleme.setValue(0)
          } else {
            surukleme.setValue(e.translationY)
            yatay.setValue(0)
          }
        })
        .onEnd((e) => {
          basiliRef.current = false
          setBasiliTutuluyor(false)
          const yatayMi = Math.abs(e.translationX) > Math.abs(e.translationY)

          if (yatayMi) {
            const gecer =
              Math.abs(e.translationX) > KISI_GECIS_MESAFESI || Math.abs(e.velocityX) > KISI_GECIS_HIZI
            if (gecer) {
              // Sola kaydirma (negatif) SONRAKI kisi.
              if (e.translationX < 0) sonrakiKisi()
              else oncekiKisi()
              yatay.setValue(0)
              return
            }
          } else {
            if (e.translationY > KAPATMA_MESAFESI || e.velocityY > KAPATMA_HIZI) {
              kapatRef.current()
              return
            }
            if (e.translationY < -KAPATMA_MESAFESI || e.velocityY < -KAPATMA_HIZI) {
              suruklemeyiYerineOturt()
              yukariAc()
              return
            }
          }

          suruklemeyiYerineOturt()
          if (!duraklatildiRef.current) ilerleme.stopAnimation((deger) => oynat(deger))
        })
        .onFinalize(() => {
          basiliRef.current = false
          setBasiliTutuluyor(false)
        })
        .runOnJS(true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hareket, sonrakiKisi, oncekiKisi, yukariAc]
  )

  // ---- Eylemler ----
  async function sil() {
    if (!hikaye || !grup) return
    setSilOnayi(false)
    try {
      await hikayeSil(hikaye.id)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
      return
    }
    const kalan = grup.hikayeler.filter((h) => h.id !== hikaye.id)
    if (kalan.length === 0) {
      const yeniGruplar = (gruplar ?? []).filter((x) => x.kullaniciId !== grup.kullaniciId)
      if (yeniGruplar.length === 0 || konum.g >= yeniGruplar.length) {
        kapat()
        return
      }
      setGruplar(yeniGruplar)
      setKonum({ g: konum.g, h: 0 })
      return
    }
    setGruplar((g) => (g ? g.map((x) => (x.kullaniciId === grup.kullaniciId ? { ...x, hikayeler: kalan } : x)) : g))
    setKonum({ g: konum.g, h: Math.min(konum.h, kalan.length - 1) })
  }

  function sikayetEt() {
    if (!hikaye || !grup) return
    router.push(`/sikayet?hedefTur=hikaye&hedefId=${hikaye.id}&kullaniciId=${grup.kullaniciId}` as never)
  }



  /** Durum satiri kisa sure gorunur. */
  function durumYaz(metin: string) {
    setYanitDurumu(metin)
    setTimeout(() => setYanitDurumu(null), 1800)
  }

  /** EMOJI BIRAK (kullanicinin istegi 2026-09-26: once ifade seti, ayni
   *  gun "standart emoji seti yap"): dokunmak emojiyi anliga birakir,
   *  ayni emojiye yeniden dokunmak kaldirir. Iyimser; sunucu reddederse
   *  eski secime doner ve sebep yazilir. Sahibi Gorenler'de gorur. */
  async function emojiSec(emoji: string | null) {
    if (!hikaye || !grup || grup.benimMi) return
    const id = hikaye.id
    const onceki = emojilerim[id] ?? null
    const yeni = emoji === onceki ? null : emoji
    setEmojilerim((m) => ({ ...m, [id]: yeni }))
    try {
      await hikayeEmojisiBirak(id, yeni)
    } catch (e) {
      setEmojilerim((m) => ({ ...m, [id]: onceki }))
      durumYaz(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  /** "Yanit ver" kutusu: yazilan metin sohbete yanit olarak gider. */
  async function mesajiGonder() {
    const metin = mesaj.trim()
    if (!metin || !grup || grup.benimMi) return
    setMesaj('')
    try {
      await hikayeyeYanitVer(grup.kullaniciId, t('hikaye.yanitOnEki'), metin)
      durumYaz(t('hikaye.yanitGonderildi'))
    } catch (e) {
      durumYaz(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  // ---- Cizim ----
  if (hata) {
    return (
      <View style={[stiller.zemin, stiller.orta]} testID="hikaye-izle">
        <Text style={stiller.durum}>{hata}</Text>
        <Pressable onPress={kapat} style={stiller.kapatDugmeBuyuk} accessibilityRole="button" testID="hikaye-kapat">
          <Text style={stiller.kapatDugmeYazi}>{t('hikaye.kapat')}</Text>
        </Pressable>
      </View>
    )
  }
  if (!gruplar) {
    return (
      <View style={[stiller.zemin, stiller.orta]} testID="hikaye-izle">
        <Text style={stiller.durum}>{t('hikaye.yukleniyor')}</Text>
      </View>
    )
  }
  if (!grup || !hikaye) {
    return (
      <View style={[stiller.zemin, stiller.orta]} testID="hikaye-izle">
        <Text style={stiller.durum} testID="hikaye-yok">
          {t('hikaye.bulunamadi')}
        </Text>
        <Pressable onPress={kapat} style={stiller.kapatDugmeBuyuk} accessibilityRole="button" testID="hikaye-kapat">
          <Text style={stiller.kapatDugmeYazi}>{t('hikaye.kapat')}</Text>
        </Pressable>
      </View>
    )
  }

  // Kart: oran sabit (ANI_KART_ORANI), kisa ekranda yalnizca eni kuculur.
  const ustPay = guvenliAlan.top + UST_BLOK_BOYU
  const altPay = guvenliAlan.bottom + ALT_BLOK_BOYU
  const kartEn = Math.max(200, Math.min(ekranEni - bosluk.sayfa * 2, (ekranBoyu - ustPay - altPay - (grup.benimMi ? 56 : 112)) * ANI_KART_ORANI))

  const secimler: AnlikMenuSecimi[] = grup.benimMi
    ? [{ etiket: t('hikaye.sil'), ikon: 'cop', yikici: true, testID: 'hikaye-menu-sil', onSec: () => setSilOnayi(true) }]
    : [{ etiket: t('kullanici.sikayetEt'), ikon: 'bayrak', yikici: true, testID: 'hikaye-menu-sikayet', onSec: sikayetEt }]
  const menuAltBilgi = [
    gorecelZaman(hikaye.olusturuldu, t),
    grup.benimMi && anlikAktifMi(hikaye.bitis) ? t('hikaye.kisiGordu', { sayi: hikaye.goruntulenmeSayisi }) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <GestureHandlerRootView style={stiller.zemin} testID="hikaye-izle">
      <GestureDetector gesture={suruklemeHareketi}>
        <Animated.View style={[stiller.sahne, { opacity: solma, transform: [{ translateY: surukleme }] }]}>
          {/* Dokunma bolgeleri: sol 1/3 geri, sag 2/3 ileri; basili tut durdur. */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={stiller.dokunmaSatiri}>
              <Pressable style={stiller.solBolge} onPress={geri} onPressIn={basiliBasladi} onPressOut={basiliBitti} accessibilityRole="button" accessibilityLabel={t('hikaye.onceki')} testID="hikaye-geri" />
              <Pressable style={stiller.sagBolge} onPress={ileri} onPressIn={basiliBasladi} onPressOut={basiliBitti} accessibilityRole="button" accessibilityLabel={t('hikaye.sonraki')} testID="hikaye-ileri" />
            </View>
          </View>

          {/* ANI KARTI (2026-09-24): paylasanin cektigi kare, AYNI oranda
              ve ayni kirpmayla (cover). Dokunma bolgelerinin USTUNDE ama
              box-none: fotografa dokunus alttaki ileri/geri bolgelerine
              gecer; yalnizca eski anilardaki etiketler ve mekan satiri
              dokunulabilir. */}
          <Animated.View
            style={[stiller.kartSutunu, { paddingTop: ustPay, paddingBottom: altPay, transform: [{ scale: menuGeriCekme }] }]}
            pointerEvents="box-none"
          >
            <View style={[stiller.kart, { width: kartEn }]} pointerEvents="box-none" testID="hikaye-kart">
              {hikaye.fotografUrl && (
                <Image
                  source={{ uri: hikaye.fotografUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  pointerEvents="none"
                  // Bellek + disk onbellegi ACIKCA: ayni hikayeye geri
                  // donuldugunde dosya yeniden indirilmemeli.
                  cachePolicy="memory-disk"
                  // Gecerken bilesen GERI DONUSUYOR; anahtar verilmezse
                  // expo-image eski kareyi yenisiyle karistiriyor.
                  recyclingKey={hikaye.id}
                  // Kare ANINDA degissin: solma efekti gecikme gibi okunuyor.
                  transition={0}
                  // Gorunen kare indi: SIRA komsularda. Boylece on yukleme
                  // bakilan fotografin bant genisligini calmiyor (olculdu:
                  // once basladiginda acilis 1581 -> 3683 ms'ye cikiyordu).
                  onLoadEnd={komsulariIndir}
                  testID={`hikaye-fotograf-${hikaye.id}`}
                />
              )}
              {/* ETIKETLER FOTOGRAFIN UZERINDE, paylasanin biraktigi yerde
                  (2026-09-22 referansi). Konumlar oransal; `konumuDuzelt`
                  bozuk/eksik degeri varsayilana dusuruyor. Izleyicide
                  surukleme YOK - yalnizca dokunma hedefleri. */}
              <View
                style={StyleSheet.absoluteFill}
                pointerEvents="box-none"
                onLayout={(o) => {
                  const { width, height } = o.nativeEvent.layout
                  if (width !== ogeAlani.en || height !== ogeAlani.boy) setOgeAlani({ en: width, boy: height })
                }}
                testID="hikaye-ogeler"
              >
                {hikaye.yazi ? (
                  <HikayeOgesi
                    konum={konumuDuzelt(hikaye.yerlesim?.yazi, VARSAYILAN_KONUM.yazi)}
                    alan={ogeAlani}
                    duzenlenebilir={false}
                    testID="hikaye-oge-yazi"
                  >
                    <Text style={stiller.tuvalYazi} testID="hikaye-yazi-metni">
                      {hikaye.yazi}
                    </Text>
                  </HikayeOgesi>
                ) : null}

                {hikaye.ifade ? (
                  <HikayeOgesi
                    konum={konumuDuzelt(hikaye.yerlesim?.ifade, VARSAYILAN_KONUM.ifade)}
                    alan={ogeAlani}
                    duzenlenebilir={false}
                    testID="hikaye-oge-ifade"
                  >
                    {ifadeBul(hikaye.ifade) ? (
                      <Image source={ifadeBul(hikaye.ifade)!.kaynak} style={stiller.tuvalIfade} contentFit="contain" />
                    ) : null}
                  </HikayeOgesi>
                ) : null}


                {hikaye.etiketler.map((e, i) => (
                  <HikayeOgesi
                    key={e.kullaniciId}
                    konum={konumuDuzelt(hikaye.yerlesim?.etiketler?.[e.kullaniciId], { x: 0.5, y: 0.84 + i * 0.05, olcek: 1 })}
                    alan={ogeAlani}
                    duzenlenebilir={false}
                    testID={`hikaye-oge-etiket-${e.kullaniciId}`}
                  >
                    <Pressable
                      onPress={() => router.push(`/kullanici/${e.kullaniciId}` as never)}
                      accessibilityRole="link"
                      testID={`hikaye-etiketli-${e.kullaniciId}`}
                      style={stiller.etiketHapi}
                    >
                      <Text style={stiller.etiketHapiYazi}>@{e.kullaniciAdi}</Text>
                    </Pressable>
                  </HikayeOgesi>
                ))}
              </View>
            </View>

            {/* STANDART EMOJILER fotografin BITTIGI yerde (kullanicinin
                karari 2026-09-24), yalnizca baskasinin anliginda. */}
            {!grup.benimMi ? (
              <EmojiSatiri
                sik={sikEmojiler}
                secili={emojilerim[hikaye.id] ?? null}
                onSec={emojiSec}
                onDahaFazla={() => setEmojiSayfasiAcik(true)}
                gizli={basiliTutuluyor}
              />
            ) : null}

            {/* KONUM fotografin ALTINDA ortada, "Anlık ekle"deki hapla ayni
                gorunum (kullanicinin istegi 2026-09-24); basinca mekan sayfasi. */}
            {hikaye.mekanAdi ? (
              <View style={basiliTutuluyor && stiller.gizli}>
                <KonumHapi
                  ad={hikaye.mekanAdi}
                  onPress={() => hikaye.mekanId && router.push(`/harita/${hikaye.mekanId}` as never)}
                  testID="hikaye-mekan"
                  erisimRolu="link"
                />
              </View>
            ) : null}
          </Animated.View>

          {/* Ust: SIRA GOSTERGESI + kimlik. Zamanlayici YOK (2026-09-24);
              gosterge yalnizca KAC anlik oldugunu ve hangisinde olundugunu
              soyler, gecince ilerler (kullanicinin istegi 2026-09-26). */}
          {/* BASILI TUTARKEN ARAYUZ GIZLENIR (Instagram): fotografin onunde
              hicbir sey kalmaz. Yalnizca gorsel - zamanlayici zaten duruyor. */}
          <View
            testID="hikaye-ust"
            style={[stiller.ust, { paddingTop: guvenliAlan.top + bosluk.s }, basiliTutuluyor && stiller.gizli]}
            pointerEvents={basiliTutuluyor ? 'none' : 'box-none'}
          >
            <SiraGostergesi adet={grup.hikayeler.length} sira={konum.h} kimlik={grup.kullaniciId} />
            <View style={stiller.kimlikSatiri}>
              <Pressable
                style={stiller.kimlik}
                onPress={() => router.push((grup.benimMi ? '/profil' : `/kullanici/${grup.kullaniciId}`) as never)}
                accessibilityRole="link"
                testID="hikaye-kimlik"
              >
                <Avatar fotografUrl={grup.avatarUrl} ad={grup.ad} kullaniciAdi={grup.kullaniciAdi} cap={38} />
                <View style={stiller.kimlikMetinleri}>
                  <View style={stiller.adSatiri}>
                    <Text style={stiller.ad} numberOfLines={1}>
                      {grup.kullaniciAdi}
                    </Text>
                    <Text style={stiller.zaman}>{gorecelZaman(hikaye.olusturuldu, t)}</Text>
                  </View>
                </View>
              </Pressable>
              {/* Uc nokta ve × HAREKETLI (kullanicinin istegi 2026-09-26):
                  yari saydam daire, yayli giris, basinca yayli kuculme. */}
              <HareketliDugme sira={0} kucukme={0.86} onPress={() => setMenuAcik(true)} etiket={t('hikaye.secenekler')} testID="hikaye-menu" style={stiller.ustDugme}>
                <UcNoktaIkonu boyut={22} renk="#FFFFFF" />
              </HareketliDugme>
              <HareketliDugme sira={1} kucukme={0.86} onPress={kapat} etiket={t('hikaye.kapat')} testID="hikaye-kapat" style={stiller.ustDugme}>
                <KapatCarpisi />
              </HareketliDugme>
            </View>
          </View>

          {/* Alt: yazi + (gorenler | yanit) */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[stiller.altKap, basiliTutuluyor && stiller.gizli]}
            pointerEvents={basiliTutuluyor ? 'none' : 'box-none'}
          >
            <View style={[stiller.alt, { paddingBottom: guvenliAlan.bottom + bosluk.m }]} pointerEvents="box-none">
              {grup.benimMi ? (
                /* KENDI HIKAYEM: mesaj kutusunun yerinde GORENLER ve SIL
                   (kullanicinin karari 2026-09-22). */
                <View style={stiller.sahipSatiri} testID="hikaye-sahip-eylemleri">
                  {/* Gorenler 24 saatte silinir: arsivdeki (suresi dolmus)
                      anlikta liste yok, dugme de yok. */}
                  {anlikAktifMi(hikaye.bitis) ? (
                  <Pressable onPress={() => setGorenlerAcik(true)} style={stiller.gorenler} accessibilityRole="button" testID="hikaye-gorenler">
                    <GozCizimi />
                    <Text style={stiller.gorenlerYazi}>{t('hikaye.kisiGordu', { sayi: hikaye.goruntulenmeSayisi })}</Text>
                  </Pressable>
                  ) : (
                    <View />
                  )}
                  {/* Sil YALNIZCA uc nokta menusunde (kullanicinin istegi 2026-09-26). */}
                </View>
              ) : (
                /* BASKASININ ANLIGI: en altta "Yanit ver" (2026-09-24);
                   yazilan sohbete yanit olarak gider. */
                <View style={stiller.mesajKutusu} testID="hikaye-yanit-satiri">
                  <TextInput
                    style={stiller.mesajGirdi}
                    value={mesaj}
                    onChangeText={setMesaj}
                    placeholder={t('hikaye.yanitYerTutucu')}
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    returnKeyType="send"
                    onSubmitEditing={mesajiGonder}
                    testID="hikaye-mesaj"
                  />
                  {mesaj.trim() !== '' && (
                    <Pressable onPress={mesajiGonder} accessibilityRole="button" accessibilityLabel={t('hikaye.gonder')} testID="hikaye-mesaj-gonder" hitSlop={8}>
                      <Text style={stiller.gonderYazi}>{t('hikaye.gonder')}</Text>
                    </Pressable>
                  )}
                </View>
              )}
              {yanitDurumu && (
                <Text style={stiller.yanitDurumu} testID="hikaye-yanit-durumu">
                  {yanitDurumu}
                </Text>
              )}
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </GestureDetector>

      <AnlikMenusu
        acikMi={menuAcik}
        onKapat={() => setMenuAcik(false)}
        fotografUrl={hikaye.fotografUrl}
        baslik={grup.benimMi ? t('hikaye.anligin') : grup.kullaniciAdi}
        altBilgi={menuAltBilgi}
        secimler={secimler}
      />
      {/* EMOJI SAYFASI (kullanicinin referansi 2026-09-26): Ara +
          Onerilenler + Tumu; secilen emoji anliga birakilir. */}
      <EmojiSayfasi
        acikMi={emojiSayfasiAcik}
        onerilenler={sikEmojiler}
        secili={emojilerim[hikaye.id] ?? null}
        onSec={(emoji) => void emojiSec(emoji)}
        onKapat={() => setEmojiSayfasiAcik(false)}
      />
      <AnlikSilOnayi
        acikMi={silOnayi}
        fotografUrl={hikaye.fotografUrl}
        baslik={t('hikaye.silBaslik')}
        aciklama={t('hikaye.silAciklama')}
        eylemEtiketi={t('hikaye.silEvet')}
        onOnay={sil}
        onVazgec={() => setSilOnayi(false)}
      />
      <KisiListesiSayfasi
        acikMi={gorenlerAcik}
        anahtar={hikaye.id}
        baslik={t('hikaye.gorenler')}
        bosMetin={t('hikaye.gorenYok')}
        yukle={() => hikayeGoruntuleyenleriGetir(hikaye.id)}
        onKapat={() => setGorenlerAcik(false)}
        testIDOnEki="gorenler"
        satirTestIDOnEki="goren"
      />
    </GestureHandlerRootView>
  )
}

/** Etiket satirinin basindaki kucuk kisi ignesi. */
function KisiIgnesi() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={3.4} stroke="#FFFFFF" strokeWidth={2} fill="none" />
      <Path d="M5 19c0-3.3 3-5.6 7-5.6s7 2.3 7 5.6" stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  )
}

function KalpCizimi() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      <Path
        d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7-2.8c0 4.8-7 9.2-7 9.2z"
        stroke="#FFFFFF"
        strokeWidth={1.9}
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

/**
 * SIRA GOSTERGESI: kisinin anlik sayisi kadar ince parca. Gecilenler ve
 * bulunulan beyaz, siradakiler yari saydam. ILERLEYINCE bulunulan parca
 * soldan saga 240 ms'de dolar (Instagram deseni, ama SURE YOK - dolum
 * yalnizca gecisi gosterir, kendiliginden ilerlemez). Renk sabit: zemin
 * her iki temada siyah izleyici.
 */
function SiraGostergesi({ adet, sira, kimlik }: { adet: number; sira: number; kimlik: string }) {
  // Onceki konum render sirasinda okunur; ileri gecildiyse bulunulan parca
  // KENDI degeriyle dolar (tek ortak deger eski parcaya bagli kalip
  // kaldirilmis gorunume animasyon baslatiyordu).
  const onceki = useRef({ sira, kimlik })
  const ileri = onceki.current.kimlik === kimlik && sira > onceki.current.sira
  useEffect(() => {
    onceki.current = { sira, kimlik }
  }, [sira, kimlik])
  return (
    <View
      style={gostergeStil.satir}
      testID="hikaye-sira"
      accessibilityLabel={`${sira + 1} / ${adet}`}
      pointerEvents="none"
    >
      {Array.from({ length: adet }, (_, i) => (
        <View key={i} style={gostergeStil.parca} testID={`hikaye-sira-${i}-${i < sira ? 'gecildi' : i === sira ? 'burada' : 'sirada'}`}>
          {i < sira ? <View style={gostergeStil.dolu} /> : null}
          {i === sira ? <DolanParca key={`${kimlik}-${sira}`} dolsun={ileri} /> : null}
        </View>
      ))}
    </View>
  )
}

/** Bulunulan parcanin dolgusu: ileri gecildiyse mount'ta 240 ms'de dolar. */
function DolanParca({ dolsun }: { dolsun: boolean }) {
  const hareket = useHareket()
  const dolum = useRef(new Animated.Value(dolsun && hareket ? 0 : 1)).current
  useEffect(() => {
    if (!dolsun || !hareket) return
    const a = Animated.timing(dolum, { toValue: 1, duration: 240, easing: EGRI.girisCikis, useNativeDriver: true })
    a.start()
    return () => a.stop()
    // Yalnizca mount'ta: karar ilk cizimde verilir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <Animated.View style={[gostergeStil.dolu, { transformOrigin: 'left', transform: [{ scaleX: dolum }] }]} />
}

const gostergeStil = StyleSheet.create({
  satir: { flexDirection: 'row', gap: 4, paddingHorizontal: 2 },
  parca: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.32)', overflow: 'hidden' },
  dolu: { ...StyleSheet.absoluteFill, backgroundColor: '#FFFFFF', borderRadius: 2 },
})

function KapatCarpisi() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6L6 18" stroke="#FFFFFF" strokeWidth={2.8} strokeLinecap="round" />
    </Svg>
  )
}

function GozCizimi() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" stroke="#FFFFFF" strokeWidth={2} fill="none" />
      <Circle cx={12} cy={12} r={3} stroke="#FFFFFF" strokeWidth={2} fill="none" />
    </Svg>
  )
}

/** Sunucu cevabi gelene kadar gosterilen varsayilan hizli tepkiler. */
const VARSAYILAN_EMOJILER = ['❤️', '😂', '😮', '😢', '👏', '🔥']

/**
 * EMOJI SATIRI (2026-09-26): fotografin altinda en sik kullanilan 6
 * standart emoji + sonda ARTI (EmojiSayfasi: Ara, Onerilenler, Tumu). Secili emoji
 * turuncu halkali; secim sik listede yoksa basa eklenir. Dokunulan emoji
 * yayli ziplar; "Hareketi azalt"ta ziplama yok. Zemin her iki temada
 * siyah izleyici - renkler sabit.
 */
function EmojiSatiri({
  sik,
  secili,
  onSec,
  onDahaFazla,
  gizli,
}: {
  sik: string[]
  secili: string | null
  onSec: (emoji: string) => void
  onDahaFazla: () => void
  gizli: boolean
}) {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const hareket = useHareket()
  const liste = secili && !sik.includes(secili) ? [secili, ...sik.slice(0, 5)] : sik.slice(0, 6)
  const olcekler = useRef<Record<string, Animated.Value>>({}).current
  const olcek = (emoji: string) => (olcekler[emoji] ??= new Animated.Value(1))
  function sec(emoji: string) {
    if (hareket) {
      olcek(emoji).setValue(1.35)
      Animated.spring(olcek(emoji), { toValue: 1, speed: 14, bounciness: 14, useNativeDriver: true }).start()
    }
    onSec(emoji)
  }
  return (
    <View style={[stiller.ifadeSatiri, gizli && stiller.gizli]} testID="hikaye-emojiler" pointerEvents={gizli ? 'none' : 'box-none'}>
      {liste.map((emoji, i) => {
        const seciliMi = emoji === secili
        return (
          <Pressable
            key={emoji}
            onPress={() => sec(emoji)}
            accessibilityRole="button"
            accessibilityLabel={t('hikaye.tepkiGonder', { emoji })}
            accessibilityState={{ selected: seciliMi }}
            testID={`hikaye-tepki-${i}`}
            style={[stiller.ifadeHucre, seciliMi && stiller.ifadeSecili]}
          >
            <Animated.Text style={[stiller.emojiYazi, { transform: [{ scale: olcek(emoji) }] }]}>{emoji}</Animated.Text>
          </Pressable>
        )
      })}
      <Pressable
        onPress={onDahaFazla}
        accessibilityRole="button"
        accessibilityLabel={t('hikaye.dahaFazlaEmoji')}
        testID="hikaye-emoji-daha"
        style={({ pressed }) => [stiller.ifadeHucre, stiller.ifadeArti, pressed && stiller.basili]}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
      </Pressable>
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    zemin: { flex: 1, backgroundColor: '#000000' },
    sahne: { flex: 1 },
    // Fotograf UST CUBUGUN hemen altinda (kullanicinin istegi 2026-09-24:
    // "fotografi daha yukari tasi"), konum altinda ortada.
    kartSutunu: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'flex-start', gap: bosluk.l },
    kart: { aspectRatio: ANI_KART_ORANI, borderRadius: 28, overflow: 'hidden', backgroundColor: '#1C1A18' },
    ifadeSatiri: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    ifadeHucre: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    ifadeSecili: { backgroundColor: 'rgba(254,120,19,0.22)', borderWidth: 2, borderColor: renk.turuncu },
    emojiYazi: { fontSize: 28, lineHeight: 34 },
    ifadeArti: { backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
    orta: { alignItems: 'center', justifyContent: 'center', gap: bosluk.l },
    durum: { color: '#FFFFFF', fontFamily: yazi.govde, fontSize: olcek.govde, textAlign: 'center', paddingHorizontal: bosluk.xl },
    kapatDugmeBuyuk: { paddingHorizontal: bosluk.xl, paddingVertical: 10, borderRadius: yuvarlak.hap, backgroundColor: 'rgba(255,255,255,0.18)' },
    kapatDugmeYazi: { color: '#FFFFFF', fontFamily: yazi.govdeKalin, fontSize: olcek.govde },
    dokunmaSatiri: { flex: 1, flexDirection: 'row' },
    solBolge: { flex: 1 },
    sagBolge: { flex: 2 },
    ustGolge: { position: 'absolute', left: 0, right: 0, top: 0 },
    altGolge: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    ust: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: bosluk.m, gap: bosluk.s },
    cubuklar: { flexDirection: 'row', gap: 4 },
    // Zemin KOYU (beyaz degil): dolu kisim beyaz, bos kisim koyu -
    // ikisi arasindaki fark gradyanin ustunde de net kaliyor.
    cubukZemin: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.45)', overflow: 'hidden' },
    cubukDolu: { height: 3, backgroundColor: '#FFFFFF' },
    kimlikSatiri: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
    kimlik: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
    kimlikMetinleri: { flex: 1 },
    adSatiri: { flexDirection: 'row', alignItems: 'baseline', gap: bosluk.s },
    ad: { color: '#FFFFFF', fontFamily: yazi.ekranBasligi, fontSize: olcek.govde, flexShrink: 1 },
    zaman: { color: 'rgba(255,255,255,0.85)', fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk },
    mekanSatiri: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    mekan: { color: '#FFFFFF', fontFamily: yazi.govde, fontSize: olcek.minik },
    ustDugme: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    kapatYazi: { color: '#FFFFFF', fontSize: 26, lineHeight: 28, fontFamily: yazi.govde },
    altKap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    alt: { paddingHorizontal: bosluk.sayfa, gap: bosluk.s },
    yaziKutusu: { alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: yuvarlak.kart, paddingHorizontal: bosluk.m, paddingVertical: bosluk.s, maxWidth: '92%' },
    yazi: { color: '#FFFFFF', fontFamily: yazi.govdeOrta, fontSize: olcek.govde, textAlign: 'center' },
    etiketSatiri: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: yuvarlak.hap,
      paddingHorizontal: bosluk.m,
      paddingVertical: 6,
      maxWidth: '92%',
    },
    etiketYazi: { color: '#FFFFFF', fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk },
    gorenler: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.28)',
    },
    gorenlerYazi: { color: '#FFFFFF', fontFamily: yazi.ekranBasligi, fontSize: olcek.govde },
    gizli: { opacity: 0 },
    tepkiSatiri: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: bosluk.xs, paddingBottom: bosluk.xs },
    tepki: { paddingHorizontal: 2, paddingVertical: 2 },
    tepkiBasili: { transform: [{ scale: 1.25 }] },
    tepkiYazi: { fontSize: 26 },
    yanitDurumu: { color: '#FFFFFF', fontFamily: yazi.govde, fontSize: olcek.minik, textAlign: 'center' },

    // Fotografin uzerindeki ogeler (paylasanin biraktigi yerde)
    tuvalYazi: {
      color: '#FFFFFF',
      fontFamily: yazi.govdeKalin,
      fontSize: 26,
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowRadius: 8,
      maxWidth: 300,
    },
    tuvalIfade: { width: 88, height: 88 },
    etiketHapi: { backgroundColor: 'rgba(255,255,255,0.85)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: yuvarlak.hap },
    etiketHapiYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: '#17130F' },

    // Alt satir
    sahipSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: bosluk.s },
    yanitSatiri: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
    mesajKutusu: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: bosluk.s,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: yuvarlak.hap,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.6)',
    },
    mesajGirdi: { flex: 1, color: '#FFFFFF', fontFamily: yazi.govde, fontSize: olcek.kucuk, padding: 0 },
    gonderYazi: { color: '#FFFFFF', fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk },
    kalp: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    basili: { opacity: 0.85 },
  })
