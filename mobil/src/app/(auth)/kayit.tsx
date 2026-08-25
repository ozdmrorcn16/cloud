import { useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { eFormatinaCevir } from '../../../lib/telefon'
import { kayitMetadatasi } from '../../../lib/kvkk'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'

const EN_AZ_SIFRE = 8

/** Onay kutusu. Dokunma hedefi satirin tamami. */
function OnayKutusu({
  isaretli,
  onDegis,
  children,
  etiket,
}: {
  isaretli: boolean
  onDegis: (yeni: boolean) => void
  children: React.ReactNode
  etiket: string
}) {
  return (
    <Pressable
      style={stiller.onaySatiri}
      onPress={() => onDegis(!isaretli)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isaretli }}
      accessibilityLabel={etiket}
    >
      <View style={[stiller.kutu, isaretli && stiller.kutuIsaretli]}>
        {isaretli && <Text style={stiller.tik}>✓</Text>}
      </View>
      <Text style={stiller.onayYazi}>{children}</Text>
    </Pressable>
  )
}

export default function KayitEkrani() {
  const router = useRouter()
  // Dil cihazdan geliyor, kullaniciya sorulmuyor; yine de kayitla
  // birlikte profile yaziliyor ki sunucu tarafi da bilsin.
  const { t, dil } = useDil()
  const [telefon, setTelefon] = useState('')
  const [sifre, setSifre] = useState('')
  const [sifreTekrar, setSifreTekrar] = useState('')
  // Sozlesme onayinin TEK yeri burasi (kullanicinin karari
  // 2026-08-25): ilk acilis ekraninda sorulmuyor, dolayisiyla kutu her
  // zaman isaretsiz baslar.
  const [kabul, setKabul] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [odaklanan, setOdaklanan] = useState<string | null>(null)

  async function kayitOl() {
    setHata(null)

    const eFormatli = eFormatinaCevir(telefon)
    if (!eFormatli) {
      setHata(t('kayit.hataTelefon'))
      return
    }
    if (sifre.length < EN_AZ_SIFRE) {
      setHata(t('kayit.hataSifreKisa', { adet: EN_AZ_SIFRE }))
      return
    }
    if (sifre !== sifreTekrar) {
      setHata(t('kayit.hataSifreUyusmuyor'))
      return
    }
    if (!kabul) {
      setHata(t('kayit.hataOnay'))
      return
    }

    setGonderiliyor(true)
    const { error } = await supabase.auth.signUp({
      phone: eFormatli,
      password: sifre,
      options: { data: kayitMetadatasi({ kabul }, dil) },
    })
    setGonderiliyor(false)

    if (error) {
      setHata(error.message)
      return
    }
    router.push(`/dogrula?telefon=${encodeURIComponent(eFormatli)}`)
  }

  function girdiStili(alan: string) {
    return [stiller.girdi, odaklanan === alan && stiller.girdiOdakli]
  }

  return (
    <ScrollView style={stiller.sayfa} contentContainerStyle={stiller.icerik}>
      <Text style={stiller.marka}>
        slooin<Text style={stiller.markaNokta}>.</Text>
      </Text>

      <Text style={stiller.baslik}>{t('kayit.baslik')}</Text>
      <Text style={stiller.altYazi}>{t('kayit.altYazi')}</Text>

      <Text style={stiller.etiket}>{t('kayit.telefonEtiket')}</Text>
      <TextInput
        style={girdiStili('telefon')}
        placeholder={t('kayit.telefonYerTutucu')}
        placeholderTextColor={renk.metinSoluk}
        keyboardType="phone-pad"
        autoComplete="tel"
        value={telefon}
        onChangeText={setTelefon}
        onFocus={() => setOdaklanan('telefon')}
        onBlur={() => setOdaklanan(null)}
      />

      <Text style={stiller.etiket}>{t('kayit.sifreEtiket')}</Text>
      <TextInput
        style={girdiStili('sifre')}
        placeholder={t('kayit.sifreYerTutucu', { adet: EN_AZ_SIFRE })}
        placeholderTextColor={renk.metinSoluk}
        secureTextEntry
        autoComplete="new-password"
        value={sifre}
        onChangeText={setSifre}
        onFocus={() => setOdaklanan('sifre')}
        onBlur={() => setOdaklanan(null)}
      />

      <Text style={stiller.etiket}>{t('kayit.tekrarEtiket')}</Text>
      <TextInput
        style={girdiStili('tekrar')}
        placeholder={t('kayit.tekrarYerTutucu')}
        placeholderTextColor={renk.metinSoluk}
        secureTextEntry
        autoComplete="new-password"
        value={sifreTekrar}
        onChangeText={setSifreTekrar}
        onFocus={() => setOdaklanan('tekrar')}
        onBlur={() => setOdaklanan(null)}
      />
      {/* Uyusmazlik yazarken soyleniyor, gonderdikten sonra degil. */}
      {sifreTekrar.length > 0 && sifre !== sifreTekrar && (
        <Text style={stiller.uyari}>{t('kayit.sifrelerFarkli')}</Text>
      )}

      <View style={stiller.onayBolumu}>
        {/* TEK onay kutusu (kullanicinin karari): onaylar bolunmuyor.
            Metin kapsayici yazildi - hem aydinlatmayi hem konum
            verisinin islenmesini iceriyor - ve isaretlendiginde
            veritabanina her iki onay turu de kaydediliyor. Yani
            arayuz sade, ispat kaydi eksiksiz. */}
        <OnayKutusu
          isaretli={kabul}
          onDegis={setKabul}
          etiket={t('kayit.onayEtiket')}
        >
          <Text>{t('kayit.onayMetni')} </Text>
          <Text
            style={stiller.baglantiYazi}
            onPress={() => router.push('/gizlilik')}
            accessibilityRole="link"
          >
            {t('kayit.metniOku')}
          </Text>
        </OnayKutusu>

        <Text style={stiller.onayNotu}>{t('kayit.onayNotu')}</Text>
      </View>

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Pressable
        style={({ pressed }) => [
          stiller.birincil,
          pressed && stiller.birincilBasili,
          gonderiliyor && stiller.birincilPasif,
        ]}
        onPress={kayitOl}
        disabled={gonderiliyor}
        accessibilityRole="button"
      >
        <Text style={stiller.birincilYazi}>
          {gonderiliyor ? t('kayit.gonderiliyor') : t('kayit.gonder')}
        </Text>
      </Pressable>

      <Pressable
        style={stiller.ikincil}
        onPress={() => router.push('/giris')}
        accessibilityRole="button"
      >
        <Text style={stiller.ikincilYazi}>
          {t('kayit.zatenHesap')}{' '}
          <Text style={stiller.ikincilVurgu}>{t('kayit.girisYap')}</Text>
        </Text>
      </Pressable>
    </ScrollView>
  )
}

const stiller = StyleSheet.create({
  sayfa: { flex: 1, backgroundColor: renk.zemin },
  icerik: { padding: bosluk.xl, paddingTop: 64, paddingBottom: bosluk.xxl },

  marka: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 22,
    color: renk.metin,
    letterSpacing: -0.5,
  },
  markaNokta: { color: renk.turuncu },

  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginTop: bosluk.xl,
  },
  altYazi: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
    marginTop: bosluk.s,
    marginBottom: bosluk.l,
  },

  etiket: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.l,
    marginBottom: bosluk.s,
  },
  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 14,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  girdiOdakli: { borderColor: renk.turuncu },
  uyari: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.s,
  },

  // --- Dil ---

  // --- Onaylar ---
  onayBolumu: { marginTop: bosluk.xl, gap: bosluk.m },
  onaySatiri: { flexDirection: 'row', gap: bosluk.m, alignItems: 'flex-start' },
  kutu: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: renk.metinSoluk,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  kutuIsaretli: { backgroundColor: renk.turuncu, borderColor: renk.turuncu },
  tik: { color: '#FFFFFF', fontSize: 14, lineHeight: 18, fontFamily: yazi.govdeKalin },
  onayYazi: {
    flex: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
  },
  baglantiYazi: {
    fontFamily: yazi.govdeKalin,
    color: renk.metin,
    textDecorationLine: 'underline',
  },
  onayNotu: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    lineHeight: 16,
    color: renk.metinSoluk,
  },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginTop: bosluk.l,
  },

  // --- Eylemler ---
  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: bosluk.xl,
    ...golge.yuzer,
  },
  birincilBasili: { backgroundColor: renk.turuncuKoyu },
  birincilPasif: { opacity: 0.6 },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.altBaslik,
    color: '#FFFFFF',
  },
  ikincil: { alignItems: 'center', paddingVertical: bosluk.l },
  ikincilYazi: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil },
  ikincilVurgu: { fontFamily: yazi.govdeKalin, color: renk.metin },
})
