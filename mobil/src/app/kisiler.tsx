import { useRef, useState } from 'react'
import { View, Text, TextInput, Image, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { kisiAra, type KisiSonucu } from '../../lib/kisi-ara'
import { profilFotografiUrl } from '../../lib/fotograf-url'

type SatirVerisi = KisiSonucu & { fotografUrl: string | null }

export default function KisilerEkrani() {
  const router = useRouter()
  const [metin, setMetin] = useState('')
  const [sonuclar, setSonuclar] = useState<SatirVerisi[]>([])
  const [durum, setDurum] = useState<string | null>(null)

  // Her arama istegine artan bir sira numarasi veriyoruz. Cevap dondugunde
  // hala en son istek miyiz diye bakiyoruz; degilsek sonucu atiyoruz.
  // Aksi halde yavas donen eski bir istek, yeni sorgunun sonuclarinin
  // uzerine yazabilir. Imzalama da async oldugu icin kontrol imzalamadan
  // sonra da yapiliyor, yoksa imzalanirken gecen surede daha yeni bir
  // istek baslamis olabilir.
  const sonIstekRef = useRef(0)

  async function metinDegisti(yeni: string) {
    setMetin(yeni)
    const istekNo = ++sonIstekRef.current

    if (yeni.trim().length < 2) {
      setSonuclar([])
      setDurum(yeni.trim().length === 0 ? null : 'En az 2 karakter yaz.')
      return
    }

    try {
      const bulunanlar = await kisiAra(yeni)
      if (istekNo !== sonIstekRef.current) return

      const satirlar: SatirVerisi[] = await Promise.all(
        bulunanlar.map(async (kisi) => ({
          ...kisi,
          fotografUrl: kisi.fotograf ? await profilFotografiUrl(kisi.fotograf) : null,
        }))
      )
      if (istekNo !== sonIstekRef.current) return

      setSonuclar(satirlar)
      setDurum(satirlar.length === 0 ? 'Kimse bulunamadi.' : null)
    } catch (e) {
      if (istekNo !== sonIstekRef.current) return
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
            {item.fotografUrl && (
              <Image
                testID="kisi-fotografi"
                source={{ uri: item.fotografUrl }}
                style={stiller.fotograf}
              />
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
