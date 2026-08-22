import { useEffect, useRef, useState } from 'react'
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
import { useOturum } from '../../../lib/oturum'

const KAPALI_KAPI_NOTU = 'Bu kişiye şu an mesaj gönderemezsin.'

// Iyimser eklenen (henuz sunucuda karsiligi olmayan) satirlar. Sunucu
// satirlarindan `yerelMi` ile ayirt ediliyorlar; Realtime yansimasi
// gelince yerini gercek satira birakiyorlar.
type ListeMesaji = Mesaj & { yerelMi?: boolean }

function hataMesaji(e: unknown): string {
  if (e instanceof TypeError && e.message === 'Network request failed') {
    return 'İnternet bağlantısı yok, tekrar dene'
  }
  return e instanceof Error ? e.message : 'Bir sorun oluştu'
}

export default function SohbetEkrani() {
  const router = useRouter()
  const { oturum } = useOturum()
  const benimKimligim = oturum?.user.id ?? null
  const { kullaniciId } = useLocalSearchParams<{ kullaniciId: string }>()
  // Konusma satiri bulunamayabilir: iki taraf hic mesajlasmamissa
  // konusmalarim listesinde bu kisiye ait satir hic olmaz. O durumda
  // yazma alani acik kalir; kapiyi ilk mesajGonder cagrisinin hatasi
  // bildirir. bagDurumunuGetir'e ikinci bir kaynak olarak bakmiyoruz -
  // sunucudaki mesaj_gonder zaten tek yetkili kapi.
  const [konusmaSatiri, setKonusmaSatiri] = useState<Konusma | null>(null)
  const [konusmaId, setKonusmaId] = useState<string | null>(null)
  const [mesajlar, setMesajlar] = useState<ListeMesaji[]>([])
  const [metin, setMetin] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const yerelSayac = useRef(0)

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
      // Birebir konusmada iki uye var, dolayisiyla gonderen karsi
      // tarafin id'siyse mesaj bize gelmis demektir; degilse kendi
      // mesajimizin yansimasidir.
      const karsiTaraftan = gelenMesaj.gonderenId === kullaniciId

      setMesajlar((mevcut) => {
        // Ayni satir iki kez yansirsa ikinci balonu uretme.
        if (mevcut.some((m) => m.id === gelenMesaj.id)) return mevcut

        if (!karsiTaraftan) {
          // Kendi mesajimiz zaten iyimser olarak eklendi. Yansima
          // gelince o yerel satiri sunucu satiriyla degistiriyoruz;
          // aksi halde ayni mesaj iki balon olarak gorunurdu. Eslesme
          // metin uzerinden yapiliyor cunku mesaj_gonder yalnizca
          // konusma id'sini donuyor, mesaj id'sini degil.
          const sira = mevcut.findIndex((m) => m.yerelMi && m.metin === gelenMesaj.metin)
          if (sira !== -1) {
            const kopya = mevcut.slice()
            kopya[sira] = gelenMesaj
            return kopya
          }
        }

        return [gelenMesaj, ...mevcut]
      })

      if (karsiTaraftan) {
        // Ekran acikken gelen mesaj kullanicinin gozunun onunde okundu;
        // son_okuma ilerlemezse ana ekrandaki rozet okunmus mesajlari
        // saymaya devam ederdi. Bu arka plan cagrisinin hatasi
        // kullanicinin yapabilecegi bir sey degil, ekrana tasinmiyor.
        konusmayiOkunduIsaretle(konusmaId).catch(() => {})
      }
    })
  }, [konusmaId, kullaniciId])

  const yazilabilirMi = konusmaSatiri ? konusmaSatiri.yazilabilirMi : true
  const gonderilecekMetin = metin.trim()
  const gonderMumkun = gonderilecekMetin.length > 0 && !gonderiliyor

  async function gonder() {
    // Buton zaten disabled={!gonderMumkun} ile korunuyor; bu ikinci
    // koruma disabled prop'a guvenmeden dogrudan tetiklemelere karsi
    // da ayni garantiyi veriyor.
    if (!gonderMumkun) return
    const oncekiKonusmaId = konusmaId
    const yerelId = `yerel:${yerelSayac.current++}`
    setGonderiliyor(true)
    // Iyimser ekleme: mesaj sunucu yanitini beklemeden listede belirsin.
    // Onceden yalnizca Realtime yansitinca goruluyordu ve davranis
    // tutarsizdi (konusmayi acan ilk gonderimde gecmis yeniden cekildigi
    // icin hemen, sonrakilerde gecikmeli). gonderenId yerel satirda
    // kullanilmiyor; ekranda yalnizca metin cizdiriliyor.
    setMesajlar((mevcut) => [
      {
        id: yerelId,
        gonderenId: '',
        metin: gonderilecekMetin,
        olusturuldu: new Date().toISOString(),
        yerelMi: true,
      },
      ...mevcut,
    ])
    try {
      const yeniKonusmaId = await mesajGonder(kullaniciId, gonderilecekMetin)
      setMetin('')
      setHata(null)
      if (!oncekiKonusmaId) {
        // Konusma listede yoktu: ya bu gonderimle ilk kez olustu ya da
        // gizlenmis bir konusma yeniden acildi. Ikinci durumda gecmis
        // var, o yuzden sunucudan cekiyoruz; donen liste iyimser satiri
        // da kapsadigi icin yerini tumden aliyor. Abonelik bu
        // konusmaId'ye yukaridaki efektle sonradan baglanacak.
        const gecmis = await mesajlariGetir(yeniKonusmaId)
        setMesajlar(gecmis)
        setKonusmaId(yeniKonusmaId)
      }
    } catch (e) {
      setHata(hataMesaji(e))
      // Gonderilemeyen mesaj listede kalmasin.
      setMesajlar((mevcut) => mevcut.filter((m) => m.id !== yerelId))
    } finally {
      setGonderiliyor(false)
    }
  }

  // Konusma henuz yokken elimizde bir konusma id'si yok; o durumda
  // sikayet KULLANICI hakkinda aciliyor. Boyle olmazsa 'mesaj' etiketli
  // bir sikayet satirinda konusma id'si yerine kullanici id'si dururdu
  // ve moderasyon paneli ikisini ayirt edemezdi.
  const sikayetHedefTur = konusmaId ? 'mesaj' : 'kullanici'
  const sikayetHedefId = konusmaId ?? kullaniciId

  return (
    <View style={stiller.kapsayici}>
      <View style={stiller.ustBar}>
        <Text style={stiller.baslik}>{konusmaSatiri?.ad ?? 'Sohbet'}</Text>
        <Pressable onPress={() => router.push(`/sikayet?hedefTur=${sikayetHedefTur}&hedefId=${sikayetHedefId}`)}>
          <Text style={stiller.sikayetButonu}>Şikayet et</Text>
        </Pressable>
      </View>

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <FlatList
        style={stiller.liste}
        data={mesajlar}
        keyExtractor={(m) => m.id}
        inverted
        renderItem={({ item }) => {
          // gonderen_id null = gonderen hesabini silmis. Kendi mesajim
          // olmadigi kesin, karsi balon olarak cizilir.
          const benimMi = item.gonderenId !== null && item.gonderenId === benimKimligim
          return (
            <View style={[stiller.mesajBalonu, benimMi ? stiller.kendiBalonu : stiller.karsiBalonu]}>
              <Text testID="mesaj-metni">{item.metin}</Text>
            </View>
          )
        }}
        ListEmptyComponent={<Text style={stiller.durum}>Henüz mesaj yok</Text>}
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
    maxWidth: '80%',
  },
  kendiBalonu: { alignSelf: 'flex-end', backgroundColor: '#f0f0f0' },
  karsiBalonu: { alignSelf: 'flex-start', backgroundColor: '#fff' },
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
