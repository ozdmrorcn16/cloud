import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, Image, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../../../lib/supabase'
import { cihazKonumunuAl } from '../../../lib/konum'
import { checkInYap, type Bulunurluk } from '../../../lib/checkin'
import { etiketleriKaydet } from '../../../lib/etiket'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import type { BagKisi } from '../../../lib/bag'
import { checkinFotografYukle } from '../../../lib/checkin-fotograf-yukle'
import { varsayilanBulunurluguGetir } from '../../../lib/ayarlar'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../../tasarim/tema'
import { UstCubuk } from '../../tasarim/UstCubuk'

const ILK_UYARI_ANAHTARI = 'ilk-checkin-uyarisi-gosterildi'

const SECENEKLER: { deger: Bulunurluk; etiket: string; aciklama: string }[] = [
  { deger: 'herkese_acik', etiket: 'Herkese açık', aciklama: 'Buradakiler ve takipçilerin görür' },
  { deger: 'takipcilerim', etiket: 'Sadece takipçilerim', aciklama: 'Buradaki yabancılar görmez' },
  { deger: 'gizli', etiket: 'Gizli', aciklama: 'Kimse görmez' },
]

export default function CheckInEkrani() {
  const router = useRouter()
  const { mekanId } = useLocalSearchParams<{ mekanId: string }>()
  const [notMetni, setNotMetni] = useState('')
  const [yerelFotoUri, setYerelFotoUri] = useState<string | null>(null)
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
  // Kullanici bulunurluk tercihini elle degistirdiyse (secenek satiri veya ilk
  // kullanim uyarisindaki "Gizli yap"), gec gelen varsayilanBulunurluguGetir()
  // yaniti bu secimin uzerine yazmasin.
  const bulunurlukManuelDegisti = useRef(false)

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
    AsyncStorage.getItem(ILK_UYARI_ANAHTARI).then((deger) => {
      if (!deger) setIlkKullanimUyarisi(true)
    })
  }, [])

  function bulunurlukDegistir(deger: Bulunurluk) {
    bulunurlukManuelDegisti.current = true
    setBulunurluk(deger)
  }

  async function ilkUyariKapat(gizliSecildi: boolean) {
    if (gizliSecildi) bulunurlukDegistir('gizli')
    setIlkKullanimUyarisi(false)
    await AsyncStorage.setItem(ILK_UYARI_ANAHTARI, 'true')
  }

  async function fotografSec() {
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
          Check-in yaptiginda bulundugun mekan ve varsa yazdigin not, seni
          takip eden arkadaslarina gorunur olur. Check-in 30 dakika sonra ya da
          "ayrildim" dedigin anda kendiliginden kapanir. Istersen bu
          check-in'i gizli yaparak sadece kendi profilinde tutabilirsin.
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
        onChangeText={setNotMetni}
        multiline
      />
      {/* ARKADAS ETIKETLEME. Liste bosken bolum hic cizilmiyor:
          hicbir bagi olmayan birine bos bir baslik gostermek yon
          vermiyor. */}
      {arkadaslar.length > 0 && (
        <View style={stiller.etiketAlani}>
          <Text style={stiller.etiketBaslik}>Arkadaşlarını etiketle</Text>
          <View style={stiller.etiketCipleri}>
            {arkadaslar.map((kisi) => {
              const secili = etiketlenenler.includes(kisi.id)
              return (
                <Pressable
                  key={kisi.id}
                  style={[stiller.etiketCipi, secili && stiller.etiketCipiSecili]}
                  onPress={() => etiketiDegistir(kisi.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: secili }}
                  accessibilityLabel={kisi.ad ?? ''}
                >
                  <Text style={[stiller.etiketYazi, secili && stiller.etiketYaziSecili]}>
                    {kisi.ad ?? ''}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      )}

      <Pressable style={stiller.fotoButonu} onPress={fotografSec}>
        <Text style={stiller.fotoButonuYazi}>
          {yerelFotoUri ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle (opsiyonel)'}
        </Text>
      </Pressable>
      {yerelFotoUri && <Image source={{ uri: yerelFotoUri }} style={stiller.onizleme} />}

      <Text style={stiller.altBaslik}>Seni kim görsün</Text>
      {SECENEKLER.map((secenek) => (
        <Pressable
          key={secenek.deger}
          accessibilityLabel={`Bulunurluk: ${secenek.deger}${
            bulunurluk === secenek.deger ? ', seçili' : ''
          }`}
          style={[stiller.secenek, bulunurluk === secenek.deger && stiller.secenekSecili]}
          onPress={() => bulunurlukDegistir(secenek.deger)}
        >
          <Text style={stiller.secenekEtiketi}>{secenek.etiket}</Text>
          <Text style={stiller.secenekAciklamasi}>{secenek.aciklama}</Text>
        </Pressable>
      ))}

      {uyari && <Text style={stiller.uyari}>{uyari}</Text>}
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Pressable
        style={stiller.buton}
        onPress={checkInYapButonu}
        disabled={gonderiliyor || bulunurluk === null}
      >
        <Text style={stiller.butonYazi}>{gonderiliyor ? 'Check-in yapılıyor...' : 'Check-in yap'}</Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  etiketAlani: { marginBottom: 16, gap: 8 },
  etiketBaslik: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  etiketCipleri: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  etiketYaziSecili: { fontFamily: yazi.govdeKalin, color: renk.turuncuKoyu },

  kapsayici: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.xl,
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
    color: '#C0392B',
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
  altBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
    marginBottom: bosluk.s,
  },
  secenek: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    padding: bosluk.l,
    marginBottom: bosluk.s,
  },
  secenekSecili: { borderColor: renk.turuncu, backgroundColor: renk.turuncuZemin },
  secenekEtiketi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  secenekAciklamasi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
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
    color: renk.turuncuKoyu,
    marginBottom: bosluk.m,
  },
})
