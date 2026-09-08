import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Circle, G } from 'react-native-svg'
import { useDil } from '../../../lib/dil'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { KarsilamaSahnesi } from '../../tasarim/KarsilamaSahnesi'
import { MarkaYazisi } from '../../tasarim/MarkaYazisi'

/**
 * ILK ACILIS EKRANI.
 *
 * Kullanicinin karari (2026-08-25): hesabi olmayan HERKES, HER
 * acilista bu ekrani gorur. Hesap olusturan kisi buraya hic dusmez,
 * cunku oturumu aciliyor.
 *
 * DUZEN 2026-09-08'de kullanicinin gonderdigi REFERANS GORSELE gore
 * yeniden kuruldu (`tasarim/karsilama-referans.png`): marka, tek
 * cumlelik vaat, harita sahnesi, dort tanitim karti, birincil eylem.
 *
 * DIL SECIMI YOK (kullanicinin karari 2026-08-25): `lib/dil.tsx`
 * cihazin dilini okuyor ve uygulama o dille aciliyor.
 *
 * SOZLESME ONAYI BURADA YOK (kullanicinin karari 2026-08-25): onay tek
 * bir yerde, kayit ekraninda aliniyor. Bu ekran yalnizca uygulamanin ne
 * oldugunu anlatiyor; bir taahhut istemiyor.
 */

/**
 * Ikonlarin OPTIK HIZA DUZELTMESI.
 *
 * Dort ikonun kutusu ayni yerde ama her ikonun CIZIMI kendi 24x24
 * viewBox'i icinde baska bir noktadan basliyor; duzeltilmezse ikon
 * sutununun sol kenari zikzak yapiyor ve goz bunu satirlarin kaymasi
 * olarak okuyor (kullanici 2026-08-26'da "yazilar yamuk duruyor"
 * demisti). Degerler tarayicida `getBBox()` ile olculdu; ikon cizimi
 * degisirse yeniden olculmeli.
 */
const HIZA = 2.0
const MERKEZ = 12

const IKON_DUZELTME = {
  konum: { sol: 4.8, merkez: 12.0, olcek: 0.87 },
  kisiler: { sol: 2.6, merkez: 12.15, olcek: 0.97 },
  sohbet: { sol: 3.6, merkez: 12.4, olcek: 1 },
  // Stroke ile cizildigi icin sol kenari fill bbox'indan yarim cizgi
  // kalinligi kadar disarida.
  yogunluk: { sol: 1.6, merkez: 11.9, olcek: 1 },
} as const

type IkonAdi = keyof typeof IKON_DUZELTME

function OzellikIkonu({ ad }: { ad: IkonAdi }) {
  const renk = useRenk()
  const R = renk.turuncu
  const { sol, merkez, olcek: o } = IKON_DUZELTME[ad]
  const donusum = `translate(${HIZA - o * sol} ${MERKEZ - o * merkez}) scale(${o})`
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <G transform={donusum}>
        {ad === 'konum' && (
          <>
            <Path
              d="M12 2.5a7.2 7.2 0 0 0-7.2 7.2c0 5.4 7.2 11.8 7.2 11.8s7.2-6.4 7.2-11.8A7.2 7.2 0 0 0 12 2.5z"
              fill={R}
            />
            {/* Ignenin deligi zemin renginde: koyu bir daire olsa
                isaret siyah bir nokta gibi okunuyor. */}
            <Circle cx={12} cy={9.6} r={2.7} fill={renk.turuncuZemin} />
          </>
        )}
        {ad === 'kisiler' && (
          <>
            <Circle cx={9} cy={8.4} r={3.5} fill={R} />
            <Path d="M2.6 19.4c0-3.5 2.9-5.8 6.4-5.8s6.4 2.3 6.4 5.8z" fill={R} />
            <Circle cx={17.2} cy={9.4} r={2.6} fill={R} />
            <Path d="M14.6 19.4c0-2.6 1.4-4.4 3.4-4.4 2 0 3.4 1.8 3.4 4.4z" fill={R} />
          </>
        )}
        {ad === 'sohbet' && (
          <Path
            d="M3.6 5.2h16.8v10.4H9.6L5.4 19.6v-4h-1.8z"
            fill={R}
            strokeLinejoin="round"
          />
        )}
        {ad === 'yogunluk' && (
          <>
            <Path
              d="M3.2 15.6 9 9.8l3.6 3.6L20.4 5.6"
              stroke={R}
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path d="M14.8 5.6h6v6" stroke={R} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        )}
      </G>
    </Svg>
  )
}

/**
 * Dort tanitim karti - DORDU DE AYNI.
 *
 * Referansta ilk kart turuncu tonlu bir zemin tasiyordu ve niyet "goz
 * once check-in'e gitsin" idi. Kullanicinin duzeltmesi (2026-09-08):
 * "check-in yap yazisi da sanki uzerine basilmis gibi obuerlerinden
 * koyu, onu da obuerleriyle ayni yap". Tonlu zemin bir VURGU degil
 * BASILI HAL gibi okunuyordu - uygulamanin geri kalaninda dolgunun
 * koyulasmasi tam olarak "su an basiliyor" demek.
 */
const KARTLAR: { no: 1 | 2 | 3 | 4; ikon: IkonAdi }[] = [
  { no: 1, ikon: 'konum' },
  { no: 2, ikon: 'kisiler' },
  { no: 3, ikon: 'sohbet' },
  { no: 4, ikon: 'yogunluk' },
]

/**
 * Markanin durum cubuguna olan uzakligi. Kok duzen bu ekrana ust pay
 * VERMIYOR (bkz. `_layout.tsx`): verseydi saatin arkasi beyaz kalir ve
 * krem sayfayla arasinda sert bir cizgi olusurdu.
 */
const UST_PAY = 18

export default function KarsilamaEkrani() {
  const guvenliAlan = useSafeAreaInsets()
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()

  function devamEt(hedef: 'kayit' | 'giris') {
    router.replace(hedef === 'kayit' ? '/kayit' : '/giris')
  }

  return (
    // Guvenli alana bir TABAN veriliyor: web'de `insets.top` sifir
    // dondugu icin marka ekranin en tepesine yapisiyordu.
    <View style={[stiller.sayfa, { paddingTop: Math.max(guvenliAlan.top, 26) + UST_PAY }]}>
      <MarkaYazisi genislik={148} style={stiller.marka} />

      {/* VAAT: tek cumle, vurgu kelimesi turuncu. Turuncunun mesru
          kullanimi - "kesfet" bu ekranin cagrisi. */}
      <Text style={stiller.baslik}>
        {t('karsilama.baslik')}
        <Text style={stiller.baslikVurgu}>{t('karsilama.baslikVurgu')}</Text>
      </Text>
      <Text style={stiller.aciklama}>{t('karsilama.aciklama')}</Text>

      <View style={stiller.sahne}>
        <KarsilamaSahnesi />
      </View>

      <View style={stiller.kartlar}>
        {KARTLAR.map(({ no, ikon }) => (
          <View key={no} style={stiller.kart}>
            <OzellikIkonu ad={ikon} />
            <Text style={stiller.kartBaslik}>{t(`karsilama.adim${no}Baslik`)}</Text>
            <Text style={stiller.kartAciklama}>{t(`karsilama.adim${no}Aciklama`)}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [stiller.birincil, pressed && stiller.birincilBasili]}
        onPress={() => devamEt('kayit')}
        accessibilityRole="button"
      >
        <Text style={stiller.birincilYazi}>{t('karsilama.hesapOlustur')}</Text>
        <Text style={stiller.birincilOk}>→</Text>
      </Pressable>

      {/* Hesabi olan biri de uygulamayi yeni bir cihaza kurmus olabilir;
          onu bu ekranda kilitlememek gerekiyor. */}
      <Pressable style={stiller.ikincil} onPress={() => devamEt('giris')} accessibilityRole="button">
        <Text style={stiller.ikincilYazi}>
          {t('karsilama.hesabinVarMi')}{' '}
          <Text style={stiller.ikincilVurgu}>{t('karsilama.girisYap')}</Text>
        </Text>
      </Pressable>

      {/* ODbL ATFI - hukuken sart, tercih degil. Sahnedeki harita
          OpenStreetMap verisinden turetilmis bir eser. */}
      <Text style={stiller.atif}>{t('karsilama.haritaAtfi')}</Text>
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    sayfa: {
      flex: 1,
      // Karsilama, beyaz zemin kuralinin TEK istisnasi.
      backgroundColor: renk.karsilamaZemini,
      paddingHorizontal: bosluk.sayfa,
      paddingBottom: bosluk.l,
    },

    marka: { alignSelf: 'center' },

    baslik: {
      fontFamily: yazi.ekranBasligi,
      fontSize: olcek.altBaslik,
      color: renk.metin,
      textAlign: 'center',
      letterSpacing: -0.3,
      marginTop: bosluk.s,
    },
    baslikVurgu: { color: renk.turuncuYazi },

    aciklama: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metinIkincil,
      textAlign: 'center',
      lineHeight: 19,
      marginTop: bosluk.xs,
      paddingHorizontal: bosluk.xl,
    },

    // Sahne ekranin TAM GENISLIGINE yayiliyor: sayfa yan payini geri
    // aliyor. Haritanin kenardan tasmasi kadrajin devam ettigi hissini
    // veriyor - referansta da harita kenardan kenara.
    sahne: {
      flex: 1,
      minHeight: 230,
      marginHorizontal: -bosluk.sayfa,
      marginTop: bosluk.m,
    },

    kartlar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: bosluk.m,
      marginTop: bosluk.l,
    },
    kart: {
      // Iki sutun: satirin yarisindan aradaki boslugun yarisi kadar az.
      width: '48%',
      flexGrow: 1,
      backgroundColor: renk.yuzey,
      borderRadius: yuvarlak.kart,
      borderWidth: 1,
      borderColor: renk.cizgi,
      padding: bosluk.l,
      gap: bosluk.xs,
    },
    kartBaslik: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.govde,
      color: renk.metin,
      letterSpacing: -0.2,
      marginTop: bosluk.xs,
    },
    kartAciklama: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metinIkincil,
      lineHeight: 17,
    },

    birincil: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: bosluk.m,
      backgroundColor: renk.turuncu,
      borderRadius: yuvarlak.hap,
      paddingVertical: 17,
      marginTop: bosluk.l,
      ...golge.yuzer,
    },
    birincilBasili: { backgroundColor: renk.turuncuBasili },
    birincilYazi: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.altBaslik,
      color: '#FFFFFF',
    },
    birincilOk: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.altBaslik,
      color: '#FFFFFF',
    },

    ikincil: { alignItems: 'center', paddingVertical: bosluk.m },
    ikincilYazi: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil },
    ikincilVurgu: { fontFamily: yazi.govdeKalin, color: renk.turuncuYazi },

    atif: {
      fontFamily: yazi.govde,
      fontSize: olcek.minik,
      // OPACITY YOK: bu satir ODbL atfi, yani hukuken zorunlu bir metin;
      // soldurmak onu ekranin en zor okunan yeri yapardi.
      color: renk.metinIkincil,
      textAlign: 'center',
      marginTop: bosluk.xs,
    },
  })
