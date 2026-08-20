import { useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { konusmalarimiGetir, konusmayiGizle, type Konusma } from '../../lib/sohbet'

export default function MesajlarEkrani() {
  const router = useRouter()
  const [konusmalar, setKonusmalar] = useState<Konusma[]>([])
  const [hata, setHata] = useState<string | null>(null)

  async function konusmalariYukle() {
    try {
      setKonusmalar(await konusmalarimiGetir())
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  useEffect(() => {
    konusmalariYukle()
  }, [])

  // Iyimser guncelleme deseni: durumu yalnizca await cozuldukten SONRA
  // degistiriyoruz. Boylece basarisiz bir gizleme, satiri listeden
  // kaldirmis gibi yalan soylemiyor - hata gosterilir, satir yerinde kalir.
  async function gizle(konusmaId: string) {
    try {
      await konusmayiGizle(konusmaId)
      setKonusmalar((mevcut) => mevcut.filter((k) => k.konusmaId !== konusmaId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  return (
    <View style={stiller.kapsayici}>
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <FlatList
        data={konusmalar}
        keyExtractor={(k) => k.konusmaId}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <Pressable
              style={stiller.icerik}
              // /sohbet/[id] rotasi bir sonraki gorevde (Task 14) olusturuluyor.
              // Simdilik expo-router'in turetilmis rota turleri bu yolu
              // taniMiyor; tip denetimini gecici olarak devre disi birakiyoruz.
              onPress={() => router.push(`/sohbet/${item.kisiId}` as never)}
            >
              <View style={stiller.ustSatir}>
                <Text style={stiller.ad}>{item.ad}</Text>
                {item.okunmamis > 0 && <Text style={stiller.rozet}>{item.okunmamis}</Text>}
              </View>
              <Text style={stiller.sonMesaj} numberOfLines={1}>
                {item.sonMesaj ?? ''}
              </Text>
            </Pressable>
            <Pressable onPress={() => gizle(item.konusmaId)}>
              <Text style={stiller.gizleButonu}>Gizle</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Henuz bir konusman yok</Text>}
      />
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  satir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  icerik: { flex: 1, marginRight: 12 },
  ustSatir: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ad: { fontSize: 16, fontWeight: '600' },
  sonMesaj: { color: '#555', marginTop: 2 },
  rozet: {
    color: '#fff',
    backgroundColor: '#c00',
    fontSize: 12,
    fontWeight: '700',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  gizleButonu: { color: '#c00' },
  hata: { color: '#c00', marginBottom: 12 },
  durum: { color: '#666', marginTop: 24, textAlign: 'center' },
})
