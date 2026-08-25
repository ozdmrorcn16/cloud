import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useDil } from '../../../lib/dil'
import { ilkAcilisiIsaretle } from '../../../lib/ilk-acilis'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'
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
 * ICERIK: kelime markasi, vaat, sozlesme onayi, hesap olustur.
 * Dil secimi BILEREK yok - asagiya bak.
 *
 * DIL SECIMI YOK (kullanicinin karari 2026-08-25): "eğer uygulama
 * kullanılan cihazın dilini tespit edip otomatik o dilde
 * görünebilecekse dil seçimi yaptırmıcaz". `lib/dil.tsx` cihazin
 * dilini okuyor ve uygulama o dille aciliyor; kullaniciya sorulmuyor.
 * Dili degistirmek isteyen icin dogru yer ayarlar ekrani.
 *
 * SOZLESME: onay burada aliniyor ama KAYIT ANINDA kaydediliyor. Onay
 * bilgisi kayit ekranina rota parametresiyle tasiniyor ve orada kutu
 * isaretli geliyor; kullaniciya ayni sey iki kez sorulmuyor, KVKK
 * ispat kaydi ise hesabin olustugu anda yaziliyor.
 */
export default function KarsilamaEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [kabul, setKabul] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  async function devamEt(hedef: 'kayit' | 'giris') {
    if (hedef === 'kayit' && !kabul) {
      setHata(t('karsilama.hataOnay'))
      return
    }
    await ilkAcilisiIsaretle()
    router.replace(hedef === 'kayit' ? '/kayit?onay=1' : '/giris')
  }

  return (
    <View style={stiller.sayfa}>
      <View style={stiller.ust}>
        <MarkaYazisi genislik={200} />
        <Text style={stiller.baslik}>
          {t('karsilama.baslikBirinci')}
          {'\n'}
          <Text style={stiller.baslikVurgu}>{t('karsilama.baslikIkinci')}</Text>
        </Text>
        <Text style={stiller.aciklama}>{t('karsilama.aciklama')}</Text>
      </View>

      <View style={stiller.esnekBosluk} />

      <Pressable
        style={stiller.onaySatiri}
        onPress={() => {
          setKabul(!kabul)
          setHata(null)
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: kabul }}
        accessibilityLabel={t('karsilama.onayEtiket')}
      >
        <View style={[stiller.kutu, kabul && stiller.kutuIsaretli]}>
          {kabul && <Text style={stiller.tik}>✓</Text>}
        </View>
        <Text style={stiller.onayYazi}>
          {t('karsilama.onayMetni')}{' '}
          <Text
            style={stiller.baglantiYazi}
            onPress={() => router.push('/gizlilik')}
            accessibilityRole="link"
          >
            {t('karsilama.metniOku')}
          </Text>
        </Text>
      </Pressable>

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Pressable
        style={({ pressed }) => [
          stiller.birincil,
          !kabul && stiller.birincilSoluk,
          pressed && stiller.birincilBasili,
        ]}
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

  ust: { alignItems: 'center' },
  baslik: {
    fontFamily: yazi.baslik,
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


  onaySatiri: { flexDirection: 'row', gap: bosluk.m, alignItems: 'flex-start' },
  kutu: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: renk.metinSoluk,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  kutuIsaretli: { backgroundColor: renk.turuncu, borderColor: renk.turuncu },
  tik: { color: '#FFFFFF', fontSize: 14, lineHeight: 18, fontFamily: yazi.govdeKalin },
  onayYazi: {
    flex: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
  },
  baglantiYazi: {
    fontFamily: yazi.govdeKalin,
    color: renk.metin,
    textDecorationLine: 'underline',
  },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginTop: bosluk.s,
  },

  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: bosluk.l,
    ...golge.yuzer,
  },
  birincilSoluk: { opacity: 0.45 },
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
