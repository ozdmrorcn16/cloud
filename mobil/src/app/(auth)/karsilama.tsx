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
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
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

/**
 * Markanin durum cubuguna olan uzakligi. Kok duzen bu ekrana ust pay
 * VERMIYOR (bkz. `_layout.tsx`), cunku verseydi saatin arkasi beyaz
 * kalir ve krem sayfayla arasinda sert bir cizgi olusurdu; pay burada,
 * guvenli alanin uzerine ekleniyor.
 */
const UST_PAY = 44

export default function KarsilamaEkrani() {
  const guvenliAlan = useSafeAreaInsets()
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  function devamEt(hedef: 'kayit' | 'giris') {
    router.replace(hedef === 'kayit' ? '/kayit' : '/giris')
  }

  return (
    <View style={[stiller.sayfa, { paddingTop: guvenliAlan.top + UST_PAY }]}>
      {/* Marka TEK KEZ (kullanicinin secimi 2026-09-03): eskiden ustte
          isaret, altinda kelime markasi vardi - ayni sey iki kez
          soyleniyordu. */}
      <MarkaYazisi genislik={132} style={stiller.marka} />

      {/* Uc vaat burada: igne (check-in), avatar kumesi (tanisma),
          lekelerin koyulugu (populer yerler). Ekran artik onlari
          yazmiyor, gosteriyor. */}
      <View style={stiller.sahne}>
        <KarsilamaSahnesi />
      </View>

      {/* BASLIK YOK (kullanicinin istegi 2026-09-04): "Şu an nerede
          insan var?" satiri kaldirildi. Sahne zaten soruyu soruyor;
          dort satir da cevabi veriyor. */}

      {/* TANITIM SATIRLARI GERI GELDI (kullanicinin istegi 2026-09-04).
          Sahne uc vaadi hissettiriyor, bu dort satir onlari ADIYLA
          soyluyor - ikisi birbirinin yerine degil, birlikte calisiyor.
          Tek satirlik "cevap" metni kaldirildi: dort baslik zaten ayni
          seyi daha eksiksiz soyluyordu. */}
      <View style={stiller.adimlar}>
        {OZELLIKLER.map(({ no, ikon }) => (
          <View key={no} style={stiller.adim}>
            <OzellikIkonu ad={ikon} />
            <Text style={stiller.adimBaslik}>{t(`karsilama.adim${no}Baslik`)}</Text>
          </View>
        ))}
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

      {/* ODbL ATFI - hukuken sart, tercih degil. Sahnedeki yol agi
          OpenStreetMap verisinden turetilmis bir eser; ODbL turetilmis
          eserde kaynagin belirtilmesini istiyor. Kesfet ekraninda ayni
          atif zaten var. Bilerek en kucuk ve en soluk satir: bilgi
          dogru yerde dursun ama kompozisyonda sira almasin. */}
      <Text style={stiller.atif}>{t('karsilama.haritaAtfi')}</Text>
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  sayfa: {
    flex: 1,
    // Karsilama, beyaz zemin kuralinin TEK istisnasi.
    backgroundColor: renk.karsilamaZemini,
    paddingHorizontal: bosluk.xl,
    // UST PAY BURADA DEGIL: kok duzen bu ekrana pay vermiyor, ekran
    // kendi payini `guvenliAlan.top + UST_PAY` ile koyuyor. Boylece
    // krem zemin saatin ardina kadar uzaniyor ve ust sinir cizgisi
    // olusmuyor.
    paddingBottom: bosluk.l,
  },

  // ORTALI ve 150 -> 132 (kullanicinin secimi 2026-09-04, bes secenek
  // gorsel olarak sunuldu). Sahnedeki en buyuk sicak nokta zaten ekranin
  // orta ekseninde duruyor; marka da oraya oturunca ikisi tek bir dikey
  // omurga oluyor. Sola yasli halde marka o eksenden kacik duruyor ve
  // sahne sol ustten bastirilmis gorunuyordu.
  atif: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
    opacity: 0.55,
    textAlign: 'center',
    marginTop: bosluk.xs,
  },

  marka: { alignSelf: 'center' },

  // Sahne ekranin TAM GENISLIGINE yayiliyor: sayfa yan payini geri
  // aliyor. Lekelerin ve yollarin kenardan tasmasi kadrajin devam
  // ettigi hissini veriyor.
  // Sahne esnek ama dort satir eklendigi icin daha az yer kapliyor.
  sahne: { flex: 1, minHeight: 200, marginHorizontal: -bosluk.xl, marginTop: bosluk.s },

  // Dort tanitim satiri. Ikon sutunu sabit genislikte: ikonlarin
  // genisligi farkli, basliklar ayni noktadan bassin.
  adimlar: { gap: bosluk.m, marginTop: bosluk.xl, marginBottom: bosluk.xl },
  adim: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  ikonAlani: { width: 30, alignItems: 'center', justifyContent: 'center' },
  adimBaslik: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
    letterSpacing: -0.2,
  },

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
