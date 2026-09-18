import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import {
  epostaMaskele,
  mevcutEposta,
  mevcutAdreseKodGonder,
  mevcutAdresiDogrula,
  yeniAdreseKodGonder,
  yeniAdresiDogrula,
} from '../../../lib/hesap-guvenlik'
import { epostaGecerliMi, epostaNormallestir } from '../../../lib/eposta'
import { hataMetni } from '../../../lib/hata-metni'
import { useDil } from '../../../lib/dil'

/**
 * E-POSTA ADRESI (kullanicinin referans gorseli 2026-09-18).
 *
 * UC ASAMA TEK EKRANDA:
 *   'form'       Mevcut adres (maskeli) + "Yeni e-posta adresin" + not + Devam et
 *   'mevcutKod'  Mevcut adrese giden 6 haneli kod (Magic Link sablonu -
 *                bugun calisan yol; hesap silmeyle ayni)
 *   'yeniKod'    Yeni adrese giden 6 haneli kod (Change Email sablonu;
 *                `{{ .Token }}` tasimali - panel isi)
 * Referanstaki cumle: "Once mevcut adresini, ardindan yeni adresini
 * dogrulamani isteyecegiz. Yeni adres dogrulanana kadar giris adresin
 * degismez." - Supabase de tam boyle calisiyor: `updateUser({ email })`
 * adresi ancak yeni adres dogrulaninca degistirir.
 */
type Asama = 'form' | 'mevcutKod' | 'yeniKod' | 'bitti'

export default function EpostaDegistirEkrani() {
  const stiller = useStiller(stilleriYap)
  const renk = useRenk()
  const router = useRouter()
  const { t } = useDil()
  const [mevcut, setMevcut] = useState<string | null>(null)
  const [yeni, setYeni] = useState('')
  const [kod, setKod] = useState('')
  const [asama, setAsama] = useState<Asama>('form')
  const [hata, setHata] = useState<string | null>(null)
  const [bilgi, setBilgi] = useState<string | null>(null)
  const [mesgul, setMesgul] = useState(false)
  const [odakli, setOdakli] = useState(false)

  useEffect(() => {
    mevcutEposta().then(setMevcut).catch(() => {})
  }, [])

  const yeniSade = epostaNormallestir(yeni)

  async function devamEt() {
    setHata(null)
    setBilgi(null)
    if (!epostaGecerliMi(yeniSade)) {
      setHata(t('hesapGuvenlik.epostaGecersiz'))
      return
    }
    if (mevcut && yeniSade === mevcut.toLowerCase()) {
      setHata(t('hesapGuvenlik.epostaAyni'))
      return
    }
    if (!mevcut) return
    setMesgul(true)
    try {
      await mevcutAdreseKodGonder(mevcut)
      setKod('')
      setAsama('mevcutKod')
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setMesgul(false)
    }
  }

  async function kodGonderTekrar() {
    if (!mevcut) return
    setHata(null)
    setMesgul(true)
    try {
      if (asama === 'mevcutKod') await mevcutAdreseKodGonder(mevcut)
      else await yeniAdreseKodGonder(yeniSade)
      setBilgi(t('hesapGuvenlik.kodMetin', { eposta: asama === 'mevcutKod' ? mevcut : yeniSade }))
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setMesgul(false)
    }
  }

  async function dogrula() {
    if (!mevcut) return
    setHata(null)
    setBilgi(null)
    if (kod.trim().length !== 6) {
      setHata(t('hesapGuvenlik.kodEksik'))
      return
    }
    setMesgul(true)
    try {
      if (asama === 'mevcutKod') {
        await mevcutAdresiDogrula(mevcut, kod.trim())
        // Mevcut adres dogrulandi: simdi yeni adrese kod gidiyor.
        await yeniAdreseKodGonder(yeniSade)
        setKod('')
        setAsama('yeniKod')
      } else {
        await yeniAdresiDogrula(yeniSade, kod.trim())
        setAsama('bitti')
      }
    } catch (e) {
      setHata(e instanceof Error ? hataMetni(e) : t('ortak.birSorunOldu'))
    } finally {
      setMesgul(false)
    }
  }

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik="" geriEtiketi={t('ortak.geri')} />
      <ScrollView contentContainerStyle={stiller.icerik} keyboardShouldPersistTaps="handled">
        <Text style={stiller.baslik}>{t('hesapGuvenlik.epostaAdresi')}</Text>
        <Text style={stiller.altBaslik}>{t('hesapGuvenlik.epostaAlt')}</Text>

        <View style={stiller.mevcutKart}>
          <Text style={stiller.mevcutEtiket}>{t('hesapGuvenlik.mevcutAdres')}</Text>
          <Text style={stiller.mevcutDeger} testID="mevcut-eposta">
            {mevcut ? epostaMaskele(mevcut) : ''}
          </Text>
        </View>

        {asama === 'form' && (
          <>
            <Text style={stiller.etiket}>{t('hesapGuvenlik.yeniAdres')}</Text>
            <TextInput
              style={[stiller.girdi, odakli && stiller.girdiOdakli]}
              placeholder={t('hesapGuvenlik.yeniAdresYerTutucu')}
              placeholderTextColor={renk.metinSoluk}
              value={yeni}
              onChangeText={setYeni}
              onFocus={() => setOdakli(true)}
              onBlur={() => setOdakli(false)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              testID="yeni-eposta"
            />
            <Text style={stiller.not}>{t('hesapGuvenlik.epostaNot')}</Text>
            {hata && <Text style={stiller.hata}>{hata}</Text>}
            <Pressable
              style={({ pressed }) => [stiller.birincil, pressed && stiller.birincilBasili]}
              onPress={devamEt}
              disabled={mesgul}
              accessibilityRole="button"
              testID="devam-et"
            >
              <Text style={stiller.birincilYazi}>
                {mesgul ? t('ortak.gonderiliyor') : t('hesapGuvenlik.devamEt')}
              </Text>
            </Pressable>
          </>
        )}

        {(asama === 'mevcutKod' || asama === 'yeniKod') && (
          <>
            <Text style={stiller.etiket}>
              {asama === 'mevcutKod' ? t('hesapGuvenlik.mevcutKodBaslik') : t('hesapGuvenlik.yeniKodBaslik')}
            </Text>
            <Text style={stiller.not}>
              {t('hesapGuvenlik.kodMetin', { eposta: asama === 'mevcutKod' ? mevcut : yeniSade })}
            </Text>
            <TextInput
              style={[stiller.girdi, stiller.kodGirdisi, odakli && stiller.girdiOdakli]}
              placeholder={t('hesapGuvenlik.kodYerTutucu')}
              placeholderTextColor={renk.metinSoluk}
              value={kod}
              onChangeText={(d) => setKod(d.replace(/\D/g, '').slice(0, 6))}
              onFocus={() => setOdakli(true)}
              onBlur={() => setOdakli(false)}
              keyboardType="number-pad"
              maxLength={6}
              testID="dogrulama-kodu"
            />
            {bilgi && <Text style={stiller.bilgi}>{bilgi}</Text>}
            {hata && <Text style={stiller.hata}>{hata}</Text>}
            <Pressable
              style={({ pressed }) => [stiller.birincil, pressed && stiller.birincilBasili]}
              onPress={dogrula}
              disabled={mesgul}
              accessibilityRole="button"
              testID="dogrula"
            >
              <Text style={stiller.birincilYazi}>
                {mesgul ? t('ortak.gonderiliyor') : t('hesapGuvenlik.dogrula')}
              </Text>
            </Pressable>
            <Pressable onPress={kodGonderTekrar} disabled={mesgul} accessibilityRole="button" style={stiller.baglanti}>
              <Text style={stiller.baglantiYazi}>{t('hesapGuvenlik.tekrarGonder')}</Text>
            </Pressable>
          </>
        )}

        {asama === 'bitti' && (
          <>
            <Text style={stiller.bilgi} testID="eposta-degisti">{t('hesapGuvenlik.epostaDegisti')}</Text>
            <Pressable
              style={({ pressed }) => [stiller.birincil, pressed && stiller.birincilBasili]}
              onPress={() => router.back()}
              accessibilityRole="button"
            >
              <Text style={stiller.birincilYazi}>{t('ortak.tamam')}</Text>
            </Pressable>
          </>
        )}
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
    marginBottom: bosluk.xl,
  },
  mevcutKart: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart + 4,
    backgroundColor: renk.yuzey,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.l,
    marginBottom: bosluk.xl,
  },
  mevcutEtiket: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },
  mevcutDeger: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde + 3,
    color: renk.metin,
    marginTop: bosluk.xs,
  },
  etiket: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde + 1,
    color: renk.metin,
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
  kodGirdisi: { letterSpacing: 4, fontFamily: yazi.govdeKalin, marginTop: bosluk.s },
  not: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginTop: bosluk.m,
  },
  bilgi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.turuncuYazi,
    marginTop: bosluk.m,
  },
  hata: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.yikici, marginTop: bosluk.m },
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
  baglanti: { alignItems: 'center', paddingVertical: bosluk.l },
  baglantiYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metinIkincil },
})
