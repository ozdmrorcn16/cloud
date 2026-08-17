import { useEffect, useState } from 'react'
import { View, Text, Switch, Pressable, StyleSheet } from 'react-native'
import {
  varsayilanGizliyiGetir,
  varsayilanGizliyiAyarla,
  aniGorunurlugunuAyarla,
} from '../../../lib/ayarlar'

export default function AyarlarEkrani() {
  const [varsayilanGizli, setVarsayilanGizli] = useState(false)
  const [hata, setHata] = useState<string | null>(null)

  async function ayarlariYukle() {
    try {
      setVarsayilanGizli(await varsayilanGizliyiGetir())
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  useEffect(() => {
    ayarlariYukle()
  }, [])

  async function varsayilanGizliDegisti(deger: boolean) {
    setVarsayilanGizli(deger)
    try {
      await varsayilanGizliyiAyarla(deger)
      setHata(null)
    } catch (e) {
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

      <View style={stiller.satir}>
        <Text style={stiller.etiket}>Yeni check-in'ler varsayilan gizli olsun</Text>
        <Switch
          accessibilityLabel="Varsayilan gizli check-in"
          value={varsayilanGizli}
          onValueChange={varsayilanGizliDegisti}
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
})
