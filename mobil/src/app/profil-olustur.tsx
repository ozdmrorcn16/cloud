import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { supabase } from '../../lib/supabase'
import { onSekizAltindaMi } from '../../lib/yas'
import { useOturum } from '../../lib/oturum'
import { useDil } from '../../lib/dil'
import { kayitMetadatasi } from '../../lib/kvkk'
import {
  kullaniciAdiGecerliMi,
  kullaniciAdiniNormallestir,
  kullaniciAdiMusaitMi,
} from '../../lib/kullanici-adi'
import { TarihSecici, type Tarih } from '../tasarim/TarihSecici'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../tasarim/tema'
import { useRenk, useStiller } from '../tasarim/tema-baglami'
import { hataMetni } from '../../lib/hata-metni'

/** Kullanici adi musaitlik sorgusunun bekletme suresi. */
const BEKLETME_MS = 300

/** Sifrenin en az uzunlugu. */
const EN_AZ_SIFRE = 8

/** Yas siniri; tarih tekerlegi bundan daha yeni bir yil gostermiyor. */
const EN_AZ_YAS = 18
/** Tekerlekteki en eski yil. */
const EN_FAZLA_YAS = 100

type AdDurumu =
  | { hal: 'bos' }
  | { hal: 'bicim' }
  | { hal: 'kontrol' }
  | { hal: 'musait' }
  | { hal: 'alinmis' }

/**
 * HESABIN OLUSTUGU EKRAN - kayit akisinin son adimi.
 *
 * Kullanicinin karari (2026-08-25): bu ekranda ad-soyad TEK kutuda
 * alinir, dogum tarihi ELLE YAZILMAZ (kaydirmali secici), altinda
 * kullanici adi, sifre, sifre dogrulama ve KAPSAMLI SOZLESME ONAYI
 * durur. Onay verilmeden hesap olusmaz ve sonraki adima gecilmez.
 *
 * Profil fotografi bu ekranda YOK: kullanicinin acik istegi. Kayit
 * akisi kisa kalsin diye fotograf sonraya birakildi.
 *
 * Bu ekrana gelindiginde telefon dogrulanmis, yani Supabase kullanicisi
 * ZATEN VAR ve oturum acik. Burada uc sey birden yaziliyor:
 *   1. sifre        -> auth.updateUser({ password })
 *   2. onay kaydi   -> ayni cagrinin `data` alani; auth.users uzerindeki
 *                      tetikleyici bunu kvkk_onaylari tablosuna aliyor
 *   3. profil satiri -> public.profiller
 * Sira onemli: sifre ve onay once yaziliyor, cunku profil eklemesi
 * kullanici adi cakismasi yuzunden basarisiz olabiliyor ve o durumda
 * kullanici ayni ekranda baska bir ad deneyerek devam ediyor.
 *
 * Kullanici adi musaitligi BEKLETMELI sorgulaniyor ve gec donen cevap
 * sira numarasiyla eleniyor; yoksa hizli yazan birinde ekranda onceki
 * harfin sonucu kalabiliyor.
 */
export default function ProfilOlusturEkrani() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t, dil } = useDil()
  const { profilKontrolunuYenile } = useOturum()

  const [ad, setAd] = useState('')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [adDurumu, setAdDurumu] = useState<AdDurumu>({ hal: 'bos' })
  const [dogum, setDogum] = useState<Tarih | null>(null)
  const [seciciAcik, setSeciciAcik] = useState(false)
  const [sifre, setSifre] = useState('')
  const [sifreTekrar, setSifreTekrar] = useState('')
  const [sifreGorunur, setSifreGorunur] = useState(false)

  const [alanHatalari, setAlanHatalari] = useState<Record<string, string | null>>({})
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [odakli, setOdakli] = useState<string | null>(null)

  // Gec donen musaitlik cevaplarini elemek icin sira numarasi.
  const sorguSirasi = useRef(0)

  const buYil = new Date().getFullYear()
  const enGecYil = buYil - EN_AZ_YAS
  const enErkenYil = buYil - EN_FAZLA_YAS
  const seciciBaslangici: Tarih = dogum ?? { gun: 1, ay: 1, yil: buYil - 25 }

  /**
   * Geri: acilis ekranina doner.
   *
   * OTURUM KAPATILIYOR ve bu sart. Bu ekrana gelindiginde telefon
   * dogrulanmis, yani Supabase kullanicisi VAR ve oturum acik. Sadece
   * `/karsilama`ya gitmek ise yaramazdi: kok yonlendirme kontrolu
   * profili olmayan acik bir oturumu aninda buraya geri gonderiyor
   * (`oturum && profilVarMi === false`). Cikis yapmak, kullaniciyi
   * gercekten disari birakmanin tek yolu.
   *
   * Yarim kalan hesap kayboluyor degil: ayni numara tekrar girildiginde
   * yeni bir kod geliyor ve akis yine bu ekranda devam ediyor.
   */
  async function geriDon() {
    await supabase.auth.signOut()
    router.replace('/karsilama')
  }

  function alanHatasiniTemizle(alan: string) {
    setAlanHatalari((mevcut) => (mevcut[alan] ? { ...mevcut, [alan]: null } : mevcut))
    setHata(null)
  }

  function kullaniciAdiDegisti(metin: string) {
    setKullaniciAdi(metin)
    alanHatasiniTemizle('kullaniciAdi')

    const normal = kullaniciAdiniNormallestir(metin)
    if (normal.length === 0) {
      setAdDurumu({ hal: 'bos' })
      return
    }
    if (!kullaniciAdiGecerliMi(normal)) {
      setAdDurumu({ hal: 'bicim' })
      return
    }
    setAdDurumu({ hal: 'kontrol' })
  }

  // Musaitlik sorgusu ayri bir etkide: her tusa basista degil, yazma
  // durunca bir kez calisiyor.
  useEffect(() => {
    if (adDurumu.hal !== 'kontrol') return
    const normal = kullaniciAdiniNormallestir(kullaniciAdi)
    const sira = ++sorguSirasi.current

    const zamanlayici = setTimeout(() => {
      kullaniciAdiMusaitMi(normal)
        .then((musait) => {
          if (sira !== sorguSirasi.current) return
          setAdDurumu({ hal: musait ? 'musait' : 'alinmis' })
        })
        .catch(() => {
          if (sira !== sorguSirasi.current) return
          // Ag hatasinda sessizce ipucuna donuyoruz: kullaniciya
          // "alinmis" demek yanlis olur, sunucu kaydederken zaten
          // benzersizligi zorluyor.
          setAdDurumu({ hal: 'bos' })
        })
    }, BEKLETME_MS)

    return () => clearTimeout(zamanlayici)
  }, [adDurumu.hal, kullaniciAdi])

  /** Secilen tarihi veritabaninin bekledigi ISO bicimine cevirir. */
  function isoTarih(tarih: Tarih): string {
    const iki = (n: number) => String(n).padStart(2, '0')
    return `${tarih.yil}-${iki(tarih.ay)}-${iki(tarih.gun)}`
  }

  async function tamamla() {
    setHata(null)
    const hatalar: Record<string, string | null> = {}

    if (ad.trim().length === 0) hatalar.ad = t('profilOlustur.adHata')

    if (!dogum) {
      hatalar.dogum = t('profilOlustur.dogumHataGecersiz')
    } else if (onSekizAltindaMi(new Date(isoTarih(dogum)))) {
      hatalar.dogum = t('profilOlustur.dogumHataYas')
    }

    const kullaniciAdiNormal = kullaniciAdiniNormallestir(kullaniciAdi)
    if (!kullaniciAdiGecerliMi(kullaniciAdiNormal)) {
      hatalar.kullaniciAdi = t('profilOlustur.kullaniciAdiIpucu')
    } else if (adDurumu.hal === 'alinmis') {
      hatalar.kullaniciAdi = t('profilOlustur.kullaniciAdiAlinmis')
    }

    if (sifre.length < EN_AZ_SIFRE) {
      hatalar.sifre = t('profilOlustur.hataSifreKisa', { adet: EN_AZ_SIFRE })
    } else if (sifre !== sifreTekrar) {
      hatalar.sifre = t('profilOlustur.hataSifreUyusmuyor')
    }


    setAlanHatalari(hatalar)
    if (Object.values(hatalar).some(Boolean)) return

    setGonderiliyor(true)
    try {
      const { data: kullaniciVerisi } = await supabase.auth.getUser()
      const kullaniciId = kullaniciVerisi.user?.id

      if (!kullaniciId) {
        setHata(t('profilOlustur.oturumDustu'))
        return
      }

      // Sifre ve onay metadatasi tek cagrida.
      const { error: kimlikHatasi } = await supabase.auth.updateUser({
        password: sifre,
        // Onay kayit ekranindaki "Devam" ile verildi; kayit buraya,
        // metadata uzerinden gecirilerek kvkk_onaylari'na yaziliyor.
        data: kayitMetadatasi({ kabul: true }, dil),
      })
      if (kimlikHatasi) {
        setHata(hataMetni(kimlikHatasi))
        return
      }

      const { error } = await supabase.from('profiller').insert({
        id: kullaniciId,
        ad: ad.trim(),
        kullanici_adi: kullaniciAdiNormal,
        dogum_tarihi: isoTarih(dogum as Tarih),
      })

      if (error) {
        if (error.code === '23505') {
          setAlanHatalari({ kullaniciAdi: t('profilOlustur.kullaniciAdiAlinmis') })
          setAdDurumu({ hal: 'alinmis' })
        } else {
          setHata(hataMetni(error))
        }
        return
      }

      await profilKontrolunuYenile()
      router.replace('/')
    } catch (hataNesnesi) {
      setHata(
        hataNesnesi instanceof Error ? hataMetni(hataNesnesi) : t('profilOlustur.beklenmeyenHata')
      )
    } finally {
      setGonderiliyor(false)
    }
  }

  const kullaniciAdiHatali = Boolean(alanHatalari.kullaniciAdi) || adDurumu.hal === 'alinmis'
  const tekrarUyari =
    sifreTekrar.length > 0 && sifre !== sifreTekrar && !alanHatalari.sifre
      ? t('profilOlustur.sifrelerFarkli')
      : null

  return (
    <>
      <ScrollView
        style={stiller.sayfa}
        contentContainerStyle={stiller.icerik}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          style={stiller.geri}
          onPress={geriDon}
          accessibilityRole="button"
          accessibilityLabel={t('ortak.geri')}
          hitSlop={12}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path
              d="M15 5l-7 7 7 7"
              stroke={renk.metin}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Pressable>

        <Text style={stiller.baslik}>{t('profilOlustur.baslik')}</Text>
        {/* Ad ve soyad TEK kutuda. Basliklar KALDIRILDI (kullanicinin
            karari 2026-08-26): etiketi alanin kendi yer tutucusu
            tasiyor, ayrica baslik yazmak ayni seyi iki kez soyluyordu. */}
        <TextInput
          style={[
            stiller.girdi,
            odakli === 'ad' && stiller.girdiOdakli,
            Boolean(alanHatalari.ad) && stiller.girdiHatali,
          ]}
          placeholder={t('profilOlustur.adYerTutucu')}
          placeholderTextColor={renk.metinSoluk}
          autoComplete="name"
          value={ad}
          onChangeText={(yeni) => {
            setAd(yeni)
            alanHatasiniTemizle('ad')
          }}
          onFocus={() => setOdakli('ad')}
          onBlur={() => setOdakli(null)}
        />
        {alanHatalari.ad ? <Text style={stiller.alanHatasi}>{alanHatalari.ad}</Text> : null}

        {/* Dogum tarihi: yazilmiyor, tekerlekten seciliyor. */}
        <Pressable
          style={[stiller.girdi, stiller.secimSatiri, Boolean(alanHatalari.dogum) && stiller.girdiHatali]}
          onPress={() => {
            setSeciciAcik(true)
            alanHatasiniTemizle('dogum')
          }}
          accessibilityRole="button"
          accessibilityLabel={t('profilOlustur.dogumEtiket')}
        >
          <Text style={dogum ? stiller.secimYazi : stiller.secimYerTutucu}>
            {dogum
              ? `${dogum.gun} ${t(`profilOlustur.aylar.${dogum.ay}`)} ${dogum.yil}`
              : t('profilOlustur.dogumSec')}
          </Text>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path
              d="M6 9l6 6 6-6"
              stroke={renk.metinSoluk}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Pressable>
        {/* Ipucu metni KALDIRILDI; yalnizca hata durumunda satir
            aciliyor. */}
        {alanHatalari.dogum ? (
          <Text style={[stiller.ipucu, stiller.ipucuHatali]}>{alanHatalari.dogum}</Text>
        ) : null}

        {/* Kullanici adi */}
        <View
          style={[
            stiller.girdi,
            stiller.onekliGirdi,
            odakli === 'kullaniciAdi' && stiller.girdiOdakli,
            kullaniciAdiHatali && stiller.girdiHatali,
          ]}
        >
          <Text style={stiller.onek}>@</Text>
          <TextInput
            style={stiller.onekliYazi}
            placeholder={t('profilOlustur.kullaniciAdiYerTutucu')}
            placeholderTextColor={renk.metinSoluk}
            autoCapitalize="none"
            autoCorrect={false}
            value={kullaniciAdi}
            onChangeText={kullaniciAdiDegisti}
            onFocus={() => setOdakli('kullaniciAdi')}
            onBlur={() => setOdakli(null)}
          />
          {adDurumu.hal === 'musait' && (
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke={renk.metin}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          )}
        </View>
        {/* Musaitlik sonucuna AYRILMIS yer: satir her durumda duruyor,
            sonuc gelince ekran ziplayarak buyumuyor. */}
        <Text style={[stiller.ipucu, kullaniciAdiHatali && stiller.ipucuHatali]}>
          {alanHatalari.kullaniciAdi
            ? alanHatalari.kullaniciAdi
            : adDurumu.hal === 'kontrol'
              ? t('profilOlustur.kullaniciAdiKontrol')
              : adDurumu.hal === 'musait'
                ? t('profilOlustur.kullaniciAdiMusait')
                : adDurumu.hal === 'alinmis'
                  ? t('profilOlustur.kullaniciAdiAlinmis')
                  : t('profilOlustur.kullaniciAdiIpucu')}
        </Text>

        {/* Sifre */}
        <Text style={stiller.etiket}>{t('profilOlustur.sifreEtiket')}</Text>
        <View
          style={[
            stiller.girdi,
            stiller.onekliGirdi,
            odakli === 'sifre' && stiller.girdiOdakli,
            Boolean(alanHatalari.sifre) && stiller.girdiHatali,
          ]}
        >
          <TextInput
            style={stiller.onekliYazi}
            placeholder={t('profilOlustur.sifreYerTutucu', { adet: EN_AZ_SIFRE })}
            placeholderTextColor={renk.metinSoluk}
            secureTextEntry={!sifreGorunur}
            autoCapitalize="none"
            value={sifre}
            onChangeText={(yeni) => {
              setSifre(yeni)
              alanHatasiniTemizle('sifre')
            }}
            onFocus={() => setOdakli('sifre')}
            onBlur={() => setOdakli(null)}
          />
          <Pressable
            onPress={() => setSifreGorunur(!sifreGorunur)}
            accessibilityRole="button"
            accessibilityLabel={
              sifreGorunur ? t('profilOlustur.sifreGizle') : t('profilOlustur.sifreGoster')
            }
            hitSlop={10}
          >
            <Text style={stiller.gosterYazi}>
              {sifreGorunur ? t('profilOlustur.sifreGizle') : t('profilOlustur.sifreGoster')}
            </Text>
          </Pressable>
        </View>

        {/* Sifre dogrulama */}
        <Text style={stiller.etiket}>{t('profilOlustur.tekrarEtiket')}</Text>
        <TextInput
          style={[
            stiller.girdi,
            odakli === 'tekrar' && stiller.girdiOdakli,
            Boolean(alanHatalari.sifre) && stiller.girdiHatali,
          ]}
          placeholder={t('profilOlustur.tekrarYerTutucu')}
          placeholderTextColor={renk.metinSoluk}
          secureTextEntry={!sifreGorunur}
          autoCapitalize="none"
          value={sifreTekrar}
          onChangeText={(yeni) => {
            setSifreTekrar(yeni)
            alanHatasiniTemizle('sifre')
          }}
          onFocus={() => setOdakli('tekrar')}
          onBlur={() => setOdakli(null)}
        />
        {alanHatalari.sifre ? (
          <Text style={stiller.alanHatasi}>{alanHatalari.sifre}</Text>
        ) : tekrarUyari ? (
          <Text style={stiller.ipucu}>{tekrarUyari}</Text>
        ) : null}

        {/* ONAY KUTUSU KALDIRILDI (kullanicinin karari 2026-09-01).
            Kabul artik KAYIT ekranindaki "Devam"a basmakla veriliyor;
            orada "Devam ederek Kullanim kosullarimizi kabul ettigini ve
            Gizlilik Politikamizi okudugunu onayliyorsun" yaziyor.

            ISPAT KAYDI KAYBOLMADI: asagidaki metadata hala
            `aydinlatma_onayi` ve `konum_rizasi` tasiyor, yani
            kvkk_onaylari tablosundaki kayit yerinde. Degisen tek sey
            onayin ALINDIGI YER - kutu degil, akisa devam etmek. */}

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        <Pressable
          style={stiller.birincil}
          onPress={tamamla}
          disabled={gonderiliyor}
          accessibilityRole="button"
        >
          <Text style={stiller.birincilYazi}>
            {gonderiliyor ? t('profilOlustur.gonderiliyor') : t('profilOlustur.gonder')}
          </Text>
        </Pressable>
      </ScrollView>

      <TarihSecici
        gorunur={seciciAcik}
        baslangic={seciciBaslangici}
        enGecYil={enGecYil}
        enErkenYil={enErkenYil}
        onKapat={() => setSeciciAcik(false)}
        onSec={(secilen) => {
          setDogum(secilen)
          setSeciciAcik(false)
          alanHatasiniTemizle('dogum')
        }}
      />
    </>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  sayfa: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.xxl + bosluk.l,
    paddingBottom: bosluk.xxl + bosluk.xl,
  },

  geri: { alignSelf: 'flex-start', marginBottom: bosluk.l },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginBottom: bosluk.s,
  },
  altYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginBottom: bosluk.xl,
  },

  etiket: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginBottom: bosluk.xs,
    marginTop: bosluk.l,
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
  girdiHatali: { borderColor: renk.yikici },

  // Tarih satiri bir girdi gibi duruyor ama basilinca tekerlek aciliyor.
  secimSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secimYazi: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metin },
  secimYerTutucu: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinSoluk },

  // "@" oneki girdinin ICINDE duruyor: kullanici adinin basina @
  // yazilmayacagini soylemenin en kisa yolu. Ayni kalip sifre
  // alanindaki goster/gizle dugmesi icin de kullaniliyor.
  onekliGirdi: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  onek: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinSoluk },
  onekliYazi: {
    flex: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
    // Web'de girdi kendi cercevesini ciziyor; disaridaki kutu yeterli.
    borderWidth: 0,
    padding: 0,
  },
  gosterYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
    marginLeft: bosluk.s,
  },

  ipucu: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 18,
    color: renk.metinIkincil,
    marginTop: bosluk.s,
  },
  ipucuHatali: { color: renk.yikici, fontFamily: yazi.govdeOrta },

  alanHatasi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    marginTop: bosluk.s,
  },

  onaySatiri: {
    flexDirection: 'row',
    gap: bosluk.m,
    alignItems: 'flex-start',
    marginTop: bosluk.xl,
  },
  kutu: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kutuIsaretli: { backgroundColor: renk.turuncu, borderColor: renk.turuncu },
  kutuHatali: { borderColor: renk.yikici },
  onayYazi: {
    flex: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
  },
  baglanti: { fontFamily: yazi.govdeKalin, color: renk.metin },
  onayNotu: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    lineHeight: 17,
    color: renk.metinSoluk,
    marginTop: bosluk.m,
  },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
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
  // Onay verilmeden dugme SOLUK duruyor: sozlesme onaylanmadan hesap
  // olusmayacagi basmadan once gorunuyor.
  birincilPasif: { opacity: 0.45 },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
})
