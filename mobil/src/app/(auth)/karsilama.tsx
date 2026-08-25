import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import { useDil } from '../../../lib/dil'
import { ilkAcilisiIsaretle } from '../../../lib/ilk-acilis'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'
import { KrokiZemin } from '../../tasarim/KrokiZemin'
import { MarkaIsareti } from '../../tasarim/MarkaIsareti'
import { MarkaYazisi } from '../../tasarim/MarkaYazisi'

/**
 * ILK ACILIS EKRANI.
 *
 * Kullanicinin karari (2026-08-25): bu ekran uygulamayi ILK INDIREN
 * kisiye gosterilir ve bir daha gorunmez. Kullanici uygulamayi silip
 * tekrar indirirse yeniden gorunur - isaret cihazda saklandigi icin
 * (bkz. lib/ilk-acilis.ts) bu davranis kendiliginden dogru calisiyor.
 * Hesabi olan biri buraya hic dusmez: oturumu olan dogrudan uygulamaya,
 * oturumu olmayip bu ekrani daha once gormus olan ise girise gider.
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
 * Kullanicinin verdigi ornekteki gibi: KOYU daire icinde TURUNCU sekil.
 * Sekiller dolgu (stroke degil) - kucuk dairenin icinde ince cizgi
 * kayboluyordu.
 */
function OzellikIkonu({ ad }: { ad: 'konum' | 'kisiler' | 'sohbet' | 'yogunluk' }) {
  const R = renk.turuncu
  return (
    <View style={stiller.ikonDairesi}>
      <Svg width={24} height={24} viewBox="0 0 24 24">
        {ad === 'konum' && (
          <>
            <Path
              d="M12 2.5a7.2 7.2 0 0 0-7.2 7.2c0 5.4 7.2 11.8 7.2 11.8s7.2-6.4 7.2-11.8A7.2 7.2 0 0 0 12 2.5z"
              fill={R}
            />
            <Circle cx={12} cy={9.6} r={2.7} fill={renk.metin} />
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
            <Path d="M3.5 20.5h3.6v-6H3.5zM10.2 20.5h3.6V9.5h-3.6zM16.9 20.5h3.6V4h-3.6z" fill={R} />
          </>
        )}
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
  async function devamEt(hedef: 'kayit' | 'giris') {
    await ilkAcilisiIsaretle()
    router.replace(hedef === 'kayit' ? '/kayit' : '/giris')
  }

  return (
    <View style={stiller.sayfa}>
      {/* Kroki butun ekrani kapliyor, icerik onun ustunde duruyor
          (kullanicinin karari 2026-08-25). */}
      <KrokiZemin />

      <View style={stiller.ust}>
        {/* Kullanicinin istegi (2026-08-25): ustte isaret, altinda
            kelime markasi. Ikisi birlikte bir kilit olusturuyor. */}
        <MarkaIsareti zemin="acik" boyut={84} />
        <MarkaYazisi genislik={168} style={stiller.markaYazisi} />

        {/* Slogan ve altindaki paragraf KALDIRILDI (kullanicinin karari,
            2026-08-25). Uygulamayi anlatan tek yer asagidaki ozellik
            listesi; slogan onun soyledigini bir kez daha soyluyordu. */}
      </View>

      {/* Uygulamanin ne yaptigini anlatan tek yer. Kullanicinin verdigi
          ornekteki duzen: koyu daire icinde turuncu ikon, yaninda kisa
          baslik ve tek satirlik aciklama. */}
      <View style={stiller.adimlar}>
        {OZELLIKLER.map(({ no, ikon }) => (
          <View key={no} style={stiller.adim}>
            <OzellikIkonu ad={ikon} />
            <View style={stiller.adimOrta}>
              <Text style={stiller.adimBaslik}>{t(`karsilama.adim${no}Baslik`)}</Text>
              <Text style={stiller.adimMetin}>{t(`karsilama.adim${no}Metin`)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={stiller.esnekBosluk} />

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

      <Text style={stiller.kucukNot}>{t('karsilama.kucukNot')}</Text>
    </View>
  )
}

const stiller = StyleSheet.create({
  sayfa: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.xl,
    paddingTop: 44,
    paddingBottom: bosluk.l,
  },

  markaYazisi: { marginTop: bosluk.s },

  adimlar: { marginTop: bosluk.l, gap: bosluk.m },
  adim: { flexDirection: 'row', alignItems: 'center', gap: bosluk.l },
  ikonDairesi: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: renk.metin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adimOrta: { flex: 1 },
  adimBaslik: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  adimMetin: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: 2,
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

  esnekBosluk: { flex: 1 },
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

  kucukNot: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    lineHeight: 15,
    color: renk.metinSoluk,
    textAlign: 'center',
  },
})
