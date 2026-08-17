import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, Image, StyleSheet, Switch } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../../../lib/supabase'
import { cihazKonumunuAl } from '../../../lib/konum'
import { checkInYap } from '../../../lib/checkin'
import { checkinFotografYukle } from '../../../lib/checkin-fotograf-yukle'
import { varsayilanGizliyiGetir } from '../../../lib/ayarlar'

const ILK_UYARI_ANAHTARI = 'ilk-checkin-uyarisi-gosterildi'

export default function CheckInEkrani() {
  const router = useRouter()
  const { mekanId } = useLocalSearchParams<{ mekanId: string }>()
  const [notMetni, setNotMetni] = useState('')
  const [yerelFotoUri, setYerelFotoUri] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [uyari, setUyari] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [gizliMi, setGizliMi] = useState(false)
  const [ilkKullanimUyarisi, setIlkKullanimUyarisi] = useState(false)
  // Kullanici gizlilik tercihini elle degistirdiyse (switch veya ilk kullanim
  // uyarisindaki "Gizli yap"), gec gelen varsayilanGizliyiGetir() yaniti bu
  // secimin uzerine yazmasin.
  const gizliManuelDegisti = useRef(false)

  useEffect(() => {
    varsayilanGizliyiGetir()
      .then((deger) => {
        if (!gizliManuelDegisti.current) setGizliMi(deger)
      })
      .catch(() => {})
    AsyncStorage.getItem(ILK_UYARI_ANAHTARI).then((deger) => {
      if (!deger) setIlkKullanimUyarisi(true)
    })
  }, [])

  function gizliMiDegistir(deger: boolean) {
    gizliManuelDegisti.current = true
    setGizliMi(deger)
  }

  async function ilkUyariKapat(gizliSecildi: boolean) {
    if (gizliSecildi) gizliMiDegistir(true)
    setIlkKullanimUyarisi(false)
    await AsyncStorage.setItem(ILK_UYARI_ANAHTARI, 'true')
  }

  async function fotografSec() {
    const sonuc = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 })
    if (!sonuc.canceled) {
      setYerelFotoUri(sonuc.assets[0].uri)
    }
  }

  async function checkInYapButonu() {
    setHata(null)
    setGonderiliyor(true)
    try {
      const konum = await cihazKonumunuAl()

      let yuklenenFotoYolu: string | undefined
      if (yerelFotoUri) {
        try {
          const { data: kullaniciVerisi } = await supabase.auth.getUser()
          const kullaniciId = kullaniciVerisi.user?.id
          if (kullaniciId) {
            yuklenenFotoYolu = await checkinFotografYukle(kullaniciId, yerelFotoUri)
          }
        } catch {
          // Fotograf yuklenemezse check-in'i engelleme — notsuz/fotografsiz devam eder.
          setUyari('Fotograf yuklenemedi, notunla check-in yapildi')
        }
      }

      await checkInYap(mekanId, konum, notMetni.trim() || undefined, yuklenenFotoYolu, gizliMi)
      router.replace(`/mekanlar/${mekanId}`)
    } catch (e) {
      if (e instanceof TypeError && e.message === 'Network request failed') {
        setHata('Internet baglantisi yok, tekrar dene')
      } else {
        setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
      }
    } finally {
      setGonderiliyor(false)
    }
  }

  if (ilkKullanimUyarisi) {
    return (
      <View style={stiller.kapsayici}>
        <Text style={stiller.baslik}>Bu check-in ne paylasiyor?</Text>
        <Text style={stiller.uyariMetni}>
          Check-in yaptiginda bulundugun mekan ve varsa yazdigin not, seni
          takip eden arkadaslarina gorunur olur. Check-in 4 saat sonra ya da
          "ayrildim" dedigin anda kendiliginden kapanir. Istersen bu
          check-in'i gizli yaparak sadece kendi profilinde tutabilirsin.
        </Text>
        <Pressable style={stiller.buton} onPress={() => ilkUyariKapat(false)}>
          <Text style={stiller.butonYazi}>Anladim</Text>
        </Pressable>
        <Pressable style={stiller.ikincilButon} onPress={() => ilkUyariKapat(true)}>
          <Text style={stiller.ikincilButonYazi}>Gizli yap</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Yeni check-in</Text>
      <TextInput
        style={[stiller.girdi, stiller.cokSatirli]}
        placeholder="Bir not ekle (opsiyonel)"
        value={notMetni}
        onChangeText={setNotMetni}
        multiline
      />
      <Pressable style={stiller.fotoButonu} onPress={fotografSec}>
        <Text style={stiller.fotoButonuYazi}>
          {yerelFotoUri ? 'Fotografi degistir' : 'Fotograf ekle (opsiyonel)'}
        </Text>
      </Pressable>
      {yerelFotoUri && <Image source={{ uri: yerelFotoUri }} style={stiller.onizleme} />}

      <View style={stiller.satir}>
        <Text style={stiller.etiket}>Gizli check-in</Text>
        <Switch
          accessibilityLabel="Gizli check-in"
          value={gizliMi}
          onValueChange={gizliMiDegistir}
        />
      </View>

      {uyari && <Text style={stiller.uyari}>{uyari}</Text>}
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Pressable style={stiller.buton} onPress={checkInYapButonu} disabled={gonderiliyor}>
        <Text style={stiller.butonYazi}>{gonderiliyor ? 'Check-in yapiliyor...' : 'Check-in yap'}</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24 },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 24 },
  girdi: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  cokSatirli: { minHeight: 80, textAlignVertical: 'top' },
  fotoButonu: { padding: 12, alignItems: 'center', marginBottom: 12 },
  fotoButonuYazi: { color: '#0645ad' },
  satir: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, marginBottom: 12,
  },
  etiket: { fontSize: 16 },
  uyariMetni: { fontSize: 16, lineHeight: 24, marginBottom: 32 },
  ikincilButon: { padding: 14, alignItems: 'center', marginTop: 12 },
  ikincilButonYazi: { color: '#0645ad', fontWeight: '600' },
  onizleme: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12 },
  uyari: { color: '#a60', marginBottom: 12 },
  hata: { color: '#c00', marginBottom: 12 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center' },
  butonYazi: { color: '#fff', fontWeight: '600' },
})
