import { useCallback, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
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
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  // useEffect yalnizca ilk acilista bir kez cekiyordu: kullanici bir
  // konusmayi acip okuyup geri donunce okunmamis rozeti eski deger de
  // kaliyordu. useFocusEffect ekran her odaklandiginda yeniden cekiyor
  // (ana ekranin "Baglar" rozetiyle ayni desen).
  useFocusEffect(
    useCallback(() => {
      konusmalariYukle()
    }, [])
  )

  // Iyimser guncelleme deseni: durumu yalnizca await cozuldukten SONRA
  // degistiriyoruz. Boylece basarisiz bir gizleme, satiri listeden
  // kaldirmis gibi yalan soylemiyor - hata gosterilir, satir yerinde kalir.
  async function gizle(konusmaId: string) {
    try {
      await konusmayiGizle(konusmaId)
      setKonusmalar((mevcut) => mevcut.filter((k) => k.konusmaId !== konusmaId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  return (
    <View style={stiller.kapsayici}>
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <FlatList
        data={konusmalar}
        keyExtractor={(k) => k.konusmaId}
        renderItem={({ item }) => {
          // Karsi taraf hesabini silmisse uyelik satiri yok; konusma
          // listede kalir ama kime ait oldugu artik bilinmiyor (spec
          // karar 69). Rota kullaniciId istiyor, null ile acilamaz.
          const gorunenAd = item.ad ?? 'Silinmiş kullanıcı'
          const acilabilirMi = item.kisiId !== null

          return (
            <View style={stiller.satir}>
              <Pressable
                style={stiller.icerik}
                onPress={() => acilabilirMi && router.push(`/sohbet/${item.kisiId}`)}
                disabled={!acilabilirMi}
              >
                <View style={stiller.ustSatir}>
                  <Text style={stiller.ad}>{gorunenAd}</Text>
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
          )
        }}
        ListEmptyComponent={<Text style={stiller.durum}>Henüz bir konuşman yok</Text>}
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
