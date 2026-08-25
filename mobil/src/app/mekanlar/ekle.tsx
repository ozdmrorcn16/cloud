import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariGetir, mekanEkle, type Mekan } from '../../../lib/mekan'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../../tasarim/tema'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { UstCubuk } from '../../tasarim/UstCubuk'

// Tur SERBEST METIN DEGIL, listeden secilir.
//
// Bu ekran tur bilgisinin GIRILDIGI tek yer (karar 2026-08-24): dis
// kaynaktan gelen mekanlarda tur artik gosterilmiyor, cunku dogrulugu
// garanti edilemiyor. Kullanicinin kendi ekledigi mekanda ise
// gosteriliyor - orayi ekleyen kisi oradadir ve turu bilerek secer.
// Liste sabit tutuluyor ki ayni yer icin "kahvehane" ve "Çay evi" gibi
// farkli yazimlar olusmasin.
const EKLENEBILIR_TURLER = [
  'Kafe', 'Restoran', 'Bar', 'Çay evi', 'Fırın', 'Tatlıcı',
  'Park', 'Plaj', 'Meydan', 'Kamp alanı',
  'Spor salonu', 'Yüzme havuzu',
  'Kütüphane', 'Müze', 'Sanat galerisi', 'Canlı müzik', 'Sinema',
  'Tarihi yer', 'AVM', 'Market', 'Otel', 'Kitapçı',
] as const

export default function MekanEkleEkrani() {
  const router = useRouter()
  const [cihazKonumu, setCihazKonumu] = useState<{ lat: number; lng: number } | null>(null)
  const [ad, setAd] = useState('')
  const [tur, setTur] = useState('')
  const [adres, setAdres] = useState('')
  const [benzerMekanlar, setBenzerMekanlar] = useState<Mekan[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  useEffect(() => {
    cihazKonumunuAl()
      .then(setCihazKonumu)
      .catch((e) => setHata(e instanceof Error ? e.message : 'Bir sorun oluştu'))
  }, [])

  useEffect(() => {
    async function benzerleriAra() {
      if (!cihazKonumu || ad.trim().length < 2) {
        setBenzerMekanlar([])
        return
      }
      const sonuc = await yakinMekanlariGetir(cihazKonumu.lat, cihazKonumu.lng, ad.trim())
      setBenzerMekanlar(sonuc)
    }
    benzerleriAra()
  }, [ad, cihazKonumu])

  async function ekle() {
    setHata(null)
    if (!cihazKonumu) {
      setHata('Konum alınamadı, tekrar dene')
      return
    }
    if (ad.trim().length === 0 || tur.trim().length === 0) {
      setHata('Mekan adı ve türü gerekli')
      return
    }

    setGonderiliyor(true)
    try {
      const yeniMekan = await mekanEkle(
        ad.trim(),
        tur.trim(),
        cihazKonumu,
        cihazKonumu,
        adres.trim() || undefined
      )
      router.replace(`/mekanlar/${yeniMekan.id}`)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    } finally {
      setGonderiliyor(false)
    }
  }

  return (
    <View style={stiller.kapsayici}>
      <UstCubuk baslik="Yeni mekan ekle" geriEtiketi="Geri" />
      <TextInput style={stiller.girdi} placeholder="Mekan adı" value={ad} onChangeText={setAd} />
      <Text style={stiller.turBaslik}>Türü seç</Text>
      <View style={stiller.turIzgara}>
        {EKLENEBILIR_TURLER.map((t) => {
          const secili = tur === t
          return (
            <Pressable
              key={t}
              style={[stiller.turCipi, secili && stiller.turCipiSecili]}
              onPress={() => setTur(t)}
            >
              <Text style={[stiller.turCipiYazi, secili && stiller.turCipiYaziSecili]}>{t}</Text>
            </Pressable>
          )
        })}
      </View>
      <TextInput style={stiller.girdi} placeholder="Adres (opsiyonel)" value={adres} onChangeText={setAdres} />

      {benzerMekanlar.length > 0 && (
        <View style={stiller.benzerKutu}>
          <Text style={stiller.benzerBaslik}>Bunlardan biri mi demek istedin?</Text>
          <FlatList
            data={benzerMekanlar}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/mekanlar/${item.id}`)}>
                <Text style={stiller.benzerMekan}>{item.ad}</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Pressable style={stiller.buton} onPress={ekle} disabled={gonderiliyor}>
        <Text style={stiller.butonYazi}>{gonderiliyor ? 'Ekleniyor...' : 'Ekle'}</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.xl,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginBottom: bosluk.l,
  },
  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 14,
    marginBottom: bosluk.m,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  buton: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
  },
  butonYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginBottom: bosluk.m,
  },
  turBaslik: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginBottom: bosluk.s,
    marginTop: bosluk.xs,
  },
  turIzgara: { flexDirection: 'row', flexWrap: 'wrap', gap: bosluk.s, marginBottom: bosluk.m },
  turCipi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.hap,
    paddingVertical: 8,
    paddingHorizontal: bosluk.m,
  },
  turCipiSecili: { backgroundColor: renk.turuncu, borderColor: renk.turuncu },
  turCipiYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  turCipiYaziSecili: { fontFamily: yazi.govdeKalin, color: '#FFFFFF' },
  benzerKutu: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    padding: bosluk.l,
    marginBottom: bosluk.m,
  },
  benzerBaslik: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
    marginBottom: bosluk.xs,
  },
  benzerMekan: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
    paddingVertical: bosluk.xs,
  },
})
