import { useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, ScrollView, StyleSheet } from 'react-native'
import {
  gelenIstekleriGetir,
  gidenIstekleriGetir,
  takipcilerimiGetir,
  takipEttiklerimiGetir,
} from '../../lib/bag-listeleri'
import { takipIsteginiYanitla, sohbetIsteginiYanitla, takibiBirak, takipciyiCikar } from '../../lib/bag'
import { engelle } from '../../lib/engelleme'
import type { BagKisi } from '../../lib/bag'

export default function BaglarEkrani() {
  const [gelenTakip, setGelenTakip] = useState<BagKisi[]>([])
  const [gelenSohbet, setGelenSohbet] = useState<BagKisi[]>([])
  const [gidenTakip, setGidenTakip] = useState<BagKisi[]>([])
  const [gidenSohbet, setGidenSohbet] = useState<BagKisi[]>([])
  const [takipciler, setTakipciler] = useState<BagKisi[]>([])
  const [takipEdilenler, setTakipEdilenler] = useState<BagKisi[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  async function verileriYukle() {
    try {
      const [gelen, giden, takipcilerVerisi, takipEdilenlerVerisi] = await Promise.all([
        gelenIstekleriGetir(),
        gidenIstekleriGetir(),
        takipcilerimiGetir(),
        takipEttiklerimiGetir(),
      ])
      setGelenTakip(gelen.takip)
      setGelenSohbet(gelen.sohbet)
      setGidenTakip(giden.takip)
      setGidenSohbet(giden.sohbet)
      setTakipciler(takipcilerVerisi)
      setTakipEdilenler(takipEdilenlerVerisi)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    verileriYukle()
  }, [])

  async function takipIstegineYanitVer(kullaniciId: string, kabul: boolean) {
    try {
      await takipIsteginiYanitla(kullaniciId, kabul)
      setGelenTakip((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      if (kabul) {
        const kisi = gelenTakip.find((k) => k.id === kullaniciId)
        if (kisi) setTakipciler((onceki) => [...onceki, kisi])
      }
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  async function sohbetIstegineYanitVer(kullaniciId: string, kabul: boolean) {
    try {
      await sohbetIsteginiYanitla(kullaniciId, kabul)
      setGelenSohbet((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  async function takipciyiCikarEt(kullaniciId: string) {
    try {
      await takipciyiCikar(kullaniciId)
      setTakipciler((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  async function takibiBirakEt(kullaniciId: string) {
    try {
      await takibiBirak(kullaniciId)
      setTakipEdilenler((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  async function kullaniciyiEngelle(kullaniciId: string) {
    try {
      await engelle(kullaniciId)
      setGelenTakip((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setGelenSohbet((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setGidenTakip((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setGidenSohbet((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setTakipciler((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setTakipEdilenler((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun olustu')
    }
  }

  if (yukleniyor) {
    return (
      <View style={stiller.kapsayici}>
        <Text style={stiller.durum}>Yukleniyor...</Text>
      </View>
    )
  }

  return (
    // Bes FlatList ve alti baslik tek bir View'da flex:1 icinde ustuste
    // duruyordu; kapsayici kaydirilamadigi icin son bolumler ("Takipcilerim",
    // "Takip ettiklerim") telefonda kirpilip erisilemez oluyordu (final
    // inceleme Madde 4). En az riskli duzeltme: butun icerigi tek bir
    // ScrollView'a al, ic FlatList'lerin hepsine scrollEnabled={false} ver.
    // Boylece dis kaydirma tek elden yonetiliyor, ic listeler kendi
    // icinde kaydirmaya calismiyor.
    <ScrollView testID="baglar-kaydirici" style={stiller.kaydirici} contentContainerStyle={stiller.icerik}>
      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Text style={stiller.bolumBaslik}>Gelen istekler</Text>
      <Text style={stiller.aciklama}>Kabul edersen check-in'lerini gorebilecek.</Text>
      <FlatList
        scrollEnabled={false}
        data={gelenTakip}
        keyExtractor={(k) => k.id}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <View style={stiller.kisiBilgisi}>
              <Text style={stiller.kullaniciAdi}>{item.kullaniciAdi}</Text>
              <Text style={stiller.ad}>{item.ad}</Text>
            </View>
            <View style={stiller.butonlar}>
              <Pressable style={stiller.kucukButon} onPress={() => takipIstegineYanitVer(item.id, true)}>
                <Text style={stiller.kucukButonYazi}>Kabul et</Text>
              </Pressable>
              <Pressable style={stiller.kucukButon} onPress={() => takipIstegineYanitVer(item.id, false)}>
                <Text style={stiller.kucukButonYazi}>Reddet</Text>
              </Pressable>
              <Pressable style={stiller.kucukTehlikeliButon} onPress={() => kullaniciyiEngelle(item.id)}>
                <Text style={stiller.kucukTehlikeliButonYazi}>Engelle</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.bosDurum}>Bekleyen takip istegi yok</Text>}
      />

      <Text style={stiller.altBaslik}>Sohbet istekleri</Text>
      <FlatList
        scrollEnabled={false}
        data={gelenSohbet}
        keyExtractor={(k) => k.id}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <View style={stiller.kisiBilgisi}>
              <Text style={stiller.kullaniciAdi}>{item.kullaniciAdi}</Text>
              <Text style={stiller.ad}>{item.ad}</Text>
            </View>
            <View style={stiller.butonlar}>
              <Pressable style={stiller.kucukButon} onPress={() => sohbetIstegineYanitVer(item.id, true)}>
                <Text style={stiller.kucukButonYazi}>Kabul et</Text>
              </Pressable>
              <Pressable style={stiller.kucukButon} onPress={() => sohbetIstegineYanitVer(item.id, false)}>
                <Text style={stiller.kucukButonYazi}>Reddet</Text>
              </Pressable>
              <Pressable style={stiller.kucukTehlikeliButon} onPress={() => kullaniciyiEngelle(item.id)}>
                <Text style={stiller.kucukTehlikeliButonYazi}>Engelle</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.bosDurum}>Bekleyen sohbet istegi yok</Text>}
      />

      <Text style={stiller.bolumBaslik}>Giden istekler</Text>
      <FlatList
        scrollEnabled={false}
        data={[...gidenTakip, ...gidenSohbet]}
        keyExtractor={(k) => k.id}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <View style={stiller.kisiBilgisi}>
              <Text style={stiller.kullaniciAdi}>{item.kullaniciAdi}</Text>
              <Text style={stiller.ad}>{item.ad}</Text>
            </View>
            <Text style={stiller.pasifDurum}>Istek gonderildi</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.bosDurum}>Bekleyen gonderilmis istek yok</Text>}
      />

      <Text style={stiller.bolumBaslik}>Takipcilerim</Text>
      <FlatList
        scrollEnabled={false}
        data={takipciler}
        keyExtractor={(k) => k.id}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <View style={stiller.kisiBilgisi}>
              <Text style={stiller.kullaniciAdi}>{item.kullaniciAdi}</Text>
              <Text style={stiller.ad}>{item.ad}</Text>
            </View>
            <View style={stiller.butonlar}>
              <Pressable style={stiller.kucukButon} onPress={() => takipciyiCikarEt(item.id)}>
                <Text style={stiller.kucukButonYazi}>Cikar</Text>
              </Pressable>
              <Pressable style={stiller.kucukTehlikeliButon} onPress={() => kullaniciyiEngelle(item.id)}>
                <Text style={stiller.kucukTehlikeliButonYazi}>Engelle</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.bosDurum}>Henuz takipcin yok</Text>}
      />

      <Text style={stiller.bolumBaslik}>Takip ettiklerim</Text>
      <FlatList
        scrollEnabled={false}
        data={takipEdilenler}
        keyExtractor={(k) => k.id}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <View style={stiller.kisiBilgisi}>
              <Text style={stiller.kullaniciAdi}>{item.kullaniciAdi}</Text>
              <Text style={stiller.ad}>{item.ad}</Text>
            </View>
            <Pressable style={stiller.kucukButon} onPress={() => takibiBirakEt(item.id)}>
              <Text style={stiller.kucukButonYazi}>Takibi birak</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.bosDurum}>Henuz kimseyi takip etmiyorsun</Text>}
      />
    </ScrollView>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  kaydirici: { flex: 1 },
  icerik: { padding: 16 },
  bolumBaslik: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 4 },
  altBaslik: { fontSize: 15, fontWeight: '600', marginTop: 12, marginBottom: 4, color: '#555' },
  aciklama: { color: '#555', marginBottom: 8 },
  satir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  kisiBilgisi: { flexShrink: 1 },
  kullaniciAdi: { fontSize: 16, fontWeight: '600' },
  ad: { color: '#555' },
  butonlar: { flexDirection: 'row', gap: 8 },
  kucukButon: { borderWidth: 1, borderColor: '#0645ad', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  kucukButonYazi: { color: '#0645ad', fontWeight: '600', fontSize: 13 },
  kucukTehlikeliButon: { borderWidth: 1, borderColor: '#c00', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  kucukTehlikeliButonYazi: { color: '#c00', fontWeight: '600', fontSize: 13 },
  pasifDurum: { color: '#666' },
  bosDurum: { color: '#666', paddingVertical: 8 },
  durum: { color: '#666', marginTop: 24, textAlign: 'center' },
  hata: { color: '#c00', marginBottom: 12 },
})
