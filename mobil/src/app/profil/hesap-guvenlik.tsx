import { useCallback, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { Bolum, Satir } from '../../tasarim/Liste'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'
import { ZarfIkonu, KilitIkonu, TelefonIkonu, KalkanTikCizgiIkonu } from '../../tasarim/hesap-ikonlari'
import { epostaMaskele, mevcutEposta, oturumlarimiGetir } from '../../../lib/hesap-guvenlik'
import { useDil } from '../../../lib/dil'

/**
 * HESAP VE GUVENLIK - ana ekran (kullanicinin referans gorseli
 * 2026-09-18). Ayarlarin en ustundeki satirdan gelinir.
 *
 *   Giris bilgilerin : E-posta adresi (maskeli)  -> /profil/eposta-degistir
 *                      Sifreyi degistir           -> /profil/sifre-degistir
 *   Guvenlik         : Acik oturumlar ("N cihaz") -> /profil/oturumlar
 *                      "Hesabini koru" bilgi karti (basilmaz)
 *
 * Ikonlar seftali kare kutuda (referans); satirlar ortak `Bolum`/`Satir`.
 */
export default function HesapGuvenlikEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const [eposta, setEposta] = useState<string | null>(null)
  const [cihazSayisi, setCihazSayisi] = useState<number | null>(null)

  // Alt ekranlardan donunce (adres degisti, oturum kapandi) degerler
  // guncel olsun: odakta yeniden okunuyor.
  useFocusEffect(
    useCallback(() => {
      let gecerli = true
      mevcutEposta()
        .then((e) => gecerli && setEposta(e))
        .catch(() => {})
      oturumlarimiGetir()
        .then((o) => gecerli && setCihazSayisi(o.length))
        .catch(() => gecerli && setCihazSayisi(null))
      return () => {
        gecerli = false
      }
    }, [])
  )

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik="" geriEtiketi={t('ortak.geri')} />
      <ScrollView contentContainerStyle={stiller.icerik} showsVerticalScrollIndicator={false}>
        <Text style={stiller.baslik}>{t('hesapGuvenlik.baslik')}</Text>
        <Text style={stiller.altBaslik}>{t('hesapGuvenlik.altBaslik')}</Text>

        <Bolum baslik={t('hesapGuvenlik.girisBilgilerin')}>
          <Satir
            ikon={<IkonKutusu><ZarfIkonu /></IkonKutusu>}
            etiket={t('hesapGuvenlik.epostaAdresi')}
            aciklama={eposta ? epostaMaskele(eposta) : ' '}
            onPress={() => router.push('/profil/eposta-degistir')}
          />
          <Satir
            ikon={<IkonKutusu><KilitIkonu /></IkonKutusu>}
            etiket={t('hesapGuvenlik.sifreyiDegistir')}
            aciklama={t('hesapGuvenlik.sifreAciklama')}
            sonuncu
            onPress={() => router.push('/profil/sifre-degistir')}
          />
        </Bolum>

        <Text style={stiller.bolumBasligi}>{t('hesapGuvenlik.guvenlik')}</Text>
        {/* Acik oturumlar: seftali kart (referans). Sagda cihaz sayisi. */}
        <Pressable
          style={({ pressed }) => [stiller.seftaliKart, pressed && stiller.seftaliKartBasili]}
          onPress={() => router.push('/profil/oturumlar')}
          accessibilityRole="button"
          testID="acik-oturumlar"
        >
          <View style={stiller.seftaliIkon}>
            <TelefonIkonu />
          </View>
          <View style={stiller.seftaliMetin}>
            <Text style={stiller.kartBaslik}>{t('hesapGuvenlik.acikOturumlar')}</Text>
            <Text style={stiller.kartAciklama}>{t('hesapGuvenlik.acikOturumlarAciklama')}</Text>
          </View>
          {cihazSayisi !== null && (
            <Text style={stiller.deger} testID="cihaz-sayisi">
              {t('hesapGuvenlik.cihazSayisi', { sayi: cihazSayisi })}
            </Text>
          )}
          <Text style={stiller.ok}>›</Text>
        </Pressable>

        {/* Bilgi karti: basilmaz, ikon BEYAZ kutuda (referans). */}
        <View style={[stiller.seftaliKart, stiller.bilgiKarti]}>
          <View style={stiller.beyazIkon}>
            <KalkanTikCizgiIkonu />
          </View>
          <View style={stiller.seftaliMetin}>
            <Text style={stiller.kartBaslik}>{t('hesapGuvenlik.koruBaslik')}</Text>
            <Text style={stiller.kartAciklama}>{t('hesapGuvenlik.koruMetin')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

/** Seftali kare ikon kutusu - satirlardaki ikonlar icin (referans). */
function IkonKutusu({ children }: { children: React.ReactNode }) {
  const stiller = useStiller(stilleriYap)
  return <View style={stiller.ikonKutusu}>{children}</View>
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
    marginBottom: bosluk.s,
  },
  bolumBasligi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde + 1,
    color: renk.metinIkincil,
    marginTop: bosluk.xl,
    marginBottom: bosluk.m,
  },
  ikonKutusu: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seftaliKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.kart + 4,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.l,
  },
  seftaliKartBasili: { opacity: 0.85 },
  bilgiKarti: { marginTop: bosluk.m, alignItems: 'flex-start' },
  seftaliIkon: { width: 32, alignItems: 'center' },
  beyazIkon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: renk.yuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seftaliMetin: { flex: 1 },
  kartBaslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin },
  kartAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metinIkincil,
    marginTop: 2,
  },
  deger: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil },
  ok: { fontFamily: yazi.govde, fontSize: 24, color: renk.metinSoluk, marginTop: -2 },
})
