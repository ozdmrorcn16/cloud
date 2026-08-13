import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { onSekizAltindaMi } from '../../lib/yas'

export default function ProfilOlusturEkrani() {
  const router = useRouter()
  const [ad, setAd] = useState('')
  const [dogumTarihiMetni, setDogumTarihiMetni] = useState('')
  const [biyografi, setBiyografi] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  async function devamEt() {
    setHata(null)

    if (ad.trim().length === 0) {
      setHata('Adini yaz')
      return
    }

    const dogumTarihi = new Date(dogumTarihiMetni)
    if (isNaN(dogumTarihi.getTime())) {
      setHata('Gecerli bir dogum tarihi gir (YYYY-AA-GG)')
      return
    }
    if (onSekizAltindaMi(dogumTarihi)) {
      setHata('Uygulamayi kullanmak icin 18 yasinda olmalisin')
      return
    }

    setGonderiliyor(true)
    const { data: kullaniciVerisi } = await supabase.auth.getUser()
    const kullaniciId = kullaniciVerisi.user?.id

    const { error } = await supabase.from('profiller').insert({
      id: kullaniciId,
      ad: ad.trim(),
      dogum_tarihi: dogumTarihiMetni,
      biyografi: biyografi.trim() || null,
    })
    setGonderiliyor(false)

    if (error) {
      setHata(error.message)
      return
    }
    router.replace('/')
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Profilini olustur</Text>
      <TextInput style={stiller.girdi} placeholder="Adin" value={ad} onChangeText={setAd} />
      <TextInput
        style={stiller.girdi}
        placeholder="YYYY-AA-GG"
        value={dogumTarihiMetni}
        onChangeText={setDogumTarihiMetni}
      />
      <TextInput
        style={[stiller.girdi, stiller.cokSatirli]}
        placeholder="Kisa bir tanitim yaz"
        value={biyografi}
        onChangeText={setBiyografi}
        multiline
      />
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Pressable style={stiller.buton} onPress={devamEt} disabled={gonderiliyor}>
        <Text style={stiller.butonYazi}>{gonderiliyor ? 'Kaydediliyor...' : 'Devam et'}</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24, justifyContent: 'center' },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 24 },
  girdi: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  cokSatirli: { height: 80, textAlignVertical: 'top' },
  hata: { color: '#c00', marginBottom: 12 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  butonYazi: { color: '#fff', fontWeight: '600' },
})
