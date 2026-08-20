import { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { gelenIstekleriGetir } from '../../lib/bag-listeleri'

export default function AnaEkran() {
  const router = useRouter()
  const [bekleyenSayisi, setBekleyenSayisi] = useState(0)

  async function cikisYap() {
    await supabase.auth.signOut()
  }

  useEffect(() => {
    gelenIstekleriGetir()
      .then((istekler) => setBekleyenSayisi(istekler.takip.length + istekler.sohbet.length))
      .catch(() => setBekleyenSayisi(0))
  }, [])

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Hesabin hazir</Text>
      <Text style={stiller.aciklama}>
        Yakinindaki mekanlari kesfet, check-in yap.
      </Text>
      <Pressable style={stiller.buton} onPress={() => router.push('/mekanlar')}>
        <Text style={stiller.butonYazi}>Mekanlari kesfet</Text>
      </Pressable>
      <Pressable style={stiller.ikincilButon} onPress={() => router.push('/kisiler')}>
        <Text style={stiller.ikincilButonYazi}>Kisi ara</Text>
      </Pressable>
      <Pressable style={stiller.ikincilButon} onPress={() => router.push('/baglar')}>
        <View style={stiller.baglarIcerik}>
          <Text style={stiller.ikincilButonYazi}>Baglar</Text>
          {bekleyenSayisi > 0 && <Text style={stiller.rozet}>{bekleyenSayisi}</Text>}
        </View>
      </Pressable>
      <Pressable style={stiller.ikincilButon} onPress={() => router.push('/profil/anilar')}>
        <Text style={stiller.ikincilButonYazi}>Anilarim</Text>
      </Pressable>
      <Pressable style={stiller.ikincilButon} onPress={() => router.push('/profil/ayarlar')}>
        <Text style={stiller.ikincilButonYazi}>Gizlilik ayarlari</Text>
      </Pressable>
      <Pressable style={stiller.cikisButonu} onPress={cikisYap}>
        <Text style={stiller.cikisYazi}>Cikis yap</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  baslik: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  aciklama: { color: '#555', textAlign: 'center', marginBottom: 24 },
  buton: { backgroundColor: '#111', borderRadius: 8, padding: 14, alignItems: 'center', width: '100%' },
  butonYazi: { color: '#fff', fontWeight: '600' },
  ikincilButon: { padding: 14, alignItems: 'center', width: '100%' },
  ikincilButonYazi: { color: '#111', fontWeight: '600' },
  baglarIcerik: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rozet: {
    color: '#fff',
    backgroundColor: '#c00',
    fontSize: 12,
    fontWeight: '700',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  cikisButonu: { padding: 14, alignItems: 'center' },
  cikisYazi: { color: '#c00' },
})
