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

  // UC ADIM (kullanicinin secimi 2026-09-04). Onceden bes alan tek
  // ekranda duruyordu; her adimda tek is olunca "doldurulacak cok sey
  // var" hissi kayboluyor ve 18 yas engeli ILK adimda cikiyor - yani
  // 18'inden kucuk biri bosuna kullanici adi secip sifre dusunmuyor.
  const [adim, setAdim] = useState<1 | 2 | 3>(1)

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
    // Adimlar arasindayken geri, bir onceki adima doner - girilenler
    // durur. Yalnizca ILK adimda ekrandan cikiyor.
    if (adim > 1) {
      setAdim((adim - 1) as 1 | 2 | 3)
      return
    }
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

  /** O adimin alanlarini dogrular; bos nesne donerse adim gecerli. */
  function adiminHatalari(hangi: 1 | 2 | 3): Record<string, string | null> {
    const hatalar: Record<string, string | null> = {}

    if (hangi === 1) {
      if (ad.trim().length === 0) hatalar.ad = t('profilOlustur.adHata')
      if (!dogum) {
        hatalar.dogum = t('profilOlustur.dogumHataGecersiz')
      } else if (onSekizAltindaMi(new Date(isoTarih(dogum)))) {
        hatalar.dogum = t('profilOlustur.dogumHataYas')
      }
    }

    if (hangi === 2) {
      const normal = kullaniciAdiniNormallestir(kullaniciAdi)
      if (!kullaniciAdiGecerliMi(normal)) {
        hatalar.kullaniciAdi = t('profilOlustur.kullaniciAdiIpucu')
      } else if (adDurumu.hal === 'alinmis') {
        hatalar.kullaniciAdi = t('profilOlustur.kullaniciAdiAlinmis')
      }
    }

    if (hangi === 3) {
      if (sifre.length < EN_AZ_SIFRE) {
        hatalar.sifre = t('profilOlustur.hataSifreKisa', { adet: EN_AZ_SIFRE })
      } else if (sifre !== sifreTekrar) {
        hatalar.sifre = t('profilOlustur.hataSifreUyusmuyor')
      }
    }

    return hatalar
  }

  /**
   * Dugmenin dolu mu soluk mu duracagini belirler.
   *
   * Soluk dugme yine BASILABILIR: basildiginda eksigin ne oldugunu
   * soyluyor. Tamamen devre disi birakmak, kullaniciyi "neden
   * calismiyor" sorusuyla bas basa birakirdi.
   */
  const adimTamam = Object.keys(adiminHatalari(adim)).length === 0

  function ileri() {
    const hatalar = adiminHatalari(adim)
    setAlanHatalari(hatalar)
    if (Object.values(hatalar).some(Boolean)) return
    setHata(null)
    setAdim((adim + 1) as 1 | 2 | 3)
  }

  async function tamamla() {
    setHata(null)
    const kullaniciAdiNormal = kullaniciAdiniNormallestir(kullaniciAdi)

    // Son adimda YALNIZCA sifreyi degil UC ADIMI birden dogruluyoruz:
    // kullanici geri gidip bir alani bozmus olabilir. Hata varsa o
    // alanin bulundugu adima geri donuluyor, yoksa kullanici gorunmeyen
    // bir hata yuzunden takilip kalirdi.
    const hatalar = { ...adiminHatalari(1), ...adiminHatalari(2), ...adiminHatalari(3) }

    setAlanHatalari(hatalar)
    if (Object.values(hatalar).some(Boolean)) {
      if (hatalar.ad || hatalar.dogum) setAdim(1)
      else if (hatalar.kullaniciAdi) setAdim(2)
      return
    }

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

        {/* ILERLEME: uc parca, nerede olundugunu tek bakista soyluyor.
            Adim sayaci ayrica YAZIYLA da veriliyor - ekran okuyucu
            renkli bir cizgiyi okuyamaz. */}
        <View style={stiller.ilerleme}>
          {[1, 2, 3].map((no) => (
            <View key={no} style={[stiller.ilerlemeParca, no <= adim && stiller.ilerlemeDolu]} />
          ))}
        </View>
        <Text style={stiller.adimSayaci}>
          {t('profilOlustur.adimSayaci', { simdiki: adim, toplam: 3 })}
        </Text>

        <Text style={stiller.baslik}>{t(`profilOlustur.adim${adim}Baslik`)}</Text>
        <Text style={stiller.altYazi}>{t(`profilOlustur.adim${adim}Aciklama`)}</Text>

        {adim === 1 && (
          <>
            {/* ETIKETLER GERI GELDI (kullanicinin secimi 2026-09-04).
                2026-08-26'da "etiketi alanin kendi yer tutucusu tasiyor"
                diye kaldirilmislardi; ama yer tutucu ilk harfte siliniyor
                ve kullanici hangi kutunun ne oldugunu hatirlamak zorunda
                kaliyordu. Ustelik sifre alanlarinda etiket zaten VARDI,
                yani ayni formda iki farkli kural isliyordu. */}
            <Text style={stiller.etiketIlk}>{t('profilOlustur.adEtiket')}</Text>
            <TextInput
              style={[
                stiller.girdi,
                odakli === 'ad' && stiller.girdiOdakli,
                Boolean(alanHatalari.ad) && stiller.girdiHatali,
              ]}
              placeholder={t('profilOlustur.adOrnek')}
              placeholderTextColor={renk.metinSoluk}
              autoComplete="name"
              value={ad}
              onChangeText={(yeniAd) => {
                setAd(yeniAd)
                alanHatasiniTemizle('ad')
              }}
              onFocus={() => setOdakli('ad')}
              onBlur={() => setOdakli(null)}
            />
            {alanHatalari.ad ? <Text style={stiller.alanHatasi}>{alanHatalari.ad}</Text> : null}

            {/* Dogum tarihi: yazilmiyor, tekerlekten seciliyor. */}
            <Text style={stiller.etiket}>{t('profilOlustur.dogumEtiket')}</Text>
            <Pressable
              style={[
                stiller.girdi,
                stiller.secimSatiri,
                Boolean(alanHatalari.dogum) && stiller.girdiHatali,
              ]}
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
            {/* YAS KURALI ARTIK ONCEDEN SOYLENIYOR. Onceden yalnizca
                hata metninde vardi: 18'inden kucuk biri butun formu
                doldurup en sonda ogreniyordu. */}
            <Text style={[stiller.ipucu, Boolean(alanHatalari.dogum) && stiller.ipucuHatali]}>
              {alanHatalari.dogum ?? t('profilOlustur.yasNotu')}
            </Text>
          </>
        )}

        {adim === 2 && (
          <>
            <Text style={stiller.etiketIlk}>{t('profilOlustur.kullaniciAdiEtiket')}</Text>
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
            {/* Musaitlik sonucuna AYRILMIS yer: satir her durumda
                duruyor, sonuc gelince ekran ziplayarak buyumuyor. */}
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
          </>
        )}

        {adim === 3 && (
          <>
            <Text style={stiller.etiketIlk}>{t('profilOlustur.sifreEtiket')}</Text>
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
                onChangeText={(yeniSifre) => {
                  setSifre(yeniSifre)
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
              onChangeText={(yeniTekrar) => {
                setSifreTekrar(yeniTekrar)
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
          </>
        )}

        {/* ONAY KUTUSU KALDIRILDI (kullanicinin karari 2026-09-01).
            Kabul KAYIT ekranindaki "Devam"a basmakla veriliyor.
            ISPAT KAYDI KAYBOLMADI: metadata hala `aydinlatma_onayi` ve
            `konum_rizasi` tasiyor. Son adimda yalnizca HATIRLATMA var -
            hesap tam olarak burada olusuyor. */}

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {/* Dugme EN ALTA itiliyor: onceden ortada kaliyordu ve altinda
            ekranin ucte biri kadar bos alan duruyordu. */}
        <View style={stiller.altBlok}>
          <Pressable
            style={[stiller.birincil, !adimTamam && stiller.birincilPasif]}
            onPress={adim === 3 ? tamamla : ileri}
            disabled={gonderiliyor}
            accessibilityRole="button"
          >
            <Text style={stiller.birincilYazi}>
              {adim < 3
                ? t('profilOlustur.devam')
                : gonderiliyor
                  ? t('profilOlustur.gonderiliyor')
                  : t('profilOlustur.gonder')}
            </Text>
          </Pressable>

          {adim === 3 && <Text style={stiller.onayNotu}>{t('profilOlustur.sozlesmeNotu')}</Text>}
        </View>
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
    // `flexGrow` sart: dugmeyi alta iten `altBlok` ancak icerik
    // yuksekligi ekrani doldurdugunda calisiyor. Onceden dugme
    // ortada kaliyor ve altinda genis bir bosluk duruyordu.
    flexGrow: 1,
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.xxl + bosluk.l,
    paddingBottom: bosluk.xxl,
  },

  // Ilerleme cizgisi: uc esit parca, gecilenler dolu.
  ilerleme: { flexDirection: 'row', gap: bosluk.xs, marginBottom: bosluk.m },
  ilerlemeParca: { flex: 1, height: 3, borderRadius: 2, backgroundColor: renk.cizgi },
  ilerlemeDolu: { backgroundColor: renk.turuncu },
  adimSayaci: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    letterSpacing: 0.8,
    color: renk.turuncu,
    textTransform: 'uppercase',
    marginBottom: bosluk.s,
  },

  // Dugme ve sozlesme notu en altta.
  altBlok: { marginTop: 'auto' },

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
  // Adimin ILK etiketi: ustundeki aciklama zaten bosluk biraktigi icin
  // ust pay verilmiyor.
  etiketIlk: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginBottom: bosluk.xs,
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
