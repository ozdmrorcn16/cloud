import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useOturum } from '../../lib/oturum'
import { supabase } from '../../lib/supabase'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../tasarim/tema'

// Bu ekran YALNIZCA moderasyon kararlari icindir. Dondurulmus hesap
// buraya hic dusmez: giris sirasinda otomatik geri acilir (karar 66).
export default function HesapDurumuEkrani() {
  const { hesapDurumu, hesapDurumunuYenile } = useOturum()
  const [cikisHatasi, setCikisHatasi] = useState<string | null>(null)

  const baslik =
    hesapDurumu?.durum === 'yasakli'
      ? 'Hesabın kalıcı olarak kapatıldı'
      : 'Hesabın askıya alındı'

  async function cikisYap() {
    setCikisHatasi(null)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) setCikisHatasi(error.message)
    } catch (hata) {
      setCikisHatasi(hata instanceof Error ? hata.message : 'Çıkış yapılamadı')
    }
  }

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
      {cikisHatasi && <Text style={stiller.hataMetni}>{cikisHatasi}</Text>}
      <Pressable style={stiller.ikincilButon} onPress={() => hesapDurumunuYenile()}>
        <Text style={stiller.ikincilButonMetni}>Yenile</Text>
      </Pressable>
      <Pressable style={stiller.buton} onPress={cikisYap}>
        <Text style={stiller.butonMetni}>Çıkış yap</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renk.zemin,
    padding: bosluk.xl,
    gap: bosluk.m,
    justifyContent: 'center',
  },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
  },
  metin: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
  },
  ipucu: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metinSoluk,
    marginTop: bosluk.s,
  },
  hataMetni: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
  },
  buton: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: bosluk.s,
  },
  butonMetni: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
  ikincilButon: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.hap,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: bosluk.xl,
  },
  ikincilButonMetni: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
})
