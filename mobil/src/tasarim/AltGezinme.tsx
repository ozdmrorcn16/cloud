import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Animated, type LayoutChangeEvent } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import { useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context'
import { konusmalarimiGetir } from '../../lib/sohbet'
import { gelenIstekleriGetir } from '../../lib/bag-listeleri'
import { bekleyenEtiketleriGetir } from '../../lib/etiket'
import { yazi, bosluk, yuvarlak, golge, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * Yuzer alt gezinme cubugu.
 *
 * Kullanicinin istegi (2026-08-25): tasarim Instagram ve eski Swarm
 * referans alinarak kurulacak. Ikisinin de omurgasi ayni sey: ekranin
 * altinda sabit duran sekme cubugu. Slooin'de bu YOKTU - gezinme bir
 * "ana ekran menusu" uzerinden yapiliyordu, yani her bolume gitmek
 * icin once menuye donmek gerekiyordu.
 *
 * Cubuk YUZUYOR (kenarlardan bosluklu, yuvarlak, golgeli). Bu, kimlik
 * kararlarinda zaten yaziliydi (bkz. tema.ts basligi).
 *
 * ORTADA BUYUK CHECK-IN DUGMESI VAR (kullanicinin karari 2026-08-26:
 * "ortaya check-in yapma ikonu koyalim, turuncu belirgin renkte,
 * biraz obirlerinden buyuk"). Onceki notta "konmadi, cunku kesfet
 * sekmesini tekrarlardi" yaziyordu; cozum dugmeyi eklemek DEGIL,
 * KESFET SEKMESINI DUGMEYE DONUSTURMEK oldu.
 *
 * Neden boyle: Slooin'de check-in bir mekan secilerek yapiliyor ve o
 * secim ekrani zaten Kesfet. Dugme ayri bir sekme olarak eklenseydi
 * ya cubuk alti slota cikacak ve ortasi kaymis olacakti, ya da
 * "Kisiler" cikarilacakti - ama `/kisiler` ekranina cubuk disinda
 * baska giris yok, cikarilsa oksuz kalirdi.
 *
 * Sonuc: Ana sayfa / Kisiler / [CHECK-IN] / Mesajlar / Profil.
 * Dugme `/mekanlar`a gidiyor; `/mekanlar` ve `/check-in` yollarinda
 * aktif sayiliyor.
 *
 * AKTIF SEKME BIR DAIREYLE ISARETLENIYOR (kullanicinin karari
 * 2026-09-07, gonderdigi "Navigation tabs V2" videosundaki ikinci
 * varyant): aktif sekmenin ikonu artik sekme slotunda DEGIL, cubugun
 * ustune tasan turuncu dolu bir dairenin icinde beyaz olarak duruyor.
 * Dairenin altinda yumusak turuncu bir parilti var.
 *
 * SEKME DEGISINCE DAIRE UC ADIMDA HAREKET EDIYOR - videodaki hareket
 * kare kare olculdu: once cubugun icine INIYOR, sonra yatay olarak
 * yeni sekmeye KAYIYOR, sonra yeniden yukari CIKIYOR. Duz bir yatay
 * kayma degil; dalis hareketi.
 *
 * DALIS BURADA AYRICA ISLEVSEL: daire ortadaki check-in dugmesinin
 * uzerinden gecmek zorunda ve ikisi de cubugun ustunde duruyor. Daire
 * kayarken cubugun ICINDE oldugu icin dugmeyle hic cakismiyor.
 *
 * ETIKETLER KALKTI (ayni karar): referans varyantta ikon var etiket
 * yok. Ekran okuyucu icin kayip yok - her sekme `accessibilityLabel`
 * tasiyor.
 *
 * ANIMASYON `Animated` ILE, Reanimated ile DEGIL. Sebep: hareketin
 * tamami transform ve opacity, yani `useNativeDriver` ile JS
 * kuyrugunu hic mesgul etmeden calisiyor; ustelik web surumunde de
 * ek yapilandirma istemiyor (uygulama tarayicidan da aciliyor ve
 * ekran goruntusu araci orayi olcuyor). Yeni bir paket gerekmedigi
 * icin degisiklik OTA ile gidiyor.
 */

/**
 * Cubugun ic satir yuksekligi.
 *
 * Etiketler kalkinca cubuk kendiliginden 62 px'e duesmustu (olculdu);
 * kullanicinin istegi uzerine (2026-09-07: "cubuk kisalmasin boyutu
 * onceki gibi olsun") eski olcusune SABITLENDI. Eski yukseklik ayni
 * sayidan geliyordu: ortadaki dugme 54 px ve satirin boyunu o
 * belirliyordu. Cubuk = 12 + 54 + 12 + 2 kenarlik = 80 px.
 *
 * Sabit olmasi ayrica ALT_GEZINME_PAYI'ni koruyor - o pay 45 ekranda
 * kullaniliyor ve cubuk kisalsaydi hepsinde alt bosluk buyurdu.
 */
const SATIR = 54

/** Aktif sekmeyi isaretleyen dairenin capi. */
const DAIRE = 44
/**
 * Dairenin yukari tasma miktari. Daire dinlenme halinde ikonlarla
 * ayni merkezden bu kadar YUKARIDA durur; dalis sirasinda 0'a inip
 * cubugun icine giriyor.
 */
const DAIRE_YUKSEK = 35

type Sekme = {
  ad: string
  yol: string
  /** Bu sekme hangi yollarda aktif sayilir. */
  onEk: string
  /**
   * Ikonu iki renkle cizer: kontur ve dolgu. AKTIF HALI YOK - aktif
   * sekmenin ikonu artik sekmede degil, ustundeki turuncu dairenin
   * icinde beyaz olarak duruyor. Ayni fonksiyon iki yerde de
   * cagriliyor, yalnizca renkler degisiyor.
   */
  ikon: (cizgi: string, dolgu: string) => React.ReactNode
}

const SEKMELER: Sekme[] = [
  {
    // Ana sayfa: akis. Instagram'daki gibi en solda ve ev ikonuyla.
    ad: 'Ana sayfa',
    yol: '/',
    onEk: '/',
    ikon: (cizgi, dolgu) => (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path
          d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5.5H9V20H5a1 1 0 0 1-1-1z"
          stroke={cizgi}
          strokeWidth={1.8}
          fill={dolgu}
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    // KISILER SEKMESI KALDIRILDI, YERINE BILDIRIMLER (kullanicinin
    // karari 2026-08-29). Kisi arama artik ANA SAYFANIN ustundeki
    // sutunda; ayri bir sekmeye gerek kalmadi. `/kisiler` ekrani
    // duruyor ve calisiyor, yalnizca cubuktan giris kalkti.
    ad: 'Bildirimler',
    yol: '/bildirimler',
    onEk: '/bildirimler',
    ikon: (cizgi, dolgu) => (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path
          d="M12 3.5a5.5 5.5 0 0 0-5.5 5.5v3.2L5 15.5h14l-1.5-3.3V9A5.5 5.5 0 0 0 12 3.5z"
          stroke={cizgi}
          strokeWidth={1.8}
          fill={dolgu}
          strokeLinejoin="round"
        />
        <Path
          d="M10 18.2a2.2 2.2 0 0 0 4 0"
          stroke={cizgi}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    ),
  },
  {
    ad: 'Mesajlar',
    yol: '/mesajlar',
    onEk: '/mesajlar',
    ikon: (cizgi, dolgu) => (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path
          d="M4 5.5h16v10H9.5L5.5 19v-3.5H4z"
          stroke={cizgi}
          strokeWidth={1.8}
          fill={dolgu}
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    ad: 'Profil',
    yol: '/profil',
    onEk: '/profil',
    ikon: (cizgi, dolgu) => (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Circle cx={12} cy={8} r={3.6} stroke={cizgi} strokeWidth={1.8} fill="none" />
        <Path
          d="M5 19.5c0-3.4 3.1-5.5 7-5.5s7 2.1 7 5.5"
          stroke={cizgi}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    ),
  },
]

/**
 * Ortadaki check-in dugmesi.
 *
 * Sekme degil EYLEM: turuncu dolu daire, beyaz konum ignesi. Diger
 * ikonlar 24 px cizgi, bu 30 px dolu ve daire 54 px - kullanicinin
 * istegi "biraz obirlerinden buyuk". Turuncunun burada mesru oldugu
 * acik: hem tiklanabilir hem de uygulamanin ana eylemi (bkz. tema.ts
 * "turuncu yalnizca eylem ve canlilik icin").
 */
function CheckInDugmesi({ aktif, onPress }: { aktif: boolean; onPress: () => void }) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  return (
    <Pressable
      style={stiller.merkez}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: aktif }}
      accessibilityLabel="Check-in yap"
    >
      <View style={[stiller.merkezDaire, aktif && stiller.merkezDaireAktif]}>
        <Svg width={30} height={30} viewBox="0 0 24 24">
          <Path
            d="M12 2.4a7.3 7.3 0 0 0-7.3 7.3c0 5.5 7.3 11.9 7.3 11.9s7.3-6.4 7.3-11.9A7.3 7.3 0 0 0 12 2.4z"
            fill="#FFFFFF"
          />
          <Circle cx={12} cy={9.6} r={2.8} fill={aktif ? renk.turuncuBasili : renk.turuncu} />
        </Svg>
      </View>
    </Pressable>
  )
}

export function AltGezinme() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const yol = usePathname()
  // Cubuk ana ekran gostergesinin (iPhone'daki alt cizgi) USTUNDE
  // durur; web'de inset sifir, cubuk eskisi gibi en altta. Icerik
  // cubugun ALTINDAN ekranin dibine kadar akiyor (2026-08-30).
  const insets = useSafeAreaInsets()
  const [okunmamisMesaj, setOkunmamisMesaj] = useState(0)
  const [bekleyenBildirim, setBekleyenBildirim] = useState(0)

  // Rozet cubugun kendi isi: cubuk artik her ekranda duruyor (kullanicinin
  // karari 2026-08-25), dolayisiyla sayiyi tek tek ekranlardan prop olarak
  // gecirmek hem tekrar hem de eksik kalma riski demekti. Yol her
  // degistiginde tazeleniyor; bir konusma okununca kullanici zaten baska
  // bir yola gidiyor.
  useEffect(() => {
    let iptal = false
    konusmalarimiGetir()
      .then((konusmalar) => {
        if (!iptal) setOkunmamisMesaj(konusmalar.reduce((t, k) => t + k.okunmamis, 0))
      })
      .catch(() => {
        if (!iptal) setOkunmamisMesaj(0)
      })
    return () => {
      iptal = true
    }
  }, [yol])

  // BILDIRIM SAYACI (kullanicinin karari 2026-08-29): gelen arkadaslik
  // istekleri + bekleyen etiketler. Ikisi de KARAR BEKLEYEN seyler;
  // bilgilendirme amacli bildirim sayilmiyor. Mesaj sayaciyla ayni
  // desen: yol degistikce tazeleniyor, hata olursa sifira duesuyor.
  useEffect(() => {
    let iptal = false
    Promise.all([gelenIstekleriGetir(), bekleyenEtiketleriGetir()])
      .then(([istekler, etiketler]) => {
        if (!iptal) setBekleyenBildirim(istekler.takip.length + etiketler.length)
      })
      .catch(() => {
        if (!iptal) setBekleyenBildirim(0)
      })
    return () => {
      iptal = true
    }
  }, [yol])

  // Check-in dugmesi bir SEKME degil eylem; aktifken hicbir sekme
  // aktif olmuyor ve daire soneuyor. Dugme kendi aktif halini zaten
  // `turuncuBasili` ile gosteriyor, ayrica daire ile isaretlemek
  // ikinci bir vurgu olurdu.
  const checkInAktif = yol.startsWith('/mekanlar') || yol.startsWith('/check-in')
  // Ana sayfanin oneki "/" oldugu icin startsWith her yolu
  // eslestirirdi; o sekme yalnizca tam eslesmede aktif.
  const aktifSira = SEKMELER.findIndex((s) =>
    s.onEk === '/' ? yol === '/' : yol.startsWith(s.onEk),
  )
  const daireGorunur = !checkInAktif && aktifSira >= 0

  // Cubugun genisligi ancak cizildikten sonra biliniyor; slot
  // merkezleri ondan turuyor. Sabit bir ekran genisligi varsaymak
  // tablette ve donmede yanlis olurdu.
  const [cubukGenislik, setCubukGenislik] = useState(0)
  // Dairenin ICINDEKI ikon, aktif sekmeden AYRI tutuluyor: videoda
  // ikon daire cubugun icine indikten SONRA degisiyor. Aninda
  // degistirilseydi ikon havada donusurdu.
  const [daireIkonSira, setDaireIkonSira] = useState(aktifSira)

  const x = useRef(new Animated.Value(0)).current
  const y = useRef(new Animated.Value(-DAIRE_YUKSEK)).current
  const opaklik = useRef(new Animated.Value(0)).current
  const ilkYerlesim = useRef(true)

  useEffect(() => {
    if (cubukGenislik === 0) return

    if (!daireGorunur) {
      Animated.timing(opaklik, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }).start()
      return
    }

    // Slot merkezi: cubuk bes esit parcaya boluenuyor (dort sekme +
    // ortadaki dugme). Sekme sirasi 2'den itibaren dugmenin sagina
    // duestugu icin bir slot kayiyor.
    const slot = aktifSira < 2 ? aktifSira : aktifSira + 1
    const hedef = (cubukGenislik / 5) * (slot + 0.5) - DAIRE / 2

    // ILK YERLESIMDE ANIMASYON YOK: daire dogrudan yerinde beliriyor.
    // Yoksa uygulama her acilista daire soldan kayarak gelirdi.
    if (ilkYerlesim.current) {
      ilkYerlesim.current = false
      x.setValue(hedef)
      y.setValue(-DAIRE_YUKSEK)
      setDaireIkonSira(aktifSira)
      Animated.timing(opaklik, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start()
      return
    }

    // UC ADIM, videodan kare kare olculdu: IN -> KAY -> CIK.
    Animated.parallel([
      Animated.timing(y, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(opaklik, { toValue: 0.65, duration: 150, useNativeDriver: true }),
    ]).start(({ finished }) => {
      // Animasyon yarida kesildiyse (hizli sekme degisimi) yeni
      // effect zaten devrali; buradan devam etmek iki animasyonu
      // ust uste bindirirdi.
      if (!finished) return
      setDaireIkonSira(aktifSira)
      Animated.sequence([
        Animated.timing(x, { toValue: hedef, duration: 210, useNativeDriver: true }),
        Animated.parallel([
          Animated.spring(y, {
            toValue: -DAIRE_YUKSEK,
            useNativeDriver: true,
            damping: 13,
            stiffness: 180,
            mass: 0.7,
          }),
          Animated.timing(opaklik, { toValue: 1, duration: 160, useNativeDriver: true }),
        ]),
      ]).start()
    })
  }, [aktifSira, daireGorunur, cubukGenislik])

  return (
    <View
      style={[stiller.kapsayici, { paddingBottom: bosluk.m + insets.bottom }]}
      pointerEvents="box-none"
    >
      <View
        testID="alt-gezinme-cubugu"
        style={stiller.cubuk}
        onLayout={(e: LayoutChangeEvent) => setCubukGenislik(e.nativeEvent.layout.width)}
      >
        {SEKMELER.map((s, sira) => {
          // Dugme ORTAYA giriyor: iki sekme solda, iki sekme sagda.
          const merkez =
            sira === 2 ? (
              <CheckInDugmesi
                key="check-in"
                aktif={checkInAktif}
                onPress={() => router.replace('/mekanlar' as never)}
              />
            ) : null
          const aktif = sira === aktifSira
          const rozet =
            s.yol === '/mesajlar'
              ? okunmamisMesaj
              : s.yol === '/bildirimler'
                ? bekleyenBildirim
                : 0
          return (
            <React.Fragment key={s.yol}>
            {merkez}
            <Pressable
              style={stiller.sekme}
              onPress={() => router.replace(s.yol as never)}
              accessibilityRole="tab"
              accessibilityState={{ selected: aktif }}
              accessibilityLabel={s.ad}
            >
              {/*
                Dairenin durdugu sekmenin ikonu GIZLI: o ikon artik
                cubugun ustundeki dairenin icinde. Silinmiyor,
                soneuyor - slot yuksekligi ikonun kendisinden geldigi
                icin cikarilsa satir zipllardi. Rozet de birlikte
                gizleniyor; zaten o sekmedeysen sayaci gostermenin
                anlami yok.
              */}
              <View
                testID={`sekme-ikonu${s.yol}`}
                style={daireIkonSira === sira && daireGorunur ? stiller.gizliIkon : null}
              >
                {s.ikon(renk.metinIkincil, 'none')}
                {rozet > 0 && (
                  <View style={stiller.rozet}>
                    <Text style={stiller.rozetYazi}>{rozet > 9 ? '9+' : rozet}</Text>
                  </View>
                )}
              </View>
            </Pressable>
            </React.Fragment>
          )
        })}

        {/*
          AKTIF SEKME DAIRESI. Sekmelerden SONRA ciziliyor, yani
          onlarin USTUNDE: kayarken aradaki ikonlarin onunden gecmesi
          gerekiyor, arkasindan gecerse hareket yarim gorunur.
          Dokunuslari gecirir - altindaki sekme hala basilabilir.
        */}
        <Animated.View
          testID="aktif-sekme-dairesi"
          pointerEvents="none"
          style={[
            stiller.daireYuva,
            { opacity: opaklik, transform: [{ translateX: x }, { translateY: y }] },
          ]}
        >
          <View style={stiller.daireGovde}>
            {daireIkonSira >= 0 && SEKMELER[daireIkonSira].ikon('#FFFFFF', 'none')}
          </View>
        </Animated.View>
      </View>
    </View>
  )
}

/**
 * Cubugun altinda kalmamasi icin sayfa iceriginin birakmasi gereken pay.
 * Icerik artik ekranin dibine kadar aktigi icin alt inset (ana ekran
 * gostergesi) da paya dahil; web'de sifir. Cihaz olcusu uygulama
 * acilirken bir kez okunuyor - donmeyle degismiyor.
 */
export const ALT_GEZINME_PAYI = 104 + (initialWindowMetrics?.insets.bottom ?? 0)

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kapsayici: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: bosluk.l,
  },
  cubuk: {
    flexDirection: 'row',
    // Yari saydam (kullanicinin istegi 2026-08-30, Instagram ornek):
    // altindan akan icerik hafifce gorunur. Gercek buzlu cam (blur)
    // native modul ister ve yeni derleme gerektirir; simdilik saydamlik.
    backgroundColor: renk.yuzerZemin,
    borderRadius: yuvarlak.buyuk,
    borderWidth: 1,
    borderColor: renk.cizgi,
    paddingVertical: bosluk.m,
    ...golge.yuzer,
  },
  sekme: {
    flex: 1,
    height: SATIR,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  /**
   * Dairenin altinda kalan ikon SILINMIYOR, soneuyor: slot
   * yuksekligi ikonun kendisinden geliyor, cikarilsa satir ziplardi.
   */
  gizliIkon: { opacity: 0 },

  /**
   * Daire iki katmanli. DIS katman yalnizca konumlandiriyor:
   * `top: 0, bottom: 0` ile cubugun tam dikey ortasina oturuyor -
   * sekme ikonlari da ortalandigi icin ikisi ayni merkezi paylasiyor.
   * Sabit bir `top` degeri yazilsaydi cubugun yuksekligi her
   * degistiginde (etiket eklense, ikon buyuese) hizalama bozulurdu.
   */
  daireYuva: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DAIRE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** IC katman: gorunen turuncu yuvarlak. */
  daireGovde: {
    width: DAIRE,
    height: DAIRE,
    borderRadius: DAIRE / 2,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
    /*
     * PARILTI: referanstaki dairenin altindaki yumusak renkli hale.
     * Golgenin rengi marka turuncusu - notr bir golge orada gri bir
     * leke birakiyor ve hale hic okunmuyor. Bu, `golge.yuzer`in
     * yerine gecmiyor; ondan farkli olarak RENKLI ve daha genis.
     */
    shadowColor: renk.turuncu,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },

  // Merkez dugme cubugun USTUNE tasiyor: buyuklugu ancak boyle
  // gorunuyor, yoksa cubugun ic yuksekligi onu diger ikonlarla ayni
  // hizaya sikistiriyor.
  merkez: {
    flex: 1,
    height: SATIR,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -18 }],
  },
  merkezDaire: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
    // HALKA YOK (kullanicinin istegi 2026-09-03): dugme TAM DOLU
    // turuncu. Eskiden 4 px'lik bir zemin halkasi vardi; acik modda
    // beyaz oldugu icin gorunmuyordu ama koyu modda zemin koyulasinca
    // turuncunun etrafinda siyah bir hale olarak ortaya cikti.
    // Halkanin isi dugmeyi cubuktan ayirmakti; o isi golge zaten
    // yapiyor.
    ...golge.yuzer,
  },
  merkezDaireAktif: { backgroundColor: renk.turuncuBasili },

  rozet: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: yuvarlak.hap,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rozetYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: 10,
    lineHeight: 13,
    color: '#FFFFFF',
  },
})
