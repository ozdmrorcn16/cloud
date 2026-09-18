import { useCallback, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { AyarSayfasi } from '../../tasarim/AyarSayfasi'
import { Avatar } from '../../tasarim/Avatar'
import { bekleyenEtiketleriGetir, etiketiYanitla, type BekleyenEtiket } from '../../../lib/etiket'
import { avatarlariGetir } from '../../../lib/akis'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'
import { useDil } from '../../../lib/dil'
import { useHataStili } from '../../tasarim/hata-stili'

/**
 * BEKLEYEN ETIKETLER (Gizlilik > Etiketler > Bekleyen etiketler):
 * Bildirimler sekmesindeki ayni liste, burada ayar baglaminda.
 * Onayla / Reddet ayni RPC (`etiketiYanitla`).
 */
export default function BekleyenEtiketlerEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const stiller = useStiller(stilleriYap)
  const hataStili = useHataStili()
  const [etiketler, setEtiketler] = useState<BekleyenEtiket[] | null>(null)
  const [avatarlar, setAvatarlar] = useState<Record<string, string | null>>({})
  const [hata, setHata] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      let gecerli = true
      bekleyenEtiketleriGetir()
        .then(async (liste) => {
          if (!gecerli) return
          setEtiketler(liste)
          const a = await avatarlariGetir([...new Set(liste.map((e) => e.etiketleyenId))]).catch(() => ({}))
          if (gecerli) setAvatarlar(a)
        })
        .catch((e) => gecerli && setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu')))
      return () => {
        gecerli = false
      }
    }, [t])
  )

  async function karar(checkInId: string, onay: boolean) {
    try {
      await etiketiYanitla(checkInId, onay)
      setEtiketler((m) => (m ? m.filter((e) => e.checkInId !== checkInId) : m))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <AyarSayfasi
      baslik={t('gizlilikEtkilesim.bekleyenEtiketler')}
      altBaslik={t('gizlilikEtkilesim.bekleyenEtiketlerAciklama')}
    >
      {hata && <Text style={hataStili}>{hata}</Text>}
      {etiketler && etiketler.length === 0 && (
        <Text style={stiller.bos}>{t('gizlilikEtkilesim.bekleyenYok')}</Text>
      )}
      {etiketler && etiketler.length > 0 && (
        <View style={stiller.kart}>
          {etiketler.map((e, sira) => (
            <View
              key={e.checkInId}
              style={[stiller.satir, sira < etiketler.length - 1 && stiller.satirCizgili]}
              testID={`bekleyen-${e.checkInId}`}
            >
              <Pressable onPress={() => router.push(`/kullanici/${e.etiketleyenId}`)} accessibilityRole="button">
                <Avatar
                  fotografUrl={avatarlar[e.etiketleyenId] ?? null}
                  ad={e.etiketleyenAd}
                  kullaniciAdi={e.etiketleyenKullaniciAdi}
                  cap={44}
                />
              </Pressable>
              <View style={stiller.metin}>
                <Text style={stiller.ad} numberOfLines={1}>
                  {e.etiketleyenAd || e.etiketleyenKullaniciAdi}
                </Text>
                <Text style={stiller.aciklama} numberOfLines={2}>
                  {t('bildirimler.etiketMetni', { mekan: e.mekanAdi })}
                </Text>
                <View style={stiller.dugmeler}>
                  <Pressable
                    style={stiller.onayla}
                    onPress={() => karar(e.checkInId, true)}
                    accessibilityRole="button"
                    testID={`onayla-${e.checkInId}`}
                  >
                    <Text style={stiller.onaylaYazi}>{t('bildirimler.onayla')}</Text>
                  </Pressable>
                  <Pressable
                    style={stiller.reddet}
                    onPress={() => karar(e.checkInId, false)}
                    accessibilityRole="button"
                    testID={`reddet-${e.checkInId}`}
                  >
                    <Text style={stiller.reddetYazi}>{t('bildirimler.reddet')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
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
  satir: { flexDirection: 'row', gap: bosluk.m, padding: bosluk.l, alignItems: 'flex-start' },
  satirCizgili: { borderBottomWidth: 1, borderBottomColor: renk.cizgi },
  metin: { flex: 1 },
  ad: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 1, color: renk.metin },
  aciklama: { fontFamily: yazi.govde, fontSize: olcek.govde, lineHeight: 21, color: renk.metinIkincil, marginTop: 2 },
  dugmeler: { flexDirection: 'row', gap: bosluk.s, marginTop: bosluk.m },
  onayla: { backgroundColor: renk.turuncu, borderRadius: yuvarlak.hap, paddingHorizontal: bosluk.l, paddingVertical: 9 },
  onaylaYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: '#FFFFFF' },
  reddet: { borderWidth: 1, borderColor: renk.cizgi, borderRadius: yuvarlak.hap, paddingHorizontal: bosluk.l, paddingVertical: 9 },
  reddetYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: renk.metin },
  bos: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil, marginTop: bosluk.s },
})
