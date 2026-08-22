import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useOturum } from '../../lib/oturum'
import { supabase } from '../../lib/supabase'

// Bu ekran YALNIZCA moderasyon kararlari icindir. Dondurulmus hesap
// buraya hic dusmez: giris sirasinda otomatik geri acilir (karar 66).
export default function HesapDurumuEkrani() {
  const { hesapDurumu } = useOturum()

  const baslik =
    hesapDurumu?.durum === 'yasakli'
      ? 'Hesabin kalici olarak kapatildi'
      : 'Hesabin askiya alindi'

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>{baslik}</Text>
      <Text style={stiller.metin}>Sebep: {hesapDurumu?.gerekce ?? '-'}</Text>
      {hesapDurumu?.askiBitisi && (
        <Text style={stiller.metin}>
          Bitis: {new Date(hesapDurumu.askiBitisi).toLocaleString('tr-TR')}
        </Text>
      )}
      <Text style={stiller.ipucu}>
        Bu sure boyunca profilin baskalarina gorunmez ve yeni icerik
        paylasamazsin. Verilerin silinmedi.
      </Text>
      <Pressable style={stiller.buton} onPress={() => supabase.auth.signOut()}>
        <Text style={stiller.butonMetni}>Cikis yap</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 24, gap: 12, justifyContent: 'center' },
  baslik: { fontSize: 20, fontWeight: '600' },
  metin: { fontSize: 15 },
  ipucu: { fontSize: 13, opacity: 0.7, marginTop: 8 },
  buton: {
    marginTop: 24,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  butonMetni: { color: 'white', fontWeight: '600' },
})
