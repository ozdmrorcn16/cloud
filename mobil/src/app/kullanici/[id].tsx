import { useEffect, useState } from 'react'
import { View, Text, Image, FlatList, Pressable, Linking, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { baskasininProfiliniGetir, type BaskaProfil } from '../../../lib/profil'
import { engelle } from '../../../lib/engelleme'
import { kullanicininAnilariniGetir, type AniGorunumu } from '../../../lib/checkin'
import { profilFotograflariUrl } from '../../../lib/fotograf-url'
import {
  bagDurumunuGetir,
  takipIstegiGonder,
  takipIsteginiYanitla,
  takibiBirak,
  sohbetIstegiGonder,
  sohbetIsteginiYanitla,
  sohbetIsteginiGeriCek,
} from '../../../lib/bag'

export default function KullaniciProfiliEkrani() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [profil, setProfil] = useState<BaskaProfil | null>(null)
  const [fotografUrlleri, setFotografUrlleri] = useState<string[]>([])
  const [anilar, setAnilar] = useState<AniGorunumu[]>([])
  const [bagDurum, setBagDurum] = useState<Awaited<ReturnType<typeof bagDurumunuGetir>> | null>(
    null
  )
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  async function verileriYukle() {
    try {
      const [profilVerisi, anilarVerisi, bagVerisi] = await Promise.all([
        baskasininProfiliniGetir(id),
        kullanicininAnilariniGetir(id),
        bagDurumunuGetir(id),
      ])
      setProfil(profilVerisi)
      setFotografUrlleri(await profilFotograflariUrl(profilVerisi?.fotograflar ?? []))
      setAnilar(anilarVerisi)
      setBagDurum(bagVerisi)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    verileriYukle()
  }, [id])

  function haritadaAc(konum: { lat: number; lng: number }) {
    Linking.openURL(`https://maps.google.com/?q=${konum.lat},${konum.lng}`)
  }

  async function kullaniciyiEngelle() {
    try {
      await engelle(id)
      setHata(null)
      setProfil(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  function sikayetEt() {
    router.push(`/sikayet?hedefTur=kullanici&hedefId=${id}`)
  }

  async function takipEt() {
    try {
      await takipIstegiGonder(id)
      setBagDurum((onceki) => (onceki ? { ...onceki, takip: 'beklemede' } : onceki))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  async function takibiBirakEt() {
    try {
      await takibiBirak(id)
      setBagDurum((onceki) => (onceki ? { ...onceki, takip: 'yok' } : onceki))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  async function sohbetIste() {
    try {
      await sohbetIstegiGonder(id)
      setBagDurum((onceki) => (onceki ? { ...onceki, sohbet: 'beklemede' } : onceki))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  async function sohbetIsteginiGeriCekEt() {
    try {
      await sohbetIsteginiGeriCek(id)
      setBagDurum((onceki) => (onceki ? { ...onceki, sohbet: 'yok' } : onceki))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  async function takipIstegineYanitVer(kabul: boolean) {
    try {
      await takipIsteginiYanitla(id, kabul)
      setBagDurum((onceki) =>
        onceki ? { ...onceki, gelenTakip: kabul ? 'kabul' : 'yok' } : onceki
      )
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
    }
  }

  async function sohbetIstegineYanitVer(kabul: boolean) {
    try {
      await sohbetIsteginiYanitla(id, kabul)
      setBagDurum((onceki) =>
        onceki ? { ...onceki, gelenSohbet: kabul ? 'kabul' : 'yok' } : onceki
      )
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

  if (!profil) {
    return (
      <View style={stiller.kapsayici}>
        {hata && <Text style={stiller.hata}>{hata}</Text>}
        <Text style={stiller.durum}>Bu profil bulunamadı</Text>
      </View>
    )
  }

  return (
    <View style={stiller.kapsayici}>
      {fotografUrlleri.length > 0 && (
        <FlatList
          horizontal
          data={fotografUrlleri}
          keyExtractor={(url) => url}
          renderItem={({ item }) => (
            <Image testID="profil-fotografi" source={{ uri: item }} style={stiller.fotograf} />
          )}
          style={stiller.fotografListesi}
        />
      )}
      <Text style={stiller.ad}>{profil.ad}</Text>
      <Text style={stiller.kullaniciAdi}>@{profil.kullaniciAdi}</Text>
      {profil.biyografi && <Text style={stiller.biyografi}>{profil.biyografi}</Text>}
      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <View style={stiller.bagButonlari}>
        {bagDurum?.takip === 'yok' && (
          <Pressable style={stiller.birincilButon} onPress={takipEt}>
            <Text style={stiller.birincilButonYazi}>Takip et</Text>
          </Pressable>
        )}
        {bagDurum?.takip === 'beklemede' && (
          <Pressable style={stiller.pasifButon} onPress={takibiBirakEt}>
            <Text style={stiller.pasifButonYazi}>İsteği geri çek</Text>
          </Pressable>
        )}
        {bagDurum?.takip === 'kabul' && (
          <Pressable style={stiller.anahtarliButon} onPress={takibiBirakEt}>
            <Text style={stiller.anahtarliButonYazi}>Bağı kopar</Text>
          </Pressable>
        )}

        {bagDurum?.sohbet === 'yok' &&
          bagDurum?.gelenSohbet !== 'kabul' &&
          bagDurum?.gelenSohbet !== 'beklemede' && (
            <Pressable style={stiller.birincilButon} onPress={sohbetIste}>
              <Text style={stiller.birincilButonYazi}>Sohbet iste</Text>
            </Pressable>
          )}
        {bagDurum?.sohbet === 'beklemede' && bagDurum?.gelenSohbet !== 'kabul' && (
          <Pressable style={stiller.pasifButon} onPress={sohbetIsteginiGeriCekEt}>
            <Text style={stiller.pasifButonYazi}>İsteği geri çek</Text>
          </Pressable>
        )}
        {(bagDurum?.sohbet === 'kabul' || bagDurum?.gelenSohbet === 'kabul') && (
          <View style={stiller.pasifButon}>
            <Text style={stiller.pasifButonYazi}>Sohbet açık</Text>
          </View>
        )}
      </View>

      {(bagDurum?.takip === 'kabul' ||
        bagDurum?.sohbet === 'kabul' ||
        bagDurum?.gelenSohbet === 'kabul') && (
        <Pressable
          style={stiller.birincilButon}
          onPress={() => router.push(`/sohbet/${id}`)}
        >
          <Text style={stiller.birincilButonYazi}>Mesaj gönder</Text>
        </Pressable>
      )}

      {bagDurum?.gelenTakip === 'beklemede' && (
        <View style={stiller.gelenIstekBlok}>
          <Text style={stiller.aciklama}>Kabul edersen birbirinizin check-in'lerini görebilir ve mesajlaşabilirsiniz.</Text>
          <View style={stiller.bagButonlari}>
            <Pressable style={stiller.kucukButon} onPress={() => takipIstegineYanitVer(true)}>
              <Text style={stiller.kucukButonYazi}>Kabul et</Text>
            </Pressable>
            <Pressable style={stiller.kucukButon} onPress={() => takipIstegineYanitVer(false)}>
              <Text style={stiller.kucukButonYazi}>Reddet</Text>
            </Pressable>
          </View>
        </View>
      )}

      {bagDurum?.gelenSohbet === 'beklemede' && (
        <View style={stiller.gelenIstekBlok}>
          <View style={stiller.bagButonlari}>
            <Pressable style={stiller.kucukButon} onPress={() => sohbetIstegineYanitVer(true)}>
              <Text style={stiller.kucukButonYazi}>Kabul et</Text>
            </Pressable>
            <Pressable style={stiller.kucukButon} onPress={() => sohbetIstegineYanitVer(false)}>
              <Text style={stiller.kucukButonYazi}>Reddet</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={stiller.bolumBaslik}>Anılar</Text>
      <FlatList
        data={anilar}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <Pressable style={stiller.satir} onPress={() => haritadaAc(item.mekanKonumu)}>
            <Text style={stiller.mekanAdi}>{item.mekanAdi}</Text>
            {item.notMetni && <Text style={stiller.not}>{item.notMetni}</Text>}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Henüz bir anısı yok</Text>}
      />

      <Pressable style={stiller.tehlikeliButon} onPress={kullaniciyiEngelle}>
        <Text style={stiller.tehlikeliButonYazi}>Engelle</Text>
      </Pressable>
      <Pressable style={stiller.ikincilButon} onPress={sikayetEt}>
        <Text style={stiller.ikincilButonYazi}>Şikayet et</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  fotografListesi: { marginBottom: 12 },
  fotograf: { width: 96, height: 96, borderRadius: 8, marginRight: 8 },
  ad: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  kullaniciAdi: { color: '#555', marginBottom: 8 },
  biyografi: { color: '#555', marginBottom: 16 },
  bolumBaslik: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  satir: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  mekanAdi: { fontSize: 16, fontWeight: '600', color: '#0645ad' },
  not: { color: '#555', marginTop: 2 },
  durum: { color: '#666', marginTop: 24, textAlign: 'center' },
  hata: { color: '#c00', marginBottom: 12 },
  bagButonlari: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  gelenIstekBlok: { marginBottom: 16 },
  aciklama: { color: '#555', marginBottom: 8 },
  kucukButon: { borderWidth: 1, borderColor: '#0645ad', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  kucukButonYazi: { color: '#0645ad', fontWeight: '600', fontSize: 13 },
  birincilButon: { flex: 1, backgroundColor: '#0645ad', borderRadius: 8, padding: 12, alignItems: 'center' },
  birincilButonYazi: { color: '#fff', fontWeight: '600' },
  pasifButon: { flex: 1, backgroundColor: '#eee', borderRadius: 8, padding: 12, alignItems: 'center' },
  pasifButonYazi: { color: '#666', fontWeight: '600' },
  anahtarliButon: { flex: 1, borderWidth: 1, borderColor: '#0645ad', borderRadius: 8, padding: 12, alignItems: 'center' },
  anahtarliButonYazi: { color: '#0645ad', fontWeight: '600' },
  tehlikeliButon: { backgroundColor: '#c00', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24 },
  tehlikeliButonYazi: { color: '#fff', fontWeight: '600' },
  ikincilButon: { borderWidth: 1, borderColor: '#c00', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  ikincilButonYazi: { color: '#c00', fontWeight: '600' },
})
