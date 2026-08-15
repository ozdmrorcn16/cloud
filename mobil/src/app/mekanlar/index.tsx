import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariGetir, type Mekan } from '../../../lib/mekan'

export default function MekanAramaEkrani() {
  const router = useRouter()
  const [cihazKonumu, setCihazKonumu] = useState<{ lat: number; lng: number } | null>(null)
  const [arama, setArama] = useState('')
  const [mekanlar, setMekanlar] = useState<Mekan[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    async function baslangicKonumunuYukle() {
      try {
        const konum = await cihazKonumunuAl()
        setCihazKonumu(konum)
        const sonuc = await yakinMekanlariGetir(konum.lat, konum.lng, undefined)
        setMekanlar(sonuc)
      } catch (e) {
        setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
      } finally {
        setYukleniyor(false)
      }
    }
    baslangicKonumunuYukle()
  }, [])

  async function aramaDegisti(metin: string) {
    setArama(metin)
    if (!cihazKonumu) return
    try {
      const sonuc = await yakinMekanlariGetir(cihazKonumu.lat, cihazKonumu.lng, metin || undefined)
      setMekanlar(sonuc)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  if (yukleniyor) return <Text style={stiller.durum}>Yukleniyor...</Text>
  if (hata) return <Text style={stiller.hata}>{hata}</Text>

  return (
    <View style={stiller.kapsayici}>
      <TextInput
        style={stiller.arama}
        placeholder="Mekan ara"
        value={arama}
        onChangeText={aramaDegisti}
      />
      <FlatList
        data={mekanlar}
        keyExtractor={(mekan) => mekan.id}
        renderItem={({ item }) => (
          <Pressable style={stiller.satir} onPress={() => router.push(`/mekanlar/${item.id}`)}>
            <Text style={stiller.mekanAdi}>{item.ad}</Text>
            <Text style={stiller.mekanTuru}>{item.tur}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Yakinda mekan bulunamadi</Text>}
      />
      <Pressable style={stiller.ekleButonu} onPress={() => router.push('/mekanlar/ekle')}>
        <Text style={stiller.ekleButonuYazi}>Mekan bulamadin mi? Ekle</Text>
      </Pressable>
      <Text style={stiller.atif}>Mekan verileri © OpenStreetMap katkida bulunanlar</Text>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  arama: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  satir: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  mekanAdi: { fontSize: 16, fontWeight: '600' },
  mekanTuru: { color: '#666', marginTop: 2 },
  durum: { textAlign: 'center', marginTop: 24, color: '#666' },
  hata: { textAlign: 'center', marginTop: 24, color: '#c00' },
  ekleButonu: { padding: 14, alignItems: 'center' },
  ekleButonuYazi: { color: '#111', fontWeight: '600' },
  atif: { textAlign: 'center', color: '#999', fontSize: 11, marginTop: 8 },
})
