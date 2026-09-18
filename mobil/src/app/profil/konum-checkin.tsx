import { useCallback, useState } from 'react'
import { View, Text, Pressable, Modal, Linking, Platform, StyleSheet } from 'react-native'
import { useFocusEffect } from 'expo-router'
import * as Location from 'expo-location'
import { AyarSayfasi, AyarBolumBasligi, IkonKutusu, RadyoKarti } from '../../tasarim/AyarSayfasi'
import { Bolum, Satir } from '../../tasarim/Liste'
import { YonOkuIkonu } from '../../tasarim/hesap-ikonlari'
import { varsayilanBulunurluguGetir, varsayilanBulunurluguAyarla } from '../../../lib/ayarlar'
import type { Bulunurluk } from '../../../lib/checkin'
import { useDil } from '../../../lib/dil'
import { useHataStili } from '../../tasarim/hata-stili'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'

/**
 * KONUM VE CHECK-IN (kullanicinin referans satiri 2026-09-18: "Konum
 * izni ve mekanda gorunurluk").
 *   - Konum izni: isletim sistemi izninin durumu; verilmemisse
 *     "Ayarlari ac" (uygulama ayarlarina gider - izin oradan verilir).
 *   - Mekanda gorunurluk: check-in yaptiginda o mekandaki "burada
 *     olanlar" listesinde kim gorsun - `varsayilan_bulunurluk`
 *     (herkese_acik / takipcilerim / gizli). 2026-09-12'de ayarlardan
 *     cikarilmisti; referansla bu ekrana geri geldi.
 */
export default function KonumCheckInEkrani() {
  const { t } = useDil()
  const hataStili = useHataStili()
  const [izin, setIzin] = useState<'verildi' | 'verilmedi' | 'sorulmadi' | null>(null)
  const [bulunurluk, setBulunurluk] = useState<Bulunurluk | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [pencere, setPencere] = useState(false)
  const stiller = useStiller(stilleriYap)

  useFocusEffect(
    useCallback(() => {
      let gecerli = true
      if (Platform.OS === 'web') {
        setIzin(null)
      } else {
        Location.getForegroundPermissionsAsync()
          .then((d) => gecerli && setIzin(d.status === 'granted' ? 'verildi' : d.canAskAgain && d.status === 'undetermined' ? 'sorulmadi' : 'verilmedi'))
          .catch(() => gecerli && setIzin(null))
      }
      varsayilanBulunurluguGetir()
        .then((d) => gecerli && setBulunurluk(d))
        .catch((e) => gecerli && setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu')))
      return () => {
        gecerli = false
      }
    }, [t])
  )

  /**
   * "Anladim" (referans penceresi): izin daha once hic sorulmadiysa
   * sistem penceresi acilir; sorulduysa yalnizca telefonun ayarlarindan
   * degistirilebilir - uygulama ayarlarina gidilir.
   */
  async function ayarlariAc() {
    setPencere(false)
    if (Platform.OS === 'web') return
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync()
    if (status !== 'granted' && canAskAgain) {
      const s = await Location.requestForegroundPermissionsAsync()
      setIzin(s.status === 'granted' ? 'verildi' : 'verilmedi')
      return
    }
    Linking.openSettings()
  }

  async function bulunurlukSec(deger: Bulunurluk) {
    const onceki = bulunurluk
    setBulunurluk(deger)
    try {
      await varsayilanBulunurluguAyarla(deger)
      setHata(null)
    } catch (e) {
      setBulunurluk(onceki)
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <AyarSayfasi baslik={t('gizlilikEtkilesim.konum')} altBaslik={t('gizlilikEtkilesim.konumAlt')}>
      {hata && <Text style={hataStili}>{hata}</Text>}

      <Bolum>
        {/* Referans (2026-09-18): "Konum erisimi - Uygulamayi kullanirken";
            aciklama IZNIN DURUMU. Basinca sistem izni / uygulama ayarlari. */}
        <Satir
          ikon={<IkonKutusu><YonOkuIkonu /></IkonKutusu>}
          etiket={t('gizlilikEtkilesim.konumErisimi')}
          aciklama={
            izin === 'verildi'
              ? t('gizlilikEtkilesim.uygulamayiKullanirken')
              : izin === 'verilmedi'
                ? t('gizlilikEtkilesim.izinYok')
                : izin === 'sorulmadi'
                  ? t('gizlilikEtkilesim.izinSorulmadi')
                  : t('gizlilikEtkilesim.konumIzniAciklama')
          }
          sonuncu
          onPress={Platform.OS === 'web' ? undefined : () => setPencere(true)}
        />
      </Bolum>

      <AyarBolumBasligi>{t('gizlilikEtkilesim.mekandaGorunurluk')}</AyarBolumBasligi>
      {bulunurluk !== null && (
        <RadyoKarti<Bulunurluk>
          testIDOneki="bulunurluk"
          secili={bulunurluk}
          onSec={bulunurlukSec}
          secenekler={[
            { deger: 'herkese_acik', baslik: t('gizlilikEtkilesim.herkes'), aciklama: t('gizlilikEtkilesim.mekanHerkesAciklama') },
            { deger: 'takipcilerim', baslik: t('gizlilikEtkilesim.sadeceArkadaslar'), aciklama: t('gizlilikEtkilesim.mekanArkadasAciklama') },
            { deger: 'gizli', baslik: t('gizlilikEtkilesim.kimse'), aciklama: t('gizlilikEtkilesim.mekanKimseAciklama') },
          ]}
        />
      )}
      {/* KONUM IZNINI YONET penceresi (kullanicinin referans gorseli
          2026-09-18): seftali ikon kutusu, baslik, yol tarifi, "Anladim"
          (ayarlara gider), "Vazgec". */}
      <Modal visible={pencere} transparent animationType="fade" onRequestClose={() => setPencere(false)}>
        <Pressable style={stiller.perde} onPress={() => setPencere(false)} accessibilityRole="button" />
        <View style={stiller.pencereKabi} pointerEvents="box-none">
          <View style={stiller.pencere} testID="konum-izni-penceresi">
            <View style={stiller.pencereIkon}>
              <YonOkuIkonu boyut={26} />
            </View>
            <Text style={stiller.pencereBaslik}>{t('gizlilikEtkilesim.konumIzniYonet')}</Text>
            <Text style={stiller.pencereMetin}>{t('gizlilikEtkilesim.konumIzniYol')}</Text>
            <Pressable
              style={({ pressed }) => [stiller.birincil, pressed && stiller.basili]}
              onPress={ayarlariAc}
              accessibilityRole="button"
              testID="konum-izni-anladim"
            >
              <Text style={stiller.birincilYazi}>{t('gizlilikEtkilesim.anladim')}</Text>
            </Pressable>
            <Pressable style={stiller.vazgec} onPress={() => setPencere(false)} accessibilityRole="button">
              <Text style={stiller.vazgecYazi}>{t('ayarlar.vazgec')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AyarSayfasi>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  perde: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  pencereKabi: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: bosluk.sayfa },
  pencere: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.buyuk,
    padding: bosluk.xl,
    ...golge.yuzer,
  },
  pencereIkon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: bosluk.l,
  },
  pencereBaslik: { fontFamily: yazi.ekranBasligi, fontSize: olcek.baslik, color: renk.metin, letterSpacing: -0.4 },
  pencereMetin: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde + 1,
    lineHeight: 23,
    color: renk.metinIkincil,
    marginTop: bosluk.m,
    marginBottom: bosluk.xl,
  },
  birincil: { backgroundColor: renk.turuncu, borderRadius: yuvarlak.hap, paddingVertical: 16, alignItems: 'center' },
  basili: { opacity: 0.92 },
  birincilYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: '#FFFFFF' },
  vazgec: { alignItems: 'center', paddingVertical: bosluk.l, marginTop: bosluk.xs },
  vazgecYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 1, color: renk.metinIkincil },
})
