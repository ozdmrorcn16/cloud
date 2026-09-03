import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import {
  mesajIsteklerimiGetir,
  mesajIsteginiKabulEt,
  mesajIsteginiReddet,
  konusmalarimiGetir,
  mesajlariGetir,
  mesajGonder,
  konusmayiOkunduIsaretle,
  mesajlaraAbonelOl,
  type Konusma,
  type Mesaj,
} from '../../../lib/sohbet'
import { useOturum } from '../../../lib/oturum'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'

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
  const stiller = useStiller(stilleriYap)
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
  /**
   * Bu kisi bana BEKLEYEN bir mesaj istegi gonderdiyse true. O zaman
   * konusma `konusmalarim` listesinde YOKTUR (sunucu ayiriyor) ve
   * mesajlar istekler listesindeki konusma id'sinden yukleniyor.
   */
  const [istekMi, setIstekMi] = useState(false)
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
          return
        }

        // Konusma listede yoksa BEKLEYEN BIR ISTEK olabilir: sunucu
        // onlari `konusmalarim`dan ayiriyor. Kullanici mesaji okumali -
        // okumak kabul etmiyor, kabul ayri bir eylem.
        const istekler = await mesajIsteklerimiGetir()
        if (iptalEdildi) return
        const istek = istekler.find((i) => i.gonderenId === kullaniciId) ?? null
        if (istek) {
          setIstekMi(true)
          if (istek.konusmaId) {
            setKonusmaId(istek.konusmaId)
            const gecmis = await mesajlariGetir(istek.konusmaId)
            if (iptalEdildi) return
            setMesajlar(gecmis)
          }
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

  // Istek ekraninda da yazilabilir: CEVAP YAZMAK kabul anlamina geliyor
  // (kullanicinin karari) ve sunucudaki mesaj_gonder bunu kendisi
  // isliyor - istegi 'kabul'e cekip mesaji yaziyor.
  const yazilabilirMi = istekMi ? true : konusmaSatiri ? konusmaSatiri.yazilabilirMi : true

  async function istegiKabulEt() {
    try {
      await mesajIsteginiKabulEt(kullaniciId as string)
      setIstekMi(false)
      setHata(null)
    } catch (e) {
      setHata(hataMesaji(e))
    }
  }

  async function istegiReddet() {
    try {
      await mesajIsteginiReddet(kullaniciId as string)
      router.push('/mesajlar')
    } catch (e) {
      setHata(hataMesaji(e))
    }
  }
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

  // Ust bardaki dugme KISIYI sikayet eder. Tek tek mesajlar icin ayri
  // bir yol var (asagida, uzun basis): sikayetin hedefi gercek mesaj
  // id'si olmali, yoksa moderator "hangi mesaj" sorusunu cevaplayamaz.
  // Eskiden bu dugme 'mesaj' turuyle KONUSMA id'si gonderiyordu.
  return (
    <View style={stiller.kapsayici}>
      <View style={stiller.ustBar}>
        <Text style={stiller.baslik}>{konusmaSatiri?.ad ?? 'Sohbet'}</Text>
        <Pressable onPress={() => router.push(`/sikayet?hedefTur=kullanici&hedefId=${kullaniciId}`)}>
          <Text style={stiller.sikayetButonu}>Şikayet et</Text>
        </Pressable>
      </View>

      {/* MESAJ ISTEGI SERIDI: onaylanmadikca istek listesinde kaliyor.
          Cevap yazmak da kabul sayiliyor, o yuzden yazma alani acik. */}
      {istekMi && (
        <View style={stiller.istekSeridi}>
          <Text style={stiller.istekSeridiYazi}>
            Bu bir mesaj isteği. Cevap yazarsan sohbet Mesajlar'a taşınır.
          </Text>
          <View style={stiller.istekButonlari}>
            <Pressable onPress={istegiKabulEt} accessibilityRole="button">
              <Text style={stiller.kabulButonu}>Kabul et</Text>
            </Pressable>
            <Pressable onPress={istegiReddet} accessibilityRole="button">
              <Text style={stiller.reddetButonu}>Reddet</Text>
            </Pressable>
          </View>
        </View>
      )}

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
          // Kendi mesajini sikayet etmek sunucuda zaten reddediliyor
          // (Kendi mesajini sikayet edemezsin); arayuz de o yola hic
          // sokmuyor.
          return (
            <Pressable
              onLongPress={
                benimMi
                  ? undefined
                  : () => router.push(`/sikayet?hedefTur=mesaj&hedefId=${item.id}`)
              }
              style={[stiller.mesajBalonu, benimMi ? stiller.kendiBalonu : stiller.karsiBalonu]}
            >
              <Text testID="mesaj-metni">{item.metin}</Text>
            </Pressable>
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
            <Text style={stiller.gonderButonuYazi}>{gonderiliyor ? 'Gönderiliyor...' : 'Gönder'}</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={stiller.kapaliNot}>{KAPALI_KAPI_NOTU}</Text>
      )}
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  istekSeridi: {
    backgroundColor: renk.turuncuZemin,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.m,
    gap: bosluk.s,
  },
  istekSeridiYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },
  istekButonlari: { flexDirection: 'row', gap: bosluk.xl },
  kabulButonu: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.turuncu,
  },
  reddetButonu: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
  // Alt gezinme cubugu artik her ekranda: yazma alani onun altinda
  // kalmasin.
  kapsayici: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.l,
    paddingTop: bosluk.xxl + bosluk.m,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  ustBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: bosluk.m,
    marginBottom: bosluk.m,
  },
  baslik: {
    flexShrink: 1,
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  sikayetButonu: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  liste: { flex: 1 },

  mesajBalonu: {
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.m,
    paddingVertical: bosluk.s + 2,
    marginVertical: bosluk.xs,
    maxWidth: '80%',
  },
  // Kendi mesajin turuncu: konusmada kimin konustugu tek bakista
  // okunmali. Turuncunun burada "eylem" degil "sen" demesi kimligin
  // izin verdigi tek istisna degil - mesaj da bir eylemdir.
  kendiBalonu: { alignSelf: 'flex-end', backgroundColor: renk.turuncu },
  karsiBalonu: {
    alignSelf: 'flex-start',
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
  },

  girdiSatiri: { flexDirection: 'row', alignItems: 'flex-end', gap: bosluk.s, marginTop: bosluk.s },
  girdi: {
    flex: 1,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 12,
    minHeight: 44,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  gonderButonu: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingHorizontal: bosluk.l,
    paddingVertical: 12,
  },
  gonderButonuPasif: { backgroundColor: renk.metinSoluk },
  gonderButonuYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: '#FFFFFF',
  },

  kapaliNot: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    textAlign: 'center',
    marginTop: bosluk.s,
    paddingVertical: bosluk.m,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
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
