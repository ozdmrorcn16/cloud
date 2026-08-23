import { useEffect, useMemo, useState } from 'react'
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
  type MekanYogunlukIle,
} from '../../../lib/mekan'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'
import { MekanGorseli } from '../../tasarim/MekanGorseli'

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
  const [secilenTur, setSecilenTur] = useState<string | null>(null)
  const [mekanlar, setMekanlar] = useState<MekanYogunlukIle[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  async function yukle(metre = yaricapMetre, metin = arama) {
    setYukleniyor(true)
    setHata(null)
    try {
      const konum = cihazKonumu ?? (await cihazKonumunuAl())
      setCihazKonumu(konum)
      setMekanlar(
        await yakinMekanlariYogunlukIleGetir(konum.lat, konum.lng, metre, metin || undefined)
      )
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    yukle()
    // Ilk yukleme; sonrakiler kullanici etkilesimiyle tetikleniyor.
  }, [])

  async function aramaDegisti(metin: string) {
    setArama(metin)
    if (cihazKonumu) await yukle(yaricapMetre, metin)
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

  // Tur cipleri GELEN VERIDEN turetiliyor, sabit liste degil: mekan
  // turleri kaynaga gore degisiyor (bugun 130'dan fazla tur var) ve
  // sabit bir liste bolgeye gore bos cipler gosterirdi.
  const turler = useMemo(() => {
    const sayac = new Map<string, number>()
    for (const m of kesfetListesi) sayac.set(m.tur, (sayac.get(m.tur) ?? 0) + 1)
    return [...sayac.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t)
  }, [kesfetListesi])

  const suzulmus = useMemo(
    () => (secilenTur ? kesfetListesi.filter((m) => m.tur === secilenTur) : kesfetListesi),
    [kesfetListesi, secilenTur]
  )

  const canlilar = suzulmus.filter((m) => m.kisiSayisi > 0)
  const sakinler = suzulmus.filter((m) => m.kisiSayisi === 0)
  const toplamKisi = canlilar.reduce((t, m) => t + m.kisiSayisi, 0)

  function uzaklik(m: MekanYogunlukIle): string {
    // Konum eksikse mesafe hic gosterilmez: yanlis bir mesafe
    // gostermektense hic gostermemek dogru.
    if (!cihazKonumu || !m.konum) return ''
    const metre = mesafeMetre(cihazKonumu.lat, cihazKonumu.lng, m.konum.lat, m.konum.lng)
    return Number.isFinite(metre) ? mesafeYazisi(metre) : ''
  }

  if (yukleniyor && mekanlar.length === 0) {
    return (
      <View style={stiller.ortala}>
        <ActivityIndicator color={renk.turuncu} />
        <Text style={stiller.durumYazi}>Çevren taranıyor…</Text>
      </View>
    )
  }

  // Bos ya da hatali durum bir yon vermeli, yalnizca hata metni degil.
  if (hata && mekanlar.length === 0) {
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
      />

      {turler.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={stiller.turSatiri}
        >
          <Pressable
            style={[stiller.turCipi, secilenTur === null && stiller.turCipiSecili]}
            onPress={() => setSecilenTur(null)}
          >
            <Text style={[stiller.turYazi, secilenTur === null && stiller.turYaziSecili]}>
              Tümü
            </Text>
          </Pressable>
          {turler.map((t) => (
            <Pressable
              key={t}
              style={[stiller.turCipi, secilenTur === t && stiller.turCipiSecili]}
              onPress={() => setSecilenTur(secilenTur === t ? null : t)}
            >
              <Text style={[stiller.turYazi, secilenTur === t && stiller.turYaziSecili]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>
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
            <Pressable onPress={() => router.push(`/mekanlar/${item.id}`)}>
              <MekanGorseli mekanId={item.id} tur={item.tur} ikonBoyut={44} style={stiller.kart}>
                <View style={stiller.kartKarartma} />
                <View style={stiller.canliRozet}>
                  <View style={stiller.canliNokta} />
                  <Text style={stiller.canliRozetYazi}>
                    {item.kisiSayisi} kişi burada
                  </Text>
                </View>
                <View style={stiller.kartAlt}>
                  <Text style={stiller.kartAd} numberOfLines={2}>
                    {item.ad}
                  </Text>
                  <Text style={stiller.kartAltYazi}>
                    {[item.tur, item.semt, uzaklik(item)].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </MekanGorseli>
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
            <MekanGorseli mekanId={item.id} tur={item.tur} ikonBoyut={22} style={stiller.satirGorsel} />
            <View style={stiller.satirOrta}>
              <Text style={stiller.satirAd} numberOfLines={1}>
                {item.ad}
              </Text>
              <Text style={stiller.satirAlt}>
                {[item.tur, item.semt, uzaklik(item)].filter(Boolean).join(' · ')}
              </Text>
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
  // Fotograf uzerindeki yazinin okunmasi icin alttan yukari karartma.
  kartKarartma: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '62%',
    backgroundColor: renk.kapakKarartma,
  },
  canliRozet: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: renk.camRozet,
    borderRadius: yuvarlak.hap,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  canliNokta: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#FF8C42' },
  canliRozetYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.minik, color: '#FFFFFF' },
  kartAlt: { position: 'absolute', left: 18, right: 18, bottom: 18, gap: 2 },
  kartAd: {
    fontFamily: yazi.baslikKalin,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  kartAltYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: 'rgba(255,255,255,0.82)' },

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
  satirGorsel: { width: 54, height: 54, borderRadius: 18 },
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
