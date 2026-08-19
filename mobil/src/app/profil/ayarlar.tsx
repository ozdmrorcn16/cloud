import { useEffect, useState } from 'react'
import { View, Text, Switch, Pressable, TextInput, StyleSheet } from 'react-native'
import {
  varsayilanGizliyiGetir,
  varsayilanGizliyiAyarla,
  aniGorunurlugunuAyarla,
  aramadaGorunsunGetir,
  aramadaGorunsunAyarla,
} from '../../../lib/ayarlar'
import {
  KULLANICI_ADI_KURALI,
  kullaniciAdiGecerliMi,
  kullaniciAdiniNormallestir,
  kullaniciAdiniDegistir,
} from '../../../lib/kullanici-adi'

export default function AyarlarEkrani() {
  const [varsayilanGizli, setVarsayilanGizli] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [yeniKullaniciAdi, setYeniKullaniciAdi] = useState('')
  const [kullaniciAdiSonucu, setKullaniciAdiSonucu] = useState<string | null>(null)
  const [aramadaGorunsun, setAramadaGorunsun] = useState(true)

  async function ayarlariYukle() {
    try {
      setVarsayilanGizli(await varsayilanGizliyiGetir())
      setAramadaGorunsun(await aramadaGorunsunGetir())
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  async function kullaniciAdiniGuncelle() {
    const normal = kullaniciAdiniNormallestir(yeniKullaniciAdi)
    if (!kullaniciAdiGecerliMi(normal)) {
      setKullaniciAdiSonucu(KULLANICI_ADI_KURALI)
      return
    }
    try {
      await kullaniciAdiniDegistir(normal)
      setKullaniciAdiSonucu('Kullanici adin guncellendi.')
      setYeniKullaniciAdi('')
    } catch (e) {
      setKullaniciAdiSonucu(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  async function aramadaGorunsunDegisti(deger: boolean) {
    const oncekiDeger = aramadaGorunsun
    setAramadaGorunsun(deger)
    try {
      await aramadaGorunsunAyarla(deger)
      setHata(null)
    } catch (e) {
      setAramadaGorunsun(oncekiDeger)
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  useEffect(() => {
    ayarlariYukle()
  }, [])

  async function varsayilanGizliDegisti(deger: boolean) {
    const oncekiDeger = varsayilanGizli
    setVarsayilanGizli(deger)
    try {
      await varsayilanGizliyiAyarla(deger)
      setHata(null)
    } catch (e) {
      setVarsayilanGizli(oncekiDeger)
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  async function aniGorunurluguDegistir(deger: 'herkese_acik' | 'kimse') {
    try {
      await aniGorunurlugunuAyarla(deger)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Gizlilik ayarlari</Text>
      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Text style={stiller.altBaslik}>Hesap</Text>
      <TextInput
        style={stiller.girdi}
        placeholder="Yeni kullanici adi"
        autoCapitalize="none"
        value={yeniKullaniciAdi}
        onChangeText={setYeniKullaniciAdi}
      />
      <Pressable style={stiller.buton} onPress={kullaniciAdiniGuncelle}>
        <Text style={stiller.butonMetni}>Kullanici adini degistir</Text>
      </Pressable>
      {kullaniciAdiSonucu ? (
        <Text style={stiller.ipucu}>{kullaniciAdiSonucu}</Text>
      ) : (
        <Text style={stiller.ipucu}>{KULLANICI_ADI_KURALI}</Text>
      )}

      <View style={stiller.satir}>
        <Text style={stiller.etiket}>Yeni check-in'ler varsayilan gizli olsun</Text>
        <Switch
          accessibilityLabel="Varsayilan gizli check-in"
          value={varsayilanGizli}
          onValueChange={varsayilanGizliDegisti}
        />
      </View>

      <View style={stiller.satir}>
        <Text style={stiller.etiket}>Beni aramada goster</Text>
        <Switch
          accessibilityLabel="Aramada gorunurluk"
          value={aramadaGorunsun}
          onValueChange={aramadaGorunsunDegisti}
        />
      </View>

      <Text style={stiller.altBaslik}>Butun anilarimi kim gorsun</Text>
      <View style={stiller.butonSatiri}>
        <Pressable
          style={stiller.buton}
          onPress={() => aniGorunurluguDegistir('herkese_acik')}
        >
          <Text style={stiller.butonMetni}>Herkes gorsun</Text>
        </Pressable>
        <Pressable
          style={stiller.buton}
          onPress={() => aniGorunurluguDegistir('kimse')}
        >
          <Text style={stiller.butonMetni}>Kimse gormesin</Text>
        </Pressable>
      </View>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  altBaslik: { fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  satir: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  etiket: { fontSize: 16, flex: 1, marginRight: 12 },
  butonSatiri: { flexDirection: 'row', gap: 12 },
  buton: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  butonMetni: { color: '#0645ad', fontWeight: '600' },
  hata: { color: '#c00', marginBottom: 12 },
  girdi: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 8 },
  ipucu: { color: '#555', marginBottom: 12 },
})
