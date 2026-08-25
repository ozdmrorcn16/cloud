import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../../tasarim/tema'

export default function DogrulaEkrani() {
  const router = useRouter()
  const { telefon } = useLocalSearchParams<{ telefon: string }>()
  const [kod, setKod] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  async function dogrula() {
    setHata(null)
    setGonderiliyor(true)
    const { error } = await supabase.auth.verifyOtp({
      phone: telefon,
      token: kod,
      type: 'sms',
    })
    setGonderiliyor(false)

    if (error) {
      setHata(error.message)
      return
    }
    router.replace('/profil-olustur')
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Telefonunu doğrula</Text>
      <Text style={stiller.aciklama}>{telefon} numarasina gonderilen kodu gir</Text>
      <TextInput
        style={stiller.girdi}
        placeholder="Doğrulama kodu"
        keyboardType="number-pad"
        value={kod}
        onChangeText={setKod}
      />
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Pressable style={stiller.buton} onPress={dogrula} disabled={gonderiliyor}>
        <Text style={stiller.butonYazi}>{gonderiliyor ? 'Dogrulaniyor...' : 'Dogrula'}</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.xl,
    justifyContent: 'center',
  },
  baslik: {
    fontFamily: yazi.baslik,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginBottom: bosluk.s,
  },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginBottom: bosluk.xl,
  },
  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 14,
    marginBottom: bosluk.m,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  buton: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
  },
  butonYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginBottom: bosluk.m,
  },
})
