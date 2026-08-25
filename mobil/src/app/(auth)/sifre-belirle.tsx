import { useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { supabase } from '../../../lib/supabase'
import { kayitMetadatasi } from '../../../lib/kvkk'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'

const EN_AZ_SIFRE = 8

/**
 * KAYDIN SON ADIMI: sifre ve tek onay kutusu.
 *
 * Akis ucе bolundu (kullanicinin karari 2026-08-25): telefon -> kod ->
 * sifre. Bu ekrana gelindiginde oturum ZATEN ACIK - numara
 * dogrulandigi anda Supabase oturumu veriyor. Yani burada kullanici
 * olusturulmuyor, var olan kullaniciya sifre ve onay ekleniyor.
 *
 * ONAY BURADA (KVKK): tek kutu, iki onay turu birden kaydediliyor
 * (bkz. lib/kvkk.ts). Kayit metadatasi `updateUser` ile yaziliyor ve
 * veritabanindaki tetikleyici onu kvkk_onaylari tablosuna aliyor -
 * onay kaydinin kacirilmasi mumkun degil. Tetikleyici bu adim icin
 * ozellikle guncellendi (20260825170000): eskiden yalnizca INSERT'te
 * calisiyordu.
 */
export default function SifreBelirleEkrani() {
  const router = useRouter()
  const { t, dil } = useDil()
  const [sifre, setSifre] = useState('')
  const [sifreTekrar, setSifreTekrar] = useState('')
  const [kabul, setKabul] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [odaklanan, setOdaklanan] = useState<string | null>(null)

  async function tamamla() {
    setHata(null)

    if (sifre.length < EN_AZ_SIFRE) {
      setHata(t('sifreBelirle.hataSifreKisa', { adet: EN_AZ_SIFRE }))
      return
    }
    if (sifre !== sifreTekrar) {
      setHata(t('sifreBelirle.hataSifreUyusmuyor'))
      return
    }
    if (!kabul) {
      setHata(t('sifreBelirle.hataOnay'))
      return
    }

    setGonderiliyor(true)
    const { error } = await supabase.auth.updateUser({
      password: sifre,
      data: kayitMetadatasi({ kabul }, dil),
    })
    setGonderiliyor(false)

    if (error) {
      setHata(error.message)
      return
    }
    router.replace('/profil-olustur')
  }

  const tekrarUyari =
    sifreTekrar.length > 0 && sifre !== sifreTekrar ? t('sifreBelirle.sifrelerFarkli') : null

  return (
    <ScrollView style={stiller.sayfa} contentContainerStyle={stiller.icerik}>
      <Pressable
        style={stiller.geri}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('sifreBelirle.geri')}
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

      <Text style={stiller.baslik}>{t('sifreBelirle.baslik')}</Text>
      <Text style={stiller.altYazi}>{t('sifreBelirle.altYazi')}</Text>

      <Text style={stiller.etiket}>{t('sifreBelirle.sifreEtiket')}</Text>
      <TextInput
        style={[stiller.girdi, odaklanan === 'sifre' && stiller.girdiOdakli]}
        placeholder={t('sifreBelirle.sifreYerTutucu', { adet: EN_AZ_SIFRE })}
        placeholderTextColor={renk.metinSoluk}
        secureTextEntry
        value={sifre}
        onChangeText={(y) => {
          setSifre(y)
          setHata(null)
        }}
        onFocus={() => setOdaklanan('sifre')}
        onBlur={() => setOdaklanan(null)}
      />

      <Text style={stiller.etiket}>{t('sifreBelirle.tekrarEtiket')}</Text>
      <TextInput
        style={[stiller.girdi, odaklanan === 'tekrar' && stiller.girdiOdakli]}
        placeholder={t('sifreBelirle.tekrarYerTutucu')}
        placeholderTextColor={renk.metinSoluk}
        secureTextEntry
        value={sifreTekrar}
        onChangeText={(y) => {
          setSifreTekrar(y)
          setHata(null)
        }}
        onFocus={() => setOdaklanan('tekrar')}
        onBlur={() => setOdaklanan(null)}
      />
      {tekrarUyari && <Text style={stiller.uyari}>{tekrarUyari}</Text>}

      {/* TEK onay kutusu (karar 2026-08-24): onaylar bolunmuyor.
          Isaretlendiginde veritabanina hem aydinlatma hem konum rizasi
          yaziliyor. */}
      <Pressable
        style={stiller.onaySatiri}
        onPress={() => {
          setKabul(!kabul)
          setHata(null)
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: kabul }}
        accessibilityLabel={t('sifreBelirle.onayEtiket')}
      >
        <View style={[stiller.kutu, kabul && stiller.kutuIsaretli]}>
          {kabul && <Text style={stiller.tik}>✓</Text>}
        </View>
        <Text style={stiller.onayYazi}>
          {t('sifreBelirle.onayMetni')}{' '}
          <Text
            style={stiller.baglanti}
            onPress={() => router.push('/gizlilik')}
            accessibilityRole="link"
          >
            {t('sifreBelirle.metniOku')}
          </Text>
        </Text>
      </Pressable>

      <Text style={stiller.onayNotu}>{t('sifreBelirle.onayNotu')}</Text>

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <Pressable
        style={stiller.birincil}
        onPress={tamamla}
        disabled={gonderiliyor}
        accessibilityRole="button"
      >
        <Text style={stiller.birincilYazi}>
          {gonderiliyor ? t('sifreBelirle.gonderiliyor') : t('sifreBelirle.gonder')}
        </Text>
      </Pressable>
    </ScrollView>
  )
}

const stiller = StyleSheet.create({
  sayfa: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.xxl + bosluk.m,
    paddingBottom: bosluk.xxl,
  },
  geri: { alignSelf: 'flex-start', marginBottom: bosluk.xl },

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
    marginTop: bosluk.m,
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
  uyari: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.xs,
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
  tik: { color: '#FFFFFF', fontSize: 14, fontFamily: yazi.govdeKalin, lineHeight: 18 },
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
})
