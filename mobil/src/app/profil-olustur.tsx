import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { onSekizAltindaMi } from '../../lib/yas'
import { fotografYukle } from '../../lib/fotograf-yukle'
import { useOturum } from '../../lib/oturum'
import {
  KULLANICI_ADI_KURALI,
  kullaniciAdiGecerliMi,
  kullaniciAdiniNormallestir,
  kullaniciAdiMusaitMi,
} from '../../lib/kullanici-adi'

export default function ProfilOlusturEkrani() {
  const router = useRouter()
  const { profilKontrolunuYenile } = useOturum()
  const [ad, setAd] = useState('')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [kullaniciAdiDurumu, setKullaniciAdiDurumu] = useState<string | null>(null)
  const [dogumTarihiMetni, setDogumTarihiMetni] = useState('')
  const [biyografi, setBiyografi] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [fotografUrileri, setFotografUrileri] = useState<string[]>([])

  async function kullaniciAdiDegisti(metin: string) {
    setKullaniciAdi(metin)
    const normal = kullaniciAdiniNormallestir(metin)

    if (normal.length === 0) {
      setKullaniciAdiDurumu(null)
      return
    }
    if (!kullaniciAdiGecerliMi(normal)) {
      setKullaniciAdiDurumu(KULLANICI_ADI_KURALI)
      return
    }
    try {
      const musait = await kullaniciAdiMusaitMi(normal)
      setKullaniciAdiDurumu(
        musait ? 'Bu kullanıcı adı müsait.' : 'Bu kullanıcı adı alınmış, başka bir tane dene.'
      )
    } catch {
      setKullaniciAdiDurumu(null)
    }
  }

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
      setHata('Adını yaz')
      return
    }

    const dogumTarihi = new Date(dogumTarihiMetni)
    if (isNaN(dogumTarihi.getTime())) {
      setHata('Geçerli bir doğum tarihi gir (YYYY-AA-GG)')
      return
    }
    if (onSekizAltindaMi(dogumTarihi)) {
      setHata('Uygulamayı kullanmak için 18 yaşında olmalısın')
      return
    }

    const kullaniciAdiNormal = kullaniciAdiniNormallestir(kullaniciAdi)
    if (!kullaniciAdiGecerliMi(kullaniciAdiNormal)) {
      // Ayni mesaj zaten kullanici adi alaninin altinda ipucu olarak
      // gosteriliyorsa hata banner'inda tekrar etmeye gerek yok.
      if (kullaniciAdiDurumu !== KULLANICI_ADI_KURALI) {
        setHata(KULLANICI_ADI_KURALI)
      }
      return
    }

    setGonderiliyor(true)
    try {
      const { data: kullaniciVerisi } = await supabase.auth.getUser()
      const kullaniciId = kullaniciVerisi.user?.id

      if (!kullaniciId) {
        setHata('Oturumun düşmüş, tekrar giriş yap')
        return
      }

      const fotografYollari: string[] = []
      for (const uri of fotografUrileri) {
        const yol = await fotografYukle(kullaniciId, uri)
        fotografYollari.push(yol)
      }

      const { error } = await supabase.from('profiller').insert({
        id: kullaniciId,
        ad: ad.trim(),
        kullanici_adi: kullaniciAdiNormal,
        dogum_tarihi: dogumTarihiMetni,
        biyografi: biyografi.trim() || null,
        fotograflar: fotografYollari,
      })

      if (error) {
        setHata(
          error.code === '23505'
            ? 'Bu kullanıcı adı alınmış, başka bir tane dene.'
            : error.message
        )
        return
      }

      await profilKontrolunuYenile()
      router.replace('/')
    } catch (hataNesnesi) {
      const mesaj =
        hataNesnesi instanceof Error ? hataNesnesi.message : 'Beklenmeyen bir hata oluştu'
      setHata(mesaj)
    } finally {
      setGonderiliyor(false)
    }
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Profilini oluştur</Text>
      <TextInput style={stiller.girdi} placeholder="Adın" value={ad} onChangeText={setAd} />
      <TextInput
        style={stiller.girdi}
        placeholder="Kullanıcı adı"
        autoCapitalize="none"
        value={kullaniciAdi}
        onChangeText={kullaniciAdiDegisti}
      />
      {kullaniciAdiDurumu && <Text style={stiller.ipucu}>{kullaniciAdiDurumu}</Text>}
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
            : 'Fotoğraf ekle'}
        </Text>
      </Pressable>
      <TextInput
        style={[stiller.girdi, stiller.cokSatirli]}
        placeholder="Kısa bir tanıtım yaz"
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
  ipucu: { color: '#555', marginBottom: 12 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  butonYazi: { color: '#fff', fontWeight: '600' },
})
