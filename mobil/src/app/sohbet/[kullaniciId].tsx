import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import {
  konusmalarimiGetir,
  mesajlariGetir,
  mesajGonder,
  konusmayiOkunduIsaretle,
  mesajlaraAbonelOl,
  type Konusma,
  type Mesaj,
} from '../../../lib/sohbet'

const KAPALI_KAPI_NOTU = 'Bu kisiye su an mesaj gonderemezsin.'

function hataMesaji(e: unknown): string {
  if (e instanceof TypeError && e.message === 'Network request failed') {
    return 'Internet baglantisi yok, tekrar dene'
  }
  return e instanceof Error ? e.message : 'Bir sorun olustu'
}

export default function SohbetEkrani() {
  const router = useRouter()
  const { kullaniciId } = useLocalSearchParams<{ kullaniciId: string }>()
  // Konusma satiri bulunamayabilir: iki taraf hic mesajlasmamissa
  // konusmalarim listesinde bu kisiye ait satir hic olmaz. O durumda
  // yazma alani acik kalir; kapiyi ilk mesajGonder cagrisinin hatasi
  // bildirir. bagDurumunuGetir'e ikinci bir kaynak olarak bakmiyoruz -
  // sunucudaki mesaj_gonder zaten tek yetkili kapi.
  const [konusmaSatiri, setKonusmaSatiri] = useState<Konusma | null>(null)
  const [konusmaId, setKonusmaId] = useState<string | null>(null)
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([])
  const [metin, setMetin] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  useEffect(() => {
    let iptalEdildi = false

    async function yukle() {
      try {
        const liste = await konusmalarimiGetir()
        if (iptalEdildi) return
        const bulunan = liste.find((k) => k.kisiId === kullaniciId) ?? null
        setKonusmaSatiri(bulunan)

        if (bulunan) {
          setKonusmaId(bulunan.konusmaId)
          const gecmis = await mesajlariGetir(bulunan.konusmaId)
          if (iptalEdildi) return
          setMesajlar(gecmis)
          await konusmayiOkunduIsaretle(bulunan.konusmaId)
        }
      } catch (e) {
        if (!iptalEdildi) setHata(hataMesaji(e))
      }
    }

    yukle()
    return () => {
      iptalEdildi = true
    }
  }, [kullaniciId])

  // Realtime abonelik konusma id bilinmeden kurulamaz. Konusma henuz
  // yokken ilk mesaj gonderilince konusmaId asagida gonder() icinde
  // set ediliyor ve bu efekt yeniden calisip aboneligi kuruyor.
  // Donen fonksiyon temizleme (cleanup) olarak kullaniliyor, boylece
  // ekran kapaninca ya da konusmaId degisince kanal birikmiyor.
  useEffect(() => {
    if (!konusmaId) return
    return mesajlaraAbonelOl(konusmaId, (gelenMesaj) => {
      setMesajlar((mevcut) => [gelenMesaj, ...mevcut])
    })
  }, [konusmaId])

  const yazilabilirMi = konusmaSatiri ? konusmaSatiri.yazilabilirMi : true
  const gonderilecekMetin = metin.trim()
  const gonderMumkun = gonderilecekMetin.length > 0 && !gonderiliyor

  async function gonder() {
    // Buton zaten disabled={!gonderMumkun} ile korunuyor; bu ikinci
    // koruma disabled prop'a guvenmeden dogrudan tetiklemelere karsi
    // da ayni garantiyi veriyor.
    if (!gonderMumkun) return
    const oncekiKonusmaId = konusmaId
    setGonderiliyor(true)
    try {
      const yeniKonusmaId = await mesajGonder(kullaniciId, gonderilecekMetin)
      setMetin('')
      setHata(null)
      if (!oncekiKonusmaId) {
        // Konusma bu gonderimle ilk kez olustu: gonderilen mesaji gormek
        // icin gecmisi yeniden cekiyoruz, abonelik bu konusmaId'ye asagidaki
        // efektle sonradan baglanacak.
        const gecmis = await mesajlariGetir(yeniKonusmaId)
        setMesajlar(gecmis)
        setKonusmaId(yeniKonusmaId)
      }
    } catch (e) {
      setHata(hataMesaji(e))
    } finally {
      setGonderiliyor(false)
    }
  }

  const sikayetHedefId = konusmaId ?? kullaniciId

  return (
    <View style={stiller.kapsayici}>
      <View style={stiller.ustBar}>
        <Text style={stiller.baslik}>{konusmaSatiri?.ad ?? 'Sohbet'}</Text>
        <Pressable onPress={() => router.push(`/sikayet?hedefTur=mesaj&hedefId=${sikayetHedefId}`)}>
          <Text style={stiller.sikayetButonu}>Sikayet et</Text>
        </Pressable>
      </View>

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <FlatList
        style={stiller.liste}
        data={mesajlar}
        keyExtractor={(m) => m.id}
        inverted
        renderItem={({ item }) => (
          <View style={stiller.mesajBalonu}>
            <Text testID="mesaj-metni">{item.metin}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={stiller.durum}>Henuz mesaj yok</Text>}
      />

      {yazilabilirMi ? (
        <View style={stiller.girdiSatiri}>
          <TextInput
            style={stiller.girdi}
            placeholder="Bir mesaj yaz..."
            value={metin}
            onChangeText={setMetin}
            multiline
          />
          <Pressable
            style={[stiller.gonderButonu, !gonderMumkun && stiller.gonderButonuPasif]}
            onPress={gonder}
            disabled={!gonderMumkun}
          >
            <Text style={stiller.gonderButonuYazi}>{gonderiliyor ? 'Gonderiliyor...' : 'Gonder'}</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={stiller.kapaliNot}>{KAPALI_KAPI_NOTU}</Text>
      )}
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: { flex: 1, padding: 16 },
  ustBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  baslik: { fontSize: 20, fontWeight: '600' },
  sikayetButonu: { color: '#c00' },
  liste: { flex: 1 },
  mesajBalonu: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
  girdiSatiri: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
  girdi: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    minHeight: 40,
  },
  gonderButonu: { backgroundColor: '#111', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
  gonderButonuPasif: { backgroundColor: '#999' },
  gonderButonuYazi: { color: '#fff', fontWeight: '600' },
  kapaliNot: { color: '#666', textAlign: 'center', marginTop: 8, paddingVertical: 12 },
  hata: { color: '#c00', marginBottom: 12 },
  durum: { color: '#666', marginTop: 24, textAlign: 'center' },
})
