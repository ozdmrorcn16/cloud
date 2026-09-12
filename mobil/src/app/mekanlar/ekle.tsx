import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, Keyboard, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { cihazKonumunuAl } from '../../../lib/konum'
import { adresOnerisiAl } from '../../../lib/adres'
import { yakinMekanlariGetir, mekanEkle, type Mekan } from '../../../lib/mekan'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { UstCubuk } from '../../tasarim/UstCubuk'

// Tur SERBEST METIN DEGIL, listeden secilir.
import { useDil } from '../../../lib/dil'
import { turEtiketi } from '../../../lib/tur-etiketi'
//
// Bu ekran tur bilgisinin GIRILDIGI tek yer (karar 2026-08-24): dis
// kaynaktan gelen mekanlarda tur artik gosterilmiyor, cunku dogrulugu
// garanti edilemiyor. Kullanicinin kendi ekledigi mekanda ise
// gosteriliyor - orayi ekleyen kisi oradadir ve turu bilerek secer.
// Liste sabit tutuluyor ki ayni yer icin "kahvehane" ve "Çay evi" gibi
// farkli yazimlar olusmasin.
const EKLENEBILIR_TURLER = [
  'Kafe', 'Restoran', 'Bar', 'Çay evi', 'Fırın', 'Tatlıcı',
  'Park', 'Plaj', 'Meydan', 'Kamp alanı',
  'Spor salonu', 'Yüzme havuzu',
  'Kütüphane', 'Müze', 'Sanat galerisi', 'Canlı müzik', 'Sinema',
  'Tarihi yer', 'AVM', 'Market', 'Otel', 'Kitapçı',
] as const

export default function MekanEkleEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const [cihazKonumu, setCihazKonumu] = useState<{ lat: number; lng: number } | null>(null)
  const [ad, setAd] = useState('')
  const [tur, setTur] = useState('')
  const [adres, setAdres] = useState('')
  const [benzerMekanlar, setBenzerMekanlar] = useState<Mekan[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  /**
   * ADRES ONERISI (kullanicinin istegi 2026-09-06): cihazin cozdugu
   * adres alana ONERI olarak giriyor, kullanici dogruluyor ya da
   * duzeltiyor.
   *
   * `onerildi` yalnizca ONAY SATIRINI gostermek icin: kullanici alani
   * elle degistirdigi anda satir kalkiyor, cunku artik onaylanacak bir
   * oneri kalmiyor - metin kisinin kendisinin.
   */
  const [onerilenAdres, setOnerilenAdres] = useState<string | null>(null)
  const [adresOnaylandi, setAdresOnaylandi] = useState(false)

  useEffect(() => {
    cihazKonumunuAl()
      .then(setCihazKonumu)
      .catch((e) => setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu')))
  }, [])

  /**
   * Konum gelince adres ONERISI cekiliyor.
   *
   * Oneri gelmezse (web, izin yok, saglayici bulamadi) hicbir sey
   * olmuyor: alan zaten opsiyonel ve bos kaliyor. Kullanici bu arada
   * kendisi bir sey yazdiysa ONERI YAZILMIYOR - yazdigini ezmek en
   * kotu davranis olurdu.
   */
  useEffect(() => {
    if (!cihazKonumu) return
    let gecerli = true
    adresOnerisiAl(cihazKonumu.lat, cihazKonumu.lng).then((oneri) => {
      if (!gecerli || !oneri) return
      setOnerilenAdres(oneri)
      setAdres((onceki) => (onceki.trim().length > 0 ? onceki : oneri))
    })
    return () => {
      gecerli = false
    }
  }, [cihazKonumu])

  /** Kullanici alani elle degistirince oneri onayi anlamini yitiriyor. */
  function adresDegisti(metin: string) {
    setAdres(metin)
    if (metin !== onerilenAdres) {
      setOnerilenAdres(null)
      setAdresOnaylandi(false)
    }
  }

  useEffect(() => {
    async function benzerleriAra() {
      if (!cihazKonumu || ad.trim().length < 2) {
        setBenzerMekanlar([])
        return
      }
      const sonuc = await yakinMekanlariGetir(cihazKonumu.lat, cihazKonumu.lng, ad.trim())
      setBenzerMekanlar(sonuc)
    }
    benzerleriAra()
  }, [ad, cihazKonumu])

  async function ekle() {
    setHata(null)
    if (!cihazKonumu) {
      setHata(t('mekanEkle.konumAlinamadi'))
      return
    }
    if (ad.trim().length === 0 || tur.trim().length === 0) {
      setHata(t('mekanEkle.adVeTurGerekli'))
      return
    }

    setGonderiliyor(true)
    try {
      const yeniMekan = await mekanEkle(
        ad.trim(),
        tur.trim(),
        cihazKonumu,
        cihazKonumu,
        adres.trim() || undefined
      )
      router.replace(`/check-in/${yeniMekan.id}`)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setGonderiliyor(false)
    }
  }

  return (
    /* BOS ALANA DOKUNUNCA KLAVYE KAPANIYOR (kullanicinin bildirdigi
       hata 2026-09-07: "Bu ekranda boş biryere basınca klavye
       kapanmıyor"). Kok bir `View`di, yani dokunusu yakalayan hicbir
       sey yoktu; klavye ekranin yarisini kapatinca adres alani ve
       altindaki onay kutusu gorunmez oluyordu.

       Ic ogeler ETKILENMIYOR: RN'de en ICTEKI basilabilir oge once
       yanit veriyor, kok yalnizca bosluga dokunuldugunda tetikleniyor.
       `accessible={false}` sart - onsuz butun ekran ekran okuyucuda
       tek bir "buton" olarak okunurdu. */
    <Pressable
      style={stiller.kapsayici}
      onPress={Keyboard.dismiss}
      accessible={false}
      testID="ekle-kok"
    >
      <UstCubuk baslik={t('mekanEkle.baslik')} geriEtiketi={t('ortak.geri')} />
      <TextInput style={stiller.girdi} placeholder={t('mekanEkle.adYerTutucu')} value={ad} onChangeText={setAd} />
      <Text style={stiller.turBaslik}>{t('mekanEkle.turuSec')}</Text>
      <View style={stiller.turIzgara}>
        {EKLENEBILIR_TURLER.map((secenek) => {
          const secili = tur === secenek
          return (
            <Pressable
              key={secenek}
              style={[stiller.turCipi, secili && stiller.turCipiSecili]}
              onPress={() => setTur(secenek)}
            >
              <Text style={[stiller.turCipiYazi, secili && stiller.turCipiYaziSecili]}>{turEtiketi(secenek)}</Text>
            </Pressable>
          )
        })}
      </View>
      {/* ADRES ALANI COK SATIRLI.
          
          Kullanicinin bildirdigi kusur (2026-09-10): "otomatik adresin
          yazildigi sutunda yazi uzun olunca kaydirmasi zor oluyor,
          adresin devamini gormek icin ona bir yol bul."
          
          Tek satirlik bir `TextInput`ta uzun metin YATAY kayiyor ve
          telefonda o kaydirmayi yakalamak zor - ekran goruntusunde
          adres "Şehit Çavuş Er…" diye kirpilmisti. Cozum kaydirmayi
          kolaylastirmak DEGIL, ihtiyaci ortadan kaldirmak: metin artik
          SARIYOR, yani devami alt satirda kendiliginden gorunuyor.
          
          `maxHeight` var cunku sinirsiz buyuyen bir alan formu asagi
          itip "Ekle" dugmesini ekrandan cikarabilir; o noktadan sonra
          alan kendi icinde dikey kayiyor - dikey kaydirma telefonda
          dogal olan hareket.
          
          `textAlignVertical: 'top'` Android icin: onsuz metin dikeyde
          ortalaniyor ve iki satirli bir alanda ilk satir asagi
          kaciyor. */}
      <TextInput
        style={[stiller.girdi, stiller.adresGirdisi]}
        placeholder={t('mekanEkle.adresYerTutucu')}
        value={adres}
        onChangeText={adresDegisti}
        multiline
        textAlignVertical="top"
        testID="adres-girdisi"
      />

      {/* ONAY SATIRI. Yalnizca ONERI DURURKEN ve henuz onaylanmamisken
          gorunuyor; kullanici alani elle degistirirse ya da "Doğru"
          derse kalkiyor.

          Neden soruyoruz: cihazin adres cozumu YANILABILIYOR - bu
          2026-08-31'de olculdu, saglayici Nilufer'deki bir mekana
          "Ertugrul" demisti, dogrusu Alaaddinbey'di. O gun adres
          dogrulanmadan gosteriliyordu ve ozellik bu yuzden
          kaldirilmisti. Onay adimi tam olarak o itirazi kapatiyor. */}
      {onerilenAdres !== null && !adresOnaylandi && (
        <View style={stiller.onayKutusu} testID="adres-onayi">
          <Text style={stiller.onaySoru}>{t('mekanEkle.adresSoru')}</Text>
          <Text style={stiller.onayAciklama}>{t('mekanEkle.adresAciklama')}</Text>
          <View style={stiller.onayDugmeleri}>
            <Pressable
              style={[stiller.onayDugme, stiller.onayBirincil]}
              onPress={() => setAdresOnaylandi(true)}
              accessibilityRole="button"
              testID="adres-dogru"
            >
              <Text style={stiller.onayBirincilYazi}>{t('mekanEkle.dogru')}</Text>
            </Pressable>
            <Pressable
              style={[stiller.onayDugme, stiller.onayIkincil]}
              onPress={() => {
                setAdres('')
                setOnerilenAdres(null)
                setAdresOnaylandi(false)
              }}
              accessibilityRole="button"
              testID="adres-temizle"
            >
              <Text style={stiller.onayIkincilYazi}>{t('ortak.temizle')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {benzerMekanlar.length > 0 && (
        <View style={stiller.benzerKutu}>
          <Text style={stiller.benzerBaslik}>{t('mekanEkle.benzerBaslik')}</Text>
          <FlatList
            data={benzerMekanlar}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/check-in/${item.id}`)}>
                <Text style={stiller.benzerMekan}>{item.ad}</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Pressable style={stiller.buton} onPress={ekle} disabled={gonderiliyor}>
        <Text style={stiller.butonYazi}>{gonderiliyor ? t('mekanEkle.ekleniyor') : t('mekanEkle.ekle')}</Text>
      </Pressable>
    </Pressable>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  // Adres onay kutusu: alanin hemen altinda, dikkat cekmesi icin
  // turuncu zeminli ama YIKICI degil - bir uyari degil bir soru.
  onayKutusu: {
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.kart,
    padding: bosluk.m,
    gap: 6,
    marginTop: -bosluk.s,
  },
  onaySoru: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  onayAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    lineHeight: 16,
    color: renk.metinIkincil,
  },
  onayDugmeleri: { flexDirection: 'row', gap: bosluk.s, marginTop: 4 },
  onayDugme: {
    borderRadius: yuvarlak.hap,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  onayBirincil: { backgroundColor: renk.turuncu },
  onayBirincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: '#FFFFFF',
  },
  onayIkincil: { borderWidth: 1.4, borderColor: renk.cizgi },
  onayIkincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },

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
  /*
   * Adres alani cok satirli: en az iki satirlik yuksekligi bastan
   * ayirir (kutu birden buyuyup formu zipzip oynatmasin), en fazla
   * bes satira kadar buyur.
   */
  adresGirdisi: { minHeight: 76, maxHeight: 140 },
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
  turBaslik: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginBottom: bosluk.s,
    marginTop: bosluk.xs,
  },
  turIzgara: { flexDirection: 'row', flexWrap: 'wrap', gap: bosluk.s, marginBottom: bosluk.m },
  turCipi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.hap,
    paddingVertical: 8,
    paddingHorizontal: bosluk.m,
  },
  turCipiSecili: { backgroundColor: renk.turuncu, borderColor: renk.turuncu },
  turCipiYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  turCipiYaziSecili: { fontFamily: yazi.govdeKalin, color: '#FFFFFF' },
  benzerKutu: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    padding: bosluk.l,
    marginBottom: bosluk.m,
  },
  benzerBaslik: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
    marginBottom: bosluk.xs,
  },
  benzerMekan: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
    paddingVertical: bosluk.xs,
  },
})
