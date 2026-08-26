import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { eFormatinaCevir } from '../../../lib/telefon'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'
import { MarkaYazisi } from '../../tasarim/MarkaYazisi'

/**
 * KAYDIN ILK ADIMI: yalnizca telefon numarasi.
 *
 * Kullanicinin karari (2026-08-25): "Hesabi olustur dedikten sonra
 * sadece telefon numarasi girilmesi gereken bir ekran ve yazdiktan
 * sonra dogrulama ekrani." Onceki halde telefon, sifre, sifre tekrari
 * ve onay kutusu tek ekrandaydi; ilk adim artik tek soru soruyor.
 *
 * Burada `signUp` DEGIL `signInWithOtp` cagriliyor: sifre henuz
 * yok. Bu cagri kullaniciyi olusturuyor ve SMS kodunu gonderiyor;
 * sifre ile KVKK onayi dogrulamadan sonraki adimda aliniyor
 * (sifre-belirle ekrani).
 *
 * Numarasi zaten kayitli biri buraya numarasini yazarsa yine kod
 * gelir ve giris yapmis olur - WhatsApp/Instagram akisinin ayni.
 */
export default function KayitEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [telefon, setTelefon] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [odakli, setOdakli] = useState(false)

  async function kodGonder() {
    setHata(null)

    const eFormatli = eFormatinaCevir(telefon)
    if (!eFormatli) {
      setHata(t('kayit.hataTelefon'))
      return
    }

    setGonderiliyor(true)
    const { error } = await supabase.auth.signInWithOtp({ phone: eFormatli })
    setGonderiliyor(false)

    if (error) {
      setHata(error.message)
      return
    }
    router.push(`/dogrula?telefon=${encodeURIComponent(eFormatli)}`)
  }

  return (
    <View style={stiller.sayfa}>
      <MarkaYazisi genislik={128} style={stiller.marka} />

      {/* Baslik ve altindaki not KALDIRILDI (kullanicinin karari
          2026-08-26). Ekranda tek bir alan var ve alanin kendi
          etiketi zaten ne istendigini soyluyor; baslik onu tekrar
          ediyordu. */}
      <Text style={stiller.etiket}>{t('kayit.telefonEtiket')}</Text>
      <TextInput
        style={[stiller.girdi, odakli && stiller.girdiOdakli]}
        placeholder={t('kayit.telefonYerTutucu')}
        placeholderTextColor={renk.metinSoluk}
        keyboardType="phone-pad"
        autoComplete="tel"
        value={telefon}
        onChangeText={(yeni) => {
          setTelefon(yeni)
          setHata(null)
        }}
        onFocus={() => setOdakli(true)}
        onBlur={() => setOdakli(false)}
      />

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Pressable
        style={stiller.birincil}
        onPress={kodGonder}
        disabled={gonderiliyor}
        accessibilityRole="button"
      >
        <Text style={stiller.birincilYazi}>
          {gonderiliyor ? t('kayit.gonderiliyor') : t('kayit.gonder')}
        </Text>
      </Pressable>

      <Pressable
        style={stiller.ikincil}
        onPress={() => router.replace('/giris')}
        accessibilityRole="button"
      >
        <Text style={stiller.ikincilYazi}>
          {t('kayit.zatenHesap')} <Text style={stiller.ikincilVurgu}>{t('kayit.girisYap')}</Text>
        </Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  sayfa: {
    flex: 1,
    backgroundColor: renk.zemin,
    paddingHorizontal: bosluk.xl,
    // Marka yukari alindi (kullanicinin istegi): 56 -> 32.
    paddingTop: bosluk.xxl,
  },
  // Sayfa payinin biraz DISINA tasiyor: kullanici markayi "biraz daha
  // sola" istedi. Marka yazisinin solunda kendi bosluğu var, bu yuzden
  // -6 ile optik olarak sayfa payina oturuyor.
  marka: { marginLeft: -6, marginBottom: bosluk.xxl + bosluk.l },

  etiket: {
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

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
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
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },

  ikincil: { alignItems: 'center', paddingVertical: bosluk.l, marginTop: bosluk.s },
  ikincilYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  ikincilVurgu: { fontFamily: yazi.govdeKalin, color: renk.metin },
})
