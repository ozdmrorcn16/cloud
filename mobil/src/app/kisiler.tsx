import { useState } from 'react'
import { View, Text, TextInput, Image, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { kisiAra, type KisiSonucu } from '../../lib/kisi-ara'
import { supabase } from '../../lib/supabase'

function fotografUrl(yol: string): string {
  return supabase.storage.from('profil-fotograflari').getPublicUrl(yol).data.publicUrl
}

export default function KisilerEkrani() {
  const router = useRouter()
  const [metin, setMetin] = useState('')
  const [sonuclar, setSonuclar] = useState<KisiSonucu[]>([])
  const [durum, setDurum] = useState<string | null>(null)

  async function metinDegisti(yeni: string) {
    setMetin(yeni)

    if (yeni.trim().length < 2) {
      setSonuclar([])
      setDurum(yeni.trim().length === 0 ? null : 'En az 2 karakter yaz.')
      return
    }

    try {
      const bulunanlar = await kisiAra(yeni)
      setSonuclar(bulunanlar)
      setDurum(bulunanlar.length === 0 ? 'Kimse bulunamadi.' : null)
    } catch (e) {
      setSonuclar([])
      setDurum(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  return (
    <View style={stiller.kapsayici}>
      <TextInput
        style={stiller.arama}
        placeholder="Kullanici adi ya da isim"
        autoCapitalize="none"
        value={metin}
        onChangeText={metinDegisti}
      />
      {durum && <Text style={stiller.durum}>{durum}</Text>}
      <FlatList
        data={sonuclar}
        keyExtractor={(k) => k.id}
        renderItem={({ item }) => (
          <Pressable style={stiller.satir} onPress={() => router.push(`/kullanici/${item.id}`)}>
            {item.fotograf && (
              <Image source={{ uri: fotografUrl(item.fotograf) }} style={stiller.fotograf} />
            )}
            <View>
              <Text style={stiller.kullaniciAdi}>{item.kullaniciAdi}</Text>
              <Text style={stiller.ad}>{item.ad}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  arama: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  durum: { color: '#555', marginBottom: 12 },
  satir: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  fotograf: { width: 40, height: 40, borderRadius: 20 },
  kullaniciAdi: { fontSize: 16, fontWeight: '600' },
  ad: { color: '#555' },
})
