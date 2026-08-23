import { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { gelenIstekleriGetir } from '../../lib/bag-listeleri'
import { konusmalarimiGetir } from '../../lib/sohbet'
import { bildirimJetonunuSil } from '../../lib/bildirim'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../tasarim/tema'

export default function AnaEkran() {
  const router = useRouter()
  const [bekleyenSayisi, setBekleyenSayisi] = useState(0)
  const [okunmamisMesajSayisi, setOkunmamisMesajSayisi] = useState(0)

  async function cikisYap() {
    // Cikistan once bu cihazin push jetonunu sil ki bir sonraki
    // kullaniciya ait bildirimler bu cihaza dusmesin. Hata yutulur,
    // cikisi bloklamaz.
    await bildirimJetonunuSil()
    await supabase.auth.signOut()
  }

  // useEffect yalnizca ilk acilista bir kez cekiyordu: kullanici /baglar
  // ekranina gidip istekleri kabul edip geri donunce rozet eski deger de
  // kaliyordu. useFocusEffect ekran her odaklandiginda yeniden cekiyor.
  useFocusEffect(
    useCallback(() => {
      gelenIstekleriGetir()
        .then((istekler) => setBekleyenSayisi(istekler.takip.length + istekler.sohbet.length))
        .catch(() => setBekleyenSayisi(0))
      konusmalarimiGetir()
        .then((konusmalar) =>
          setOkunmamisMesajSayisi(konusmalar.reduce((toplam, k) => toplam + k.okunmamis, 0))
        )
        .catch(() => setOkunmamisMesajSayisi(0))
    }, [])
  )

  return (
    <ScrollView style={stiller.sayfa} contentContainerStyle={stiller.icerik}>
      {/* Kelime markasi: siyah "slooin" + turuncu nokta (karar 73). */}
      <Text style={stiller.marka}>
        slooin<Text style={stiller.markaNokta}>.</Text>
      </Text>

      <Text style={stiller.baslik}>Hesabın hazır</Text>
      <Text style={stiller.aciklama}>Yakınındaki mekanları keşfet, check-in yap.</Text>

      {/* Turuncu YALNIZCA burada: sayfanin tek birincil eylemi. */}
      <Pressable style={stiller.birincil} onPress={() => router.push('/mekanlar')}>
        <Text style={stiller.birincilYazi}>Mekanları keşfet</Text>
      </Pressable>

      <View style={stiller.liste}>
        <SatirDugmesi etiket="Kişi ara" onPress={() => router.push('/kisiler')} />
        <SatirDugmesi
          etiket="Bağlar"
          rozet={bekleyenSayisi}
          onPress={() => router.push('/baglar')}
        />
        <SatirDugmesi
          etiket="Mesajlar"
          rozet={okunmamisMesajSayisi}
          onPress={() => router.push('/mesajlar')}
        />
        <SatirDugmesi etiket="Anılarım" onPress={() => router.push('/profil/anilar')} />
        <SatirDugmesi
          etiket="Gizlilik ayarları"
          sonuncu
          onPress={() => router.push('/profil/ayarlar')}
        />
      </View>

      <Pressable style={stiller.cikisButonu} onPress={cikisYap}>
        <Text style={stiller.cikisYazi}>Çıkış yap</Text>
      </Pressable>
    </ScrollView>
  )
}

/** Kart icindeki tek satir. Rozet yalnizca sayi sifirdan buyukse cikar. */
function SatirDugmesi({
  etiket,
  rozet = 0,
  sonuncu = false,
  onPress,
}: {
  etiket: string
  rozet?: number
  sonuncu?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      style={[stiller.satir, !sonuncu && stiller.satirCizgili]}
      onPress={onPress}
    >
      <Text style={stiller.satirYazi}>{etiket}</Text>
      <View style={stiller.satirSag}>
        {rozet > 0 && <Text style={stiller.rozet}>{rozet}</Text>}
        <Text style={stiller.ok}>›</Text>
      </View>
    </Pressable>
  )
}

const stiller = StyleSheet.create({
  sayfa: { flex: 1, backgroundColor: renk.zemin },
  icerik: { padding: bosluk.xl, paddingTop: bosluk.xxl + bosluk.l },

  marka: {
    fontFamily: yazi.baslikKalin,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginBottom: bosluk.xxl,
  },
  markaNokta: { color: renk.turuncu },

  baslik: {
    fontFamily: yazi.baslik,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.5,
    marginBottom: bosluk.xs,
  },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
    marginBottom: bosluk.xl,
  },

  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: bosluk.l,
    alignItems: 'center',
    ...golge.kart,
  },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.yuzey,
  },

  liste: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    marginTop: bosluk.xl,
    overflow: 'hidden',
    ...golge.kart,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: bosluk.l,
    paddingHorizontal: bosluk.l,
  },
  satirCizgili: { borderBottomWidth: 1, borderBottomColor: renk.cizgi },
  satirYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  satirSag: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  rozet: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.yuzey,
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  ok: { fontFamily: yazi.govde, fontSize: olcek.altBaslik, color: renk.metinSoluk },

  cikisButonu: { paddingVertical: bosluk.l, alignItems: 'center', marginTop: bosluk.s },
  cikisYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
  },
})
