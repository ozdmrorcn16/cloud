import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, Image, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { SecimPenceresi } from '../../tasarim/SecimPenceresi'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../../../lib/supabase'
import { cihazKonumunuAl } from '../../../lib/konum'
import { checkInYap, type Bulunurluk, NOT_EN_FAZLA } from '../../../lib/checkin'
import { etiketleriKaydet } from '../../../lib/etiket'
import { ArkadasSecici } from '../../tasarim/ArkadasSecici'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import type { BagKisi } from '../../../lib/bag'
import { checkinFotografYukle } from '../../../lib/checkin-fotograf-yukle'
import { varsayilanBulunurluguGetir } from '../../../lib/ayarlar'
import { kendiKullaniciIdim } from '../../../lib/profil'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { UstCubuk } from '../../tasarim/UstCubuk'

/*
 * HESABA BAGLI (2026-09-13): tek anahtar ayni telefondaki ikinci
 * hesabin "bu check-in ne paylasiyor?" uyarisini HIC gormemesine yol
 * aciyordu (tur suzgecinde yasanan devretme kusurunun kardesi). Uyari
 * bir aydinlatma; her yeni hesap kendi uyarisini gormeli.
 */
const ILK_UYARI_ANAHTARI = 'ilk-checkin-uyarisi-gosterildi'
const ilkUyariAnahtari = (kimlik: string | null) =>
  kimlik ? `${ILK_UYARI_ANAHTARI}.${kimlik}` : ILK_UYARI_ANAHTARI

export default function CheckInEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { mekanId } = useLocalSearchParams<{ mekanId: string }>()
  const [notMetni, setNotMetni] = useState('')
  const [yerelFotoUri, setYerelFotoUri] = useState<string | null>(null)
  // Fotograf KAYNAGI penceresi: kamera mi galeri mi.
  const [kaynakSecimi, setKaynakSecimi] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [uyari, setUyari] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  // null = varsayilan henuz cozulmedi. Bu sure boyunca gonder butonu
  // devre disi: cozulmeden basilirsa ya da profil okumasi (agdaki bir
  // sorun yuzunden) basarisiz olursa, kullanicinin secmedigi 'herkese_acik'
  // yayinlanmamali - o kademe artik yalnizca "bu mekandakiler" degil,
  // mekan ARTI HER YERDEKI butun takipciler demek.
  const [bulunurluk, setBulunurluk] = useState<Bulunurluk | null>(null)
  const [ilkKullanimUyarisi, setIlkKullanimUyarisi] = useState(false)
  // Etiketlenebilecek kisiler: YALNIZCA karsilikli bagli oldugun
  // arkadaslar. Ayni kisit veritabani politikasinda da var; buradaki
  // liste kullaniciya secenek gostermek icin.
  const [arkadaslar, setArkadaslar] = useState<BagKisi[]>([])
  const [etiketlenenler, setEtiketlenenler] = useState<string[]>([])
  const [arkadasSecimi, setArkadasSecimi] = useState(false)
  // Kullanici bulunurluk tercihini elle degistirdiyse (secenek satiri veya ilk
  // kullanim uyarisindaki "Gizli yap"), gec gelen varsayilanBulunurluguGetir()
  // yaniti bu secimin uzerine yazmasin.
  const bulunurlukManuelDegisti = useRef(false)
  const uyariAnahtari = useRef(ILK_UYARI_ANAHTARI)

  useEffect(() => {
    varsayilanBulunurluguGetir()
      .then((deger) => {
        if (!bulunurlukManuelDegisti.current) setBulunurluk(deger)
      })
      .catch(() => {
        // Profil okumasi basarisiz oldu: sessizce en genis degerde
        // birakmak yerine en dar degere (gizli) dusuyoruz. Kullanici
        // isterse elle genisletebilir, ama varsayilan asla onun
        // secmedigi bir yayin genisligine kaymamali.
        if (!bulunurlukManuelDegisti.current) setBulunurluk('gizli')
      })
    kendiKullaniciIdim()
      .then((kimlik) => {
        uyariAnahtari.current = ilkUyariAnahtari(kimlik)
        return AsyncStorage.getItem(uyariAnahtari.current)
      })
      .then((deger) => {
        if (!deger) setIlkKullanimUyarisi(true)
      })
      .catch(() => {})
  }, [])

  function bulunurlukDegistir(deger: Bulunurluk) {
    bulunurlukManuelDegisti.current = true
    setBulunurluk(deger)
  }

  async function ilkUyariKapat(gizliSecildi: boolean) {
    if (gizliSecildi) bulunurlukDegistir('gizli')
    setIlkKullanimUyarisi(false)
    await AsyncStorage.setItem(uyariAnahtari.current, 'true')
  }

  /**
   * FOTOGRAF: once KAYNAK sorulur (kullanicinin istegi 2026-09-08:
   * "fotograf eklemeye basilinca canli fotograf cekmede olsun kamera
   * acilsin"). Onceden dogrudan galeri aciliyordu; check-in "su an
   * buradayim" demek oldugu icin asil beklenen kaynak KAMERA.
   *
   * Kamera SIRADA ONCE: listede ilk siradaki secim en cok beklenen
   * olmali.
   */
  async function kameradanCek() {
    setKaynakSecimi(false)
    // Izin REDDEDILIRSE sessizce gecmiyoruz: kullanici dugmeye basip
    // hicbir sey olmamasini "uygulama bozuk" diye okur.
    const izin = await ImagePicker.requestCameraPermissionsAsync()
    if (!izin.granted) {
      setHata('Fotoğraf çekmek için kamera izni gerekiyor.')
      return
    }
    const sonuc = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!sonuc.canceled) setYerelFotoUri(sonuc.assets[0].uri)
  }

  async function galeridenSec() {
    setKaynakSecimi(false)
    const sonuc = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 })
    if (!sonuc.canceled) {
      setYerelFotoUri(sonuc.assets[0].uri)
    }
  }

  useEffect(() => {
    let gecerli = true
    // Bag listesi okunamazsa etiketleme bolumu hic cizilmiyor;
    // check-in'in kendisi bundan etkilenmiyor.
    takipcilerimiGetir()
      .then((liste) => {
        if (gecerli) setArkadaslar(liste)
      })
      .catch(() => {
        if (gecerli) setArkadaslar([])
      })
    return () => {
      gecerli = false
    }
  }, [])

  function etiketiDegistir(kullaniciId: string) {
    setEtiketlenenler((mevcut) =>
      mevcut.includes(kullaniciId)
        ? mevcut.filter((k) => k !== kullaniciId)
        : [...mevcut, kullaniciId]
    )
  }

  async function checkInYapButonu() {
    // Buton zaten disabled={bulunurluk === null} ile korunuyor; bu ikinci
    // koruma, disabled prop'a guvenmeden fireEvent.press gibi dogrudan
    // tetiklemelere karsi da ayni garantiyi veriyor.
    if (bulunurluk === null) return
    setHata(null)
    setGonderiliyor(true)
    try {
      const konum = await cihazKonumunuAl()

      let yuklenenFotoYolu: string | undefined
      if (yerelFotoUri) {
        try {
          const { data: kullaniciVerisi } = await supabase.auth.getUser()
          const kullaniciId = kullaniciVerisi.user?.id
          if (kullaniciId) {
            yuklenenFotoYolu = await checkinFotografYukle(kullaniciId, yerelFotoUri)
          }
        } catch {
          // Fotograf yuklenemezse check-in'i engelleme — notsuz/fotografsiz devam eder.
          setUyari('Fotoğraf yüklenemedi, notunla check-in yapıldı')
        }
      }

      const olusan = await checkInYap(
        mekanId,
        konum.lat,
        konum.lng,
        notMetni.trim() || undefined,
        yuklenenFotoYolu,
        bulunurluk
      )

      // Etiketler check-in OLUSTUKTAN SONRA yaziliyor: etiket satiri
      // check-in'e bagli, once o var olmali. Etiketleme basarisiz
      // olursa check-in yine duruyor - kullaniciyi bastan baslatmak
      // yerine uyari gosteriliyor.
      if (etiketlenenler.length > 0) {
        try {
          await etiketleriKaydet(olusan.id, etiketlenenler)
        } catch {
          setUyari('Check-in yapıldı ama arkadaşların etiketlenemedi.')
        }
      }

      // Check-in sonrasi MEKAN DETAYINA gidilmiyor (kullanicinin
      // karari 2026-08-29): kullanici check-in sekmesinde kaliyor,
      // kart zaten "Şu an buradasın" haline geciyor.
      router.replace('/mekanlar')
    } catch (e) {
      if (e instanceof TypeError && e.message === 'Network request failed') {
        setHata('İnternet bağlantısı yok, tekrar dene')
      } else {
        setHata(e instanceof Error ? e.message : 'Bir sorun oluştu')
      }
    } finally {
      setGonderiliyor(false)
    }
  }

  if (ilkKullanimUyarisi) {
    return (
      <View style={stiller.kapsayici}>
        <Text style={stiller.baslik}>Bu check-in ne paylaşıyor?</Text>
        <Text style={stiller.uyariMetni}>
          Check-in yaptığında bulunduğun mekan ve varsa yazdığın not
          arkadaşlarına görünür olur. Check-in süresi dolunca ya da
          "ayrıldım" dediğin anda kendiliğinden kapanır. İstersen bu
          check-in’i gizli yaparak sadece kendi profilinde tutabilirsin.
        </Text>
        <Pressable style={stiller.buton} onPress={() => ilkUyariKapat(false)}>
          <Text style={stiller.butonYazi}>Anladım</Text>
        </Pressable>
        <Pressable style={stiller.ikincilButon} onPress={() => ilkUyariKapat(true)}>
          <Text style={stiller.ikincilButonYazi}>Gizli yap</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={stiller.kapsayici}>
      <UstCubuk baslik="Yeni check-in" geriEtiketi="Geri" />
      <TextInput
        style={[stiller.girdi, stiller.cokSatirli]}
        placeholder="Bir not ekle (opsiyonel)"
        value={notMetni}
        // Sinir sunucuda da var; burada kirpmak kullaniciyi sinira
        // carptirmadan durduruyor (yorum kutusundaki desenin aynisi).
        onChangeText={(d) => setNotMetni(d.slice(0, NOT_EN_FAZLA))}
        maxLength={NOT_EN_FAZLA}
        multiline
      />
      {/* ARKADAS EKLE (kullanicinin istegi 2026-09-12: "Arkadas ekle koy
          buraya"). Onceden etiketleme satir ici ciplerdi ve arkadas
          listesi bosken HIC cizilmiyordu - hesabinda arkadas olmayan
          biri ozelligin varligini gormuyordu. Buton artik her zaman
          gorunuyor, fotograf butonuyla ayni dilde; secim alttan acilan
          `ArkadasSecici` penceresinde, secilenler butonun altinda cip
          olarak duruyor ve tek dokunusla kaldiriliyor. */}
      <Pressable
        style={stiller.fotoButonu}
        onPress={() => setArkadasSecimi(true)}
        accessibilityRole="button"
        testID="arkadas-ekle"
      >
        <Text style={stiller.fotoButonuYazi}>
          {etiketlenenler.length > 0
            ? `Arkadaş ekle (${etiketlenenler.length} seçili)`
            : 'Arkadaş ekle (opsiyonel)'}
        </Text>
      </Pressable>
      {etiketlenenler.length > 0 && (
        <View style={stiller.etiketCipleri}>
          {etiketlenenler.map((id) => {
            const kisi = arkadaslar.find((k) => k.id === id)
            if (!kisi) return null
            return (
              <Pressable
                key={id}
                style={[stiller.etiketCipi, stiller.etiketCipiSecili]}
                onPress={() => etiketiDegistir(id)}
                accessibilityRole="button"
                accessibilityLabel={`${kisi.ad} etiketini kaldır`}
              >
                <Text style={[stiller.etiketYazi, stiller.etiketYaziSecili]}>{kisi.ad} ✕</Text>
              </Pressable>
            )
          })}
        </View>
      )}

      <Pressable style={stiller.fotoButonu} onPress={() => setKaynakSecimi(true)}>
        <Text style={stiller.fotoButonuYazi}>
          {yerelFotoUri ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle (opsiyonel)'}
        </Text>
      </Pressable>
      {yerelFotoUri && <Image source={{ uri: yerelFotoUri }} style={stiller.onizleme} />}

      {/* "SENI KIM GORSUN" SECIMI BU EKRANDAN KALDIRILDI (kullanicinin
          karari 2026-08-30). Gorunurluk artik her check-in'de
          sorulmuyor; Ayarlar > "Yeni check-in'lerim" altindaki
          VARSAYILAN tercih kullaniliyor.

          Tercih yine de degistirilebiliyor: bu ekran acilirken
          `varsayilanBulunurluguGetir` okunuyor ve ilk kullanim
          uyarisindaki "Gizli yap" hala calisiyor. Yani secim kayboldu
          degil, her seferinde sorulmaktan cikip ayarlara tasindi. */}

      {uyari && <Text style={stiller.uyari}>{uyari}</Text>}
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Pressable
        style={stiller.buton}
        onPress={checkInYapButonu}
        disabled={gonderiliyor || bulunurluk === null}
      >
        <Text style={stiller.butonYazi}>{gonderiliyor ? 'Check-in yapılıyor...' : 'Check-in yap'}</Text>
      </Pressable>
      <SecimPenceresi
        acikMi={kaynakSecimi}
        secimler={[
          // NOT: bu ekranin metinleri (bastan beri) sozlukte degil koda
          // gomulu; yenileri de ayni yerde tutuluyor ki ekranin yarisi
          // sozlukten yarisi gomuluden gelmesin. Ekranin tamaminin
          // i18n'e tasinmasi ayri bir is.
          { etiket: 'Fotoğraf çek', testID: 'foto-kamera', onSec: kameradanCek },
          { etiket: 'Galeriden seç', testID: 'foto-galeri', onSec: galeridenSec },
        ]}
        onKapat={() => setKaynakSecimi(false)}
      />
      <ArkadasSecici
        acikMi={arkadasSecimi}
        arkadaslar={arkadaslar}
        secili={etiketlenenler}
        onDegistir={etiketiDegistir}
        onKapat={() => setArkadasSecimi(false)}
      />

    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  etiketCipleri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: bosluk.m },
  etiketCipi: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: yuvarlak.hap,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
  },
  etiketCipiSecili: { borderColor: renk.turuncu, backgroundColor: renk.turuncuZemin },
  etiketYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },
  etiketYaziSecili: { fontFamily: yazi.govdeKalin, color: renk.turuncuYazi },

  kapsayici: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.sayfa,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginBottom: bosluk.l,
  },
  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 14,
    marginBottom: bosluk.m,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  buton: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
  },
  butonYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    marginBottom: bosluk.m,
  },
  cokSatirli: { minHeight: 90, textAlignVertical: 'top' },
  fotoButonu: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: bosluk.m,
  },
  fotoButonuYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },
  uyariMetni: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 23,
    color: renk.metinIkincil,
    marginBottom: bosluk.xxl,
  },
  ikincilButon: { paddingVertical: 14, alignItems: 'center', marginTop: bosluk.m },
  ikincilButonYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },
  onizleme: {
    width: '100%',
    height: 200,
    borderRadius: yuvarlak.kart,
    marginBottom: bosluk.m,
    backgroundColor: renk.cizgi,
  },
  uyari: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.turuncuYazi,
    marginBottom: bosluk.m,
  },
})
