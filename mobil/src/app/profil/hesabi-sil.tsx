import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { hesabiSil } from '../../../lib/hesap'
import { supabase } from '../../../lib/supabase'

// Spec karar 67: bekleme suresi YOK, koruma parola dogrulamasi.
// Dondurma alternatifi ayni ekranda sunuluyor cunku "kararsizim"
// ihtiyacini o karsiliyor.
//
// Kullanici adi onayi kullanilmiyor (kullanici karari): kullanici zaten
// KENDI hesabindan islem yapiyor, kullanici adini yazdirmak ekstra bir
// korumaydi ama kullanici adi HERKESE ACIK oldugu icin (baskasinin_profili,
// kisi_ara RPC'leri donduruyor) gercek bir kapi degildi. Parola gercek
// bir kapi: `hesap-sil` Edge Function'i parolayi SUNUCUDA
// (`signInWithPassword`) dogruluyor, istemci bu adimi atlayamaz.
export default function HesabiSilEkrani() {
  const [parola, setParola] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [calisiyor, setCalisiyor] = useState(false)

  async function sil() {
    if (parola.trim() === '') {
      setHata('Onaylamak icin parolani yaz.')
      return
    }
    setCalisiyor(true)
    setHata(null)
    try {
      await hesabiSil(parola)
      await supabase.auth.signOut()
    } catch (e) {
      setHata((e as Error).message)
    } finally {
      setCalisiyor(false)
    }
  }

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>Hesabini sil</Text>
      <Text style={stiller.metin}>
        Geri donusu yok. Yeniden gelmek istersen sifirdan hesap acman
        gerekir.
      </Text>
      <Text style={stiller.ipucu}>
        Profilin, anilarin, baglarin ve konusma listen silinir. Karsi
        tarafin gecmisindeki mesajlar kalir ama adin gorunmez.
      </Text>

      <Pressable style={stiller.ikincilButon} onPress={() => router.back()}>
        <Text style={stiller.ikincilButonMetni}>
          Bunun yerine hesabimi dondur
        </Text>
      </Pressable>

      <Text style={stiller.etiket}>
        Onaylamak icin parolani yaz
      </Text>
      <TextInput
        style={stiller.girdi}
        placeholder="parolan"
        secureTextEntry
        autoCapitalize="none"
        value={parola}
        onChangeText={setParola}
      />
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Pressable style={stiller.tehlikeButonu} onPress={sil} disabled={calisiyor}>
        <Text style={stiller.tehlikeButonMetni}>
          Hesabimi kalici olarak sil
        </Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24, gap: 12 },
  baslik: { fontSize: 20, fontWeight: '600' },
  metin: { fontSize: 15 },
  ipucu: { fontSize: 13, opacity: 0.7 },
  etiket: { fontSize: 14, marginTop: 16 },
  girdi: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  hata: { color: '#b00020' },
  ikincilButon: { padding: 12, alignItems: 'center' },
  ikincilButonMetni: { fontWeight: '600' },
  tehlikeButonu: {
    marginTop: 8,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#b00020',
    alignItems: 'center',
  },
  tehlikeButonMetni: { color: 'white', fontWeight: '600' },
})
