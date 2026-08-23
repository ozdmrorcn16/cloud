import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { MekanIkonu } from '../../tasarim/MekanIkonu'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariGetir, mekanEkle, type Mekan } from '../../../lib/mekan'

// Tur ARTIK SERBEST METIN DEGIL. Sebep: kapak gorseli turden
// turetilen ikondur (karar 2026-08-23); kullanici "kahvehane" yazarsa
// hicbir ikonla eslesmez ve mekan noktasiz kalir. Liste, ikonu olan
// turlerden en yaygin olanlari.
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
      <Text style={stiller.baslik}>Yeni mekan ekle</Text>
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
              {/* Kullanici sectigi turun ikonunu ANINDA goruyor;
                  mekanin kapagi bu ikon olacak. */}
              <MekanIkonu tur={t} boyut={20} renk={secili ? '#FFFFFF' : '#6E6660'} />
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
  turBaslik: { fontSize: 13, color: '#6E6660', marginBottom: 8, marginTop: 4 },
  turIzgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  turCipi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#EFEAE5',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  turCipiSecili: { backgroundColor: '#FF6B1A', borderColor: '#FF6B1A' },
  turCipiYazi: { fontSize: 13, color: '#6E6660' },
  turCipiYaziSecili: { color: '#FFFFFF', fontWeight: '600' },
  kapsayici: { flex: 1, padding: 24 },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 24 },
  girdi: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  benzerKutu: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 12 },
  benzerBaslik: { fontWeight: '600', marginBottom: 6 },
  benzerMekan: { color: '#0645ad', paddingVertical: 4 },
  hata: { color: '#c00', marginBottom: 12 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  butonYazi: { color: '#fff', fontWeight: '600' },
})
