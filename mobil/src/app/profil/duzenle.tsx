import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native'
import { kendiProfilimiGetir, profiliGuncelle } from '../../../lib/profil'
import {
  KULLANICI_ADI_KURALI,
  kullaniciAdiGecerliMi,
  kullaniciAdiniNormallestir,
  kullaniciAdiniDegistir,
} from '../../../lib/kullanici-adi'
import { kullaniciAdiDurumunuGetir } from '../../../lib/ayarlar'
import { illeriGetir, ilceleriGetir, ulkeleriGetir, TURKIYE } from '../../../lib/bolge'
import {
  instagramNormallestir,
  instagramGecerliMi,
  INSTAGRAM_EN_FAZLA,
} from '../../../lib/instagram'
import { hataMetni } from '../../../lib/hata-metni'
import { useDil } from '../../../lib/dil'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { ListeSecici } from '../../tasarim/ListeSecici'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'

/** Biyografinin en fazla uzunlugu. */
const EN_FAZLA_BIYOGRAFI = 160

function tarihiBicimlendir(tarih: Date): string {
  const gun = String(tarih.getDate()).padStart(2, '0')
  const ay = String(tarih.getMonth() + 1).padStart(2, '0')
  return `${gun}.${ay}.${tarih.getFullYear()}`
}

/**
 * PROFILINI DUZENLE.
 *
 * Kullanicinin istegi (2026-08-27): ad-soyad, kullanici adi ve
 * biyografi buradan degistirilsin.
 *
 * BIYOGRAFININ ILK GIRIS NOKTASI BURASI. Alan veritabaninda hep vardi
 * ama yalnizca hesap olusturma adiminda soruluyordu; o adim
 * sadelestirilince (kullanicinin karari) biyografi yazmanin hicbir
 * yolu kalmamisti.
 *
 * KULLANICI ADI DA BURADA DUZENLENIYOR (kullanicinin istegi
 * 2026-09-11: "kullanici adi satirina basinca baska sayfaya geciyor,
 * onu iptal et; bu attigim kendi satirinda duzenleme yapilacak").
 * Onceden satir `/profil/kullanici-adi` ekranina gidiyordu.
 *
 * O EKRAN SILINMEDI: ayarlardaki "Kullanıcı adı" satiri hala oraya
 * gidiyor, yani ikinci bir girisi var. Bir girisi kaldirmadan once o
 * islemin baska girisi var mi diye BAKMAK gerekiyor - ayni tuzak
 * 2026-09-03'te ayarlardaki "Profili düzenle" satirinda ve
 * 2026-09-07'de "Anılarım" ekraninda yasandi.
 *
 * MANTIK IKI KEZ YAZILMADI: bicim kurallari ve degistirme cagrisi
 * `lib/kullanici-adi.ts` icinde, iki ekran da onu kullaniyor.
 */
export default function ProfilDuzenleEkrani() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const { t, dil } = useDil()

  const [ad, setAd] = useState('')
  const [biyografi, setBiyografi] = useState('')
  const [instagram, setInstagram] = useState('')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  /*
   * Kullanici adi SATIR ICINDE duzenleniyor (kullanicinin istegi
   * 2026-09-11: "kullanici adi satirina basinca baska sayfaya geciyor,
   * onu iptal et; bu attigim kendi satirinda duzenleme yapilacak").
   *
   * AYRI EKRAN SILINMEDI: ayarlardaki "Kullanıcı adı" satiri da oraya
   * gidiyor, yani ikinci bir girisi var. Silmek o ekrani oksuz
   * birakmazdi ama ayarlar satirini da kirardi.
   *
   * BASLANGIC DEGERI sunucudan gelen ad; degismediyse RPC hic
   * cagrilmiyor - 30 gun sayaci bosuna harcanmasin.
   */
  const [ilkKullaniciAdi, setIlkKullaniciAdi] = useState('')
  const [sonrakiDegisim, setSonrakiDegisim] = useState<Date | null>(null)
  /*
   * OTURDUGU BOLGE (2026-09-11 istege bagli; 2026-09-18 ZORUNLU ve ulke
   * eklendi). Ulke her zaman dolu (varsayilan TR); Turkiye'de il VE
   * ilce sart - sunucudaki CHECK yarim secimi zaten reddeder. Baska
   * ulkede il/ilce yok. Profilde gosterilip gosterilmemesi AYARLARDA
   * ("bolgemi profilde goster"); ulke hicbir zaman gosterilmez.
   */
  const [ulke, setUlke] = useState<string>(TURKIYE)
  const [il, setIl] = useState<string | null>(null)
  const [ilce, setIlce] = useState<string | null>(null)
  const [iller, setIller] = useState<string[]>([])
  const [ilceler, setIlceler] = useState<string[]>([])
  const [secici, setSecici] = useState<'ulke' | 'il' | 'ilce' | null>(null)
  const ulkeler = ulkeleriGetir(dil)
  const [odakli, setOdakli] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const [kaydediliyor, setKaydediliyor] = useState(false)

  useEffect(() => {
    let gecerli = true
    kendiProfilimiGetir()
      .then((profil) => {
        if (!gecerli || !profil) return
        setAd(profil.ad)
        setBiyografi(profil.biyografi ?? '')
        setInstagram(profil.instagram ?? '')
        setKullaniciAdi(profil.kullaniciAdi)
        setIlkKullaniciAdi(profil.kullaniciAdi)
        setUlke(profil.yasadigiUlke ?? TURKIYE)
        setIl(profil.yasadigiIl)
        setIlce(profil.yasadigiIlce)
      })
      .catch((e) => {
        if (gecerli) setHata(hataMetni(e))
      })
    // 30 GUN KURALI ONCEDEN GOSTERILIYOR: kisi adini degistirip
    // "Kaydet"e basip sonunda reddedilmesin ("bosa is yaptirma").
    // Baglayici kontrol yine SUNUCUDA.
    kullaniciAdiDurumunuGetir()
      .then((d) => {
        if (gecerli) setSonrakiDegisim(d.sonrakiDegisimTarihi)
      })
      .catch(() => {
        // Sayaci okuyamamak formu bloke etmemeli; kurali sunucu zaten
        // uyguluyor.
      })
    // IL LISTESI BIR KEZ cekiliyor: 81 satir ve degismiyor. Secici
    // acildiginda cekmek, pencereyi bos acip sonra doldurmak demekti.
    illeriGetir()
      .then((d) => {
        if (gecerli) setIller(d)
      })
      .catch(() => {
        // Liste gelmezse secici bos kalir; alan zaten opsiyonel.
      })
    return () => {
      gecerli = false
    }
  }, [])

  async function kaydet() {
    setHata(null)
    setBilgi(null)

    if (ad.trim().length === 0) {
      setHata(t('profilDuzenle.adHata'))
      return
    }

    /*
     * INSTAGRAM ONCE NORMALLESTIRILIYOR, sonra dogrulaniyor. Insanlar
     * bu alana `@orcun` ya da yapistirilmis bir adres yaziyor; ucunu
     * de kabul edip ayni degere indirmek "yanlis yazdin" demekten iyi.
     * Bos birakmak alani TEMIZLIYOR - kisi baglantisini kaldirabilmeli.
     */
    const instagramSade = instagramNormallestir(instagram)
    if (instagramSade.length > 0 && !instagramGecerliMi(instagramSade)) {
      setHata(t('profilDuzenle.instagramHata'))
      return
    }

    /*
     * KULLANICI ADI ONCE, digerlerinden AYRI bir RPC ile: `profiller`
     * uzerinde o sutuna dogrudan yazma yetkisi YOK (Faz 2c, sutun
     * duzeyinde kisit) ve 30 gun kurali orada zorlaniyor.
     *
     * SIRA ONEMLI: reddedilebilen islem once deneniyor. Sonra
     * yapilsaydi ad ve biyografi kaydedilir, kullanici adi
     * reddedilirdi ve kisi neyin kaydedilip neyin kaydedilmedigini
     * anlamazdi.
     */
    const kadSade = kullaniciAdiniNormallestir(kullaniciAdi)
    const kadDegisti = kadSade !== ilkKullaniciAdi
    if (kadDegisti && !kullaniciAdiGecerliMi(kadSade)) {
      setHata(KULLANICI_ADI_KURALI)
      return
    }

    // BOLGE ZORUNLU: Turkiye'de il ve ilce secilmeden kaydedilmez.
    if (ulke === TURKIYE && (!il || !ilce)) {
      setHata(t('profilDuzenle.bolgeHata'))
      return
    }

    setKaydediliyor(true)
    try {
      if (kadDegisti) {
        await kullaniciAdiniDegistir(kadSade)
        setIlkKullaniciAdi(kadSade)
        setKullaniciAdi(kadSade)
      }
      await profiliGuncelle({
        ad: ad.trim(),
        biyografi: biyografi.trim() || null,
        instagram: instagramSade || null,
        yasadigiUlke: ulke,
        // Il/ilce yalnizca Turkiye'de ve ikisi birden.
        yasadigiIl: ulke === TURKIYE && il && ilce ? il : null,
        yasadigiIlce: ulke === TURKIYE && il && ilce ? ilce : null,
      })
      // Normallesmis hali ekrana yaziliyor: kisi ne kaydedildigini
      // gorsun, "@" ile yazdiysa onun duestuegunu anlasin.
      setInstagram(instagramSade)
      setBilgi(t('profilDuzenle.kaydedildi'))
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setKaydediliyor(false)
    }
  }

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik={t('profilDuzenle.baslik')} geriEtiketi={t('ortak.geri')} />

      <ScrollView contentContainerStyle={stiller.icerik} keyboardShouldPersistTaps="handled">
        {hata && <Text style={stiller.hata}>{hata}</Text>}
        {bilgi && !hata && <Text style={stiller.bilgi}>{bilgi}</Text>}

        <Text style={stiller.etiket}>{t('profilDuzenle.adEtiket')}</Text>
        <TextInput
          style={[stiller.girdi, odakli === 'ad' && stiller.girdiOdakli]}
          placeholder={t('profilDuzenle.adYerTutucu')}
          placeholderTextColor={renk.metinIkincil}
          value={ad}
          onChangeText={(y) => {
            setAd(y)
            setBilgi(null)
          }}
          onFocus={() => setOdakli('ad')}
          onBlur={() => setOdakli(null)}
        />

        {/* KULLANICI ADI ARTIK SATIR ICINDE (kullanicinin istegi
            2026-09-11). Onceden bu satir baska bir ekrana gidiyordu;
            ayni formdaki diger alanlarla ayni sekilde duzenleniyor.

            30 GUN KURALI ONCEDEN YAZIYOR: degistirilemiyorsa kisi
            bunu yazmadan once gorsun. Kural BAGLAYICI OLARAK SUNUCUDA
            (`kullanici_adi_degistir`); buradaki metin yalnizca
            bilgilendirme. */}
        <Text style={stiller.etiket}>{t('profilDuzenle.kullaniciAdiEtiket')}</Text>
        <TextInput
          style={[stiller.girdi, odakli === 'kad' && stiller.girdiOdakli]}
          placeholder={t('kullaniciAdiEkrani.yerTutucu')}
          placeholderTextColor={renk.metinIkincil}
          value={kullaniciAdi}
          onChangeText={(y) => {
            setKullaniciAdi(y)
            setBilgi(null)
          }}
          onFocus={() => setOdakli('kad')}
          onBlur={() => setOdakli(null)}
          autoCapitalize="none"
          autoCorrect={false}
          testID="kullanici-adi-girdisi"
        />
        <Text style={stiller.ipucu}>
          {sonrakiDegisim && sonrakiDegisim > new Date()
            ? t('kullaniciAdiEkrani.sonrakiDegisim', {
                tarih: tarihiBicimlendir(sonrakiDegisim),
              })
            : KULLANICI_ADI_KURALI}
        </Text>

        <View style={stiller.etiketSatiri}>
          <Text style={stiller.etiket}>{t('profilDuzenle.biyografiEtiket')}</Text>
          <Text style={stiller.sayac}>
            {biyografi.length}/{EN_FAZLA_BIYOGRAFI}
          </Text>
        </View>
        <TextInput
          style={[stiller.girdi, stiller.cokSatirli, odakli === 'bio' && stiller.girdiOdakli]}
          placeholder={t('profilDuzenle.biyografiYerTutucu')}
          placeholderTextColor={renk.metinIkincil}
          value={biyografi}
          onChangeText={(y) => {
            setBiyografi(y)
            setBilgi(null)
          }}
          onFocus={() => setOdakli('bio')}
          onBlur={() => setOdakli(null)}
          multiline
          maxLength={EN_FAZLA_BIYOGRAFI}
        />
        <Text style={stiller.etiket}>{t('profilDuzenle.instagramEtiket')}</Text>
        <View style={[stiller.girdi, stiller.onekli, odakli === 'ig' && stiller.girdiOdakli]}>
          {/* "@" ALANIN ICINDE, SABIT: kullanicinin onu yazmasi
              gerekmiyor ve alanin ne bekledigi bakar bakmaz anlasiliyor.
              Yine de yazan olursa normallestirme onu atiyor. */}
          <Text style={stiller.onek}>@</Text>
          <TextInput
            style={stiller.oneksizGirdi}
            placeholder={t('profilDuzenle.instagramYerTutucu')}
            placeholderTextColor={renk.metinIkincil}
            value={instagram}
            onChangeText={(y) => {
              setInstagram(y)
              setBilgi(null)
            }}
            onFocus={() => setOdakli('ig')}
            onBlur={() => setOdakli(null)}
            autoCapitalize="none"
            autoCorrect={false}
            // Yapistirilan bir adres 30 karakteri asabiliyor; sinir
            // normallestirmeden SONRA dogrulaniyor, girdide degil.
            maxLength={INSTAGRAM_EN_FAZLA + 40}
            testID="instagram-girdisi"
          />
        </View>
        <Text style={stiller.ipucu}>{t('profilDuzenle.instagramIpucu')}</Text>

        {/* YASADIGIN BOLGE (kullanicinin istegi 2026-09-11).
            OPSIYONEL - ipucu da bunu soyluyor; kimse konumunu
            paylasmak zorunda degil.

            IL VE ILCE SECILIYOR, YAZILMIYOR: liste `public.ilceler`
            tablosundan geliyor ve o tablo OSM idari sinir
            poligonlariyla uretildi (968 cift, Bursa'da tam 17 ilce).
            Serbest metin olsaydi "Bursaa" ya da "Marmara Bölgesi"
            gibi degerler profilde gercek bilgi gibi dururdu. */}
        <Text style={stiller.etiket}>{t('profilDuzenle.bolgeEtiket')}</Text>
        {/* ULKE (2026-09-18): liste ICU'dan 7 dilde; Turkiye basta. */}
        <Pressable
          style={[stiller.girdi, stiller.secimAlani, stiller.ulkeAlani]}
          onPress={() => setSecici('ulke')}
          accessibilityRole="button"
          accessibilityLabel={t('profilDuzenle.bolgeUlkeSec')}
          testID="bolge-ulke"
        >
          <Text style={stiller.secimYazi}>{ulkeler.find((u) => u.kod === ulke)?.ad ?? ulke}</Text>
        </Pressable>
        {ulke !== TURKIYE && (
          <Text style={stiller.ipucu}>{t('profilDuzenle.bolgeYalnizcaUlke')}</Text>
        )}
        {ulke === TURKIYE && (
        <View style={stiller.ikili}>
          <Pressable
            style={[stiller.girdi, stiller.yariAlan, stiller.secimAlani]}
            onPress={() => setSecici('il')}
            accessibilityRole="button"
            accessibilityLabel={t('profilDuzenle.bolgeIlSec')}
            testID="bolge-il"
          >
            <Text style={[stiller.secimYazi, !il && stiller.secimBos]}>
              {il ?? t('profilDuzenle.bolgeIlSec')}
            </Text>
          </Pressable>
          {/* ILCE SECICI IL SECILMEDEN KAPALI: ilceler ile bagli ve
              "once il" demek, bos bir liste acmaktan iyi. */}
          <Pressable
            style={[
              stiller.girdi,
              stiller.yariAlan,
              stiller.secimAlani,
              !il && stiller.secimKapali,
            ]}
            onPress={() => il && setSecici('ilce')}
            disabled={!il}
            accessibilityRole="button"
            accessibilityLabel={t('profilDuzenle.bolgeIlceSec')}
            testID="bolge-ilce"
          >
            <Text style={[stiller.secimYazi, !ilce && stiller.secimBos]}>
              {ilce ?? t('profilDuzenle.bolgeIlceSec')}
            </Text>
          </Pressable>
        </View>
        )}
        {/* "Bolgeyi kaldir" KALKTI: bolge zorunlu (2026-09-18). Gizlemek
            ayarlarda. */}
        <Text style={stiller.ipucu}>{t('profilDuzenle.bolgeIpucu')}</Text>

        <Pressable
          style={stiller.birincil}
          onPress={kaydet}
          disabled={kaydediliyor}
          accessibilityRole="button"
        >
          <Text style={stiller.birincilYazi}>
            {kaydediliyor ? t('profilDuzenle.kaydediliyor') : t('ortak.kaydet')}
          </Text>
        </Pressable>
      </ScrollView>

      <ListeSecici
        acikMi={secici === 'ulke'}
        baslik={t('profilDuzenle.bolgeUlkeSec')}
        secenekler={ulkeler.map((u) => u.ad)}
        secili={ulkeler.find((u) => u.kod === ulke)?.ad ?? null}
        onSec={(ad) => {
          const secilen = ulkeler.find((u) => u.ad === ad)
          if (secilen) {
            setUlke(secilen.kod)
            if (secilen.kod !== TURKIYE) {
              setIl(null)
              setIlce(null)
            }
          }
          setSecici(null)
          setBilgi(null)
        }}
        onKapat={() => setSecici(null)}
      />
      <ListeSecici
        acikMi={secici === 'il'}
        baslik={t('profilDuzenle.bolgeIlSec')}
        secenekler={iller}
        secili={il}
        onSec={(secilen) => {
          setIl(secilen)
          // IL DEGISINCE ILCE SIFIRLANIYOR: eski ilce yeni ilde
          // bulunmuyor olabilir ve sunucudaki yabanci anahtar onu
          // reddederdi.
          setIlce(null)
          setIlceler([])
          setSecici(null)
          setBilgi(null)
          ilceleriGetir(secilen)
            .then(setIlceler)
            .catch(() => {
              // Liste gelmezse ilce secici bos acilir; alan opsiyonel.
            })
        }}
        onKapat={() => setSecici(null)}
      />

      <ListeSecici
        acikMi={secici === 'ilce'}
        baslik={t('profilDuzenle.bolgeIlceSec')}
        secenekler={ilceler}
        secili={ilce}
        onSec={(secilen) => {
          setIlce(secilen)
          setSecici(null)
          setBilgi(null)
        }}
        onKapat={() => setSecici(null)}
      />
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.sayfa,
    paddingBottom: ALT_GEZINME_PAYI,
  },

  etiketSatiri: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  etiket: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginBottom: bosluk.xs,
    marginTop: bosluk.l,
  },
  sayac: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
  },

  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 15,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  girdiOdakli: { borderColor: renk.turuncu },
  cokSatirli: { height: 96, textAlignVertical: 'top', paddingTop: 14 },
  /*
   * ONEKLI GIRDI: "@" alanin icinde sabit duruyor, yazi onun sagindan
   * basliyor. Dikey dolgu SIFIRLANIYOR cunku artik yuksekligi iceride
   * duran `TextInput` belirliyor; `girdi`nin 15'lik dolgusu ustune
   * binseydi alan digerlerinden uzun olurdu.
   */
  onekli: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 0,
  },
  onek: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil },
  oneksizGirdi: {
    flex: 1,
    paddingVertical: 15,
    paddingLeft: 2,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  ipucu: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
    marginTop: bosluk.xs,
    flex: 1,
  },
  ikili: { flexDirection: 'row' as const, gap: bosluk.m },
  yariAlan: { flex: 1 },
  /* Secim alani bir GIRDI gibi gorunuyor ama metin girilmiyor:
     dikey dolgu `girdi` ile ayni tutuldu ki iki alan yan yana ayni
     yukseklikte dursun. */
  secimAlani: { justifyContent: 'center' as const },
  secimYazi: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metin },
  /* Secilmemis hal YER TUTUCU gibi okunuyor - dolu bir degerle
     karistirilmasin. */
  secimBos: { color: renk.metinIkincil },
  secimKapali: { backgroundColor: renk.zemin },
  ulkeAlani: { marginBottom: bosluk.m },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    marginTop: bosluk.m,
  },
  bilgi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.turuncuYazi,
    marginTop: bosluk.m,
  },

  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: bosluk.xl,
    ...golge.yuzer,
  },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
})
