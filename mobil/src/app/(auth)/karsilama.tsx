import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path, Circle, G } from 'react-native-svg'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'
import { SicaklikZemin } from '../../tasarim/SicaklikZemin'
import { CheckInSahnesi } from '../../tasarim/CheckInSahnesi'
import { MarkaIsareti } from '../../tasarim/MarkaIsareti'
import { MarkaYazisi } from '../../tasarim/MarkaYazisi'

/**
 * ILK ACILIS EKRANI.
 *
 * Kullanicinin karari (2026-08-25): hesabi olmayan HERKES, HER
 * acilista bu ekrani gorur. Once "yalnizca ilk indirene gosterilsin"
 * denmisti; o kural ve onu tasiyan cihaz isareti kaldirildi.
 * Hesap olusturan kisi buraya hic dusmez, cunku oturumu aciliyor.
 *
 * ICERIK: kelime markasi, vaat, hesap olustur. Dil secimi ve sozlesme
 * onayi BILEREK yok - asagiya bak.
 *
 * DIL SECIMI YOK (kullanicinin karari 2026-08-25): "eğer uygulama
 * kullanılan cihazın dilini tespit edip otomatik o dilde
 * görünebilecekse dil seçimi yaptırmıcaz". `lib/dil.tsx` cihazin
 * dilini okuyor ve uygulama o dille aciliyor; kullaniciya sorulmuyor.
 * Dili degistirmek isteyen icin dogru yer ayarlar ekrani.
 *
 * SOZLESME ONAYI BURADA YOK (kullanicinin karari 2026-08-25):
 * "Sozlesmeyi ilk acilis ekraninda degil sadece hesap olusturma
 * adimina koy." Onay tek bir yerde, kayit ekraninda aliniyor ve orada
 * KVKK ispat kaydi hesabin olustugu anda yaziliyor. Bu ekran yalnizca
 * uygulamanin ne oldugunu anlatiyor; bir taahhut istemiyor.
 */
/**
 * Acilis ekranindaki ozellik ikonlari.
 *
 * Once koyu daire icindeydiler; kullanici daireyi kaldirtti ve ikonlari
 * biraz buyuttu (2026-08-25). Zeminsiz turuncu sekil, krokinin uzerinde
 * daha hafif duruyor - koyu daireler ekranin en agir ogesiydi ve gozu
 * metinden caliyordu.
 *
 * Sekiller dolgu (stroke degil): bu boyutta ince cizgi zayif kaliyor.
 */
/**
 * Ikonlarin OPTIK HIZA DUZELTMESI.
 *
 * Sorun (2026-08-26, kullanici "yazilar yamuk duruyor" dedi): dort
 * ikonun kutusu da ayni yerde (x=27, 34x34) ve dort baslik da ayni
 * yerde (x=76) basliyor, ama her ikonun CIZIMI kendi 24x24 viewBox'i
 * icinde baska bir noktadan basliyor. Olculen mürekkep sol kenarlari
 * 33.8 / 30.7 / 32.1 / 29.7 px'di - yani ikon sutununun sol kenari
 * 4 px zikzak yapiyordu ve goz bunu satirlarin kaymasi olarak
 * okuyordu.
 *
 * Cozum ikonlari yeniden cizmek degil, her birini kendi bbox'ina gore
 * kaydirmak: hepsinin mürekkebi ayni x'ten (HIZA) basliyor ve dikey
 * merkezi 12'ye oturuyor. Degerler tarayicida `getBBox()` ile
 * olculdu; ikon cizimi degisirse yeniden olculmeli.
 *
 * yogunluk'ta gövde stroke ile ciziliyor: getBBox stroke'u saymadigi
 * icin genislik 2.6/2 = 1.3 birim disariya tasiyor, dolayisiyla
 * gercek sol kenari 3.2 degil 1.9.
 */
const HIZA = 2.0
/** Butun ikonlarin oturdugu dikey merkez. */
const MERKEZ = 12

/**
 * `sol` ve `merkez`: ikonun mürekkebinin OLCULEN sol kenari ve dikey
 * merkezi (viewBox birimi). `olcek`: optik boyut esitlemesi.
 *
 * Olcek neden hepsinde 1 degil: ham hallerinde konum ignesi 19 birim
 * yuksekti, digerleri ~14.5. Alan olarak yakinlar ama IGNE UZUN oldugu
 * icin gozde daha iri duruyordu. Boyu 16.5'e cekildi. Yukseklikleri
 * ZORLA esitlemek yanlis olurdu: populer oku yassi bir sekil, ayni
 * boya cekilse 26 birim genisleyip viewBox'i tasardi.
 */
const IKON_DUZELTME = {
  konum: { sol: 4.8, merkez: 12.0, olcek: 0.87 },
  kisiler: { sol: 2.6, merkez: 12.15, olcek: 0.97 },
  sohbet: { sol: 3.6, merkez: 12.4, olcek: 1 },
  // Stroke ile cizildigi icin sol kenari fill bbox'indan yarim cizgi
  // kalinligi (3.2/2) kadar disarida: 3.2 - 1.6 = 1.6.
  yogunluk: { sol: 1.6, merkez: 11.9, olcek: 1 },
} as const

function OzellikIkonu({ ad }: { ad: 'konum' | 'kisiler' | 'sohbet' | 'yogunluk' }) {
  const R = renk.turuncu
  const { sol, merkez, olcek } = IKON_DUZELTME[ad]
  // Once olcekleniyor, sonra kaydiriliyor - bu yuzden kaydirma
  // olceklenmis kenara gore hesaplaniyor.
  const donusum = `translate(${HIZA - olcek * sol} ${MERKEZ - olcek * merkez}) scale(${olcek})`
  return (
    <View style={stiller.ikonAlani}>
      <Svg width={30} height={30} viewBox="0 0 24 24">
        <G transform={donusum}>
        {ad === 'konum' && (
          <>
            <Path
              d="M12 2.5a7.2 7.2 0 0 0-7.2 7.2c0 5.4 7.2 11.8 7.2 11.8s7.2-6.4 7.2-11.8A7.2 7.2 0 0 0 12 2.5z"
              fill={R}
            />
            {/* Ignenin deligi: koyu daire kalkinca zemin rengi olmali,
                yoksa siyah bir nokta gibi duruyor. */}
            <Circle cx={12} cy={9.6} r={2.7} fill={renk.karsilamaZemini} />
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
          // Yukselen ok: 'populer yerler' sutun grafiginden daha dogru
          // anlatiyor - artan ilgi demek.
          <>
            <Path
              d="M3.2 16.4l5.6-5.6 3.8 3.8 6-6"
              stroke={R}
              // 2.6 -> 3.2: diger uc ikon DOLU sekil, bu tek basina
              // ince cizgiydi ve satirda daha zayif duruyordu. Fark
              // boyutta degil agirliktaydi.
              strokeWidth={3.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path d="M14.6 7.4h6.4v6.4z" fill={R} />
          </>
        )}
        </G>
      </Svg>
    </View>
  )
}

const OZELLIKLER = [
  { no: 1, ikon: 'konum' },
  { no: 2, ikon: 'kisiler' },
  { no: 3, ikon: 'sohbet' },
  { no: 4, ikon: 'yogunluk' },
] as const

export default function KarsilamaEkrani() {
  const router = useRouter()
  const { t } = useDil()
  function devamEt(hedef: 'kayit' | 'giris') {
    router.replace(hedef === 'kayit' ? '/kayit' : '/giris')
  }

  return (
    <View style={stiller.sayfa}>
      {/* Kroki butun ekrani kapliyor, icerik onun ustunde duruyor
          (kullanicinin karari 2026-08-25). */}
      <SicaklikZemin />

      <View style={stiller.ust}>
        {/* Kullanicinin istegi (2026-08-25): ustte isaret, altinda
            kelime markasi. Ikisi birlikte bir kilit olusturuyor. */}
        <MarkaIsareti zemin="acik" boyut={84} />
        <MarkaYazisi genislik={168} style={stiller.markaYazisi} />

        {/* SLOGAN YOK. 2026-08-26'da bir kez geri getirildi ve ayni
            gun kullanicinin karariyla yeniden kaldirildi.

            ORNEK CHECK-IN KARTLARI DA YOK. Ayni gun eklenmislerdi,
            2026-08-27'de kullanicinin istegiyle kaldirildi: uydurma
            mekan adlari ve uydurma kisi sayilari tasiyorlardi. Geriye
            kroki zemin, marka ve dort baslik kaldi. Tekrar onerme. */}
      </View>

      {/* Uygulamanin ne yaptigini anlatan tek yer: ikon + tek satirlik
          baslik. Basliklarin altindaki aciklamalar kullanicinin
          karariyla kaldirildi (2026-08-26) ve satirlar EKRANA
          ORTALANDI - artik sola dayali bir liste degil, ortada duran
          dort satir. */}
      <View style={stiller.ustBosluk} />

      <View style={stiller.adimlar}>
        {OZELLIKLER.map(({ no, ikon }) => (
          <View key={no} style={stiller.adim}>
            <OzellikIkonu ad={ikon} />
            <Text style={stiller.adimBaslik}>{t(`karsilama.adim${no}Baslik`)}</Text>
          </View>
        ))}
      </View>

      <View style={stiller.esnekBosluk} />

      {/* Check-in sahnesi: nabiz atan igne ve cevresindeki insanlar
          (kullanicinin karari 2026-08-30). Sayfa yan payini asip
          ekranin tam genisligine yayiliyor; kenardaki halkalarin
          tasmasi kadrajin devam ettigi hissini veriyor. */}
      <View style={stiller.sahneAlani}>
        <CheckInSahnesi />
      </View>

      <Pressable
        style={({ pressed }) => [stiller.birincil, pressed && stiller.birincilBasili]}
        onPress={() => devamEt('kayit')}
        accessibilityRole="button"
      >
        <Text style={stiller.birincilYazi}>{t('karsilama.hesapOlustur')}</Text>
      </Pressable>

      {/* Hesabi olan biri de uygulamayi yeni bir cihaza kurmus
          olabilir; onu bu ekranda kilitlememek gerekiyor. */}
      <Pressable
        style={stiller.ikincil}
        onPress={() => devamEt('giris')}
        accessibilityRole="button"
      >
        <Text style={stiller.ikincilYazi}>
          {t('karsilama.hesabinVarMi')}{' '}
          <Text style={stiller.ikincilVurgu}>{t('karsilama.girisYap')}</Text>
        </Text>
      </Pressable>

    </View>
  )
}

const stiller = StyleSheet.create({
  sayfa: {
    flex: 1,
    // Karsilama, beyaz zemin kuralinin TEK istisnasi.
    backgroundColor: renk.karsilamaZemini,
    paddingHorizontal: bosluk.xl,
    paddingTop: 44,
    paddingBottom: bosluk.l,
  },

  markaYazisi: { marginTop: bosluk.s },

  adimlar: {
    // Blok, marka kilidi ile butonlarin ARASINA ortalaniyor: ustunde ve
    // altinda birer esnek bosluk var.
    //
    // Satirlar ARTIK SOLA DAYALI DEGIL (kullanicinin karari
    // 2026-08-26): her satir ikonuyla birlikte kendi icinde
    // ortalaniyor. Aciklamalar kalkinca sola dayali hizalamanin
    // tuttugu sey kalmadi - dort kisa baslik ortada daha dengeli
    // duruyor.
    marginTop: 0,
    gap: 20,
    // Blok en genis satiri kadar genis ve EKRANA ORTALI; satirlar
    // blogun icinde sola dayali. Kullanicinin karari (2026-08-26):
    // "basliklar onceki gibi orantili alt alta olmali". Her satiri tek
    // tek ortalamak basliklarin baslangic noktasini kaydiriyor ve
    // sutun hissi kayboluyordu; blogu ortalayip icini hizali tutmak
    // ikisini birden veriyor.
    //
    // Blok SOLA DAYALI (kullanicinin karari 2026-08-26: once "biraz
    // sola yakin baslasin", sonra "daha sola"). Ek pay kaldirildi;
    // artik sayfa payinin kendisinden, yani 24 px'ten basliyor -
    // butonlarla ayni sol kenar. Tam ortada ~54, ara adimda 36 px'ti.
    alignSelf: 'flex-start',
  },
  adim: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  // Sabit genislik: ikonlarin genisligi farkli, sutun bundan
  // kaymasin. Basliklar da bu yuzden ayni noktadan basliyor.
  ikonAlani: { width: 36, alignItems: 'center', justifyContent: 'center' },
  adimBaslik: {
    // Agirlik iki adimda indi: once 700 Bold -> 600 SemiBold ("cok az
    // incelt ama yine belirgin olsun"), sonra 600 -> 500 Medium ("cok
    // az daha incelt"). Punto da bir tik kucultuldu (19 -> 17) ve
    // ikonlar 34 -> 30 ile birlikte indi ki oran bozulmasin.
    fontFamily: yazi.govdeOrta,
    fontSize: 17,
    color: renk.metin,
    letterSpacing: -0.2,
  },
  ust: { alignItems: 'center' },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 30,
    lineHeight: 37,
    color: renk.metin,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: bosluk.xxl,
  },
  baslikVurgu: { color: renk.turuncu },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 23,
    color: renk.metinIkincil,
    textAlign: 'center',
    marginTop: bosluk.m,
  },

  // Blok ortadan biraz YUKARIDA duruyor (kullanicinin karari
  // 2026-08-26: "biraz yukariya"). Ustteki bosluk alttakinden kucuk;
  // 1 / 1 tam ortaliyordu.
  // Icerik krokinin ALT KALABALIGINA duesmemeli: haritanin dibindeki
  // insan baloncuklari ve nabiz halkasi metnin altina girip okumayi
  // bozuyor. Bu yuzden ust bosluklar kucuk, alt bosluk buyuk.
  // Dort baslik, marka kilidi ile check-in sahnesinin ARASINA
  // ortalaniyor (kullanicinin duzeltmesi 2026-08-30: "biraz asagi cek
  // ortala"). Onceden 0.8 / 1.05 idi, yani blok yukari kacikti.
  //
  // Oran neden 1.4 / 1, yani neden tam esit degil: sahnenin ust
  // kenari ile nabiz halkasinin GORUNEN ust kenari arasinda ~24 px
  // olu alan var (halka, ignenin basina ortalaniyor). Esit bolunce
  // alttaki bosluk gozde o kadar fazla duruyordu. Sahnenin olculeri
  // degisirse bu oran da yeniden bakilmali.
  ustBosluk: { flex: 1.4 },
  esnekBosluk: { flex: 1 },
  // Sayfanin yatay payini geri aliyor: sahne ekranin tam genisliginde.
  sahneAlani: { marginHorizontal: -bosluk.xl },
  tik: { color: '#FFFFFF', fontSize: 14, lineHeight: 18, fontFamily: yazi.govdeKalin },

  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: bosluk.l,
    ...golge.yuzer,
  },
  birincilBasili: { backgroundColor: renk.turuncuKoyu },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.altBaslik,
    color: '#FFFFFF',
  },

  ikincil: { alignItems: 'center', paddingVertical: bosluk.m },
  ikincilYazi: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil },
  ikincilVurgu: { fontFamily: yazi.govdeKalin, color: renk.metin },

})
