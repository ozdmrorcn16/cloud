import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { onSekizAltindaMi } from '../../lib/yas'
import { fotografYukle } from '../../lib/fotograf-yukle'

export default function ProfilOlusturEkrani() {
  const router = useRouter()
  const [ad, setAd] = useState('')
  const [dogumTarihiMetni, setDogumTarihiMetni] = useState('')
  const [biyografi, setBiyografi] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [fotografUrileri, setFotografUrileri] = useState<string[]>([])

  async function fotografEkle() {
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 6,
    })
    if (!sonuc.canceled) {
      setFotografUrileri((mevcut) => [...mevcut, ...sonuc.assets.map((a) => a.uri)].slice(0, 6))
    }
  }

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

    const fotografYollari: string[] = []
    for (const uri of fotografUrileri) {
      const yol = await fotografYukle(kullaniciId!, uri)
      fotografYollari.push(yol)
    }

    const { error } = await supabase.from('profiller').insert({
      id: kullaniciId,
      ad: ad.trim(),
      dogum_tarihi: dogumTarihiMetni,
      biyografi: biyografi.trim() || null,
      fotograflar: fotografYollari,
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
      <Pressable style={stiller.fotografButonu} onPress={fotografEkle}>
        <Text>
          {fotografUrileri.length > 0
            ? `${fotografUrileri.length} fotograf secildi`
            : 'Fotograf ekle'}
        </Text>
      </Pressable>
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
  fotografButonu: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  hata: { color: '#c00', marginBottom: 12 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  butonYazi: { color: '#fff', fontWeight: '600' },
})
