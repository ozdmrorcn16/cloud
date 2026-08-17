import { useEffect, useState } from 'react'
import { View, Text, Image, FlatList, Pressable, Linking, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { baskasininProfiliniGetir, type BaskaProfil } from '../../../lib/profil'
import { engelle } from '../../../lib/engelleme'
import { kullanicininAnilariniGetir, type AniGorunumu } from '../../../lib/checkin'
import { supabase } from '../../../lib/supabase'

function fotografUrl(yol: string): string {
  return supabase.storage.from('profil-fotograflari').getPublicUrl(yol).data.publicUrl
}

export default function KullaniciProfiliEkrani() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [profil, setProfil] = useState<BaskaProfil | null>(null)
  const [anilar, setAnilar] = useState<AniGorunumu[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  async function verileriYukle() {
    try {
      const [profilVerisi, anilarVerisi] = await Promise.all([
        baskasininProfiliniGetir(id),
        kullanicininAnilariniGetir(id),
      ])
      setProfil(profilVerisi)
      setAnilar(anilarVerisi)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    verileriYukle()
  }, [id])

  function haritadaAc(konum: { lat: number; lng: number }) {
    Linking.openURL(`https://maps.google.com/?q=${konum.lat},${konum.lng}`)
  }

  async function kullaniciyiEngelle() {
    try {
      await engelle(id)
      setHata(null)
      setProfil(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  function sikayetEt() {
    router.push(`/sikayet?hedefTur=kullanici&hedefId=${id}`)
  }

  if (yukleniyor) {
    return (
      <View style={stiller.kapsayici}>
        <Text style={stiller.durum}>Yukleniyor...</Text>
      </View>
    )
  }

  if (!profil) {
    return (
      <View style={stiller.kapsayici}>
        {hata && <Text style={stiller.hata}>{hata}</Text>}
        <Text style={stiller.durum}>Bu profil bulunamadi</Text>
      </View>
    )
  }

  return (
    <View style={stiller.kapsayici}>
      {profil.fotograflar.length > 0 && (
        <FlatList
          horizontal
          data={profil.fotograflar}
          keyExtractor={(yol) => yol}
          renderItem={({ item }) => (
            <Image source={{ uri: fotografUrl(item) }} style={stiller.fotograf} />
          )}
          style={stiller.fotografListesi}
        />
      )}
      <Text style={stiller.ad}>{profil.ad}</Text>
      {profil.biyografi && <Text style={stiller.biyografi}>{profil.biyografi}</Text>}
      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Text style={stiller.bolumBaslik}>Anilar</Text>
      <FlatList
        data={anilar}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <Pressable style={stiller.satir} onPress={() => haritadaAc(item.mekanKonumu)}>
            <Text style={stiller.mekanAdi}>{item.mekanAdi}</Text>
            {item.notMetni && <Text style={stiller.not}>{item.notMetni}</Text>}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Henuz bir anisi yok</Text>}
      />

      <Pressable style={stiller.tehlikeliButon} onPress={kullaniciyiEngelle}>
        <Text style={stiller.tehlikeliButonYazi}>Engelle</Text>
      </Pressable>
      <Pressable style={stiller.ikincilButon} onPress={sikayetEt}>
        <Text style={stiller.ikincilButonYazi}>Sikayet et</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  fotografListesi: { marginBottom: 12 },
  fotograf: { width: 96, height: 96, borderRadius: 8, marginRight: 8 },
  ad: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  biyografi: { color: '#555', marginBottom: 16 },
  bolumBaslik: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  satir: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  mekanAdi: { fontSize: 16, fontWeight: '600', color: '#0645ad' },
  not: { color: '#555', marginTop: 2 },
  durum: { color: '#666', marginTop: 24, textAlign: 'center' },
  hata: { color: '#c00', marginBottom: 12 },
  tehlikeliButon: { backgroundColor: '#c00', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24 },
  tehlikeliButonYazi: { color: '#fff', fontWeight: '600' },
  ikincilButon: { borderWidth: 1, borderColor: '#c00', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  ikincilButonYazi: { color: '#c00', fontWeight: '600' },
})
