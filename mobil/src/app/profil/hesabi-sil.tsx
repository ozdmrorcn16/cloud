import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Platform, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { hesabiSil } from '../../../lib/hesap'
import { supabase } from '../../../lib/supabase'
import { gonderimKaydet } from '../../../lib/kod-gonderim'
import {
  saglayiciylaGirisYap,
  SaglayiciHazirDegil,
  Vazgecildi,
  type Saglayici,
} from '../../../lib/sosyal-giris'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { hataMetni } from '../../../lib/hata-metni'
import { useDil } from '../../../lib/dil'

/** Kodun hane sayisi - dogrulama ekraniyla ayni. */
const HANE = 6

/**
 * HESAP SILME - E-POSTA ONAY KODUYLA (kullanicinin karari 2026-09-13:
 * "hesap silme adimina e-postaya onaylama kodu getirilsin, e-postaya
 * gelen onay kodunu giren biri hesabini silebilecek, bilgilendirme
 * yazilari da olacak").
 *
 * Akis: bilgilendirme -> "Onay kodu gonder" -> koda gelen 6 hane ->
 * "Hesabimi kalici olarak sil". Kod `verifyOtp` ile dogrulaniyor; bu
 * YENI bir giris sayilir ve `last_sign_in_at`i ilerletir. `hesap-sil`
 * Edge Function'i parola gelmediginde tam olarak buna bakiyor: son
 * giris 10 dakikadan TAZE degilse silmiyor. Yani kapi SUNUCUDA -
 * istemci kod adimini atlayamaz.
 *
 * Onceki kapi PAROLAYDI (2026-08-22). Parola giris icin duruyor; silme
 * ekranindan kalkti. Sunucu parolali yolu da kabul etmeye devam ediyor
 * (web formu ve canli testler icin), yeni ekran onu kullanmiyor.
 *
 * APPLE / GOOGLE ILE ACILMIS HESAP: Apple "e-postami gizle" adresine
 * kod ULASMIYOR (gonderici alan adi Apple'da kayitli degil; slooin.com
 * + SMTP kurulunca cozulecek). O kisi icin ayrica "Apple ile dogrula"
 * dugmesi var - saglayiciyla yeniden giris de tazelik kapisini aciyor.
 * Dugme yalnizca hesap o saglayiciyla acildiysa gorunuyor.
 *
 * Dondurma alternatifi ayni ekranda: "kararsizim" ihtiyacini o
 * karsiliyor. Bekleme suresi YOK (spec karar 67).
 */
export default function HesabiSilEkrani() {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const [hata, setHata] = useState<string | null>(null)
  const [calisiyor, setCalisiyor] = useState(false)
  const [kodGonderildi, setKodGonderildi] = useState(false)
  const [kod, setKod] = useState('')
  const [eposta, setEposta] = useState<string | null>(null)
  const [saglayicilar, setSaglayicilar] = useState<Saglayici[]>([])

  useEffect(() => {
    let gecerli = true
    supabase.auth.getUser().then(({ data }) => {
      if (!gecerli) return
      const kullanici = data.user
      setEposta(kullanici?.email ?? null)
      const liste = (kullanici?.app_metadata?.providers as string[] | undefined) ?? []
      setSaglayicilar(
        liste.filter(
          (s): s is Saglayici => s === 'google' || (s === 'apple' && Platform.OS === 'ios')
        )
      )
    })
    return () => {
      gecerli = false
    }
  }, [])

  async function silmeyiTamamla() {
    setCalisiyor(true)
    setHata(null)
    try {
      await hesabiSil()
      await supabase.auth.signOut()
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setCalisiyor(false)
    }
  }

  /** Adim 1: e-postaya onay kodu gonder. */
  async function kodGonder() {
    if (!eposta) {
      setHata(t('hesabiSil.epostaYok'))
      return
    }
    setHata(null)
    setCalisiyor(true)
    // `shouldCreateUser: false`: bu bir kayit degil, var olan hesabin
    // sahipligini ispat. Yeni kullanici acilmaz.
    const { error } = await supabase.auth.signInWithOtp({
      email: eposta,
      options: { shouldCreateUser: false },
    })
    setCalisiyor(false)
    if (error) {
      setHata(hataMetni(error))
      return
    }
    await gonderimKaydet(eposta)
    setKodGonderildi(true)
  }

  /** Adim 2: kodu dogrula, sonra sil. */
  async function kodlaSil() {
    if (!eposta) return
    if (kod.length < HANE) {
      setHata(t('hesabiSil.kodEksik'))
      return
    }
    setHata(null)
    setCalisiyor(true)
    const { error } = await supabase.auth.verifyOtp({ email: eposta, token: kod, type: 'email' })
    if (error) {
      setCalisiyor(false)
      setHata(hataMetni(error))
      return
    }
    await silmeyiTamamla()
  }

  /** Apple / Google ile yeniden dogrulayip sil. */
  async function saglayiciylaSil(saglayici: Saglayici) {
    setHata(null)
    try {
      await saglayiciylaGirisYap(saglayici)
    } catch (e) {
      if (e instanceof Vazgecildi) return
      if (e instanceof SaglayiciHazirDegil) {
        setHata(t('kayit.hataSaglayiciKapali'))
        return
      }
      setHata(hataMetni(e))
      return
    }
    await silmeyiTamamla()
  }

  return (
    <ScrollView style={stiller.sayfa} contentContainerStyle={stiller.kapsayici}>
      <UstCubuk baslik={t('hesabiSil.baslik')} geriEtiketi={t('ortak.geri')} />

      {/* BILGILENDIRME: ne silinir, ne kalir, geri alinamaz. */}
      <Text style={stiller.metin}>{t('hesabiSil.uyari')}</Text>
      <Text style={stiller.altBaslik}>{t('hesabiSil.neSilinirBaslik')}</Text>
      <Text style={stiller.ipucu}>{t('hesabiSil.neSilinir')}</Text>
      <Text style={stiller.altBaslik}>{t('hesabiSil.neKalirBaslik')}</Text>
      <Text style={stiller.ipucu}>{t('hesabiSil.neKalir')}</Text>

      <Pressable style={stiller.ikincilButon} onPress={() => router.back()} accessibilityRole="button">
        <Text style={stiller.ikincilButonMetni}>{t('hesabiSil.dondur')}</Text>
      </Pressable>

      {/* ONAY KODU */}
      <Text style={stiller.etiket}>
        {kodGonderildi
          ? t('hesabiSil.kodGonderildi', { eposta: eposta ?? '' })
          : t('hesabiSil.kodAciklama', { eposta: eposta ?? '' })}
      </Text>

      {!kodGonderildi ? (
        <Pressable
          style={stiller.anahtarli}
          onPress={kodGonder}
          disabled={calisiyor}
          accessibilityRole="button"
          testID="kod-gonder"
        >
          <Text style={stiller.anahtarliYazi}>
            {calisiyor ? t('ortak.gonderiliyor') : t('hesabiSil.kodGonder')}
          </Text>
        </Pressable>
      ) : (
        <>
          <TextInput
            style={stiller.girdi}
            placeholder={t('hesabiSil.kodYerTutucu')}
            placeholderTextColor={renk.metinIkincil}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            value={kod}
            onChangeText={(y) => setKod(y.replace(/\D/g, '').slice(0, HANE))}
            testID="dogrulama-kodu"
          />
          <Pressable
            style={stiller.tehlikeButonu}
            onPress={kodlaSil}
            disabled={calisiyor}
            accessibilityRole="button"
            testID="kodla-sil"
          >
            <Text style={stiller.tehlikeButonMetni}>{t('hesabiSil.sil')}</Text>
          </Pressable>
          <Pressable
            style={stiller.ikincilButon}
            onPress={kodGonder}
            disabled={calisiyor}
            accessibilityRole="button"
          >
            <Text style={stiller.ikincilButonMetni}>{t('hesabiSil.tekrarGonder')}</Text>
          </Pressable>
        </>
      )}

      {saglayicilar.length > 0 && (
        <Text style={stiller.ipucu}>{t('hesabiSil.saglayiciAciklama')}</Text>
      )}
      {saglayicilar.map((s) => (
        <Pressable
          key={s}
          style={stiller.anahtarli}
          onPress={() => saglayiciylaSil(s)}
          disabled={calisiyor}
          accessibilityRole="button"
          testID={`saglayici-${s}`}
        >
          <Text style={stiller.anahtarliYazi}>
            {t(s === 'apple' ? 'hesabiSil.appleIleDogrula' : 'hesabiSil.googleIleDogrula')}
          </Text>
        </Pressable>
      ))}

      {hata && <Text style={stiller.hata}>{hata}</Text>}
    </ScrollView>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  sayfa: { flex: 1, backgroundColor: renk.zemin },
  kapsayici: {
    padding: bosluk.xl,
    gap: bosluk.m,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  metin: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metin,
  },
  altBaslik: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
    marginTop: bosluk.xs,
  },
  ipucu: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metinIkincil,
  },
  etiket: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metinIkincil,
    marginTop: bosluk.l,
  },
  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 14,
    fontFamily: yazi.govde,
    fontSize: olcek.altBaslik,
    letterSpacing: 6,
    textAlign: 'center',
    color: renk.metin,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
  },
  ikincilButon: { paddingVertical: bosluk.m, alignItems: 'center' },
  ikincilButonMetni: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  /* Hayalet buton: kod gonder / saglayiciyla dogrula. Turuncu dolgu
     degil - ekrandaki tek dolu buton kirmizi "sil". */
  anahtarli: {
    borderWidth: 1.5,
    borderColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 14,
    alignItems: 'center',
  },
  anahtarliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.turuncuYazi,
  },
  // Silme geri alinamaz: uygulamadaki tek kirmizi zemin burada, bilerek.
  tehlikeButonu: {
    backgroundColor: renk.yikici,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: bosluk.s,
  },
  tehlikeButonMetni: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
})
