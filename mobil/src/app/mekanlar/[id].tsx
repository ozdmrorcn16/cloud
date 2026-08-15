import { useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import {
  suAnBurdakileriGetir,
  mekanAnilariniGetir,
  checkIndenAyril,
  type CheckInGorunumu,
} from '../../../lib/checkin'

export default function MekanDetayEkrani() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [suAnBurdakiler, setSuAnBurdakiler] = useState<CheckInGorunumu[]>([])
  const [anilar, setAnilar] = useState<CheckInGorunumu[]>([])
  const [kendiKullaniciId, setKendiKullaniciId] = useState<string | null>(null)

  async function verileriYukle() {
    const [canlilar, gecmisAnilar, kullaniciVerisi] = await Promise.all([
      suAnBurdakileriGetir(id),
      mekanAnilariniGetir(id),
      supabase.auth.getUser(),
    ])
    setSuAnBurdakiler(canlilar)
    setAnilar(gecmisAnilar)
    setKendiKullaniciId(kullaniciVerisi.data.user?.id ?? null)
  }

  useEffect(() => {
    verileriYukle()
  }, [id])

  const kendiCheckIni = suAnBurdakiler.find((c) => c.kullaniciId === kendiKullaniciId)

  async function ayril(checkInId: string) {
    await checkIndenAyril(checkInId)
    await verileriYukle()
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.bolumBaslik}>Su an burada</Text>
      <FlatList
        data={suAnBurdakiler}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <Text style={stiller.kullaniciAdi}>{item.kullaniciAdi}</Text>
            {item.notMetni && <Text style={stiller.not}>{item.notMetni}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Su an kimse yok</Text>}
      />

      {kendiCheckIni ? (
        <Pressable style={stiller.buton} onPress={() => ayril(kendiCheckIni.id)}>
          <Text style={stiller.butonYazi}>Ayrildim</Text>
        </Pressable>
      ) : (
        <Pressable style={stiller.buton} onPress={() => router.push(`/check-in/${id}`)}>
          <Text style={stiller.butonYazi}>Check-in yap</Text>
        </Pressable>
      )}

      <Text style={stiller.bolumBaslik}>Anilar</Text>
      <FlatList
        data={anilar}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <Text style={stiller.kullaniciAdi}>{item.kullaniciAdi}</Text>
            {item.notMetni && <Text style={stiller.not}>{item.notMetni}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Henuz bir ani yok</Text>}
      />
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  bolumBaslik: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  satir: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  kullaniciAdi: { fontSize: 16, fontWeight: '600' },
  not: { color: '#555', marginTop: 2 },
  durum: { color: '#666' },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  butonYazi: { color: '#fff', fontWeight: '600' },
})
