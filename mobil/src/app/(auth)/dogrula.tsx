import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../../lib/supabase'

export default function DogrulaEkrani() {
  const router = useRouter()
  const { telefon } = useLocalSearchParams<{ telefon: string }>()
  const [kod, setKod] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  async function dogrula() {
    setHata(null)
    setGonderiliyor(true)
    const { error } = await supabase.auth.verifyOtp({
      phone: telefon,
      token: kod,
      type: 'sms',
    })
    setGonderiliyor(false)

    if (error) {
      setHata(error.message)
      return
    }
    router.replace('/profil-olustur')
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Telefonunu dogrula</Text>
      <Text style={stiller.aciklama}>{telefon} numarasina gonderilen kodu gir</Text>
      <TextInput
        style={stiller.girdi}
        placeholder="Dogrulama kodu"
        keyboardType="number-pad"
        value={kod}
        onChangeText={setKod}
      />
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Pressable style={stiller.buton} onPress={dogrula} disabled={gonderiliyor}>
        <Text style={stiller.butonYazi}>{gonderiliyor ? 'Dogrulaniyor...' : 'Dogrula'}</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24, justifyContent: 'center' },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  aciklama: { color: '#555', marginBottom: 24 },
  girdi: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  hata: { color: '#c00', marginBottom: 12 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  butonYazi: { color: '#fff', fontWeight: '600' },
})
