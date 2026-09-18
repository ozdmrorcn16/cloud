import { useState } from 'react'
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { AyarSayfasi, AyarBolumBasligi } from '../../tasarim/AyarSayfasi'
import { useDil } from '../../../lib/dil'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'

/**
 * YARDIM MERKEZI (kullanicinin referans gorseli 2026-09-19): baslik,
 * alt baslik, "Sik sorulanlar" karti (dort soru, ucgen isaretli,
 * dokununca cevap acilir) ve dolu turuncu "Sorun bildir".
 *
 * Cevaplar uygulamanin GERCEK davranisini anlatiyor (gizli profil,
 * check-in suresi 1 saat, engelleme, dondurma/silme) - sozlukte
 * `uygulama.cevapN`. Kural degisirse cevap da degismeli.
 *
 * "Sorun bildir" destek adresine e-posta acar (destek@slooin.com,
 * Cloudflare Email Routing ile kullaniciya dusuyor); ayri bir form
 * yok - her sorun bir insana ulassin.
 */
const SORULAR = [1, 2, 3, 4] as const
const DESTEK_ADRESI = 'destek@slooin.com'

export default function YardimEkrani() {
  const { t } = useDil()
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const [acik, setAcik] = useState<number | null>(null)

  function sorunBildir() {
    const konu = encodeURIComponent(t('uygulama.sorunKonu'))
    Linking.openURL(`mailto:${DESTEK_ADRESI}?subject=${konu}`)
  }

  return (
    <AyarSayfasi baslik={t('uygulama.yardim')} altBaslik={t('uygulama.yardimAlt')}>
      <AyarBolumBasligi>{t('uygulama.sikSorulanlar')}</AyarBolumBasligi>
      <View style={stiller.kart}>
        {SORULAR.map((n, sira) => {
          const acikMi = acik === n
          return (
            <View key={n} style={sira < SORULAR.length - 1 ? stiller.satirCizgili : undefined}>
              <Pressable
                style={stiller.soru}
                onPress={() => setAcik(acikMi ? null : n)}
                accessibilityRole="button"
                accessibilityState={{ expanded: acikMi }}
                testID={`soru-${n}`}
              >
                <View style={[stiller.ucgen, acikMi && stiller.ucgenAcik]}>
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Path d="M6 4l14 8-14 8z" fill={renk.metin} />
                  </Svg>
                </View>
                <Text style={stiller.soruYazi}>{t(`uygulama.soru${n}`)}</Text>
              </Pressable>
              {acikMi && (
                <Text style={stiller.cevap} testID={`cevap-${n}`}>
                  {t(`uygulama.cevap${n}`)}
                </Text>
              )}
            </View>
          )
        })}
      </View>

      <Pressable
        style={({ pressed }) => [stiller.birincil, pressed && stiller.basili]}
        onPress={sorunBildir}
        accessibilityRole="button"
        testID="sorun-bildir"
      >
        <Text style={stiller.birincilYazi}>{t('uygulama.sorunBildir')}</Text>
      </Pressable>
    </AyarSayfasi>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kart: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart + 4,
    backgroundColor: renk.yuzey,
    overflow: 'hidden',
  },
  satirCizgili: { borderBottomWidth: 1, borderBottomColor: renk.cizgi },
  soru: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bosluk.s,
    paddingHorizontal: bosluk.l,
    paddingVertical: 22,
  },
  ucgen: { marginTop: 4 },
  ucgenAcik: { transform: [{ rotate: '90deg' }] },
  soruYazi: {
    flex: 1,
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde + 2,
    lineHeight: 22,
    color: renk.metin,
  },
  cevap: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    paddingHorizontal: bosluk.l,
    paddingBottom: bosluk.l,
    marginTop: -bosluk.s,
  },
  birincil: {
    marginTop: bosluk.l,
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.kart + 4,
    paddingVertical: 18,
    alignItems: 'center',
  },
  birincilYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: '#FFFFFF' },
  basili: { opacity: 0.85 },
})
