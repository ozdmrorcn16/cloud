import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, Image, StyleSheet } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { SecimPenceresi } from '../../tasarim/SecimPenceresi'
import { BasariDugmesi } from '../../tasarim/BasariDugmesi'
import { supabase } from '../../../lib/supabase'
import { cihazKonumunuAl } from '../../../lib/konum'
import { checkInYap, type Bulunurluk, NOT_EN_FAZLA } from '../../../lib/checkin'
import { etiketleriKaydet } from '../../../lib/etiket'
import { ArkadasSecici } from '../../tasarim/ArkadasSecici'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import type { BagKisi } from '../../../lib/bag'
import { checkinFotografYukle } from '../../../lib/checkin-fotograf-yukle'
import { varsayilanBulunurluguGetir } from '../../../lib/ayarlar'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { FormSayfasi } from '../../tasarim/FormSayfasi'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { useDil } from '../../../lib/dil'
import { mekaniGetir, type Mekan } from '../../../lib/mekan'
import { IgneIkonu, KisilerIkonu } from '../../tasarim/mekan-ikonlari'
import { KapatIkonu } from '../../tasarim/sikayet-ikonlari'
import { Avatar } from '../../tasarim/Avatar'

/*
 * "Bu check-in ne paylasiyor?" ilk kullanim ekrani KALDIRILDI
 * (kullanicinin istegi 2026-09-18). Aydinlatma gizlilik metninde
 * duruyor; kayitta onaylaniyor. Onunla birlikte tek check-in'i
 * "gizli" yapma yolu da kalkti - paylasimi daraltmanin tek kontrolu
 * ayarlardaki "Profilim gizli" (2026-09-12 karariyla ayni cizgi).
 */

export default function CheckInEkrani() {
  const stiller = useStiller(stilleriYap)
  const renk = useRenk()
  const router = useRouter()
  const { t } = useDil()
  const { mekanId } = useLocalSearchParams<{ mekanId: string }>()
  const [notMetni, setNotMetni] = useState('')
  const [yerelFotoUri, setYerelFotoUri] = useState<string | null>(null)
  // Fotograf KAYNAGI penceresi: kamera mi galeri mi.
  const [kaynakSecimi, setKaynakSecimi] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [uyari, setUyari] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [basarili, setBasarili] = useState(false)
  // null = varsayilan henuz cozulmedi. Bu sure boyunca gonder butonu
  // devre disi: cozulmeden basilirsa ya da profil okumasi (agdaki bir
  // sorun yuzunden) basarisiz olursa, kullanicinin secmedigi 'herkese_acik'
  // yayinlanmamali - o kademe artik yalnizca "bu mekandakiler" degil,
  // mekan ARTI HER YERDEKI butun takipciler demek.
  const [bulunurluk, setBulunurluk] = useState<Bulunurluk | null>(null)
  // Etiketlenebilecek kisiler: YALNIZCA karsilikli bagli oldugun
  // arkadaslar. Ayni kisit veritabani politikasinda da var; buradaki
  // liste kullaniciya secenek gostermek icin.
  const [arkadaslar, setArkadaslar] = useState<BagKisi[]>([])
  const [etiketlenenler, setEtiketlenenler] = useState<string[]>([])
  const [arkadasSecimi, setArkadasSecimi] = useState(false)
  // Mekan karti (referans 2026-09-20): ad + ilce, il; "Degistir" listeye
  // doner. Okunamazsa kart cizilmez, form calisir.
  const [mekan, setMekan] = useState<Mekan | null>(null)
  useEffect(() => {
    let gecerli = true
    mekaniGetir(mekanId)
      .then((m) => {
        if (gecerli) setMekan(m)
      })
      .catch(() => {})
    return () => {
      gecerli = false
    }
  }, [mekanId])
  // Bulunurluk ekranda SECILMIYOR (secenek satiri 2026-09-12'de, ilk
  // kullanim ekranindaki "Gizli yap" 2026-09-18'de kalkti); deger
  // profilin varsayilanindan geliyor.
  useEffect(() => {
    varsayilanBulunurluguGetir()
      .then(setBulunurluk)
      .catch(() => {
        // Profil okumasi basarisiz oldu: sessizce en genis degerde
        // birakmak yerine en dar degere (gizli) dusuyoruz - varsayilan
        // asla kullanicinin secmedigi bir yayin genisligine kaymamali.
        setBulunurluk('gizli')
      })
  }, [])

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
      setHata(t('checkIn.kameraIzni'))
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
          setUyari(t('checkIn.fotografYuklenemedi'))
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
          setUyari(t('checkIn.etiketlenemedi'))
        }
      }

      // Check-in sonrasi MEKAN DETAYINA gidilmiyor (kullanicinin
      // karari 2026-08-29): kullanici check-in sekmesinde kaliyor,
      // kart zaten "Şu an buradasın" haline geciyor.
      // BASARI ANI (2026-09-20): once dugme daireye toplanip tik
      // gosterir, "Şu an buradasın" belirir; yonlendirme BasariDugmesi
      // `onBasariBitti` ile ~1,15 s sonra. Urunun en onemli ani bugune
      // kadar hic gorunmuyordu.
      setBasarili(true)
    } catch (e) {
      if (e instanceof TypeError && e.message === 'Network request failed') {
        setHata(t('ortak.agYok'))
      } else {
        setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
      }
    } finally {
      setGonderiliyor(false)
    }
  }

  const secilenler = etiketlenenler
    .map((id) => arkadaslar.find((k) => k.id === id))
    .filter((k): k is BagKisi => Boolean(k))
  const konumSatiri = mekan ? [mekan.semt, mekan.il].filter(Boolean).join(', ') : ''

  /*
   * YERLESIM REFERANSTAN (kullanicinin gorseli 2026-09-20 "check-in'e
   * basinca gelecek sayfayi boyle yap"): mekan karti (seftali kare igne,
   * ad, ilce/il, Degistir) -> "istege bagli" notu -> Notun -> Fotograf
   * (kesikli kutu / secilince tam genislik onizleme + x) -> Arkadas
   * etiketle satiri (secilince "Birlikte" + Ekle + avatarli cipler) ->
   * gorunurluk notu -> "Check-in paylas". Mantik degismedi: kamera/
   * galeri secimi, ArkadasSecici, bulunurluk profil varsayilani.
   */
  return (
    <FormSayfasi icerikStili={stiller.kapsayici}>
      <UstCubuk baslik={t('checkIn.baslik')} geriEtiketi={t('ortak.geri')} />

      {mekan && (
        <View style={stiller.mekanKarti} testID="mekan-karti">
          <View style={stiller.mekanIkonKutusu}>
            <IgneIkonu boyut={26} />
          </View>
          <View style={stiller.mekanMetinler}>
            <Text style={stiller.mekanAd} numberOfLines={1}>{mekan.ad}</Text>
            {konumSatiri ? <Text style={stiller.mekanKonum} numberOfLines={1}>{konumSatiri}</Text> : null}
          </View>
          <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8} testID="mekan-degistir">
            <Text style={stiller.degistir}>{t('checkIn.degistir')}</Text>
          </Pressable>
        </View>
      )}
      <Text style={stiller.ipucu}>{t('checkIn.istegeBagli')}</Text>

      <Text style={stiller.etiket}>{t('checkIn.notEtiket')}</Text>
      <TextInput
        style={[stiller.girdi, stiller.cokSatirli]}
        placeholder={t('checkIn.notYerTutucu')}
        placeholderTextColor={renk.metinSoluk}
        value={notMetni}
        // Sinir sunucuda da var; burada kirpmak kullaniciyi sinira
        // carptirmadan durduruyor (yorum kutusundaki desenin aynisi).
        onChangeText={(d) => setNotMetni(d.slice(0, NOT_EN_FAZLA))}
        maxLength={NOT_EN_FAZLA}
        multiline
        testID="not-girdisi"
      />

      <Text style={stiller.etiket}>{t('checkIn.fotografEtiket')}</Text>
      {yerelFotoUri ? (
        <View style={stiller.onizlemeKabi}>
          <Pressable onPress={() => setKaynakSecimi(true)} accessibilityRole="imagebutton" accessibilityLabel={t('checkIn.fotografCek')}>
            <Image source={{ uri: yerelFotoUri }} style={stiller.onizleme} testID="foto-onizleme" />
          </Pressable>
          <Pressable
            style={stiller.kaldirDugmesi}
            onPress={() => setYerelFotoUri(null)}
            accessibilityRole="button"
            accessibilityLabel={t('checkIn.fotografKaldir')}
            hitSlop={8}
            testID="foto-kaldir"
          >
            <KapatIkonu boyut={16} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [stiller.fotoKutusu, pressed && stiller.basili]}
          onPress={() => setKaynakSecimi(true)}
          accessibilityRole="button"
          testID="foto-ekle"
        >
          <KameraIkonu renk={renk.metinIkincil} />
          <Text style={stiller.fotoKutusuYazi}>{t('checkIn.fotografEkle')}</Text>
        </Pressable>
      )}

      {secilenler.length === 0 ? (
        /* ARKADAS ETIKETLE satiri (referans): ikon, iki satir metin, ok.
           Arkadas listesi bos olsa da gorunur - ozelligin varligi belli
           olsun (2026-09-12 karari). */
        <Pressable
          style={({ pressed }) => [stiller.etiketleSatiri, pressed && stiller.basili]}
          onPress={() => setArkadasSecimi(true)}
          accessibilityRole="button"
          testID="arkadas-ekle"
        >
          <KisilerIkonu boyut={26} renk={renk.metin} />
          <View style={stiller.mekanMetinler}>
            <Text style={stiller.satirBaslik}>{t('checkIn.arkadasEtiketle')}</Text>
            <Text style={stiller.satirAlt}>{t('checkIn.kimlerle')}</Text>
          </View>
          <OkIkonuKucuk renk={renk.metinIkincil} />
        </Pressable>
      ) : (
        <>
          <View style={stiller.birlikteBaslik}>
            <Text style={stiller.etiketSikisik}>{t('checkIn.birlikte')}</Text>
            <Pressable onPress={() => setArkadasSecimi(true)} accessibilityRole="button" hitSlop={8} testID="arkadas-ekle">
              <Text style={stiller.degistir}>{t('checkIn.ekle')}</Text>
            </Pressable>
          </View>
          <View style={stiller.etiketCipleri}>
            {secilenler.map((kisi) => (
              <View key={kisi.id} style={stiller.etiketCipi}>
                <Avatar fotografUrl={kisi.avatarUrl ?? null} ad={kisi.ad} kullaniciAdi={kisi.kullaniciAdi} cap={28} />
                <Text style={stiller.etiketYazi}>{kisi.kullaniciAdi}</Text>
                <Pressable
                  onPress={() => etiketiDegistir(kisi.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('checkIn.etiketiKaldir', { ad: kisi.ad })}
                  hitSlop={8}
                >
                  <KapatIkonu boyut={14} />
                </Pressable>
              </View>
            ))}
          </View>
        </>
      )}

      {uyari && <Text style={stiller.uyari}>{uyari}</Text>}
      {hata && <Text style={stiller.hata}>{hata}</Text>}
      <Text style={stiller.gorunurlukNotu}>{t('checkIn.gorunurlukNotu')}</Text>
      <BasariDugmesi
        etiket={t('checkIn.gonder')}
        mesgulEtiketi={t('checkIn.gonderiliyor')}
        basariEtiketi={t('kesfet.suAnBuradasin')}
        mesgul={gonderiliyor}
        basarili={basarili}
        disabled={bulunurluk === null}
        onPress={checkInYapButonu}
        onBasariBitti={() => router.replace('/mekanlar')}
        testID="check-in-gonder"
      />
      <SecimPenceresi
        acikMi={kaynakSecimi}
        secimler={[
          // NOT: bu ekranin metinleri (bastan beri) sozlukte degil koda
          // gomulu; yenileri de ayni yerde tutuluyor ki ekranin yarisi
          // sozlukten yarisi gomuluden gelmesin. Ekranin tamaminin
          // i18n'e tasinmasi ayri bir is.
          { etiket: t('checkIn.fotografCek'), testID: 'foto-kamera', onSec: kameradanCek },
          { etiket: t('checkIn.galeridenSec'), testID: 'foto-galeri', onSec: galeridenSec },
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

    </FormSayfasi>
  )
}

/** Kesikli fotograf kutusundaki kamera. */
function KameraIkonu({ renk: c }: { renk: string }) {
  return (
    <Svg width={30} height={30} viewBox="0 0 24 24">
      <Path
        d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.1-1.8A1 1 0 0 1 9.65 4.7h4.7a1 1 0 0 1 .85.5L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"
        stroke={c}
        strokeWidth={1.7}
        fill="none"
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12.8} r={3.3} stroke={c} strokeWidth={1.7} fill="none" />
    </Svg>
  )
}

/** Satir sonundaki saga ok. */
function OkIkonuKucuk({ renk: c }: { renk: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path d="M9 6l6 6-6 6" stroke={c} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kapsayici: {
    flexGrow: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.sayfa,
    paddingBottom: ALT_GEZINME_PAYI,
  },

  // Mekan karti: beyaz, ince cerceve; solda seftali kare igne.
  mekanKarti: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    padding: bosluk.m,
  },
  mekanIkonKutusu: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mekanMetinler: { flex: 1 },
  mekanAd: { fontFamily: yazi.govdeKalin, fontSize: olcek.altBaslik, color: renk.metin },
  mekanKonum: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil, marginTop: 2 },
  degistir: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.turuncu },
  ipucu: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinSoluk, marginTop: bosluk.s, marginBottom: bosluk.l },

  etiket: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin, marginBottom: bosluk.s },
  etiketSikisik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 14,
    marginBottom: bosluk.l,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  cokSatirli: { minHeight: 130, textAlignVertical: 'top' },

  // Kesikli kutu: fotograf yokken.
  fotoKutusu: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: bosluk.s,
    minHeight: 170,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.yuzey,
    marginBottom: bosluk.l,
  },
  fotoKutusuYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.govde, color: renk.metinIkincil },
  onizlemeKabi: { marginBottom: bosluk.l },
  onizleme: { width: '100%', aspectRatio: 16 / 10, borderRadius: yuvarlak.kart, backgroundColor: renk.cizgi },
  kaldirDugmesi: {
    position: 'absolute',
    top: bosluk.s,
    right: bosluk.s,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  etiketleSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    padding: bosluk.m,
    marginBottom: bosluk.l,
  },
  satirBaslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  satirAlt: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil, marginTop: 2 },
  birlikteBaslik: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: bosluk.s },
  etiketCipleri: { flexDirection: 'row', flexWrap: 'wrap', gap: bosluk.s, marginBottom: bosluk.l },
  etiketCipi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.s,
    paddingLeft: 4,
    paddingRight: bosluk.m,
    paddingVertical: 4,
    borderRadius: yuvarlak.hap,
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
  },
  etiketYazi: { fontFamily: yazi.govdeOrta, fontSize: olcek.govde, color: renk.metin },
  basili: { opacity: 0.85 },

  gorunurlukNotu: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
    textAlign: 'center',
    marginTop: 'auto',
    marginBottom: bosluk.m,
  },
  hata: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.yikici, marginBottom: bosluk.s },
  uyari: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.turuncuYazi, marginBottom: bosluk.s },
})
