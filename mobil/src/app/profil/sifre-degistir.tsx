import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { EN_AZ_YENI_SIFRE, mevcutEposta, sifreDegistir } from '../../../lib/hesap-guvenlik'
import { useDil } from '../../../lib/dil'

/**
 * SIFREYI DEGISTIR (kullanicinin referans gorseli 2026-09-18).
 * Mevcut sifre + yeni sifre (en az 12) + tekrar; "Sifreyi guncelle";
 * altta "Sifremi unuttum" (mevcut sifre sifirlama ekranina, e-postayla
 * kod) ve not: sifre degisince diger cihazlardaki oturumlar kapatilir.
 */
export default function SifreDegistirEkrani() {
  const stiller = useStiller(stilleriYap)
  const renk = useRenk()
  const router = useRouter()
  const { t } = useDil()
  const [eposta, setEposta] = useState<string | null>(null)
  const [mevcut, setMevcut] = useState('')
  const [yeni, setYeni] = useState('')
  const [tekrar, setTekrar] = useState('')
  const [odakli, setOdakli] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const [mesgul, setMesgul] = useState(false)

  useEffect(() => {
    mevcutEposta().then(setEposta).catch(() => {})
  }, [])

  async function guncelle() {
    setHata(null)
    setBilgi(null)
    if (yeni.length < EN_AZ_YENI_SIFRE) {
      setHata(t('hesapGuvenlik.sifreKisa'))
      return
    }
    if (yeni !== tekrar) {
      setHata(t('hesapGuvenlik.sifreEslesmiyor'))
      return
    }
    if (!eposta) return
    setMesgul(true)
    try {
      await sifreDegistir(eposta, mevcut, yeni)
      setBilgi(t('hesapGuvenlik.sifreDegisti'))
      setMevcut('')
      setYeni('')
      setTekrar('')
    } catch (e) {
      const m = e instanceof Error ? e.message : ''
      if (m === 'MEVCUT_SIFRE_YANLIS') setHata(t('hesapGuvenlik.mevcutSifreYanlis'))
      else if (m === 'DIGER_CIHAZLAR_KAPATILAMADI') setBilgi(t('hesapGuvenlik.digerCihazlarKapatilamadi'))
      else setHata(m || t('ortak.birSorunOldu'))
    } finally {
      setMesgul(false)
    }
  }

  const alan = (
    anahtar: string,
    etiket: string,
    deger: string,
    setDeger: (d: string) => void,
    testID: string
  ) => (
    <>
      <Text style={stiller.etiket}>{etiket}</Text>
      <TextInput
        style={[stiller.girdi, odakli === anahtar && stiller.girdiOdakli]}
        value={deger}
        onChangeText={setDeger}
        onFocus={() => setOdakli(anahtar)}
        onBlur={() => setOdakli(null)}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        testID={testID}
      />
    </>
  )

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik="" geriEtiketi={t('ortak.geri')} />
      <ScrollView contentContainerStyle={stiller.icerik} keyboardShouldPersistTaps="handled">
        <Text style={stiller.baslik}>{t('hesapGuvenlik.sifreyiDegistir')}</Text>
        <Text style={stiller.altBaslik}>{t('hesapGuvenlik.sifreAlt')}</Text>

        {alan('mevcut', t('hesapGuvenlik.mevcutSifre'), mevcut, setMevcut, 'mevcut-sifre')}
        {alan('yeni', t('hesapGuvenlik.yeniSifre'), yeni, setYeni, 'yeni-sifre')}
        <Text style={stiller.ipucu}>{t('hesapGuvenlik.sifreIpucu')}</Text>
        {alan('tekrar', t('hesapGuvenlik.yeniSifreTekrar'), tekrar, setTekrar, 'yeni-sifre-tekrar')}

        {hata && <Text style={stiller.hata}>{hata}</Text>}
        {bilgi && <Text style={stiller.bilgi}>{bilgi}</Text>}

        <Pressable
          style={({ pressed }) => [stiller.birincil, pressed && stiller.birincilBasili]}
          onPress={guncelle}
          disabled={mesgul}
          accessibilityRole="button"
          testID="sifreyi-guncelle"
        >
          <Text style={stiller.birincilYazi}>
            {mesgul ? t('ortak.gonderiliyor') : t('hesapGuvenlik.sifreGuncelle')}
          </Text>
        </Pressable>

        <Pressable
          style={stiller.baglanti}
          onPress={() =>
            router.push(
              (eposta ? `/sifre-sifirla?eposta=${encodeURIComponent(eposta)}` : '/sifre-sifirla') as never
            )
          }
          accessibilityRole="button"
          testID="sifremi-unuttum"
        >
          <Text style={stiller.baglantiYazi}>{t('hesapGuvenlik.sifremiUnuttum')}</Text>
        </Pressable>

        <Text style={stiller.not}>{t('hesapGuvenlik.sifreNot')}</Text>
      </ScrollView>
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: { paddingHorizontal: bosluk.sayfa, paddingBottom: ALT_GEZINME_PAYI },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 30,
    lineHeight: 36,
    color: renk.metin,
    letterSpacing: -0.6,
  },
  altBaslik: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde + 1,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginTop: bosluk.s,
    marginBottom: bosluk.m,
  },
  etiket: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde + 1,
    color: renk.metin,
    marginTop: bosluk.l,
    marginBottom: bosluk.m,
  },
  girdi: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart + 4,
    paddingHorizontal: bosluk.l,
    paddingVertical: 16,
    fontFamily: yazi.govde,
    fontSize: olcek.govde + 1,
    color: renk.metin,
  },
  girdiOdakli: { borderColor: renk.turuncu },
  ipucu: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginTop: bosluk.m,
  },
  not: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginTop: bosluk.m,
  },
  bilgi: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.turuncuYazi, marginTop: bosluk.l },
  hata: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.yikici, marginTop: bosluk.l },
  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: bosluk.xl,
    ...golge.yuzer,
  },
  birincilBasili: { opacity: 0.92 },
  birincilYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: '#FFFFFF' },
  baglanti: { alignItems: 'center', paddingVertical: bosluk.xl },
  baglantiYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 1, color: renk.metinIkincil },
})
