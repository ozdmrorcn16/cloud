import { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { cihazKonumunuAl, mesafeMetre } from '../../../lib/konum'
import {
  yakinMekanlariYogunlukIleGetir,
  kesfetIcinSuz,
  turuGosterilir,
  type MekanYogunlukIle,
} from '../../../lib/mekan'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'

const YARICAP_SECENEKLERI = [
  { etiket: '1 km', metre: 1000 },
  { etiket: '2 km', metre: 2000 },
  { etiket: '5 km', metre: 5000 },
] as const

const VARSAYILAN_YARICAP_METRE = 5000

/** 240 m / 1,2 km gibi kisa ve okunur mesafe. */
function mesafeYazisi(metre: number): string {
  if (metre < 1000) return `${Math.round(metre / 10) * 10} m`
  return `${(metre / 1000).toFixed(1).replace('.', ',')} km`
}

export default function KesfetEkrani() {
  const router = useRouter()
  const [cihazKonumu, setCihazKonumu] = useState<{ lat: number; lng: number } | null>(null)
  const [arama, setArama] = useState('')
  const [yaricapMetre, setYaricapMetre] = useState(VARSAYILAN_YARICAP_METRE)
  const [mekanlar, setMekanlar] = useState<MekanYogunlukIle[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  // Ilk acilis bittikten sonra ekran duzeni bir daha tam ekran
  // durumlara gecmiyor; bkz. asagidaki not.
  const [ilkYuklemeBitti, setIlkYuklemeBitti] = useState(false)
  const istekSirasi = useRef(0)

  async function yukle(metre = yaricapMetre, metin = arama) {
    // Yaris korumasi: hizli yazarken istekler sirayla degil paralel
    // doner. Sira numarasi olmadan eski ve yavas bir istek, yeni
    // sonucun uzerine yaziyor ve liste yanlis kaliyordu.
    const sira = ++istekSirasi.current
    setYukleniyor(true)
    setHata(null)
    try {
      const konum = cihazKonumu ?? (await cihazKonumunuAl())
      setCihazKonumu(konum)
      const sonuc = await yakinMekanlariYogunlukIleGetir(
        konum.lat,
        konum.lng,
        metre,
        metin || undefined
      )
      if (sira !== istekSirasi.current) return
      setMekanlar(sonuc)
    } catch (e) {
      if (sira !== istekSirasi.current) return
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    } finally {
      if (sira === istekSirasi.current) {
        setYukleniyor(false)
        setIlkYuklemeBitti(true)
      }
    }
  }

  useEffect(() => {
    yukle()
    // Ilk yukleme; sonrakiler kullanici etkilesimiyle tetikleniyor.
  }, [])

  // Arama kutusu her harfte istek ATMIYOR. Onceki surumde her tusa
  // basista sunucuya gidiliyordu; bu hem agi bosa yoruyor hem de
  // yazmayi tekletiyordu. 300 ms sessizlik bekleniyor.
  useEffect(() => {
    if (!cihazKonumu) return
    const zamanlayici = setTimeout(() => {
      yukle(yaricapMetre, arama)
    }, 300)
    return () => clearTimeout(zamanlayici)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arama])

  function aramaDegisti(metin: string) {
    // Burada yalnizca metin guncelleniyor: istegi yukaridaki
    // bekletmeli etki atiyor. Yazma ile ag istegini ayirmak, yazi
    // kutusunun her tusta yeniden olusmasini engelliyor.
    setArama(metin)
  }

  async function yaricapDegisti(metre: number) {
    setYaricapMetre(metre)
    await yukle(metre, arama)
  }

  // Kesfet akisi "su an nereye gidip birileriyle karsilasabilirim"
  // sorusunu cevapliyor; arama ise butun veritabanini kapsiyor. Bu
  // yuzden arama BOSKEN liste sosyal turlere daraliyor, bir sey
  // arandigi anda 133 turun tamami geri geliyor.
  const kesfetListesi = useMemo(
    () => kesfetIcinSuz(mekanlar, arama.trim().length > 0),
    [mekanlar, arama]
  )

  // Tur cipleri KALDIRILDI (karar 2026-08-24): tur artik dis kaynakli
  // mekanlarda gosterilmedigi icin ona gore suzmek de anlamsiz.
  const suzulmus = kesfetListesi

  const canlilar = suzulmus.filter((m) => m.kisiSayisi > 0)
  const sakinler = suzulmus.filter((m) => m.kisiSayisi === 0)
  const toplamKisi = canlilar.reduce((t, m) => t + m.kisiSayisi, 0)

  // Ad'in altindaki satir. TUR YALNIZCA kullanicinin ekledigi
  // mekanlarda gorunuyor (karar 2026-08-24): dis kaynagin tur verisi
  // guvenilmez oldugu icin yanlis tur gostermektense hic gostermemek
  // tercih edildi. Dis kaynakli kayitlarda semt ve uzaklik kaliyor.
  function altSatir(m: MekanYogunlukIle): string {
    const parcalar = turuGosterilir(m) ? [m.tur] : []
    parcalar.push(m.semt ?? '', uzaklik(m))
    return parcalar.filter(Boolean).join(' · ')
  }

  function uzaklik(m: MekanYogunlukIle): string {
    // Konum eksikse mesafe hic gosterilmez: yanlis bir mesafe
    // gostermektense hic gostermemek dogru.
    if (!cihazKonumu || !m.konum) return ''
    const metre = mesafeMetre(cihazKonumu.lat, cihazKonumu.lng, m.konum.lat, m.konum.lng)
    return Number.isFinite(metre) ? mesafeYazisi(metre) : ''
  }

  // TAM EKRAN DURUMLAR YALNIZCA ILK ACILISTA.
  //
  // Kullanicinin bildirdigi hata buradaydi: arama sonuc vermeyince
  // liste bosaliyor, bir harf daha yazilinca `yukleniyor && liste bos`
  // kosulu saglaniyor ve EKRANIN TAMAMI yukleme ekraniyla
  // degisiyordu. Yazi kutusu agactan kalkinca klavye kapaniyor,
  // kullanici yazmaya devam edemiyordu.
  //
  // Ilk acilistan sonra yukleme durumu artik yalnizca kutunun
  // yanindaki kucuk gostergeyle anlatiliyor; ekran duzeni sabit
  // kaliyor.
  if (!ilkYuklemeBitti && yukleniyor) {
    return (
      <View style={stiller.ortala}>
        <ActivityIndicator color={renk.turuncu} />
        <Text style={stiller.durumYazi}>Çevren taranıyor…</Text>
      </View>
    )
  }

  // Bos ya da hatali durum bir yon vermeli, yalnizca hata metni degil.
  // Arama YAPILIYORKEN tam ekrana gecilmiyor - ayni klavye sorunu.
  if (hata && mekanlar.length === 0 && !arama.trim()) {
    return (
      <View style={stiller.ortala}>
        <Text style={stiller.hataBaslik}>Çevreni göremiyoruz</Text>
        <Text style={stiller.hataAciklama}>
          {hata === 'Konum izni verilmedi'
            ? 'Yakınındaki mekanları gösterebilmek için konum iznine ihtiyacımız var. Tarayıcı ayarlarından izni açıp tekrar dene.'
            : hata}
        </Text>
        <Pressable style={stiller.birincilButon} onPress={() => yukle()}>
          <Text style={stiller.birincilButonYazi}>Tekrar dene</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <ScrollView style={stiller.sayfa} contentContainerStyle={stiller.icerik}>
      <View style={stiller.ustBar}>
        <Text style={stiller.marka}>
          slooin<Text style={stiller.markaNokta}>.</Text>
        </Text>
        <View style={stiller.yaricapSatiri}>
          {YARICAP_SECENEKLERI.map((s) => (
            <Pressable
              key={s.metre}
              style={[stiller.yaricapCipi, s.metre === yaricapMetre && stiller.yaricapCipiSecili]}
              onPress={() => yaricapDegisti(s.metre)}
            >
              <Text
                style={[
                  stiller.yaricapYazi,
                  s.metre === yaricapMetre && stiller.yaricapYaziSecili,
                ]}
              >
                {s.etiket}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Liste DOLUYKEN olusan hata (ornegin arama sirasinda ag
          kopmasi) tam ekran hata ekranini tetiklemez; sessizce
          yutulmamasi icin ustte bir serit olarak gorunur. */}
      {hata && <Text style={stiller.hataSeridi}>{hata}</Text>}

      <Text style={stiller.baslik}>Şu an çevrende{'\n'}neler oluyor?</Text>
      <Text style={stiller.ozet}>
        {toplamKisi > 0 ? (
          <>
            {canlilar.length} mekânda <Text style={stiller.ozetVurgu}>{toplamKisi} kişi</Text> canlı
          </>
        ) : (
          `${suzulmus.length} mekan yakınında`
        )}
      </Text>

      <TextInput
        style={stiller.arama}
        placeholder="Mekan ara"
        placeholderTextColor={renk.metinSoluk}
        value={arama}
        onChangeText={aramaDegisti}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />

      {/* Arama sirasinda ekran duzeni DEGISMIYOR; durum yalnizca bu
          ince seritle anlatiliyor. Boylece yazi kutusu agacta kaliyor
          ve klavye acik kaliyor. */}
      {arama.trim().length > 0 && (
        <View style={stiller.aramaDurumu}>
          {yukleniyor ? (
            <>
              <ActivityIndicator size="small" color={renk.turuncu} />
              <Text style={stiller.aramaDurumYazi}>Aranıyor…</Text>
            </>
          ) : suzulmus.length === 0 ? (
            <Text style={stiller.aramaDurumYazi}>
              “{arama.trim()}” için yakınında bir yer bulunamadı. Yarıçapı
              büyütmeyi deneyebilirsin.
            </Text>
          ) : (
            <Text style={stiller.aramaDurumYazi}>
              {suzulmus.length} sonuç
            </Text>
          )}
        </View>
      )}

      {/* Canli mekanlar one cikiyor: uygulamanin tek sorusu "su an
          nerede insan var". Kimse yoksa bu bolum hic cizilmiyor. */}
      {canlilar.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={canlilar}
          keyExtractor={(m) => m.id}
          contentContainerStyle={stiller.kartSatiri}
          renderItem={({ item }) => (
            <Pressable
              style={stiller.kart}
              onPress={() => router.push(`/mekanlar/${item.id}`)}
            >
              <View style={stiller.canliRozet}>
                <View style={stiller.canliNokta} />
                <Text style={stiller.canliRozetYazi}>{item.kisiSayisi} kişi burada</Text>
              </View>
              <View style={stiller.kartAlt}>
                <Text style={stiller.kartAd} numberOfLines={2}>
                  {item.ad}
                </Text>
                <Text style={stiller.kartAltYazi}>{altSatir(item)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Text style={stiller.bolumBasligi}>Yakınında</Text>
      {sakinler.length === 0 ? (
        <Text style={stiller.bosDurum}>Bu filtreyle yakında mekan yok.</Text>
      ) : (
        sakinler.map((item) => (
          <Pressable
            key={item.id}
            style={stiller.satir}
            onPress={() => router.push(`/mekanlar/${item.id}`)}
          >
            <View style={stiller.satirOrta}>
              <Text style={stiller.satirAd} numberOfLines={1}>
                {item.ad}
              </Text>
              <Text style={stiller.satirAlt}>{altSatir(item)}</Text>
            </View>
            <Text style={stiller.sakinYazi}>Sakin</Text>
          </Pressable>
        ))
      )}

      <Pressable style={stiller.ekleButonu} onPress={() => router.push('/mekanlar/ekle')}>
        <Text style={stiller.ekleButonuYazi}>Mekan bulamadın mı? Ekle</Text>
      </Pressable>
      <Text style={stiller.atif}>
        Mekan verileri: Overture Maps Foundation ve katkıda bulunanlar
      </Text>
    </ScrollView>
  )
}

const KART_GENISLIK = 256
const KART_YUKSEKLIK = 316

const stiller = StyleSheet.create({
  sayfa: { flex: 1, backgroundColor: renk.zemin },
  icerik: { paddingTop: bosluk.xxl + bosluk.m, paddingBottom: bosluk.xxl },
  ortala: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: bosluk.xl,
    backgroundColor: renk.zemin,
    gap: bosluk.m,
  },
  durumYazi: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },
  hataBaslik: { fontFamily: yazi.baslik, fontSize: olcek.altBaslik, color: renk.metin },
  hataAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
    textAlign: 'center',
  },
  birincilButon: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: bosluk.m,
    paddingHorizontal: bosluk.xl,
    marginTop: bosluk.s,
  },
  birincilButonYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.yuzey },

  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: bosluk.xl,
  },
  marka: {
    fontFamily: yazi.baslikKalin,
    fontSize: 22,
    color: renk.metin,
    letterSpacing: -0.6,
  },
  markaNokta: { color: renk.turuncu },
  yaricapSatiri: { flexDirection: 'row', gap: bosluk.xs },
  yaricapCipi: {
    borderRadius: yuvarlak.hap,
    paddingVertical: 6,
    paddingHorizontal: bosluk.m,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  yaricapCipiSecili: { backgroundColor: renk.turuncuZemin, borderColor: renk.turuncuZemin },
  yaricapYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.minik, color: renk.metinIkincil },
  yaricapYaziSecili: { color: renk.turuncuKoyu },

  baslik: {
    fontFamily: yazi.baslikKalin,
    fontSize: 30,
    lineHeight: 34,
    color: renk.metin,
    letterSpacing: -0.8,
    paddingHorizontal: bosluk.xl,
    marginTop: bosluk.l,
  },
  ozet: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    paddingHorizontal: bosluk.xl,
    marginTop: bosluk.xs,
  },
  ozetVurgu: { fontFamily: yazi.govdeKalin, color: renk.turuncuKoyu },
  aramaDurumu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    paddingHorizontal: bosluk.l,
    paddingTop: bosluk.s,
  },
  aramaDurumYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
    flexShrink: 1,
  },
  hataSeridi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.turuncuKoyu,
    backgroundColor: renk.turuncuZemin,
    marginHorizontal: bosluk.xl,
    marginTop: bosluk.m,
    paddingVertical: bosluk.s,
    paddingHorizontal: bosluk.m,
    borderRadius: yuvarlak.kart,
  },

  arama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.m,
    marginHorizontal: bosluk.xl,
    marginTop: bosluk.l,
  },

  turSatiri: { gap: bosluk.s, paddingHorizontal: bosluk.xl, paddingTop: bosluk.m },
  turCipi: {
    borderRadius: yuvarlak.hap,
    paddingVertical: 8,
    paddingHorizontal: bosluk.l,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  turCipiSecili: { backgroundColor: renk.metin, borderColor: renk.metin },
  turYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.metinIkincil },
  turYaziSecili: { color: renk.yuzey },

  kartSatiri: { gap: bosluk.m, paddingHorizontal: bosluk.xl, paddingTop: bosluk.l },
  kart: { width: KART_GENISLIK, height: KART_YUKSEKLIK, borderRadius: 28, ...golge.yuzer },
  // Beyaz kapak uzerinde cam rozet gorunmuyordu: dolgu turuncuya
  // gecti. Turuncu burada dogru - "su an canli" bir eylem/canlilik
  // isareti.
  canliRozet: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  canliNokta: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#FFFFFF' },
  canliRozetYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.minik, color: '#FFFFFF' },
  kartAlt: { position: 'absolute', left: 18, right: 18, bottom: 18, gap: 2 },
  kartAd: {
    fontFamily: yazi.baslikKalin,
    fontSize: 20,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  kartAltYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.metinIkincil },

  bolumBasligi: {
    fontFamily: yazi.baslikKalin,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
    paddingHorizontal: bosluk.xl,
    marginTop: bosluk.xl,
    marginBottom: bosluk.xs,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    paddingHorizontal: bosluk.xl,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  satirGorsel: { width: 58, height: 58, borderRadius: 18 },
  satirOrta: { flex: 1, gap: 3 },
  satirAd: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  satirAlt: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },
  sakinYazi: { fontFamily: yazi.govde, fontSize: olcek.minik, color: renk.metinSoluk },
  bosDurum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    paddingHorizontal: bosluk.xl,
    paddingVertical: bosluk.m,
  },

  ekleButonu: { alignItems: 'center', paddingVertical: bosluk.l, marginTop: bosluk.s },
  ekleButonuYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: renk.turuncuKoyu },
  atif: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
    textAlign: 'center',
    paddingHorizontal: bosluk.xl,
  },
})
