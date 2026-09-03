import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
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
export default function KarsilamaEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  function devamEt(hedef: 'kayit' | 'giris') {
    router.replace(hedef === 'kayit' ? '/kayit' : '/giris')
  }

  return (
    <View style={stiller.sayfa}>
      {/* Marka TEK KEZ (kullanicinin secimi 2026-09-03): eskiden ustte
          isaret, altinda kelime markasi vardi - ayni sey iki kez
          soyleniyordu. */}
      <MarkaYazisi genislik={150} style={stiller.marka} />

      {/* Uc vaat burada: igne (check-in), avatar kumesi (tanisma),
          lekelerin koyulugu (populer yerler). Ekran artik onlari
          yazmiyor, gosteriyor. */}
      <View style={stiller.sahne}>
        <KarsilamaSahnesi />
      </View>

      <Text style={stiller.soru}>{t('karsilama.soru')}</Text>
      <Text style={stiller.cevap}>{t('karsilama.cevap')}</Text>

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

const stilleriYap = (renk: Renk) => StyleSheet.create({
  sayfa: {
    flex: 1,
    // Karsilama, beyaz zemin kuralinin TEK istisnasi.
    backgroundColor: renk.karsilamaZemini,
    paddingHorizontal: bosluk.xl,
    paddingTop: 44,
    paddingBottom: bosluk.l,
  },

  marka: { alignSelf: 'flex-start' },

  // Sahne ekranin TAM GENISLIGINE yayiliyor: sayfa yan payini geri
  // aliyor. Lekelerin ve yollarin kenardan tasmasi kadrajin devam
  // ettigi hissini veriyor.
  sahne: { flex: 1, marginHorizontal: -bosluk.xl, marginTop: bosluk.m },

  soru: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.6,
    color: renk.metin,
    marginTop: bosluk.l,
  },
  cevap: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metinIkincil,
    marginTop: bosluk.s,
    marginBottom: bosluk.xl,
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
