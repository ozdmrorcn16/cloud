import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useDil } from '../../../lib/dil'
import { ilkAcilisiIsaretle } from '../../../lib/ilk-acilis'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'
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
export default function KarsilamaEkrani() {
  const router = useRouter()
  const { t } = useDil()
  async function devamEt(hedef: 'kayit' | 'giris') {
    await ilkAcilisiIsaretle()
    router.replace(hedef === 'kayit' ? '/kayit' : '/giris')
  }

  return (
    <View style={stiller.sayfa}>
      <View style={stiller.ust}>
        {/* Kullanicinin istegi (2026-08-25): ustte isaret, altinda
            kelime markasi. Ikisi birlikte bir kilit olusturuyor. */}
        <MarkaIsareti zemin="acik" boyut={104} />
        <MarkaYazisi genislik={190} style={stiller.markaYazisi} />
        <Text style={stiller.baslik}>
          {t('karsilama.baslikBirinci')}
          {'\n'}
          <Text style={stiller.baslikVurgu}>{t('karsilama.baslikIkinci')}</Text>
        </Text>
        <Text style={stiller.aciklama}>{t('karsilama.aciklama')}</Text>
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
    paddingTop: 72,
    paddingBottom: bosluk.l,
  },

  markaYazisi: { marginTop: bosluk.m },
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
