import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, Image, StyleSheet, useWindowDimensions } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { BasariDugmesi } from '../../tasarim/BasariDugmesi'
import { IfadeSecici, IfadeCipi } from '../../tasarim/IfadeSecici'
import { ifadeBul } from '../../../lib/ifadeler'
import { supabase } from '../../../lib/supabase'
import { cihazKonumunuAl } from '../../../lib/konum'
import { checkInYap, type Bulunurluk, NOT_EN_FAZLA } from '../../../lib/checkin'
import { etiketleriKaydet } from '../../../lib/etiket'
import { ArkadasSecici } from '../../tasarim/ArkadasSecici'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import type { BagKisi } from '../../../lib/bag'
import { checkinFotograflariniYukle } from '../../../lib/checkin-fotograf-yukle'
import { FotografIzgarasiDuzenle, type FotografKaresi } from '../../tasarim/FotografIzgarasiDuzenle'
import { varsayilanBulunurluguGetir } from '../../../lib/ayarlar'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { FormSayfasi } from '../../tasarim/FormSayfasi'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { useDil } from '../../../lib/dil'
import { mekaniGetir, type Mekan } from '../../../lib/mekan'
import { IgneIkonu, KisilerIkonu } from '../../tasarim/mekan-ikonlari'
import { Avatar } from '../../tasarim/Avatar'
import { KapatIkonu } from '../../tasarim/sikayet-ikonlari'

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
  // KISA EKRAN (< 720 pt, iPhone SE): ipucu satiri gizli, kutular daha
  // basik - tek ekrana kaydirmasiz sigsin (cihaz uyumu kurali 2026-09-19).
  const kisaEkran = useWindowDimensions().height < 720
  const router = useRouter()
  const { t } = useDil()
  const { mekanId } = useLocalSearchParams<{ mekanId: string }>()
  const [notMetni, setNotMetni] = useState('')
  // IFADE (2026-09-21): 108'lik setten tek secim; not alaninin ustunde.
  const [ifade, setIfade] = useState<string | null>(null)
  const [ifadeSecici, setIfadeSecici] = useState(false)
  // COKLU FOTOGRAF (2026-09-21): en fazla EN_FAZLA_FOTOGRAF yerel dosya.
  const [fotoKareleri, setFotoKareleri] = useState<FotografKaresi[]>([])
  // Fotograf KAYNAGI penceresi: kamera mi galeri mi.
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

      let yuklenenYollar: string[] = []
      if (fotoKareleri.length > 0) {
        try {
          const { data: kullaniciVerisi } = await supabase.auth.getUser()
          const kullaniciId = kullaniciVerisi.user?.id
          if (kullaniciId) {
            yuklenenYollar = await checkinFotograflariniYukle(kullaniciId, fotoKareleri.map((k) => k.uri))
          }
        } catch {
          // Fotograf yuklenemezse check-in'i engelleme — notsuz/fotografsiz devam eder.
          setUyari(t('checkIn.fotografYuklenemedi'))
          yuklenenYollar = []
        }
      }

      const olusan = await checkInYap(
        mekanId,
        konum.lat,
        konum.lng,
        notMetni.trim() || undefined,
        yuklenenYollar,
        bulunurluk,
        ifade
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
        <View style={[stiller.mekanKarti, kisaEkran && stiller.mekanKartiKisa]} testID="mekan-karti">
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
      {!kisaEkran && <Text style={stiller.ipucu}>{t('checkIn.istegeBagli')}</Text>}

      <Text style={stiller.etiket}>{t('checkIn.notEtiket')}</Text>
      {/* IFADE: not alaninin ustunde. Secilmemisken hayalet "Ifade ekle"
          (setin bir ikonuyla), secilince cip (ikon + etiket + kaldir);
          cipe basmak seciciyi yeniden acar. */}
      <View style={stiller.ifadeSatiri}>
        {ifade ? (
          <IfadeCipi slug={ifade} onPress={() => setIfadeSecici(true)} onKaldir={() => setIfade(null)} />
        ) : (
          <Pressable
            style={({ pressed }) => [stiller.ifadeEkle, pressed && stiller.ifadeEkleBasili]}
            onPress={() => setIfadeSecici(true)}
            accessibilityRole="button"
            testID="ifade-ekle"
          >
            <Image source={ifadeBul('cok-mutluyum')!.kaynak} style={stiller.ifadeEkleIkon} resizeMode="contain" />
            <Text style={stiller.ifadeEkleYazi}>{t('checkIn.ifadeEkle')}</Text>
          </Pressable>
        )}
      </View>
      <TextInput
        style={[stiller.girdi, stiller.cokSatirli, kisaEkran && stiller.cokSatirliKisa]}
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

      <Text style={stiller.etiket}>{t('checkIn.fotograflar')}</Text>
      {/* COKLU FOTOGRAF (2026-09-21): duzenleme sayfasiyla AYNI izgara -
          bos halde kesikli kutu, secilince kareler + "Ekle". */}
      <View style={stiller.fotoAlani}>
        <FotografIzgarasiDuzenle
          kareler={fotoKareleri}
          onEklendi={(uriler) => setFotoKareleri((m) => [...m, ...uriler.map((uri) => ({ uri }))])}
          onDegistirildi={(i, uri) => setFotoKareleri((m) => m.map((k, j) => (j === i ? { uri } : k)))}
          onKaldir={(i) => setFotoKareleri((m) => m.filter((_, j) => j !== i))}
          onHata={setHata}
          pasif={gonderiliyor}
        />
      </View>

      {secilenler.length === 0 ? (
        /* ARKADAS ETIKETLE satiri (referans): ikon, iki satir metin, ok.
           Arkadas listesi bos olsa da gorunur - ozelligin varligi belli
           olsun (2026-09-12 karari). */
        <Pressable
          style={({ pressed }) => [stiller.etiketleSatiri, kisaEkran && stiller.etiketleSatiriKisa, pressed && stiller.basili]}
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
        etiket={t('checkIn.paylas')}
        mesgulEtiketi={t('checkIn.gonderiliyor')}
        basariEtiketi={t('kesfet.suAnBuradasin')}
        mesgul={gonderiliyor}
        basarili={basarili}
        disabled={bulunurluk === null}
        onPress={checkInYapButonu}
        onBasariBitti={() => router.replace('/mekanlar')}
        testID="check-in-gonder"
      />
      <IfadeSecici acikMi={ifadeSecici} secili={ifade} onSec={setIfade} onKapat={() => setIfadeSecici(false)} />
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
  ipucu: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinSoluk, marginTop: bosluk.s, marginBottom: bosluk.m },

  etiket: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin, marginBottom: bosluk.s },
  ifadeSatiri: { marginBottom: bosluk.s, alignItems: 'flex-start' },
  // Hayalet desen (tema: dolgu yok, turuncu kenarlik + yazi) - ekranda
  // dolu turuncu tek: "Check-in yap".
  ifadeEkle: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s, borderWidth: 1.5, borderColor: renk.turuncu, borderRadius: yuvarlak.hap, paddingVertical: 8, paddingHorizontal: 14 },
  ifadeEkleBasili: { backgroundColor: renk.turuncuZemin },
  ifadeEkleIkon: { width: 22, height: 22 },
  ifadeEkleYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk + 1, color: renk.turuncuYazi },
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
  // TEK EKRAN, KAYDIRMASIZ (kullanicinin istegi 2026-09-20): not ve
  // fotograf kutulari sabit degil, kalan yuksekligi paylasiyor (FormSayfasi
  // icerigi flexGrow 1). Kucuk ekranda minHeight'a iner; ancak o da
  // sigmazsa kaydirir (SE 375x647 olculdu: sigiyor).
  cokSatirli: { flex: 1, minHeight: 72, textAlignVertical: 'top' },
  cokSatirliKisa: { minHeight: 48, paddingVertical: 10 },
  mekanKartiKisa: { padding: bosluk.s, marginBottom: bosluk.m },
  etiketleSatiriKisa: { padding: bosluk.s },

  // Fotograf izgarasi (FotografIzgarasiDuzenle) - bos halde kesikli kutu.
  fotoAlani: { marginBottom: bosluk.m },

  etiketleSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    padding: bosluk.m,
    marginBottom: bosluk.m,
  },
  satirBaslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  satirAlt: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil, marginTop: 2 },
  birlikteBaslik: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: bosluk.s },
  etiketCipleri: { flexDirection: 'row', flexWrap: 'wrap', gap: bosluk.s, marginBottom: bosluk.m },
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
    marginBottom: bosluk.s,
  },
  hata: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.yikici, marginBottom: bosluk.s },
  uyari: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.turuncuYazi, marginBottom: bosluk.s },
})
