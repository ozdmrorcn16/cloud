import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { eFormatinaCevir } from '../../../lib/telefon'

export default function GirisEkrani() {
  const router = useRouter()
  const [telefon, setTelefon] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  async function girisYap() {
    setHata(null)
    const eFormatli = eFormatinaCevir(telefon)
    if (!eFormatli) {
      setHata('Geçerli bir telefon numarası gir')
      return
    }

    setGonderiliyor(true)
    const { error } = await supabase.auth.signInWithPassword({ phone: eFormatli, password: sifre })
    setGonderiliyor(false)

    if (error) {
      setHata(error.message)
      return
    }
    router.replace('/')
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Tekrar hoş geldin</Text>
      <TextInput
        style={stiller.girdi}
        placeholder="05XX XXX XX XX"
        keyboardType="phone-pad"
        value={telefon}
        onChangeText={setTelefon}
      />
      <TextInput
        style={stiller.girdi}
        placeholder="Şifre"
        secureTextEntry
        value={sifre}
        onChangeText={setSifre}
      />
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Pressable style={stiller.buton} onPress={girisYap} disabled={gonderiliyor}>
        <Text style={stiller.butonYazi}>{gonderiliyor ? 'Giriş yapılıyor...' : 'Giriş yap'}</Text>
      </Pressable>
      <Pressable style={stiller.baglantiButonu} onPress={() => router.push('/kayit')}>
        <Text style={stiller.baglanti}>Hesabın yok mu? Kayıt ol</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24, justifyContent: 'center' },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 24 },
  girdi: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  hata: { color: '#c00', marginBottom: 12 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  butonYazi: { color: '#fff', fontWeight: '600' },
  baglantiButonu: { marginTop: 16, alignItems: 'center' },
  baglanti: { color: '#111' },
})
