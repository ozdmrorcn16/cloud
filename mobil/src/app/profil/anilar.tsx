import { useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, Linking, StyleSheet } from 'react-native'
import { supabase } from '../../../lib/supabase'
import { kendiAnilariniGetir, aniyiSil, type AniGorunumu } from '../../../lib/checkin'

export default function AnilarEkrani() {
  const [anilar, setAnilar] = useState<AniGorunumu[]>([])
  const [hata, setHata] = useState<string | null>(null)

  async function anilariYukle() {
    try {
      const { data: kullaniciVerisi } = await supabase.auth.getUser()
      const kullaniciId = kullaniciVerisi.user?.id
      if (!kullaniciId) return
      setAnilar(await kendiAnilariniGetir(kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  useEffect(() => {
    anilariYukle()
  }, [])

  function haritadaAc(konum: { lat: number; lng: number }) {
    Linking.openURL(`https://maps.google.com/?q=${konum.lat},${konum.lng}`)
  }

  async function sil(checkInId: string) {
    await aniyiSil(checkInId)
    setAnilar((mevcut) => mevcut.filter((a) => a.id !== checkInId))
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Anilarim</Text>
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <FlatList
        data={anilar}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <Pressable onPress={() => haritadaAc(item.mekanKonumu)}>
              <Text style={stiller.mekanAdi}>{item.mekanAdi}</Text>
              {item.notMetni && <Text style={stiller.not}>{item.notMetni}</Text>}
            </Pressable>
            <Pressable onPress={() => sil(item.id)}>
              <Text style={stiller.silButonu}>Sil</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Henuz bir anin yok</Text>}
      />
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  satir: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  mekanAdi: { fontSize: 16, fontWeight: '600', color: '#0645ad' },
  not: { color: '#555', marginTop: 2 },
  silButonu: { color: '#c00' },
  hata: { color: '#c00', marginBottom: 12 },
  durum: { color: '#666', marginTop: 24, textAlign: 'center' },
})
