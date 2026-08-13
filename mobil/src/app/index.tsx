import { View, Text, Pressable, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function AnaEkran() {
  async function cikisYap() {
    await supabase.auth.signOut()
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Hesabin hazir</Text>
      <Text style={stiller.aciklama}>
        Yakinda cevrendeki mekanlari ve insanlari burada gorecegin.
      </Text>
      <Pressable style={stiller.buton} onPress={cikisYap}>
        <Text style={stiller.butonYazi}>Cikis yap</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  aciklama: { color: '#555', textAlign: 'center', marginBottom: 24 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  butonYazi: { color: '#fff', fontWeight: '600' },
})
