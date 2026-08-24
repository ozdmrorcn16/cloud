import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { eFormatinaCevir } from '../../../lib/telefon'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'

export default function GirisEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [telefon, setTelefon] = useState('')
  const [sifre, setSifre] = useState('')
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [odaklanan, setOdaklanan] = useState<'telefon' | 'sifre' | null>(null)

  async function girisYap() {
    setHata(null)
    const eFormatli = eFormatinaCevir(telefon)
    if (!eFormatli) {
      setHata(t('giris.hataTelefon'))
      return
    }

    setGonderiliyor(true)
    const { error } = await supabase.auth.signInWithPassword({ phone: eFormatli, password: sifre })
    setGonderiliyor(false)

    if (error) {
      setHata(error.message)
      return
    }
    router.replace('/')
  }

  return (
    <View style={stiller.kapsayici}>
      {/* Uygulamanin ilk gorunen yuzu. Marka burada tam boy duruyor;
          iceride kuculup ust bara cekiliyor. */}
      <Text style={stiller.marka}>
        slooin<Text style={stiller.markaNokta}>.</Text>
      </Text>

      <Text style={stiller.baslik}>{t('giris.baslik')}</Text>
      <Text style={stiller.altYazi}>{t('giris.altYazi')}</Text>

      <TextInput
        style={[stiller.girdi, odaklanan === 'telefon' && stiller.girdiOdakli]}
        placeholder={t('kayit.telefonYerTutucu')}
        placeholderTextColor={renk.metinSoluk}
        keyboardType="phone-pad"
        value={telefon}
        onChangeText={setTelefon}
        onFocus={() => setOdaklanan('telefon')}
        onBlur={() => setOdaklanan(null)}
      />
      <TextInput
        style={[stiller.girdi, odaklanan === 'sifre' && stiller.girdiOdakli]}
        placeholder={t('giris.sifreYerTutucu')}
        placeholderTextColor={renk.metinSoluk}
        secureTextEntry
        value={sifre}
        onChangeText={setSifre}
        onFocus={() => setOdaklanan('sifre')}
        onBlur={() => setOdaklanan(null)}
      />

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Pressable
        style={[stiller.buton, gonderiliyor && stiller.butonPasif]}
        onPress={girisYap}
        disabled={gonderiliyor}
      >
        <Text style={stiller.butonYazi}>{gonderiliyor ? t('giris.gonderiliyor') : t('giris.gonder')}</Text>
      </Pressable>

      <Pressable style={stiller.baglantiButonu} onPress={() => router.push('/kayit')}>
        <Text style={stiller.baglanti}>
          {t('giris.hesabinYokMu')}{' '}
          <Text style={stiller.baglantiVurgu}>{t('giris.kayitOl')}</Text>
        </Text>
      </Pressable>
    </View>
  )
}

const stiller = StyleSheet.create({
  kapsayici: {
    flex: 1,
    padding: bosluk.xl,
    justifyContent: 'center',
    backgroundColor: renk.zemin,
  },

  marka: {
    fontFamily: yazi.baslikKalin,
    fontSize: 34,
    color: renk.metin,
    letterSpacing: -1,
    marginBottom: bosluk.xxl,
  },
  markaNokta: { color: renk.turuncu },

  baslik: {
    fontFamily: yazi.baslik,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.5,
    marginBottom: bosluk.xs,
  },
  altYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
    marginBottom: bosluk.xl,
  },

  girdi: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.l,
    marginBottom: bosluk.m,
  },
  // Odak turuncuyla belirtiliyor: turuncu "su an burasi etkin" demek.
  girdiOdakli: { borderColor: renk.turuncu, backgroundColor: renk.yuzey },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.turuncuKoyu,
    marginBottom: bosluk.m,
  },

  buton: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: bosluk.l,
    alignItems: 'center',
    marginTop: bosluk.s,
    ...golge.kart,
  },
  butonPasif: { backgroundColor: renk.turuncuKoyu, opacity: 0.6 },
  butonYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.yuzey,
  },

  baglantiButonu: { marginTop: bosluk.xl, alignItems: 'center' },
  baglanti: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  baglantiVurgu: { fontFamily: yazi.govdeKalin, color: renk.turuncu },
})
