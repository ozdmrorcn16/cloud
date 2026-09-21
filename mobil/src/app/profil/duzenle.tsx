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
import {
  instagramNormallestir,
  instagramGecerliMi,
  INSTAGRAM_EN_FAZLA,
} from '../../../lib/instagram'
import { hataMetni } from '../../../lib/hata-metni'
import { useDil } from '../../../lib/dil'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { OnayPenceresi } from '../../tasarim/OnayPenceresi'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'

/** Biyografinin en fazla uzunlugu. */
const EN_FAZLA_BIYOGRAFI = 160

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
  const { t } = useDil()

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
  /** 24 saat icinde ikinci degisiklik denendi: uyari penceresi (kalan saat). */
  const [kalanSaat, setKalanSaat] = useState<number | null>(null)
  /* OTURDUGU BOLGE BU EKRANDA YOK (kullanicinin karari 2026-09-18 aksam):
     bolge yalnizca hesap olusturma adiminda secilir, profilde
     gosterilmez, gizleme ayari yok; secim veri olarak saklanir. Bu
     ekran o sutunlari ne okur ne yazar - `profiliGuncelle` bolge
     alanlarina dokunmaz. */
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
    // 24 SAAT KURALI (kullanicinin karari 2026-09-21): ikinci deneme
    // sunucuya gitmeden uyari penceresi. Kural baglayici olarak yine
    // sunucuda (`kullanici_adi_degistir`).
    if (kadDegisti && sonrakiDegisim && sonrakiDegisim > new Date()) {
      setKalanSaat(Math.max(1, Math.ceil((sonrakiDegisim.getTime() - Date.now()) / 3_600_000)))
      return
    }

    setKaydediliyor(true)
    try {
      if (kadDegisti) {
        await kullaniciAdiniDegistir(kadSade)
        setIlkKullaniciAdi(kadSade)
        setKullaniciAdi(kadSade)
        setSonrakiDegisim(new Date(Date.now() + 24 * 60 * 60 * 1000))
      }
      await profiliGuncelle({
        ad: ad.trim(),
        biyografi: biyografi.trim() || null,
        instagram: instagramSade || null,
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
        {/* Tarih notu KALKTI (kullanicinin istegi 2026-09-21): 24 saat
            icinde ikinci degisiklik denenirse uyari penceresi cikar. */}
        <Text style={stiller.ipucu}>{KULLANICI_ADI_KURALI}</Text>

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

        {/* SONUC MESAJI KAYDET'IN HEMEN USTUNDE, ORTALI (kullanicinin
            istegi 2026-09-18: "kaydedildigi hemen ustunde yazsin, en
            ustte solda degil"). Onceden listenin tepesindeydi; uzun formda
            dugmeye basan kisi mesaji gormek icin yukari kaydirmak zorunda
            kaliyordu. Hata da ayni yerde - ikisi de dugmenin cevabi. */}
        {hata && <Text style={stiller.hata} testID="kaydet-hata">{hata}</Text>}
        {bilgi && !hata && <Text style={stiller.bilgi} testID="kaydet-bilgi">{bilgi}</Text>}

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

      <OnayPenceresi
        acikMi={kalanSaat !== null}
        baslik={t('kullaniciAdiEkrani.tekrarUyariBaslik')}
        aciklama={t('kullaniciAdiEkrani.tekrarUyari', { saat: kalanSaat ?? 0 })}
        eylemEtiketi={t('ortak.tamam')}
        yikici={false}
        tekDugme
        onOnay={() => setKalanSaat(null)}
        onVazgec={() => setKalanSaat(null)}
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

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    textAlign: 'center',
    marginTop: bosluk.l,
    marginBottom: -bosluk.s,
  },
  bilgi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.turuncuYazi,
    textAlign: 'center',
    marginTop: bosluk.l,
    marginBottom: -bosluk.s,
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
