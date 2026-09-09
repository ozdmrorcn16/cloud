import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Animated, type LayoutChangeEvent } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import { useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context'
import { konusmalarimiGetir } from '../../lib/sohbet'
import { gelenIstekleriGetir } from '../../lib/bag-listeleri'
import { bekleyenEtiketleriGetir } from '../../lib/etiket'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from './tema'
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
 * SEKME DEGISINCE DAIRE YANA KAYMIYOR (kullanicinin duzeltmesi
 * 2026-09-07: "yana kayiyormus gibi bir animasyon olmasi, sadece
 * secilen one ciksin"). Ilk uygulamada daire referans videodaki gibi
 * bir sekmeden digerine kayiyordu; kullanici o hareketi istemedi.
 *
 * Yeni hareket YERINDE: daire birakilan sekmede kuceuelerek cubugun
 * icine cekilip soneuyor, ardindan yeni sekmede yay ile buyueyerek
 * ONE CIKIYOR. Yatay konum ikisinin ARASINDA, daire tamamen
 * gorunmezken aninda degisiyor - yani gozle izlenebilen bir yatay
 * hareket hic yok.
 *
 * Yan fayda: daire artik ortadaki check-in dugmesinin uzerinden
 * gecmiyor, dolayisiyla ikisinin cakisma ihtimali tamamen ortadan
 * kalkti.
 *
 * CHECK-IN DUGMESI DE AYNI SEKILDE ONE CIKIYOR (ayni istek: "chekin
 * dugmesine de aynisi olsun"): secildiginde yay ile buyueyup yukari
 * kalkiyor, birakildiginda eski olcusune donuyor. Boylece cubuktaki
 * her secim ayni dili konusuyor.
 *
 * ETIKETLER DURUYOR. Referans varyantta yoktular ve bir sure
 * kaldirildilar, ama kullanici geri istedi (2026-09-07: "sabit sutunu
 * butonlari eski haline getir, altlarinda yazi olan haline"). Yani
 * daire referanstan, etiketler bizden.
 *
 * ANIMASYON `Animated` ILE, Reanimated ile DEGIL. Sebep: hareketin
 * tamami transform ve opacity, yani `useNativeDriver` ile JS
 * kuyrugunu hic mesgul etmeden calisiyor; ustelik web surumunde de
 * ek yapilandirma istemiyor (uygulama tarayicidan da aciliyor ve
 * ekran goruntusu araci orayi olcuyor). Yeni bir paket gerekmedigi
 * icin degisiklik OTA ile gidiyor.
 */

/**
 * IKON ALANI - her slotta ikonun (ya da dairenin) oturdugu bolge.
 *
 * Olcusu ORTADAKI DUGMEDEN geliyor: check-in dairesi bu alani tam
 * dolduruyor ve slotlarin en buyugu o. Butun slotlarda ayni oldugu
 * icin ETIKETLER AYNI HIZADA duruyor - onceden merkezin icerigi daha
 * uzundu ve "Check-in" etiketi komsularindan 20 px asagida kaliyordu
 * (olculdu).
 *
 * 54 -> 48 (kullanicinin istegi 2026-09-09: "sabit sutun cok kalin,
 * biraz incelt, cok genis duruyor"). ALT SINIR aktif sekme dairesi:
 * `DAIRE` 44 px, yani 48 ona 2 px pay birakiyor. Daha asagisi daireyi
 * kirpardi.
 *
 * Check-in dugmesi bu olcuye BAGLI ve hala en buyuk slot (48'e karsi
 * 24 px'lik ikonlar), yani "obur ikonlardan buyuk olsun" kurali
 * (2026-08-26) bozulmuyor.
 */
const IKON_ALANI = 48

/**
 * Cubugun ic satir yuksekligi = ikon alani + gap + etiket satiri.
 *
 * 54 -> 72 (2026-09-09). Dugmeler cubuktan TASMAYI birakinca 54'luk
 * satira 54'luk daire + etiket sigmiyordu: aktif sekmenin dairesi
 * etiketin uzerine biniyordu (kullanicinin bildirdigi hata; olculdu -
 * daire 754-798, "Bildirimler" etiketi 785-799).
 *
 * SECILEN COZUM BUYUTMEK, KUCULTMEK DEGIL: daireleri kucultmek
 * check-in dugmesini 54'ten ~34'e indirirdi ve o dugmenin "obur
 * ikonlardan buyuk" olmasi kullanicinin karari (2026-08-26).
 *
 * Cubuk boylece 80 -> 98 px. GORSEL AYAK IZI BUYUMUYOR: eskiden daire
 * cubuktan 17 px yukari tasiyordu, yani ekranda kapladigi alan zaten
 * bu kadardi - tasan parca artik cubugun icinde.
 *
 * SONRA INCELTILDI (kullanicinin istegi 2026-09-09): ikon alani 54 ->
 * 48 ve dikey dolgu 12 -> 8, yani satir 72 -> 66 ve cubuk 98 -> 84 px.
 * Etiketler ve daire duruyor; kisalan sey yalnizca bosluk.
 */
const SATIR = IKON_ALANI + 4 + 14

/** Aktif sekmeyi isaretleyen dairenin capi. */
const DAIRE = 44
/**
 * Dairenin dikey konumu.
 *
 * 35 -> 0 (kullanicinin istegi 2026-09-09): aktif sekmenin dairesi
 * cubugun USTUNE cikiyordu; artik ikonun yerinde, slotun icinde
 * duruyor. Sabit korunuyor cunku animasyon hala bu degeri kullaniyor -
 * ileride yeniden yukselmesi istenirse tek satirlik is.
 */
const DAIRE_YUKSEK = 0

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

  /*
   * SECILI HAL YALNIZCA RENK VE PARILTI (kullanicinin istegi
   * 2026-09-09: "sabit sutundaki butonlar one dogru cikmasin,
   * basilinca oldugu yerde turuncu parlak halde olsun").
   *
   * Onceki surumde secilince yay ile 8 px yukari kalkip %10
   * buyuyordu; o hareket kaldirildi. Buyume ayrica dairenin
   * altindaki etiketin uzerine tasiyordu - dugme kendi ikon alanini
   * tam dolduruyor, buyudugunde tasacak yer yok.
   */
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
          <Circle cx={12} cy={9.6} r={2.8} fill={aktif ? renk.turuncuSecili : renk.turuncu} />
        </Svg>
      </View>
      <Text style={stiller.merkezEtiket} numberOfLines={1}>
        Check-in
      </Text>
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
  // `turuncuSecili` ile gosteriyor, ayrica daire ile isaretlemek
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
  const olcek = useRef(new Animated.Value(1)).current
  const opaklik = useRef(new Animated.Value(0)).current
  const ilkYerlesim = useRef(true)

  useEffect(() => {
    if (cubukGenislik === 0) return

    if (!daireGorunur) {
      // Check-in ekrani: daire GERI CEKILIYOR. Olcek de kuceuelueyor -
      // yalnizca opaklik dueseydi daire "solmus" gorunurdu, oysa
      // burada sekmeyi birakiyor.
      Animated.parallel([
        Animated.timing(opaklik, { toValue: 0, duration: 130, useNativeDriver: true }),
        Animated.timing(olcek, { toValue: 0.55, duration: 130, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 130, useNativeDriver: true }),
      ]).start()
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
      olcek.setValue(1)
      setDaireIkonSira(aktifSira)
      Animated.timing(opaklik, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start()
      return
    }

    // IKI ADIM: CEKIL -> ONE CIK. Yatay konum ikisinin arasinda,
    // daire gorunmezken degisiyor; yana kayma diye bir sey yok.
    Animated.parallel([
      Animated.timing(y, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(olcek, { toValue: 0.55, duration: 120, useNativeDriver: true }),
      Animated.timing(opaklik, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start(({ finished }) => {
      // Animasyon yarida kesildiyse (hizli sekme degisimi) yeni
      // effect zaten devrali; buradan devam etmek iki animasyonu
      // ust uste bindirirdi.
      if (!finished) return
      // YATAY SICRAMA TAM BURADA: opaklik 0, yani hareket gorunmuyor.
      x.setValue(hedef)
      setDaireIkonSira(aktifSira)
      Animated.parallel([
        Animated.timing(opaklik, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.spring(olcek, {
          toValue: 1,
          useNativeDriver: true,
          damping: 11,
          stiffness: 210,
          mass: 0.6,
        }),
        Animated.spring(y, {
          toValue: -DAIRE_YUKSEK,
          useNativeDriver: true,
          damping: 12,
          stiffness: 190,
          mass: 0.65,
        }),
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
              <View style={stiller.ikonAlani}>
                {/* Ic sarmalayici KUCUK kaliyor (ikon kadar): ROZET ona
                    gore konumlaniyor, disa alinsaydi 54 px'lik alanin
                    kosesine kacardi. */}
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
              </View>
              {/*
                Etiket GIZLENMIYOR - ikonun aksine. Aktif sekmede ikonun
                yerini ustteki daire aliyor, ama etiket slotta kalan tek
                isaret; gizlenseydi aktif sekmenin adi hicbir yerde
                yazmazdi.
              */}
              <Text style={[stiller.etiket, aktif && stiller.etiketAktif]} numberOfLines={1}>
                {s.ad}
              </Text>
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
            {
              opacity: opaklik,
              transform: [{ translateX: x }, { translateY: y }, { scale: olcek }],
            },
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
 *
 * 104 -> 122 -> 108 (2026-09-09, ayni gun iki kez). Once cubugun ic
 * satiri 54'ten 72'ye cikti (daire etiketi ortuyordu), sonra kullanici
 * "cubuk cok kalin, biraz incelt" deyince satir 66'ya, cubuk 84 px'e
 * indi. Bu sayi 45 ekranda kullaniliyor; cubugun yuksekligi degisirse
 * BURASI DA degismeli, yoksa son satir cubugun altinda kalir.
 * Icerik artik ekranin dibine kadar aktigi icin alt inset (ana ekran
 * gostergesi) da paya dahil; web'de sifir. Cihaz olcusu uygulama
 * acilirken bir kez okunuyor - donmeyle degismiyor.
 */
export const ALT_GEZINME_PAYI = 108 + (initialWindowMetrics?.insets.bottom ?? 0)

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
    // 12 -> 8 (kullanicinin istegi 2026-09-09: cubuk incelsin).
    paddingVertical: bosluk.s,
    ...golge.yuzer,
  },
  sekme: {
    flex: 1,
    height: SATIR,
    alignItems: 'center',
    // ORTALAMA YOK: icerik yukaridan basliyor ki ikon alani her
    // slotta ayni yeri kaplasin ve etiketler ayni hizaya duessun.
    gap: 4,
    paddingHorizontal: 2,
  },
  /** Ikonun oturdugu bolge; merkez dugmenin dairesiyle ayni olcude. */
  ikonAlani: { height: IKON_ALANI, alignItems: 'center', justifyContent: 'center' },
  etiket: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },
  /*
   * Aktif etiket turuncu ve kalin. Aktif sekmenin IKONU gizli (yerini
   * ustteki daire aldi), yani sekmeyi slotta temsil eden tek sey bu
   * etiket - vurguyu tasimasi gerekiyor.
   */
  etiketAktif: { fontFamily: yazi.govdeKalin, color: renk.turuncuYazi },

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
    /*
     * ETIKET TELAFISI. Yuva cubugun tam dikey ortasina oturuyor ama
     * hizalanmasi gereken sey cubugun ortasi degil IKONUN merkezi -
     * etiket eklenince ikon, kendi slotunda yukari kaydi (ikon + gap +
     * etiket birlikte ortalaniyor). Alt pay icerigi tam o kadar yukari
     * itiyor: gap (4) + etiket satiri (~14) = 18, yarisi 9 px.
     *
     * Bu sayi etiketin punto ya da gap degistiginde GUNCELLENMELI;
     * yoksa daire ikonun uzerine tam oturmaz ve dalis sirasinda kayma
     * gorunur.
     */
    paddingBottom: 18,
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

  /*
   * Merkez dugme artik cubuktan TASMIYOR (kullanicinin istegi
   * 2026-09-09). Dairesi ikon alanini tam dolduruyor, yani slotun
   * icerigi diger sekmelerle birebir ayni yuksekligi kapliyor:
   * 54 + gap 4 + etiket 14.
   *
   * Eski surumde tasma once `transform`, sonra `marginTop` ile
   * yapiliyordu; ikisi de kalkti. Tarihsel gerekce: transform
   * layout'u etkilemedigi icin satiri kisaltmiyordu ama etiketi de
   * birlikte tasiyordu.
   */
  merkez: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  merkezEtiket: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.turuncuYazi,
    // TELAFI YOK: daire artik butun slotlarla ayni ikon alanini
    // kapliyor, dolayisiyla etiket kendiliginden komsulariyla ayni
    // hizada duruyor.
  },
  merkezDaire: {
    width: IKON_ALANI,
    height: IKON_ALANI,
    borderRadius: IKON_ALANI / 2,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
    // HALKA YOK (kullanicinin istegi 2026-09-03): dugme TAM DOLU
    // turuncu. Eskiden 4 px'lik bir zemin halkasi vardi; acik modda
    // beyaz oldugu icin gorunmuyordu ama koyu modda zemin koyulasinca
    // turuncunun etrafinda siyah bir hale olarak ortaya cikti.
    // Halkanin isi dugmeyi cubuktan ayirmakti; o isi golge yapiyor.
    //
    // PARILTI, notr golge DEGIL (kullanicinin istegi 2026-09-07:
    // "checkin dugmesinin altina da yanindaki sutunlar gibi parlak
    // neon bir isik koy, yanlarindaki butonlardan referans al").
    // Degerler aktif sekme dairesinden (`daireGovde`) BIREBIR
    // alindi - referans acikca o oldugu icin ikisi ayni jetonlari
    // paylasiyor; biri degistirilirse digeri de degismeli, yoksa
    // cubukta iki farkli parilti dili olur.
    //
    // `golge.yuzer`in yerini aliyor, yanina gelmiyor: RN'de tek bir
    // golge var, iki tanim ust uste yazilir ve sonuncusu kazanirdi.
    shadowColor: renk.turuncu,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  /*
   * SECILI hal PARLAKLASIR, koyulasmaz (kullanicinin istegi
   * 2026-09-07). `turuncuBasili` degil `turuncuSecili` - ikisinin
   * farki tema.ts'te yazili.
   */
  merkezDaireAktif: { backgroundColor: renk.turuncuSecili },

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
