import { useEffect, useState } from 'react'
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { mekaniGetir, yakinMekanlariYogunlukIleGetir, type Mekan } from '../../../lib/mekan'
import { hataMetni } from '../../../lib/hata-metni'
import { CanliHarita, type HaritaMekani } from '../../tasarim/CanliHarita'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../../tasarim/tema'

/**
 * BIR CHECK-IN'IN KONUMU.
 *
 * Akistaki ya da profildeki bir check-in'e basilinca aciliyor
 * (kullanicinin istegi 2026-08-26): "check-inin uzerine basilabilir,
 * basinca harita ekrani acilir, konumu gorunur."
 *
 * Harita MEKANA ODAKLI: merkezde check-in'in yapildigi yer duruyor,
 * cevresinde de yakin mekanlar - yalnizca tek bir nokta gostermek
 * "neresi burasi" sorusunu cevaplamiyor, cevre baglami gerekiyor.
 *
 * Kullanicinin kendi konumu BURADA KULLANILMIYOR: check-in baska bir
 * gun baska bir yerde yapilmis olabilir, "sana uzakligi" yaniltici
 * olurdu.
 */
export default function CheckInHaritasiEkrani() {
  const { mekanId } = useLocalSearchParams<{ mekanId: string }>()
  const [mekan, setMekan] = useState<Mekan | null>(null)
  const [cevre, setCevre] = useState<HaritaMekani[]>([])
  const [hata, setHata] = useState<string | null>(null)

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

  function haritadaAc() {
    if (!mekan) return
    Linking.openURL(`https://maps.google.com/?q=${mekan.konum.lat},${mekan.konum.lng}`)
  }

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik={mekan?.ad ?? ''} geriEtiketi="Geri" />

      <View style={stiller.icerik}>
        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {mekan && (
          <>
            <CanliHarita merkez={mekan.konum} mekanlar={cevre} yukseklik={320} />

            <View style={stiller.bilgi}>
              <Text style={stiller.ad}>{mekan.ad}</Text>
              {mekan.semt && <Text style={stiller.semt}>{mekan.semt}</Text>}
            </View>

            {/* Gercek harita uygulamasina cikis: yol tarifi bizim
                isimiz degil, cihazin harita uygulamasi yapiyor. */}
            <Pressable style={stiller.buton} onPress={haritadaAc} accessibilityRole="button">
              <Text style={stiller.butonYazi}>Harita uygulamasında aç</Text>
            </Pressable>
          </>
        )}
      </View>
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
  bilgi: { gap: 2 },
  ad: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  semt: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
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
})
