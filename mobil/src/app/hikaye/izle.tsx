import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TextInput,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler'
import Svg, { Path, Circle } from 'react-native-svg'
import { useDil } from '../../../lib/dil'
import {
  hikayeAkisiniGetir,
  hikayeGoruntulendi,
  hikayeGoruntuleyenleriGetir,
  hikayeSil,
  hikayeyeYanitVer,
  HIKAYE_SURESI_MS,
  type HikayeGrubu,
  seritOnbelleginiOku,
} from '../../../lib/hikaye'
import { gorecelZaman } from '../../../lib/zaman'
import { konumuDuzelt, VARSAYILAN_KONUM } from '../../../lib/hikaye'
import { useHareket } from '../../tasarim/hareket'
import { Avatar } from '../../tasarim/Avatar'
import { SecimPenceresi, UcNoktaIkonu, CopIkonu } from '../../tasarim/SecimPenceresi'
import { OnayPenceresi } from '../../tasarim/OnayPenceresi'
import { KisiListesiSayfasi } from '../../tasarim/KisiListesiSayfasi'
import { IfadeCipi } from '../../tasarim/IfadeSecici'
import { HikayeOgesi } from '../../tasarim/HikayeOgesi'
import { ifadeBul } from '../../../lib/ifadeler'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'

/** Ust ve alt okunurluk gradyanlarinin guvenli alan USTUNE eklenen boyu. */
const UST_GOLGE = 104
const ALT_GOLGE = 132

/** Dikey surukleme kapatma esikleri - FotografGezgini ile ayni. */
const KAPATMA_MESAFESI = 120
const KAPATMA_HIZI = 900

/**
 * HIZLI TEPKILER - Instagram'in hikaye tepki seti. Dokunmak emojiyi
 * mesaj olarak gonderiyor (Instagram'da da DM'e dusuyor).
 */
const HIZLI_TEPKILER = ['❤️', '😂', '😮', '😢', '👏', '🔥', '🎉', '😍'] as const

/** Komsu kareler bu kadar sonra indirilir - gorunen kareyi geciktirmesin. */
const ON_YUKLEME_GECIKMESI_MS = 600

/** Yatay kaydirmada kisi degistirme esikleri (Instagram: sola = sonraki hesap). */
const KISI_GECIS_MESAFESI = 70
const KISI_GECIS_HIZI = 650

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
 * "N kisi gordu" -> KisiListesiSayfasi; baskasi altta "Mesaj gonder"
 * (sohbete on ekli mesaj). Uc nokta: sahibiyse Sil (onayli), degilse
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
  const { kullanici } = useLocalSearchParams<{ kullanici?: string }>()

  const [gruplar, setGruplar] = useState<HikayeGrubu[] | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [konum, setKonum] = useState<{ g: number; h: number }>({ g: 0, h: 0 })
  const [menuAcik, setMenuAcik] = useState(false)
  const [silOnayi, setSilOnayi] = useState(false)
  const [gorenlerAcik, setGorenlerAcik] = useState(false)
  const [yanitDurumu, setYanitDurumu] = useState<string | null>(null)
  const [mesaj, setMesaj] = useState('')
  const [klavyeAcik, setKlavyeAcik] = useState(false)
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
  }, [kullanici])

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

  // ---- Ilerleme cubugu / zamanlayici ----
  const ilerleme = useRef(new Animated.Value(0)).current
  const duraklatildi = menuAcik || silOnayi || gorenlerAcik || klavyeAcik
  const duraklatildiRef = useRef(duraklatildi)
  duraklatildiRef.current = duraklatildi
  const basiliRef = useRef(false)

  const oynat = useCallback(
    (baslangicDegeri: number) => {
      ilerleme.stopAnimation()
      ilerleme.setValue(baslangicDegeri)
      Animated.timing(ilerleme, {
        toValue: 1,
        duration: Math.max(0, (1 - baslangicDegeri) * HIKAYE_SURESI_MS),
        easing: (x) => x,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) ileri()
      })
    },
    [ilerleme, ileri]
  )

  const durdur = useCallback(() => {
    ilerleme.stopAnimation()
  }, [ilerleme])

  // Hikaye degisince: sifirdan baslat + goruntuleme kaydi.
  useEffect(() => {
    if (!hikaye || !grup) return
    if (!duraklatildiRef.current && !basiliRef.current) oynat(0)
    else ilerleme.setValue(0)
    if (!grup.benimMi && !hikaye.gordum) {
      hikayeGoruntulendi(hikaye.id).catch(() => {})
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

  // Pencere/klavye acilinca dur, kapaninca kaldigi yerden devam.
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

  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', () => setKlavyeAcik(true))
    const b = Keyboard.addListener('keyboardDidHide', () => setKlavyeAcik(false))
    return () => {
      a.remove()
      b.remove()
    }
  }, [])

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
  const yatay = useRef(new Animated.Value(0)).current
  const solma = surukleme.interpolate({ inputRange: [-320, 0, 320], outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' })

  /**
   * Yukari kaydirma: KENDI hikayende izleyen listesini acar. Baskasinin
   * hikayesinde artik bir sey yapmiyor - yanit yazma kutusu kullanicinin
   * istegiyle kaldirildi (2026-09-22), tepki icin alttaki emojiler var.
   */
  const yukariAc = useCallback(() => {
    if (gruplarRef.current?.[konumRef.current.g]?.benimMi) setGorenlerAcik(true)
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
        .onBegin(() => {
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

  /** Hizli tepki: emoji, yanit olarak sohbete gider (Instagram deseni). */
  async function tepkiGonder(emoji: string) {
    if (!hikaye || !grup) return
    try {
      await hikayeyeYanitVer(grup.kullaniciId, t('hikaye.yanitOnEki'), emoji)
      setYanitDurumu(t('hikaye.tepkiGonderildi', { emoji }))
    } catch (e) {
      setYanitDurumu(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
    setTimeout(() => setYanitDurumu(null), 1800)
  }

  /** Mesaj kutusu: yazilan metin sohbete yanit olarak gider (kalple
   *  ayni yol). Bos mesaj gonderilmez. */
  async function mesajiGonder() {
    const metin = mesaj.trim()
    if (!metin || !grup) return
    setMesaj('')
    try {
      await hikayeyeYanitVer(grup.kullaniciId, t('hikaye.yanitOnEki'), metin)
      setYanitDurumu(t('hikaye.yanitGonderildi'))
    } catch (e) {
      setYanitDurumu(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
    setTimeout(() => setYanitDurumu(null), 1800)
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

  const secimler = grup.benimMi
    ? [{ etiket: t('hikaye.sil'), ikon: <CopIkonu />, yikici: true, testID: 'hikaye-menu-sil', onSec: () => setSilOnayi(true) }]
    : [{ etiket: t('kullanici.sikayetEt'), yikici: true, testID: 'hikaye-menu-sikayet', onSec: sikayetEt }]

  return (
    <GestureHandlerRootView style={stiller.zemin} testID="hikaye-izle">
      <GestureDetector gesture={suruklemeHareketi}>
        <Animated.View style={[stiller.sahne, { opacity: solma, transform: [{ translateY: surukleme }] }]}>
          {hikaye.fotografUrl && (
            <Image
              source={{ uri: hikaye.fotografUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
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
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID="hikaye-ogeler">
            {hikaye.yazi ? (
              <HikayeOgesi
                konum={konumuDuzelt(hikaye.yerlesim?.yazi, VARSAYILAN_KONUM.yazi)}
                alan={{ en: 0, boy: 0 }}
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
                alan={{ en: 0, boy: 0 }}
                duzenlenebilir={false}
                testID="hikaye-oge-ifade"
              >
                {ifadeBul(hikaye.ifade) ? (
                  <Image source={ifadeBul(hikaye.ifade)!.kaynak} style={stiller.tuvalIfade} contentFit="contain" />
                ) : null}
              </HikayeOgesi>
            ) : null}

            {hikaye.mekanAdi ? (
              <HikayeOgesi
                konum={konumuDuzelt(hikaye.yerlesim?.mekan, VARSAYILAN_KONUM.mekan)}
                alan={{ en: 0, boy: 0 }}
                duzenlenebilir={false}
                testID="hikaye-oge-mekan"
              >
                <Pressable
                  onPress={() => hikaye.mekanId && router.push(`/harita/${hikaye.mekanId}` as never)}
                  accessibilityRole="link"
                  testID="hikaye-mekan"
                  style={stiller.mekanHapi}
                >
                  <IgneCizimi />
                  <Text style={stiller.mekanHapiYazi} numberOfLines={1}>
                    {hikaye.mekanAdi}
                  </Text>
                  <Text style={stiller.mekanHapiOk}>›</Text>
                </Pressable>
              </HikayeOgesi>
            ) : null}

            {hikaye.etiketler.map((e, i) => (
              <HikayeOgesi
                key={e.kullaniciId}
                konum={konumuDuzelt(hikaye.yerlesim?.etiketler?.[e.kullaniciId], { x: 0.5, y: 0.84 + i * 0.05, olcek: 1 })}
                alan={{ en: 0, boy: 0 }}
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

          {/* Dokunma bolgeleri: sol 1/3 geri, sag 2/3 ileri; basili tut durdur. */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={stiller.dokunmaSatiri}>
              <Pressable style={stiller.solBolge} onPress={geri} onPressIn={basiliBasladi} onPressOut={basiliBitti} accessibilityRole="button" accessibilityLabel={t('hikaye.onceki')} testID="hikaye-geri" />
              <Pressable style={stiller.sagBolge} onPress={ileri} onPressIn={basiliBasladi} onPressOut={basiliBitti} accessibilityRole="button" accessibilityLabel={t('hikaye.sonraki')} testID="hikaye-ileri" />
            </View>
          </View>

          {/*
            OKUNURLUK GOLGESI (kullanicinin bildirimi 2026-09-22:
            "hikayelerdeki dolma ibaresi beyaz bir fotografta hic
            gorunmuyor"). Ilerleme cubugu, kimlik satiri ve alttaki
            eylemler BEYAZ; acik renkli bir fotografta (ornegin bir ekran
            goruntusu) hepsi kayboluyordu. Instagram'in cozumu: icerigin
            ARKASINA usttan ve alttan koyu gradyan. Fotografin kendisi
            karartilmiyor - gradyan yalnizca kenarlarda ve saydamdan
            koyuya gidiyor, ortadaki icerik dokunulmamis kaliyor.
            `pointerEvents="none"`: sag/sol dokunus ve surukleme gradyana
            takilmamali.
          */}
          <LinearGradient
            colors={['rgba(0,0,0,0.70)', 'rgba(0,0,0,0.38)', 'rgba(0,0,0,0)']}
            style={[
              stiller.ustGolge,
              { height: guvenliAlan.top + UST_GOLGE },
              basiliTutuluyor && stiller.gizli,
            ]}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.38)', 'rgba(0,0,0,0.70)']}
            style={[
              stiller.altGolge,
              { height: guvenliAlan.bottom + ALT_GOLGE },
              basiliTutuluyor && stiller.gizli,
            ]}
            pointerEvents="none"
          />

          {/* Ust: ilerleme cubuklari + kimlik */}
          {/* BASILI TUTARKEN ARAYUZ GIZLENIR (Instagram): fotografin onunde
              hicbir sey kalmaz. Yalnizca gorsel - zamanlayici zaten duruyor. */}
          <View
            style={[stiller.ust, { paddingTop: guvenliAlan.top + bosluk.s }, basiliTutuluyor && stiller.gizli]}
            pointerEvents={basiliTutuluyor ? 'none' : 'box-none'}
          >
            <View style={stiller.cubuklar} testID="hikaye-ilerleme">
              {grup.hikayeler.map((h, i) => (
                <View key={h.id} style={stiller.cubukZemin}>
                  {i < konum.h ? (
                    <View style={[stiller.cubukDolu, { width: '100%' }]} />
                  ) : i === konum.h ? (
                    <Animated.View
                      style={[stiller.cubukDolu, { width: ilerleme.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
                    />
                  ) : null}
                </View>
              ))}
            </View>
            <View style={stiller.kimlikSatiri}>
              <Pressable
                style={stiller.kimlik}
                onPress={() => router.push((grup.benimMi ? '/profil' : `/kullanici/${grup.kullaniciId}`) as never)}
                accessibilityRole="link"
                testID="hikaye-kimlik"
              >
                <Avatar fotografUrl={grup.avatarUrl} ad={grup.ad} kullaniciAdi={grup.kullaniciAdi} cap={34} />
                <View style={stiller.kimlikMetinleri}>
                  <View style={stiller.adSatiri}>
                    <Text style={stiller.ad} numberOfLines={1}>
                      {grup.kullaniciAdi}
                    </Text>
                    <Text style={stiller.zaman}>{gorecelZaman(hikaye.olusturuldu, t)}</Text>
                  </View>
                </View>
              </Pressable>
              <Pressable onPress={() => setMenuAcik(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('hikaye.secenekler')} testID="hikaye-menu" style={stiller.ustDugme}>
                <UcNoktaIkonu boyut={20} renk="#FFFFFF" />
              </Pressable>
              <Pressable onPress={kapat} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('hikaye.kapat')} testID="hikaye-kapat" style={stiller.ustDugme}>
                <Text style={stiller.kapatYazi}>×</Text>
              </Pressable>
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
                  <Pressable onPress={() => setGorenlerAcik(true)} style={stiller.gorenler} accessibilityRole="button" testID="hikaye-gorenler">
                    <GozCizimi />
                    <Text style={stiller.gorenlerYazi}>{t('hikaye.kisiGordu', { sayi: hikaye.goruntulenmeSayisi })}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSilOnayi(true)}
                    style={({ pressed }) => [stiller.silDugmesi, pressed && stiller.basili]}
                    accessibilityRole="button"
                    accessibilityLabel={t('hikaye.sil')}
                    testID="hikaye-sil"
                  >
                    <CopIkonu />
                    <Text style={stiller.silYazi}>{t('hikaye.sil')}</Text>
                  </Pressable>
                </View>
              ) : (
                /* BASKASININ HIKAYESI: mesaj kutusu + kalp (2026-09-22
                   referansi). Kalp, hizli tepkilerle ayni yoldan gidiyor:
                   emoji sohbete yanit olarak dusuyor. */
                <View style={stiller.yanitSatiri} testID="hikaye-yanit-satiri">
                  <View style={stiller.mesajKutusu}>
                    <TextInput
                      style={stiller.mesajGirdi}
                      value={mesaj}
                      onChangeText={setMesaj}
                      placeholder={t('hikaye.mesajGonder')}
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
                  <Pressable
                    onPress={() => tepkiGonder('❤️')}
                    accessibilityRole="button"
                    accessibilityLabel={t('hikaye.tepkiGonder', { emoji: '❤️' })}
                    testID="hikaye-begen"
                    style={({ pressed }) => [stiller.kalp, pressed && stiller.tepkiBasili]}
                    hitSlop={8}
                  >
                    <KalpCizimi />
                  </Pressable>
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

      <SecimPenceresi acikMi={menuAcik} onKapat={() => setMenuAcik(false)} secimler={secimler} />
      <OnayPenceresi
        acikMi={silOnayi}
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

function IgneCizimi() {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" fill="#FFFFFF" />
      <Circle cx={12} cy={9} r={2.4} fill="#111111" />
    </Svg>
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

function GozCizimi() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" stroke="#FFFFFF" strokeWidth={2} fill="none" />
      <Circle cx={12} cy={12} r={3} stroke="#FFFFFF" strokeWidth={2} fill="none" />
    </Svg>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    zemin: { flex: 1, backgroundColor: '#000000' },
    sahne: { flex: 1 },
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
    ad: { color: '#FFFFFF', fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, flexShrink: 1 },
    zaman: { color: 'rgba(255,255,255,0.7)', fontFamily: yazi.govde, fontSize: olcek.minik },
    mekanSatiri: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    mekan: { color: '#FFFFFF', fontFamily: yazi.govde, fontSize: olcek.minik },
    ustDugme: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
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
    gorenler: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 },
    gorenlerYazi: { color: '#FFFFFF', fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk },
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
    mekanHapi: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FFFFFF',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: yuvarlak.hap,
    },
    mekanHapiYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: '#17130F', maxWidth: 220 },
    mekanHapiOk: { fontFamily: yazi.govde, fontSize: olcek.govde, color: '#17130F' },
    etiketHapi: { backgroundColor: 'rgba(255,255,255,0.85)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: yuvarlak.hap },
    etiketHapiYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: '#17130F' },

    // Alt satir
    sahipSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: bosluk.s },
    silDugmesi: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: yuvarlak.hap,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.5)',
    },
    silYazi: { color: '#FFFFFF', fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk },
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
