import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { supabase } from '../../../lib/supabase'
import { epostaGecerliMi, epostaNormallestir } from '../../../lib/eposta'
import { epostaKayitliMi } from '../../../lib/eposta-kayit'
import { EN_AZ_SIFRE, sifreYeterliMi } from '../../../lib/sifre'
import { useDil } from '../../../lib/dil'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { hataMetni } from '../../../lib/hata-metni'
import { KlavyeKapatan } from '../../tasarim/KlavyeKapatan'
import {
  BEKLEME_SANIYE,
  gonderimDurumu,
  gonderimKaydet,
} from '../../../lib/kod-gonderim'

/** Kodun hane sayisi - Supabase e-posta OTP'si alti hane gonderiyor. */
const HANE = 6

type Asama = 'eposta' | 'kod' | 'yeniSifre'

/**
 * SIFRE SIFIRLAMA (kullanicinin istegi 2026-09-12: "hesabi olan
 * kullanicinin giris yapma sayfasina sifreni unuttun mu ekle").
 *
 * Uc asama TEK EKRANDA: e-posta -> 6 haneli kod -> yeni sifre.
 *
 * NEDEN `resetPasswordForEmail` DEGIL: o yol Supabase'in "Reset
 * Password" sablonunu kullanir ve o sablon bir BAGLANTI tasir
 * (ConfirmationURL). Telefonda baglantiyi uygulamaya dusurmek derin
 * baglanti kurulumu ister, ustelik sablon hic duzenlenmedi ve panel
 * bugun ulasilamaz durumda. Bunun yerine `signInWithOtp` kullaniliyor:
 * o, kayit akisinin zaten kullandigi ve `{{ .Token }}` tasidigi
 * DOGRULANMIS "Magic Link" sablonunu gonderiyor (2026-09-02 olcumu).
 * Kod dogrulaninca oturum aciliyor ve `updateUser` ile sifre yazilıyor.
 * Yani hicbir panel ayari degismeden bugun calisiyor.
 *
 * `shouldCreateUser: false` SART: bu ekran hesap ACMAZ. Onsuz, olmayan
 * bir adrese kod istemek sessizce yeni bir hesap yaratirdi.
 *
 * HESAP VAR MI KONTROLU kayit ekranindaki `epostaKayitliMi` ile ayni
 * yol (cihaz + IP hiz sinirli RPC). Kayit ekrani zaten "bu adreste
 * hesap var" diyor; burada "yok" demek yeni bir sizinti acmiyor ve
 * kullanicinin "bosa is yaptirma, erken hata ver" kurali bunu
 * gerektiriyor. RPC cevap vermezse (tavan, ag) kontrol atlanir ve
 * karar `signInWithOtp`in kendi cevabina birakilir: `otp_disabled`
 * kodu "bu adreste hesap yok" demek.
 *
 * KOK YONLENDIRME BU EKRANI MUAF TUTUYOR (`_layout.tsx`): kod
 * dogrulaninca oturum aciliyor; muaf olmasa kisi sifre yazamadan
 * uygulamaya atilirdi.
 */
export default function SifreSifirlaEkrani() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const { eposta: gelenEposta } = useLocalSearchParams<{ eposta?: string }>()

  const [asama, setAsama] = useState<Asama>('eposta')
  const [eposta, setEposta] = useState(gelenEposta ?? '')
  const [adres, setAdres] = useState('')
  const [kod, setKod] = useState('')
  const [sifre, setSifre] = useState('')
  const [sifreTekrar, setSifreTekrar] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const [mesgul, setMesgul] = useState(false)
  const [odaklanan, setOdaklanan] = useState<string | null>(null)
  const [kalanSaniye, setKalanSaniye] = useState(0)
  const [hakKalmadi, setHakKalmadi] = useState(false)
  const kodGirdiRef = useRef<TextInput>(null)

  useEffect(() => {
    if (kalanSaniye <= 0) return
    const zamanlayici = setTimeout(() => setKalanSaniye((s) => s - 1), 1000)
    return () => clearTimeout(zamanlayici)
  }, [kalanSaniye])

  /**
   * Kodu gonderir. Ilk gonderimde ve "tekrar gonder"de ayni yol:
   * `signInWithOtp` mevcut hesaba yeni kod uretir. `resend` DEGIL -
   * o yalnizca signup/email_change turlerini biliyor.
   */
  async function kodGonder(hedef: string): Promise<boolean> {
    const { error } = await supabase.auth.signInWithOtp({
      email: hedef,
      options: { shouldCreateUser: false },
    })
    if (error) {
      const hesapYok =
        (error as { code?: string }).code === 'otp_disabled' ||
        /signups? not allowed/i.test(error.message)
      setHata(hesapYok ? t('sifreSifirla.hataHesapYok') : hataMetni(error))
      return false
    }
    await gonderimKaydet(hedef)
    return true
  }

  async function epostaGonder() {
    setHata(null)
    setBilgi(null)
    const temiz = epostaGecerliMi(eposta) ? epostaNormallestir(eposta) : null
    if (!temiz) {
      setHata(t('sifreSifirla.hataEposta'))
      return
    }

    setMesgul(true)
    // Cihaz bazli geri sayim: ayni adrese az once kod istenmisse
    // yeniden postalamak yerine kod ekranina gecip sayaci gosteriyoruz.
    const durum = await gonderimDurumu(temiz)
    if (durum.kalanHak <= 0) {
      setMesgul(false)
      setHakKalmadi(true)
      setHata(t('sifreSifirla.hakKalmadi'))
      return
    }

    // Ayni adrese az once kod gitmisse (kisi geri donup yeniden
    // basti) ikinci bir posta atilmiyor: eldeki kod hala gecerli,
    // kod ekranina sayacla birlikte donuluyor.
    if (durum.kalanSaniye > 0) {
      setMesgul(false)
      setAdres(temiz)
      setKod('')
      setKalanSaniye(durum.kalanSaniye)
      setAsama('kod')
      return
    }

    const kayitli = await epostaKayitliMi(temiz).catch(() => null)
    if (kayitli === false) {
      setMesgul(false)
      setHata(t('sifreSifirla.hataHesapYok'))
      return
    }

    const gitti = await kodGonder(temiz)
    setMesgul(false)
    if (!gitti) return

    setAdres(temiz)
    setKod('')
    setKalanSaniye(BEKLEME_SANIYE)
    setHakKalmadi(durum.kalanHak - 1 <= 0)
    setAsama('kod')
  }

  async function dogrula(girilen: string = kod) {
    if (girilen.length < HANE) {
      setHata(t('sifreSifirla.hataEksik'))
      return
    }
    setHata(null)
    setBilgi(null)
    setMesgul(true)
    const { error } = await supabase.auth.verifyOtp({
      email: adres,
      token: girilen,
      type: 'email',
    })
    setMesgul(false)
    if (error) {
      setHata(hataMetni(error))
      return
    }
    setAsama('yeniSifre')
  }

  function kodDegisti(yeni: string) {
    const temiz = yeni.replace(/\D/g, '').slice(0, HANE)
    setKod(temiz)
    setHata(null)
    if (temiz.length === HANE) dogrula(temiz)
  }

  async function tekrarGonder() {
    if (kalanSaniye > 0 || hakKalmadi) return
    setHata(null)
    const { kalanSaniye: kalan, kalanHak } = await gonderimDurumu(adres)
    if (kalan > 0) {
      setKalanSaniye(kalan)
      return
    }
    if (kalanHak <= 0) {
      setHakKalmadi(true)
      setHata(t('sifreSifirla.hakKalmadi'))
      return
    }
    const gitti = await kodGonder(adres)
    if (!gitti) return
    setBilgi(t('sifreSifirla.tekrarGonderildi'))
    setKalanSaniye(BEKLEME_SANIYE)
    setHakKalmadi(kalanHak - 1 <= 0)
  }

  async function sifreKaydet() {
    setHata(null)
    if (!sifreYeterliMi(sifre)) {
      setHata(t('sifreSifirla.hataSifreKisa', { adet: EN_AZ_SIFRE }))
      return
    }
    if (sifre !== sifreTekrar) {
      setHata(t('sifreSifirla.hataSifreEslesmiyor'))
      return
    }
    setMesgul(true)
    const { error } = await supabase.auth.updateUser({ password: sifre })
    setMesgul(false)
    if (error) {
      setHata(hataMetni(error))
      return
    }
    // Oturum zaten acik (kod dogrulamasi acti); sifre de yazildi.
    // Kisi dogrudan uygulamaya giriyor - yeniden giris yaptirmak
    // az once ispat ettigi seyi ikinci kez istemek olurdu.
    router.replace('/')
  }

  function geriDon() {
    if (asama === 'kod') {
      setAsama('eposta')
      setHata(null)
      setBilgi(null)
      return
    }
    if (router.canGoBack()) router.back()
    else router.replace('/giris')
  }

  const gecerliAdim = asama === 'yeniSifre' ? null : geriDon

  return (
    <KlavyeKapatan style={stiller.sayfa}>
      {/* Yeni sifre asamasinda geri yok: oturum acildi, kod harcandi;
          geri gidilecek anlamli bir yer kalmadi. */}
      {gecerliAdim && (
        <Pressable
          style={stiller.geri}
          onPress={gecerliAdim}
          accessibilityRole="button"
          accessibilityLabel={t('sifreSifirla.geri')}
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
      )}

      {asama === 'eposta' && (
        <>
          <Text style={stiller.baslik}>{t('sifreSifirla.baslik')}</Text>
          <Text style={stiller.aciklama}>{t('sifreSifirla.aciklama')}</Text>
          <TextInput
            style={[stiller.girdi, odaklanan === 'eposta' && stiller.girdiOdakli]}
            placeholder={t('sifreSifirla.epostaYerTutucu')}
            placeholderTextColor={renk.metinIkincil}
            keyboardType="email-address"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            autoCapitalize="none"
            autoFocus={!gelenEposta}
            value={eposta}
            onChangeText={(v) => {
              setEposta(v)
              setHata(null)
            }}
            onFocus={() => setOdaklanan('eposta')}
            onBlur={() => setOdaklanan(null)}
          />
          {hata && <Text style={stiller.hata}>{hata}</Text>}
          <Pressable
            style={({ pressed }) => [stiller.birincil, pressed && stiller.birincilBasili]}
            onPress={epostaGonder}
            disabled={mesgul}
            accessibilityRole="button"
          >
            <Text style={stiller.birincilYazi}>
              {mesgul ? t('sifreSifirla.gonderiliyor') : t('sifreSifirla.kodGonder')}
            </Text>
          </Pressable>
        </>
      )}

      {asama === 'kod' && (
        <>
          <Text style={stiller.baslik}>{t('sifreSifirla.kodBaslik')}</Text>
          <Text style={stiller.aciklama}>{t('sifreSifirla.kodAciklama', { eposta: adres })}</Text>

          {/* Alti kutu gorsel, altta TEK girdi - dogrula ekraniyla
              ayni gerekce: silme, yapistirma ve otomatik doldurma alti
              alana bolununce bozuluyor. */}
          <Pressable
            style={stiller.kutular}
            onPress={() => kodGirdiRef.current?.focus()}
            accessibilityRole="button"
            accessibilityLabel={t('sifreSifirla.kodEtiketi')}
          >
            {Array.from({ length: HANE }).map((_, i) => (
              <View
                key={i}
                style={[
                  stiller.kutu,
                  i === kod.length && stiller.kutuSiradaki,
                  kod[i] !== undefined && stiller.kutuDolu,
                ]}
              >
                <Text style={stiller.hane}>{kod[i] ?? ''}</Text>
              </View>
            ))}
          </Pressable>
          <TextInput
            ref={kodGirdiRef}
            style={stiller.gizliGirdi}
            value={kod}
            onChangeText={kodDegisti}
            keyboardType="number-pad"
            maxLength={HANE}
            autoFocus
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            placeholder={t('sifreSifirla.kodEtiketi')}
          />

          {hata && <Text style={stiller.hata}>{hata}</Text>}
          {bilgi && !hata && <Text style={stiller.bilgi}>{bilgi}</Text>}

          <Pressable
            style={({ pressed }) => [stiller.birincil, pressed && stiller.birincilBasili]}
            onPress={() => dogrula()}
            disabled={mesgul}
            accessibilityRole="button"
          >
            <Text style={stiller.birincilYazi}>
              {mesgul ? t('sifreSifirla.dogrulaniyor') : t('sifreSifirla.dogrula')}
            </Text>
          </Pressable>

          <View style={stiller.tekrarAlani}>
            <Text style={stiller.tekrarSoru}>{t('sifreSifirla.kodGelmedi')}</Text>
            <Text style={stiller.spamNotu}>{t('sifreSifirla.spamNotu')}</Text>
            {hakKalmadi ? (
              <Text style={stiller.tekrarBekle}>{t('sifreSifirla.hakKalmadi')}</Text>
            ) : kalanSaniye > 0 ? (
              <Text style={stiller.tekrarBekle}>
                {t('sifreSifirla.tekrarBekle', { saniye: kalanSaniye })}
              </Text>
            ) : (
              <Pressable onPress={tekrarGonder} accessibilityRole="button" hitSlop={8}>
                <Text style={stiller.tekrarYazi}>{t('sifreSifirla.tekrarGonder')}</Text>
              </Pressable>
            )}
          </View>
        </>
      )}

      {asama === 'yeniSifre' && (
        <>
          <Text style={stiller.baslik}>{t('sifreSifirla.yeniBaslik')}</Text>
          <Text style={stiller.aciklama}>{t('sifreSifirla.yeniAciklama')}</Text>
          <View style={stiller.form}>
            <TextInput
              style={[stiller.girdi, odaklanan === 'sifre' && stiller.girdiOdakli]}
              placeholder={t('sifreSifirla.sifreYerTutucu', { adet: EN_AZ_SIFRE })}
              placeholderTextColor={renk.metinIkincil}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              autoFocus
              value={sifre}
              onChangeText={(v) => {
                setSifre(v)
                setHata(null)
              }}
              onFocus={() => setOdaklanan('sifre')}
              onBlur={() => setOdaklanan(null)}
            />
            <TextInput
              style={[stiller.girdi, odaklanan === 'sifreTekrar' && stiller.girdiOdakli]}
              placeholder={t('sifreSifirla.sifreTekrarYerTutucu')}
              placeholderTextColor={renk.metinIkincil}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              value={sifreTekrar}
              onChangeText={(v) => {
                setSifreTekrar(v)
                setHata(null)
              }}
              onFocus={() => setOdaklanan('sifreTekrar')}
              onBlur={() => setOdaklanan(null)}
            />
          </View>
          {hata && <Text style={stiller.hata}>{hata}</Text>}
          <Pressable
            style={({ pressed }) => [stiller.birincil, pressed && stiller.birincilBasili]}
            onPress={sifreKaydet}
            disabled={mesgul}
            accessibilityRole="button"
          >
            <Text style={stiller.birincilYazi}>
              {mesgul ? t('sifreSifirla.kaydediliyor') : t('sifreSifirla.kaydet')}
            </Text>
          </Pressable>
        </>
      )}
    </KlavyeKapatan>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  sayfa: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.sayfa,
    paddingTop: bosluk.xxl + bosluk.m,
  },
  geri: { alignSelf: 'flex-start', marginBottom: bosluk.xl },

  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginBottom: bosluk.s,
  },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginBottom: bosluk.xl,
  },

  form: { gap: bosluk.m },
  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 16,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  girdiOdakli: { borderColor: renk.turuncu },

  kutular: { flexDirection: 'row', gap: bosluk.s },
  kutu: {
    flex: 1,
    aspectRatio: 0.82,
    backgroundColor: renk.yuzey,
    borderWidth: 1.5,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kutuSiradaki: { borderColor: renk.turuncu },
  kutuDolu: { borderColor: renk.metinSoluk },
  hane: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik + 3,
    color: renk.metin,
  },
  gizliGirdi: { position: 'absolute', opacity: 0, height: 1, width: 1 },

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
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: bosluk.xl,
    ...golge.yuzer,
  },
  birincilBasili: { backgroundColor: renk.turuncuBasili },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },

  tekrarAlani: { alignItems: 'center', gap: bosluk.xs, marginTop: bosluk.l },
  tekrarSoru: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  spamNotu: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
    textAlign: 'center',
    marginTop: 2,
  },
  tekrarYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },
  tekrarBekle: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
  },
})
