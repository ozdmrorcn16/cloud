import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { sikayetGonder, SIKAYET_SEBEPLERI, type SikayetHedefTuru } from '../../lib/sikayet'

export default function SikayetEkrani() {
  const router = useRouter()
  const { hedefTur, hedefId } = useLocalSearchParams<{
    hedefTur: SikayetHedefTuru
    hedefId: string
  }>()
  const [secilenSebep, setSecilenSebep] = useState<string | null>(null)
  const [aciklama, setAciklama] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [gonderildi, setGonderildi] = useState(false)

  async function gonder() {
    if (!secilenSebep) {
      setHata('Bir sebep sec')
      return
    }
    setHata(null)
    setGonderiliyor(true)
    try {
      await sikayetGonder(hedefTur, hedefId, secilenSebep, aciklama.trim() || undefined)
      setGonderildi(true)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    } finally {
      setGonderiliyor(false)
    }
  }

  if (gonderildi) {
    return (
      <View style={stiller.kapsayici}>
        <Text style={stiller.baslik}>Sikayetin alindi</Text>
        <Text style={stiller.teyitMetni}>Bildirimin icin tesekkurler.</Text>
        <Pressable style={stiller.buton} onPress={() => router.back()}>
          <Text style={stiller.butonYazi}>Kapat</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Sikayet et</Text>

      {SIKAYET_SEBEPLERI.map((sebep) => (
        <Pressable
          key={sebep.anahtar}
          style={[
            stiller.sebepSatiri,
            secilenSebep === sebep.anahtar && stiller.sebepSatiriSecili,
          ]}
          onPress={() => setSecilenSebep(sebep.anahtar)}
        >
          <Text style={stiller.sebepYazi}>{sebep.etiket}</Text>
        </Pressable>
      ))}

      <TextInput
        style={[stiller.girdi, stiller.cokSatirli]}
        placeholder="Eklemek istedigin bir sey var mi?"
        value={aciklama}
        onChangeText={setAciklama}
        multiline
      />

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Pressable style={stiller.buton} onPress={gonder} disabled={gonderiliyor}>
        <Text style={stiller.butonYazi}>{gonderiliyor ? 'Gonderiliyor...' : 'Gonder'}</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 16 },
  sebepSatiri: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 12, marginBottom: 8,
  },
  sebepSatiriSecili: { borderColor: '#111', backgroundColor: '#f0f0f0' },
  sebepYazi: { fontSize: 16 },
  girdi: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginTop: 8, marginBottom: 12 },
  cokSatirli: { minHeight: 80, textAlignVertical: 'top' },
  teyitMetni: { fontSize: 16, color: '#555', marginBottom: 24 },
  hata: { color: '#c00', marginBottom: 12 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  butonYazi: { color: '#fff', fontWeight: '600' },
})
