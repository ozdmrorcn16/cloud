import { useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, ScrollView, StyleSheet } from 'react-native'
import {
  gelenIstekleriGetir,
  gidenIstekleriGetir,
  takipcilerimiGetir,
} from '../../lib/bag-listeleri'
import {
  takipIsteginiYanitla,
  sohbetIsteginiYanitla,
  takibiBirak,
  sohbetIsteginiGeriCek,
} from '../../lib/bag'
import { engelle } from '../../lib/engelleme'
import type { BagKisi } from '../../lib/bag'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../tasarim/tema'
import { UstCubuk } from '../tasarim/UstCubuk'

export default function BaglarEkrani() {
  const [gelenTakip, setGelenTakip] = useState<BagKisi[]>([])
  const [gelenSohbet, setGelenSohbet] = useState<BagKisi[]>([])
  const [gidenTakip, setGidenTakip] = useState<BagKisi[]>([])
  const [gidenSohbet, setGidenSohbet] = useState<BagKisi[]>([])
  const [takipciler, setTakipciler] = useState<BagKisi[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  async function verileriYukle() {
    try {
      const [gelen, giden, takipcilerVerisi] = await Promise.all([
        gelenIstekleriGetir(),
        gidenIstekleriGetir(),
        takipcilerimiGetir(),
      ])
      setGelenTakip(gelen.takip)
      setGelenSohbet(gelen.sohbet)
      setGidenTakip(giden.takip)
      setGidenSohbet(giden.sohbet)
      setTakipciler(takipcilerVerisi)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
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
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  async function sohbetIstegineYanitVer(kullaniciId: string, kabul: boolean) {
    try {
      await sohbetIsteginiYanitla(kullaniciId, kabul)
      setGelenSohbet((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  // Takip artik karsilikli yazildigi icin bagi koparmanin tek yolu bu:
  // takibiBirak sunucu tarafinda iki yonu birden siliyor.
  async function bagiKoparEt(kullaniciId: string) {
    try {
      await takibiBirak(kullaniciId)
      setTakipciler((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  async function gidenTakipIsteginiGeriCekEt(kullaniciId: string) {
    try {
      await takibiBirak(kullaniciId)
      setGidenTakip((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  async function gidenSohbetIsteginiGeriCekEt(kullaniciId: string) {
    try {
      await sohbetIsteginiGeriCek(kullaniciId)
      setGidenSohbet((onceki) => onceki.filter((k) => k.id !== kullaniciId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
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
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  if (yukleniyor) {
    return (
      <View style={stiller.kapsayici}>
        <Text style={stiller.durum}>Yükleniyor...</Text>
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
    // icinde kaydirmaya calismiyor. (Takip karsilikli olunca "Takip
    // ettiklerim" listesi kaldirildi, simdi dort FlatList var.)
    <View style={stiller.kok}>
      <UstCubuk baslik="Arkadaşlar" geriEtiketi="Geri" />
      <ScrollView testID="baglar-kaydirici" style={stiller.kaydirici} contentContainerStyle={stiller.icerik}>
      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Text style={stiller.bolumBaslik}>Gelen istekler</Text>
      <Text style={stiller.aciklama}>Kabul edersen birbirinizin check-in'lerini görebilir ve mesajlaşabilirsiniz.</Text>
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
        ListEmptyComponent={<Text style={stiller.bosDurum}>Bekleyen takip isteği yok</Text>}
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
        ListEmptyComponent={<Text style={stiller.bosDurum}>Bekleyen sohbet isteği yok</Text>}
      />

      <Text style={stiller.bolumBaslik}>Giden istekler</Text>
      <FlatList
        scrollEnabled={false}
        data={[
          ...gidenTakip.map((k) => ({ ...k, tur: 'takip' as const })),
          ...gidenSohbet.map((k) => ({ ...k, tur: 'sohbet' as const })),
        ]}
        keyExtractor={(item) => `${item.id}-${item.tur}`}
        renderItem={({ item }) => (
          <View style={stiller.satir}>
            <View style={stiller.kisiBilgisi}>
              <Text style={stiller.kullaniciAdi}>{item.kullaniciAdi}</Text>
              <Text style={stiller.ad}>{item.ad}</Text>
            </View>
            <Pressable
              style={stiller.kucukButon}
              onPress={() =>
                item.tur === 'takip'
                  ? gidenTakipIsteginiGeriCekEt(item.id)
                  : gidenSohbetIsteginiGeriCekEt(item.id)
              }
            >
              <Text style={stiller.kucukButonYazi}>Geri çek</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.bosDurum}>Bekleyen gönderilmiş istek yok</Text>}
      />

      <Text style={stiller.bolumBaslik}>Takipçilerim</Text>
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
              <Pressable style={stiller.kucukButon} onPress={() => bagiKoparEt(item.id)}>
                <Text style={stiller.kucukButonYazi}>Arkadaşlıktan çıkar</Text>
              </Pressable>
              <Pressable style={stiller.kucukTehlikeliButon} onPress={() => kullaniciyiEngelle(item.id)}>
                <Text style={stiller.kucukTehlikeliButonYazi}>Engelle</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.bosDurum}>Henüz takipçin yok</Text>}
      />
      </ScrollView>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: bosluk.xl, paddingBottom: ALT_GEZINME_PAYI },
  kok: { flex: 1, backgroundColor: renk.zemin },
  kaydirici: { flex: 1 },
  icerik: {
    paddingHorizontal: bosluk.xl,
    paddingBottom: ALT_GEZINME_PAYI,
  },

  bolumBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
    marginTop: bosluk.xl,
    marginBottom: bosluk.xs,
  },
  altBaslik: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.l,
    marginBottom: bosluk.xs,
  },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginBottom: bosluk.s,
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
  kisiBilgisi: { flexShrink: 1 },
  kullaniciAdi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  ad: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 1,
  },

  butonlar: { flexDirection: 'row', gap: bosluk.s },
  kucukButon: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.hap,
    paddingVertical: 7,
    paddingHorizontal: bosluk.m,
  },
  kucukButonYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.metin,
  },
  kucukTehlikeliButon: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.hap,
    paddingVertical: 7,
    paddingHorizontal: bosluk.m,
  },
  kucukTehlikeliButonYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: '#C0392B',
  },

  bosDurum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    paddingVertical: bosluk.s,
  },
  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.xl,
    textAlign: 'center',
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginBottom: bosluk.m,
  },
})
