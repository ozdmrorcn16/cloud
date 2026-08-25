import { useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, Linking, StyleSheet } from 'react-native'
import { supabase } from '../../../lib/supabase'
import { kullanicininAnilariniGetir, aniyiSil, type AniGorunumu } from '../../../lib/checkin'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../../tasarim/tema'
import { UstCubuk } from '../../tasarim/UstCubuk'

export default function AnilarEkrani() {
  const [anilar, setAnilar] = useState<AniGorunumu[]>([])
  const [hata, setHata] = useState<string | null>(null)

  async function anilariYukle() {
    try {
      const { data: kullaniciVerisi } = await supabase.auth.getUser()
      const kullaniciId = kullaniciVerisi.user?.id
      if (!kullaniciId) return
      setAnilar(await kullanicininAnilariniGetir(kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  useEffect(() => {
    anilariYukle()
  }, [])

  function haritadaAc(konum: { lat: number; lng: number }) {
    Linking.openURL(`https://maps.google.com/?q=${konum.lat},${konum.lng}`)
  }

  async function sil(checkInId: string) {
    await aniyiSil(checkInId)
    setAnilar((mevcut) => mevcut.filter((a) => a.id !== checkInId))
  }

  return (
    <View style={stiller.kapsayici}>
      <UstCubuk baslik="Anılarım" geriEtiketi="Geri" />
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <FlatList
        data={anilar}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <Pressable onPress={() => haritadaAc(item.mekanKonumu)}>
              <Text style={stiller.mekanAdi}>{item.mekanAdi}</Text>
              {item.notMetni && <Text style={stiller.not}>{item.notMetni}</Text>}
            </Pressable>
            <Pressable onPress={() => sil(item.id)}>
              <Text style={stiller.silButonu}>Sil</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Henüz bir anın yok</Text>}
      />
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.xl,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  baslik: {
    fontFamily: yazi.baslik,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginBottom: bosluk.l,
  },
  satir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  mekanAdi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  not: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
  },
  silButonu: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginBottom: bosluk.m,
  },
  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.xl,
    textAlign: 'center',
  },
})
