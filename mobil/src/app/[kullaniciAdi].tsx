import { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../tasarim/tema'
import { useStiller } from '../tasarim/tema-baglami'
import { useDil } from '../../lib/dil'
import { kullaniciAdindanKimlik, SITE_SAYFALARI } from '../../lib/profil-baglantisi'
import { kendiKullaniciIdim } from '../../lib/profil'
import { SITE_KOKU } from '../../lib/paylasim'

/**
 * `https://slooin.com/<kullanici_adi>` UYGULAMADA ACILINCA (2026-09-18).
 *
 * Kullanicinin istegi: "siteye yonlendirmesin, direkt uygulamaya
 * yonlendirsin, basinca o linkteki kisinin profili acilsin". iOS
 * Universal Links (`associatedDomains`) ve Android App Links
 * (`intentFilters`, autoVerify) baglantiyi uygulamaya getiriyor;
 * expo-router bu dosyaya dusuruyor. Ekran hic gorunmeden kullanici adi
 * kimlige cevrilip profile gecilir; kendi adiysa kendi profiline.
 *
 * Sitenin kendi sayfalari (gizlilik, kosullar...) Android'de de buraya
 * duser - onlar tarayicida acilir, uygulama ana sayfaya doner.
 *
 * Oturum yoksa kok duzen zaten karsilamaya atiyor; baglanti o durumda
 * kayboluyor (bilinen sinir, giristen sonra hatirlatma YOK).
 */
export default function KullaniciBaglantisiEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  const { kullaniciAdi } = useLocalSearchParams<{ kullaniciAdi: string }>()
  const [bulunamadi, setBulunamadi] = useState(false)

  useEffect(() => {
    let gecerli = true
    const ad = String(kullaniciAdi ?? '').toLowerCase()

    if (SITE_SAYFALARI.has(ad)) {
      WebBrowser.openBrowserAsync(`${SITE_KOKU}/${ad}`).catch(() => {})
      router.replace('/')
      return
    }

    Promise.all([kullaniciAdindanKimlik(ad), kendiKullaniciIdim()])
      .then(([id, benimId]) => {
        if (!gecerli) return
        if (!id) {
          setBulunamadi(true)
          return
        }
        if (id === benimId) router.replace('/profil')
        else router.replace(`/kullanici/${id}` as never)
      })
      .catch(() => {
        if (gecerli) setBulunamadi(true)
      })
    return () => {
      gecerli = false
    }
  }, [kullaniciAdi, router])

  if (!bulunamadi) return <View style={stiller.kapsayici} testID="baglanti-cozuluyor" />

  return (
    <View style={stiller.kapsayici}>
      <Text style={stiller.baslik}>{t('kullanici.bulunamadi')}</Text>
      <Text style={stiller.aciklama}>@{String(kullaniciAdi ?? '')}</Text>
      <Pressable
        style={({ pressed }) => [stiller.buton, pressed && stiller.butonBasili]}
        onPress={() => router.replace('/')}
        accessibilityRole="button"
        testID="ana-sayfaya-don"
      >
        <Text style={stiller.butonYazi}>{t('altGezinme.anaSayfa')}</Text>
      </Pressable>
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kapsayici: {
      flex: 1,
      backgroundColor: renk.zemin,
      alignItems: 'center',
      justifyContent: 'center',
      padding: bosluk.sayfa,
      gap: bosluk.s,
    },
    baslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.altBaslik, color: renk.metin, textAlign: 'center' },
    aciklama: { fontFamily: yazi.govde, fontSize: olcek.govde, color: renk.metinIkincil },
    buton: {
      marginTop: bosluk.l,
      paddingVertical: 12,
      paddingHorizontal: bosluk.xl,
      borderRadius: yuvarlak.kart,
      backgroundColor: renk.turuncu,
    },
    butonBasili: { backgroundColor: renk.turuncuBasili },
    butonYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: '#FFFFFF' },
  })
