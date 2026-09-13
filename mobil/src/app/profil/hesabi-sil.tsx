import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, Platform, ScrollView } from 'react-native'
import { router } from 'expo-router'
import Svg, { Path, Rect } from 'react-native-svg'
import { hesabiSil, hesabiDondur } from '../../../lib/hesap'
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
import { AppleIkonu, GoogleIkonu } from '../../tasarim/sosyal-ikonlar'
import { hataMetni } from '../../../lib/hata-metni'
import { useDil } from '../../../lib/dil'

/** Kodun hane sayisi - dogrulama ekraniyla ayni. */
const HANE = 6

/** Apple'in "e-postami gizle" aktarma adresi mi? */
function gizliAppleAdresiMi(eposta: string | null): boolean {
  return !!eposta && eposta.toLowerCase().endsWith('@privaterelay.appleid.com')
}

/**
 * Uzun adresi karta sigdirmak icin yerel kismi kisaltir:
 * `dsh5zw82yk@privaterelay.appleid.com` -> `dsh5…@privaterelay.appleid.com`.
 * Kisa adres oldugu gibi kalir - kisaltma bilgi degil yer kazandirir.
 */
function adresiKisalt(eposta: string, enFazla = 28): string {
  if (eposta.length <= enFazla) return eposta
  const at = eposta.indexOf('@')
  if (at <= 4) return eposta
  return `${eposta.slice(0, 4)}…${eposta.slice(at)}`
}

/**
 * HESAP SILME EKRANI - kullanicinin verdigi referans gorsele gore
 * (2026-09-13, "Boyle yap"). Yerlesim yukaridan asagi:
 *
 *   ust cubuk "Hesabi sil"
 *   kirmizi cop ikonu (acik kirmizi kutuda)
 *   "Hesabini silmek istedigine emin misin?" + geri alinamaz uyarisi
 *   SEFTALI KART: "Sadece ara vermek mi istiyorsun? / Hesabimi dondur"
 *      -> basinca AYNI SAYFADA aciliyor (kullanicinin kurali: baska
 *         sayfaya yonlendirme), aciklama + Evet, dondur / Vazgec
 *   "Kimligini dogrula" + aciklama
 *   GRI KART: zarf ikonu, "E-posta adresin", adres, altinda not
 *      (Apple gizli adresiyse "Apple hesabina bagli adrese yonlendirilir")
 *   TURUNCU dolu "Onay kodu gonder"  -> kod gelince yerini kod kutusu +
 *      KIRMIZI "Hesabimi kalici olarak sil" + "Kodu tekrar gonder" aliyor
 *   "veya" ayraci + saglayici dugmesi (Apple SIYAH, Google beyaz/cizgili;
 *      yalnizca hesap o saglayiciyla acildiysa - e-postayla acilan
 *      hesapta hicbiri yok)
 *   "Vazgec"
 *
 * SUNUCU KAPISI DEGISMEDI: `hesap-sil` (surum 7) parola gelmezse son
 * girisin 10 dk taze olmasini istiyor; `verifyOtp` ve saglayici girisi
 * o tazeligi sagliyor. Istemci kod adimini atlayamaz.
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
  const [dondurmaAcik, setDondurmaAcik] = useState(false)

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

  /* Dondurma ayni sayfada; dondurduktan sonra cikis, yoksa kisi
     dondurulmus ama girisli bir ara durumda kalir (spec karar 66). */
  async function dondur() {
    setCalisiyor(true)
    setHata(null)
    try {
      await hesabiDondur()
      await supabase.auth.signOut()
    } catch (e) {
      setHata(hataMetni(e))
      setCalisiyor(false)
    }
  }

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

  const gizliApple = gizliAppleAdresiMi(eposta)

  return (
    <ScrollView style={stiller.sayfa} contentContainerStyle={stiller.kapsayici}>
      <UstCubuk baslik={t('hesabiSil.baslik')} geriEtiketi={t('ortak.geri')} />

      {/* Kirmizi cop ikonu - ekrandaki kirmizi ogeler yalnizca bu ve sil dugmesi. */}
      <View style={stiller.ikonKutusu} testID="cop-ikonu">
        <Svg width={28} height={28} viewBox="0 0 24 24">
          <Path
            d="M5 7h14M9 7V4.5h6V7M7 7l1 13h8l1-13M10 11v5M14 11v5"
            stroke={renk.yikici}
            strokeWidth={1.9}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <Text style={stiller.soru}>{t('hesabiSil.soru')}</Text>
      <Text style={stiller.uyari}>{t('hesabiSil.uyari')}</Text>

      {/* DONDURMA - seftali kart, ayni sayfada acilir. */}
      <Pressable
        style={stiller.dondurKarti}
        onPress={() => setDondurmaAcik((a) => !a)}
        disabled={calisiyor}
        accessibilityRole="button"
        testID="dondur-ac"
      >
        <View style={stiller.durakDairesi}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Rect x={7} y={5} width={3.5} height={14} rx={1.5} fill={renk.turuncu} />
            <Rect x={13.5} y={5} width={3.5} height={14} rx={1.5} fill={renk.turuncu} />
          </Svg>
        </View>
        <View style={stiller.dondurMetni}>
          <Text style={stiller.dondurSoru}>{t('hesabiSil.araSoru')}</Text>
          <Text style={stiller.dondurEylem}>{t('hesabiSil.dondur')}</Text>
        </View>
        <View style={[stiller.ok, dondurmaAcik && stiller.okAcik]} />
      </Pressable>
      {dondurmaAcik && (
        <View style={stiller.dondurmaKutusu} testID="dondurma-kutusu">
          <Text style={stiller.ipucu}>{t('ayarlar.dondurAciklama')}</Text>
          <View style={stiller.dondurmaButonlari}>
            <Pressable
              onPress={dondur}
              disabled={calisiyor}
              accessibilityRole="button"
              testID="dondur-onayla"
              hitSlop={8}
            >
              <Text style={stiller.dondurEvet}>{t('ayarlar.dondurEvet')}</Text>
            </Pressable>
            <Pressable
              onPress={() => setDondurmaAcik(false)}
              disabled={calisiyor}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={stiller.vazgecKucuk}>{t('ayarlar.vazgec')}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* KIMLIK DOGRULAMA */}
      <Text style={stiller.bolumBasligi}>{t('hesabiSil.dogrulaBaslik')}</Text>
      <Text style={stiller.bolumAciklama}>{t('hesabiSil.dogrulaAciklama')}</Text>

      <View style={stiller.epostaKarti}>
        <View style={stiller.epostaSatiri}>
          <Svg width={26} height={26} viewBox="0 0 24 24">
            <Rect
              x={3}
              y={5}
              width={18}
              height={14}
              rx={2.5}
              stroke={renk.metin}
              strokeWidth={1.7}
              fill="none"
            />
            <Path d="M3.5 7l8.5 6 8.5-6" stroke={renk.metin} strokeWidth={1.7} fill="none" />
          </Svg>
          <View style={stiller.epostaMetni}>
            <Text style={stiller.epostaEtiket}>{t('hesabiSil.epostaEtiket')}</Text>
            <Text style={stiller.epostaDeger} numberOfLines={1} testID="eposta-degeri">
              {eposta ? adresiKisalt(eposta) : '—'}
            </Text>
          </View>
        </View>
        <View style={stiller.epostaAyrac} />
        {/* Apple "e-postami gizle": adres `@privaterelay.appleid.com` olur ve
            kullaniciya yabanci gorunur; aktarim ancak gonderici alan adi
            Apple'da kayitliysa calisir - o yuzden bu hesaplar icin asil yol
            asagidaki "Apple ile onayla". */}
        <Text style={stiller.epostaNot} testID={gizliApple ? 'gizli-apple-notu' : 'kod-notu'}>
          {kodGonderildi
            ? t('hesabiSil.kodGonderildi')
            : gizliApple
              ? t('hesabiSil.gizliAppleAdresi')
              : t('hesabiSil.kodNot')}
        </Text>
      </View>

      {!kodGonderildi ? (
        <Pressable
          style={[stiller.dolu, calisiyor && stiller.soluk]}
          onPress={kodGonder}
          disabled={calisiyor}
          accessibilityRole="button"
          testID="kod-gonder"
        >
          <Text style={stiller.doluYazi}>
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
          {/* Silme geri alinamaz: ekrandaki tek kirmizi dolgu, bilerek. */}
          <Pressable
            style={[stiller.tehlike, calisiyor && stiller.soluk]}
            onPress={kodlaSil}
            disabled={calisiyor}
            accessibilityRole="button"
            testID="kodla-sil"
          >
            <Text style={stiller.doluYazi}>{t('hesabiSil.sil')}</Text>
          </Pressable>
          <Pressable
            style={stiller.metinButonu}
            onPress={kodGonder}
            disabled={calisiyor}
            accessibilityRole="button"
          >
            <Text style={stiller.metinButonuYazi}>{t('hesabiSil.tekrarGonder')}</Text>
          </Pressable>
        </>
      )}

      {saglayicilar.length > 0 && (
        <View style={stiller.ayrac}>
          <View style={stiller.ayracCizgi} />
          <Text style={stiller.ayracYazi}>{t('kayit.veya')}</Text>
          <View style={stiller.ayracCizgi} />
        </View>
      )}
      {/* Apple'in dugmesi SIYAH (Apple'in kendi kilavuzu), Google'inki acik
          zeminli cizgili (Google'in kilavuzu). */}
      {saglayicilar.map((s) => (
        <Pressable
          key={s}
          style={[s === 'apple' ? stiller.appleButonu : stiller.googleButonu, calisiyor && stiller.soluk]}
          onPress={() => saglayiciylaSil(s)}
          disabled={calisiyor}
          accessibilityRole="button"
          testID={`saglayici-${s}`}
        >
          {s === 'apple' ? <AppleIkonu boyut={19} renk="#FFFFFF" /> : <GoogleIkonu boyut={19} />}
          <Text style={s === 'apple' ? stiller.appleYazi : stiller.googleYazi}>
            {t(s === 'apple' ? 'hesabiSil.appleIleDogrula' : 'hesabiSil.googleIleDogrula')}
          </Text>
        </Pressable>
      ))}

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Pressable
        style={stiller.metinButonu}
        onPress={() => router.back()}
        disabled={calisiyor}
        accessibilityRole="button"
        testID="vazgec"
      >
        <Text style={stiller.vazgecYazi}>{t('ayarlar.vazgec')}</Text>
      </Pressable>
    </ScrollView>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  sayfa: { flex: 1, backgroundColor: renk.zemin },
  kapsayici: {
    paddingHorizontal: bosluk.sayfa,
    paddingTop: bosluk.xl,
    gap: bosluk.m,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  // '1A' = %10 alfa: acik modda soluk kirmizi kutu; koyu modda da ayni
  // jetondan turedigi icin zeminden kopmuyor.
  ikonKutusu: {
    width: 56,
    height: 56,
    borderRadius: yuvarlak.kart,
    backgroundColor: renk.yikici + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: bosluk.s,
  },
  soru: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: renk.metin,
    marginTop: bosluk.xs,
  },
  uyari: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
  },

  dondurKarti: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.kart,
    padding: bosluk.l,
    marginTop: bosluk.s,
  },
  durakDairesi: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: renk.turuncu + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dondurMetni: { flex: 1, gap: 2 },
  dondurSoru: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  dondurEylem: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.turuncuYazi,
  },
  ok: {
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: renk.metinIkincil,
    transform: [{ rotate: '45deg' }],
    marginRight: 4,
  },
  okAcik: { transform: [{ rotate: '135deg' }] },
  dondurmaKutusu: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    padding: bosluk.l,
    gap: bosluk.m,
  },
  dondurmaButonlari: { flexDirection: 'row', gap: bosluk.xl, alignItems: 'center' },
  dondurEvet: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.turuncuYazi,
  },
  vazgecKucuk: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
  ipucu: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metinIkincil,
  },

  bolumBasligi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 22,
    letterSpacing: -0.3,
    color: renk.metin,
    marginTop: bosluk.l,
  },
  bolumAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginTop: -bosluk.xs,
  },
  // Sicak gri kart: `karsilamaZemini` uygulamadaki tek acik-gri jeton ve
  // iki palette de zeminden bir ton koyu.
  epostaKarti: {
    backgroundColor: renk.karsilamaZemini,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    padding: bosluk.l,
    gap: bosluk.m,
  },
  epostaSatiri: { flexDirection: 'row', alignItems: 'center', gap: bosluk.l },
  epostaMetni: { flex: 1, gap: 2 },
  epostaEtiket: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  epostaDeger: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  epostaAyrac: { height: 1, backgroundColor: renk.cizgi },
  epostaNot: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metinIkincil,
  },

  dolu: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.kart,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: bosluk.xs,
  },
  tehlike: {
    backgroundColor: renk.yikici,
    borderRadius: yuvarlak.kart,
    paddingVertical: 16,
    alignItems: 'center',
  },
  soluk: { opacity: 0.6 },
  doluYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
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

  ayrac: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    marginVertical: bosluk.xs,
  },
  ayracCizgi: { flex: 1, height: 1, backgroundColor: renk.cizgi },
  ayracYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  appleButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: bosluk.m,
    backgroundColor: '#000000',
    borderRadius: yuvarlak.kart,
    paddingVertical: 16,
  },
  appleYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
  googleButonu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: bosluk.m,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingVertical: 16,
  },
  googleYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    textAlign: 'center',
  },
  metinButonu: { paddingVertical: bosluk.m, alignItems: 'center' },
  metinButonuYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  vazgecYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
})
