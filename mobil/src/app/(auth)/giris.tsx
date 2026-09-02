import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { epostaGecerliMi, epostaNormallestir } from '../../../lib/eposta'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../../tasarim/tema'
import { MarkaYazisi } from '../../tasarim/MarkaYazisi'
import { hataMetni } from '../../../lib/hata-metni'
import { KlavyeKapatan } from '../../tasarim/KlavyeKapatan'
import Svg, { Path } from 'react-native-svg'

/**
 * GIRIS - uygulamanin ilk sayfasi.
 *
 * Kullanicinin karari (2026-08-25): uygulamayi acan kisi dogrudan bu
 * ekrani gorur. Once bir karsilama/tanitim ekrani vardi; kullanici
 * Instagram'in giris ekranini ornek gosterip "ilk sayfa bu olacak"
 * dedi. Gerekce makul: donen kullanici cogunluktur ve onu bir tanitim
 * ekranindan gecirmek her acilista engel cikarmak demek.
 *
 * DUZEN (Instagram'dan alinan iskelet, Slooin kimligiyle):
 *   - Ust bosluk, ortada marka isareti
 *   - Iki alan: e-posta ve sifre
 *   - Dolu birincil buton (turuncu)
 *   - Esnek bosluk
 *   - Altta CERCEVELI ikincil eylem: yeni hesap olustur
 *   - En altta kelime markasi
 *
 * Iki eylemin bicimi bilerek farkli: birincil DOLU, ikincil CERCEVELI.
 * Boylece ekranda tek bir turuncu dolgu kaliyor ve "asil eylem hangisi"
 * sorusu bakisla cevaplaniyor - kimlik kurali da bunu soyluyor
 * (turuncu yalnizca eylem ve canlilik icin).
 */
export default function GirisEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [eposta, setEposta] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [odaklanan, setOdaklanan] = useState<'eposta' | 'sifre' | null>(null)

  const hazir = eposta.trim().length > 0 && sifre.length > 0

  async function girisYap() {
    setHata(null)
    if (!hazir) {
      setHata(t('giris.hataBos'))
      return
    }
    const adres = epostaGecerliMi(eposta) ? epostaNormallestir(eposta) : null
    if (!adres) {
      setHata(t('giris.hataEposta'))
      return
    }

    setGonderiliyor(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: adres,
      password: sifre,
    })
    setGonderiliyor(false)

    if (error) {
      setHata(hataMetni(error))
      return
    }
    router.replace('/')
  }

  /**
   * GERI DONME.
   *
   * `router.back()` TEK BASINA YETMIYOR: karsilama ekrani bu ekrana
   * `replace` ile geciyor, yani gecmiste geri donulecek bir sayfa
   * KALMIYOR ve back() sessizce hicbir sey yapmiyor (kullanicinin
   * bildirdigi kusur, 2026-09-02). Gecmis yoksa dogrudan karsilamaya
   * donuyoruz.
   */
  function geriDon() {
    if (router.canGoBack()) router.back()
    else router.replace('/karsilama')
  }

  return (
    <KlavyeKapatan style={stiller.sayfa}>
      {/* GERI DONME (kullanicinin istegi 2026-09-02). Karsilama
          ekranindan buraya gelen kisi fikrini degistirebilmeli; tek
          cikis yolu uygulamayi kapatmak olmamali. Mutlak konumlu:
          ustteki marka isareti ORTADA kalmali, geri oku onu itmemeli. */}
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

      <View style={stiller.ust}>
        {/* Kelime markasi: marka adini da gosteriyor. Isaret yerine
            burada yazi kullaniliyor - uygulamayi ilk acan kisi adi
            gormeli. */}
        <MarkaYazisi genislik={200} />
      </View>

      <View style={stiller.form}>
        <TextInput
          style={[stiller.girdi, odaklanan === 'eposta' && stiller.girdiOdakli]}
          placeholder={t('giris.epostaYerTutucu')}
          placeholderTextColor={renk.metinSoluk}
          keyboardType="email-address"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          autoCapitalize="none"
          value={eposta}
          onChangeText={setEposta}
          onFocus={() => setOdaklanan('eposta')}
          onBlur={() => setOdaklanan(null)}
        />
        <TextInput
          style={[stiller.girdi, odaklanan === 'sifre' && stiller.girdiOdakli]}
          placeholder={t('giris.sifreYerTutucu')}
          placeholderTextColor={renk.metinSoluk}
          secureTextEntry
          autoComplete="current-password"
          value={sifre}
          onChangeText={setSifre}
          onFocus={() => setOdaklanan('sifre')}
          onBlur={() => setOdaklanan(null)}
        />

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {/* Alanlar bosken buton soluk: basmadan once ne bekledigi
            belli oluyor. Yine de basilabilir ve eksigi soyluyor -
            devre disi bir buton neyin eksik oldugunu anlatmiyor. */}
        <Pressable
          style={({ pressed }) => [
            stiller.birincil,
            !hazir && stiller.birincilSoluk,
            pressed && stiller.birincilBasili,
          ]}
          onPress={girisYap}
          disabled={gonderiliyor}
          accessibilityRole="button"
        >
          <Text style={stiller.birincilYazi}>
            {gonderiliyor ? t('giris.gonderiliyor') : t('giris.gonder')}
          </Text>
        </Pressable>
      </View>

      <View style={stiller.esnekBosluk} />

      <Pressable
        style={({ pressed }) => [stiller.ikincil, pressed && stiller.ikincilBasili]}
        onPress={() => router.push('/kayit')}
        accessibilityRole="button"
      >
        <Text style={stiller.ikincilYazi}>{t('giris.kayitOl')}</Text>
      </Pressable>

    </KlavyeKapatan>
  )
}

const stiller = StyleSheet.create({
  geri: {
    position: 'absolute',
    left: bosluk.l,
    top: bosluk.xxl + bosluk.s,
    zIndex: 1,
  },
  sayfa: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.xl,
    paddingTop: 96,
    paddingBottom: bosluk.xl,
  },

  ust: { alignItems: 'center', marginBottom: 56 },

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

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    paddingHorizontal: bosluk.xs,
  },

  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: bosluk.xs,
  },
  birincilSoluk: { opacity: 0.45 },
  birincilBasili: { backgroundColor: renk.turuncuKoyu },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.altBaslik,
    color: '#FFFFFF',
  },

  esnekBosluk: { flex: 1 },

  // Ikincil eylem CERCEVELI: ekranda tek turuncu dolgu kalsin diye.
  ikincil: {
    borderWidth: 1.5,
    borderColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
  },
  ikincilBasili: { backgroundColor: renk.turuncuZemin },
  ikincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.turuncu,
  },

  marka: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.metinSoluk,
    textAlign: 'center',
    marginTop: bosluk.l,
  },
  markaNokta: { color: renk.turuncu },
})
