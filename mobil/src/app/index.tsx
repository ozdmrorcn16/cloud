import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

export default function AnaEkran() {
  const router = useRouter()

  async function cikisYap() {
    await supabase.auth.signOut()
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Hesabin hazir</Text>
      <Text style={stiller.aciklama}>
        Yakinindaki mekanlari kesfet, check-in yap.
      </Text>
      <Pressable style={stiller.buton} onPress={() => router.push('/mekanlar')}>
        <Text style={stiller.butonYazi}>Mekanlari kesfet</Text>
      </Pressable>
      <Pressable style={stiller.ikincilButon} onPress={() => router.push('/profil/anilar')}>
        <Text style={stiller.ikincilButonYazi}>Anilarim</Text>
      </Pressable>
      <Pressable style={stiller.ikincilButon} onPress={() => router.push('/profil/ayarlar')}>
        <Text style={stiller.ikincilButonYazi}>Gizlilik ayarlari</Text>
      </Pressable>
      <Pressable style={stiller.cikisButonu} onPress={cikisYap}>
        <Text style={stiller.cikisYazi}>Cikis yap</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  aciklama: { color: '#555', textAlign: 'center', marginBottom: 24 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center', width: '100%' },
  butonYazi: { color: '#fff', fontWeight: '600' },
  ikincilButon: { padding: 14, alignItems: 'center', width: '100%' },
  ikincilButonYazi: { color: '#111', fontWeight: '600' },
  cikisButonu: { padding: 14, alignItems: 'center' },
  cikisYazi: { color: '#c00' },
})
