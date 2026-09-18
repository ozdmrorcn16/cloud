import { useCallback, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { OnayPenceresi } from '../../tasarim/OnayPenceresi'
import { TelefonIkonu, DizustuIkonu } from '../../tasarim/hesap-ikonlari'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'
import {
  cihazAdi,
  tarayiciMi,
  digerCihazlardanCik,
  oturumlarimiGetir,
  oturumuKapat,
  type Oturum,
} from '../../../lib/hesap-guvenlik'
import { gunEtiketi } from '../../../lib/zaman'
import { useDil } from '../../../lib/dil'

/**
 * ACIK OTURUMLAR (kullanicinin referans gorseli 2026-09-18).
 *
 * Tek kartta satirlar: seftali kutuda telefon/dizustu ikonu,
 * "iPhone · Slooin" / "Safari · Mac", altinda "Su anda kullaniliyor"
 * ya da "Son etkinlik: bugun"; sagda bu cihazda "Bu cihaz" rozeti,
 * digerlerinde "Kapat" (onayli). Altta cerceveli "Diger oturumlardan
 * cikis yap" ve not. Bu cihazdan cikis ayarlardaki "Cikis yap" ile.
 *
 * Veri `oturumlarim` RPC'si (auth.sessions, yalnizca kendi satirlari).
 */
export default function OturumlarEkrani() {
  const stiller = useStiller(stilleriYap)
  const { t, dil } = useDil()
  const [oturumlar, setOturumlar] = useState<Oturum[] | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [kapatilacak, setKapatilacak] = useState<Oturum | null>(null)
  const [digerleriOnayi, setDigerleriOnayi] = useState(false)

  useFocusEffect(
    useCallback(() => {
      let gecerli = true
      oturumlarimiGetir()
        .then((o) => {
          if (!gecerli) return
          setOturumlar(o)
          setHata(null)
        })
        .catch((e) => gecerli && setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu')))
      return () => {
        gecerli = false
      }
    }, [t])
  )

  async function kapat() {
    if (!kapatilacak) return
    const hedef = kapatilacak
    setKapatilacak(null)
    try {
      await oturumuKapat(hedef.id)
      setOturumlar((m) => (m ? m.filter((o) => o.id !== hedef.id) : m))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function digerleriniKapat() {
    setDigerleriOnayi(false)
    try {
      await digerCihazlardanCik()
      setOturumlar((m) => (m ? m.filter((o) => o.buCihaz) : m))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  const bilinmeyen = t('hesapGuvenlik.cihazBilinmeyen')
  const digerleriVar = (oturumlar ?? []).some((o) => !o.buCihaz)

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik="" geriEtiketi={t('ortak.geri')} />
      <ScrollView contentContainerStyle={stiller.icerik} showsVerticalScrollIndicator={false}>
        <Text style={stiller.baslik}>{t('hesapGuvenlik.acikOturumlar')}</Text>
        <Text style={stiller.altBaslik}>{t('hesapGuvenlik.oturumlarAlt')}</Text>

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {oturumlar && oturumlar.length > 0 && (
          <View style={stiller.kart}>
            {oturumlar.map((o, sira) => (
              <View
                key={o.id}
                style={[stiller.satir, sira < oturumlar.length - 1 && stiller.satirCizgili]}
                testID={`oturum-${o.id}`}
              >
                <View style={stiller.ikonKutusu}>
                  {tarayiciMi(o.cihaz) ? <DizustuIkonu /> : <TelefonIkonu />}
                </View>
                <View style={stiller.metin}>
                  <Text style={stiller.cihaz} numberOfLines={1}>{cihazAdi(o.cihaz, bilinmeyen)}</Text>
                  <Text style={stiller.ayrinti} numberOfLines={1}>
                    {o.buCihaz
                      ? t('hesapGuvenlik.suAndaKullaniliyor')
                      : t('hesapGuvenlik.sonEtkinlik', {
                          zaman: gunEtiketi(o.sonEtkinlik, dil, {
                            bugun: t('sohbet.bugun').toLocaleLowerCase(dil),
                            dun: t('sohbet.dun').toLocaleLowerCase(dil),
                          }),
                        })}
                  </Text>
                </View>
                {o.buCihaz ? (
                  <View style={stiller.rozet} testID="bu-cihaz">
                    <Text style={stiller.rozetYazi}>{t('hesapGuvenlik.buCihaz')}</Text>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [stiller.kapatDugmesi, pressed && stiller.basili]}
                    onPress={() => setKapatilacak(o)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('hesapGuvenlik.kapat')} · ${cihazAdi(o.cihaz, bilinmeyen)}`}
                    testID={`oturumu-kapat-${o.id}`}
                  >
                    <Text style={stiller.kapatYazi}>{t('hesapGuvenlik.kapat')}</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            stiller.cerceveli,
            !digerleriVar && stiller.cerceveliPasif,
            pressed && digerleriVar && stiller.basili,
          ]}
          onPress={() => setDigerleriOnayi(true)}
          disabled={!digerleriVar}
          accessibilityRole="button"
          testID="digerlerinden-cik"
        >
          <Text style={[stiller.cerceveliYazi, !digerleriVar && stiller.cerceveliYaziPasif]}>
            {t('hesapGuvenlik.digerCihazlardanCik')}
          </Text>
        </Pressable>

        <Text style={stiller.not}>{t('hesapGuvenlik.oturumNot')}</Text>
      </ScrollView>

      <OnayPenceresi
        acikMi={kapatilacak !== null}
        baslik={t('hesapGuvenlik.kapat')}
        aciklama={kapatilacak ? cihazAdi(kapatilacak.cihaz, bilinmeyen) : undefined}
        eylemEtiketi={t('hesapGuvenlik.kapat')}
        onOnay={kapat}
        onVazgec={() => setKapatilacak(null)}
      />
      <OnayPenceresi
        acikMi={digerleriOnayi}
        baslik={t('hesapGuvenlik.digerCihazlardanCik')}
        eylemEtiketi={t('hesapGuvenlik.digerCihazlardanCik')}
        onOnay={digerleriniKapat}
        onVazgec={() => setDigerleriOnayi(false)}
      />
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
  kart: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart + 4,
    backgroundColor: renk.yuzey,
    overflow: 'hidden',
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.l,
  },
  satirCizgili: { borderBottomWidth: 1, borderBottomColor: renk.cizgi },
  ikonKutusu: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metin: { flex: 1 },
  cihaz: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin },
  ayrinti: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil, marginTop: 2 },
  // "Bu cihaz" rozeti: referansta yesil; palette tek vurgu turuncu -
  // seftali zemin + turuncu yazi (marka kurali).
  rozet: {
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.m,
    paddingVertical: 8,
  },
  rozetYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk + 1, color: renk.turuncuYazi },
  kapatDugmesi: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: 10,
    backgroundColor: renk.zemin,
  },
  kapatYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  basili: { opacity: 0.7 },
  cerceveli: {
    marginTop: bosluk.l,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart + 4,
    paddingVertical: 17,
    alignItems: 'center',
    backgroundColor: renk.yuzey,
  },
  cerceveliPasif: { opacity: 0.5 },
  cerceveliYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin },
  cerceveliYaziPasif: { color: renk.metinSoluk },
  not: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 22,
    color: renk.metinIkincil,
    marginTop: bosluk.l,
  },
  hata: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.yikici, marginBottom: bosluk.m },
})
