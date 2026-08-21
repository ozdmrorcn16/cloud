import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { cihazKonumunuAl } from '../../../lib/konum'
import { yakinMekanlariYogunlukIleGetir, type MekanYogunlukIle } from '../../../lib/mekan'

const YARICAP_SECENEKLERI = [
  { etiket: '1 km', metre: 1000 },
  { etiket: '2 km', metre: 2000 },
  { etiket: '5 km', metre: 5000 },
] as const

const VARSAYILAN_YARICAP_METRE = 5000

export default function MekanAramaEkrani() {
  const router = useRouter()
  const [cihazKonumu, setCihazKonumu] = useState<{ lat: number; lng: number } | null>(null)
  const [arama, setArama] = useState('')
  const [yaricapMetre, setYaricapMetre] = useState(VARSAYILAN_YARICAP_METRE)
  const [mekanlar, setMekanlar] = useState<MekanYogunlukIle[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    async function baslangicKonumunuYukle() {
      try {
        const konum = await cihazKonumunuAl()
        setCihazKonumu(konum)
        const sonuc = await yakinMekanlariYogunlukIleGetir(
          konum.lat,
          konum.lng,
          VARSAYILAN_YARICAP_METRE,
          undefined
        )
        setMekanlar(sonuc)
      } catch (e) {
        setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
      } finally {
        setYukleniyor(false)
      }
    }
    baslangicKonumunuYukle()
  }, [])

  async function sorgulaVeGuncelle(metin: string, metre: number) {
    if (!cihazKonumu) return
    try {
      const sonuc = await yakinMekanlariYogunlukIleGetir(
        cihazKonumu.lat,
        cihazKonumu.lng,
        metre,
        metin || undefined
      )
      setMekanlar(sonuc)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  async function aramaDegisti(metin: string) {
    setArama(metin)
    await sorgulaVeGuncelle(metin, yaricapMetre)
  }

  async function yaricapDegisti(metre: number) {
    setYaricapMetre(metre)
    await sorgulaVeGuncelle(arama, metre)
  }

  if (yukleniyor) return <Text style={stiller.durum}>Yukleniyor...</Text>
  if (hata) return <Text style={stiller.hata}>{hata}</Text>

  return (
    <View style={stiller.kapsayici}>
      <TextInput
        style={stiller.arama}
        placeholder="Mekan ara"
        value={arama}
        onChangeText={aramaDegisti}
      />
      <View style={stiller.yaricapSatiri}>
        {YARICAP_SECENEKLERI.map((secenek) => (
          <Pressable
            key={secenek.metre}
            style={[
              stiller.yaricapButonu,
              secenek.metre === yaricapMetre && stiller.yaricapButonuSecili,
            ]}
            onPress={() => yaricapDegisti(secenek.metre)}
          >
            <Text
              style={[
                stiller.yaricapButonuYazi,
                secenek.metre === yaricapMetre && stiller.yaricapButonuYaziSecili,
              ]}
            >
              {secenek.etiket}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={mekanlar}
        keyExtractor={(mekan) => mekan.id}
        renderItem={({ item }) => (
          <Pressable style={stiller.satir} onPress={() => router.push(`/mekanlar/${item.id}`)}>
            <View style={stiller.satirUst}>
              <Text style={stiller.mekanAdi}>{item.ad}</Text>
              {item.kisiSayisi > 0 && (
                <Text style={stiller.kisiSayisi}>{item.kisiSayisi} kisi</Text>
              )}
            </View>
            <Text style={stiller.mekanTuru}>{item.tur}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Yakinda mekan bulunamadi</Text>}
      />
      <Pressable style={stiller.ekleButonu} onPress={() => router.push('/mekanlar/ekle')}>
        <Text style={stiller.ekleButonuYazi}>Mekan bulamadin mi? Ekle</Text>
      </Pressable>
      <Text style={stiller.atif}>Mekan verileri: Overture Maps Foundation ve katkida bulunanlar</Text>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  arama: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  yaricapSatiri: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  yaricapButonu: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  yaricapButonuSecili: { backgroundColor: '#111', borderColor: '#111' },
  yaricapButonuYazi: { color: '#111' },
  yaricapButonuYaziSecili: { color: '#fff' },
  satir: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  satirUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mekanAdi: { fontSize: 16, fontWeight: '600' },
  kisiSayisi: { color: '#666', fontSize: 13 },
  mekanTuru: { color: '#666', marginTop: 2 },
  durum: { textAlign: 'center', marginTop: 24, color: '#666' },
  hata: { textAlign: 'center', marginTop: 24, color: '#c00' },
  ekleButonu: { padding: 14, alignItems: 'center' },
  ekleButonuYazi: { color: '#111', fontWeight: '600' },
  atif: { textAlign: 'center', color: '#999', fontSize: 11, marginTop: 8 },
})
