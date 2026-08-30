import { useEffect, useState } from 'react'
import { View, Text, Pressable, Linking, Platform, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { mekaniGetir, yakinMekanlariYogunlukIleGetir, type Mekan } from '../../../lib/mekan'
import { hataMetni } from '../../../lib/hata-metni'
import { useDil } from '../../../lib/dil'
import { CanliHarita, type HaritaMekani } from '../../tasarim/CanliHarita'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'

/**
 * BIR CHECK-IN'IN KONUMU.
 *
 * Akistaki ya da profildeki bir check-in'e VE mekan adina basilinca
 * aciliyor. Mekan adi onceden `/check-in/<id>` ekranini aciyordu
 * (yeni check-in formu); kullanicinin karari (2026-08-30): konum
 * etiketine basinca konumun kendisi gorunmeli.
 *
 * Harita MEKANA ODAKLI: merkezde check-in'in yapildigi yer duruyor,
 * cevresinde de yakin mekanlar - yalnizca tek bir nokta gostermek
 * "neresi burasi" sorusunu cevaplamiyor, cevre baglami gerekiyor.
 *
 * Kullanicinin kendi konumu BURADA KULLANILMIYOR: check-in baska bir
 * gun baska bir yerde yapilmis olabilir, "sana uzakligi" yaniltici
 * olurdu.
 *
 * HARITA BURADA DOKUNMATIK DEGIL, BIR DUGME. Ustune basinca hangi
 * harita uygulamasiyla acilacagi soruluyor (kullanicinin istegi
 * 2026-08-30). Bu yuzden kaydirma ve yakinlastirma bilerek kapali:
 * ayni alan hem kaydirilip hem "basilinca acilan" bir dugme olamaz.
 * Yol tarifi bizim isimiz degil, cihazin harita uygulamasi yapiyor.
 */

/** Secim penceresi: iOS'ta Apple Haritalar da var, diger yerlerde yok. */
function haritaSecenekleri(): ('apple' | 'google')[] {
  return Platform.OS === 'ios' ? ['apple', 'google'] : ['google']
}

/** Yol tarifi adresleri. Ikisi de HEDEFI verir, yani yol tarifi acilir. */
function yolTarifiAdresi(secim: 'apple' | 'google', mekan: Mekan) {
  const { lat, lng } = mekan.konum
  if (secim === 'apple') {
    return `https://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(mekan.ad)}`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export default function CheckInHaritasiEkrani() {
  const { t } = useDil()
  const { mekanId } = useLocalSearchParams<{ mekanId: string }>()
  const [mekan, setMekan] = useState<Mekan | null>(null)
  const [cevre, setCevre] = useState<HaritaMekani[]>([])
  const [hata, setHata] = useState<string | null>(null)
  const [secimAcik, setSecimAcik] = useState(false)

  useEffect(() => {
    let gecerli = true
    mekaniGetir(mekanId)
      .then(async (bulunan) => {
        if (!gecerli) return
        setMekan(bulunan)
        if (!bulunan) return
        // Cevre baglami; okunamazsa harita yine ciziliyor.
        const yakinlar = await yakinMekanlariYogunlukIleGetir(
          bulunan.konum.lat,
          bulunan.konum.lng,
          1000
        ).catch(() => [])
        if (gecerli) setCevre(yakinlar)
      })
      .catch((e) => {
        if (gecerli) setHata(hataMetni(e))
      })
    return () => {
      gecerli = false
    }
  }, [mekanId])

  function ac(secim: 'apple' | 'google') {
    setSecimAcik(false)
    if (!mekan) return
    Linking.openURL(yolTarifiAdresi(secim, mekan))
  }

  /**
   * Tek secenek varsa (iOS disi) soru sormanin anlami yok; dogrudan
   * aciliyor. Bos yere bir adim eklemek kullaniciyi yavaslatir.
   */
  function haritayaDokunuldu() {
    const secenekler = haritaSecenekleri()
    if (secenekler.length === 1) ac(secenekler[0])
    else setSecimAcik(true)
  }

  // Adres varsa o, yoksa semt. Ikisi de yoksa satir hic cizilmiyor.
  const adresSatiri = mekan?.adres ?? mekan?.semt ?? null

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik={mekan?.ad ?? ''} geriEtiketi={t('checkInHaritasi.geri')} />

      <View style={stiller.icerik}>
        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {mekan && (
          <>
            <Pressable
              onPress={haritayaDokunuldu}
              accessibilityRole="button"
              accessibilityLabel={t('checkInHaritasi.haritaAcikla')}
            >
              {/* Dokunuslar haritaya degil bu Pressable'a gitsin diye
                  harita katmani dokunusa kapali. */}
              <View pointerEvents="none" style={stiller.haritaCercevesi}>
                <CanliHarita merkez={mekan.konum} mekanlar={cevre} yukseklik={320} />
              </View>
            </Pressable>

            <View style={stiller.bilgi}>
              <Text style={stiller.ad}>{mekan.ad}</Text>
              {adresSatiri && <Text style={stiller.adres}>{adresSatiri}</Text>}
            </View>

            <Pressable
              style={stiller.buton}
              onPress={haritayaDokunuldu}
              accessibilityRole="button"
            >
              <Text style={stiller.butonYazi}>{t('checkInHaritasi.haritadaAc')}</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Secim penceresi ekranin ALTINDAN geliyor. `Alert.alert`
          kullanilmadi: react-native-web'de calismiyor ve uygulama
          tarayicidan da aciliyor. */}
      {secimAcik && (
        <>
          <Pressable
            style={stiller.perde}
            onPress={() => setSecimAcik(false)}
            accessibilityRole="button"
            accessibilityLabel={t('checkInHaritasi.vazgec')}
          />
          <View style={stiller.sayfa}>
            <Text style={stiller.sayfaBaslik}>{t('checkInHaritasi.secimBaslik')}</Text>

            {haritaSecenekleri().map((secenek) => (
              <Pressable
                key={secenek}
                style={stiller.secenek}
                onPress={() => ac(secenek)}
                accessibilityRole="button"
              >
                <Text style={stiller.secenekYazi}>
                  {secenek === 'apple'
                    ? t('checkInHaritasi.appleHaritalar')
                    : t('checkInHaritasi.googleHaritalar')}
                </Text>
              </Pressable>
            ))}

            <Pressable
              style={stiller.vazgec}
              onPress={() => setSecimAcik(false)}
              accessibilityRole="button"
            >
              <Text style={stiller.vazgecYazi}>{t('checkInHaritasi.vazgec')}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.xl,
    paddingBottom: ALT_GEZINME_PAYI,
    gap: bosluk.l,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
  },
  haritaCercevesi: {
    borderRadius: yuvarlak.kart,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  bilgi: { gap: 2 },
  ad: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  adres: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metinIkincil,
  },
  buton: {
    backgroundColor: renk.yuzey,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.hap,
    paddingVertical: 14,
    alignItems: 'center',
  },
  butonYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },

  perde: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(23, 19, 15, 0.35)',
  },
  sayfa: {
    position: 'absolute',
    left: bosluk.m,
    right: bosluk.m,
    bottom: bosluk.xl,
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.buyuk,
    padding: bosluk.l,
    gap: bosluk.s,
    ...golge.yuzer,
  },
  sayfaBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.metin,
    textAlign: 'center',
    marginBottom: bosluk.xs,
  },
  secenek: {
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secenekYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.turuncu,
  },
  vazgec: { paddingVertical: 12, alignItems: 'center' },
  vazgecYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
})
