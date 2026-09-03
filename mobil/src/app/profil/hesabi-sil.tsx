import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { hesabiSil } from '../../../lib/hesap'
import { supabase } from '../../../lib/supabase'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { hataMetni } from '../../../lib/hata-metni'

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
  const stiller = useStiller(stilleriYap)
  const [parola, setParola] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [calisiyor, setCalisiyor] = useState(false)

  async function sil() {
    if (parola.trim() === '') {
      setHata('Onaylamak için parolanı yaz.')
      return
    }
    setCalisiyor(true)
    setHata(null)
    try {
      await hesabiSil(parola)
      setParola('')
      await supabase.auth.signOut()
    } catch (e) {
      // Basarisiz denemeden sonra da parolayi state'te birakmiyoruz -
      // yanlis yazilmis ya da reddedilmis bir parolanin ekran hafizasinda
      // gereksiz yere durmasina gerek yok (duzeltme turu 1, Minor).
      setParola('')
      setHata(hataMetni(e))
    } finally {
      setCalisiyor(false)
    }
  }

  return (
    <View style={stiller.kapsayici}>
      <UstCubuk baslik="Hesabını sil" geriEtiketi="Geri" />
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
          Bunun yerine hesabımı dondur
        </Text>
      </Pressable>

      <Text style={stiller.etiket}>
        Onaylamak için parolanı yaz
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
          Hesabımı kalıcı olarak sil
        </Text>
      </Pressable>
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renk.zemin,
    padding: bosluk.xl,
    gap: bosluk.m,
    paddingBottom: ALT_GEZINME_PAYI,
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
  },
  etiket: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.l,
  },
  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 14,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
  },
  ikincilButon: { paddingVertical: bosluk.m, alignItems: 'center' },
  ikincilButonMetni: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  // Silme geri alinamaz: uygulamadaki tek kirmizi zemin burada, bilerek.
  tehlikeButonu: {
    backgroundColor: renk.yikici,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: bosluk.s,
  },
  tehlikeButonMetni: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
})
