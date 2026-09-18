import { useEffect, useState } from 'react'
import { View, Text, Switch, Pressable, Modal, Linking, Platform, StyleSheet } from 'react-native'
import { AyarSayfasi, AyarBolumBasligi } from '../../tasarim/AyarSayfasi'
import { ZilIkonu } from '../../tasarim/zil-ikonu'
import { bildirimTercihleriniGetir, bildirimTercihiAyarla, type BildirimTercihleri } from '../../../lib/ayarlar'
import { yazi, olcek, bosluk, yuvarlak, golge, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { useDil } from '../../../lib/dil'
import { useHataStili } from '../../tasarim/hata-stili'

/**
 * BILDIRIMLER (kullanicinin referans gorselleri 2026-09-19):
 *   Anlik bildirimler (ana anahtar)
 *   Insanlar ve etkilesim: Arkadaslik istekleri / Mesajlar / Etiketler
 *   Kesif ve anilar: Ani hatirlatmalari ("bir yil once bugun", gunluk cron)
 *   Sessiz saatler: Gece sessize al (22.00-08.00, cihazin yerel saati)
 *   "Cihaz bildirim ayarlari" -> "Bildirim iznini yonet" penceresi
 * "Mekan onerileri" BILEREK YOK: arkada oneri ureten bir sey yok, sahte
 * anahtar koymak yaklasik olurdu. Hepsi sunucuda (`profiller`), Edge
 * Function surum 7 gondermeden once okur.
 */
export default function BildirimAyarlariEkrani() {
  const { t } = useDil()
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const hataStili = useHataStili()
  const [tercih, setTercih] = useState<BildirimTercihleri | null>(null)
  const [hata, setHata] = useState<string | null>(null)
  const [pencere, setPencere] = useState(false)

  useEffect(() => {
    bildirimTercihleriniGetir()
      .then(setTercih)
      .catch((e) => setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu')))
  }, [t])

  async function degistir(anahtar: keyof BildirimTercihleri, deger: boolean) {
    const onceki = tercih
    setTercih((m) => (m ? { ...m, [anahtar]: deger } : m))
    try {
      await bildirimTercihiAyarla(anahtar, deger)
      setHata(null)
    } catch (e) {
      setTercih(onceki)
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  const anaKapali = tercih !== null && !tercih.anlik

  const satir = (
    anahtar: keyof BildirimTercihleri,
    baslik: string,
    aciklama: string,
    sonuncu = false,
    pasif = false
  ) => (
    <View style={[stiller.satir, !sonuncu && stiller.satirCizgili]}>
      <View style={stiller.metin}>
        <Text style={[stiller.baslik, pasif && stiller.pasif]}>{baslik}</Text>
        <Text style={stiller.aciklama}>{aciklama}</Text>
      </View>
      <Switch
        accessibilityLabel={baslik}
        value={tercih?.[anahtar] ?? (anahtar === 'anlik' || anahtar === 'mesaj' || anahtar === 'arkadas' || anahtar === 'ani')}
        onValueChange={(d) => degistir(anahtar, d)}
        disabled={tercih === null || pasif}
        trackColor={{ true: renk.turuncu, false: renk.cizgi }}
        thumbColor={renk.yuzey}
        {...({ activeThumbColor: renk.yuzey } as object)}
        testID={`bildirim-${anahtar}`}
      />
    </View>
  )

  return (
    <AyarSayfasi baslik={t('gizlilikEtkilesim.bildirimler')} altBaslik={t('bildirimAyarlari.altBaslik')}>
      {hata && <Text style={hataStili}>{hata}</Text>}

      <View style={stiller.kart}>
        {satir('anlik', t('bildirimAyarlari.anlik'), t('bildirimAyarlari.anlikAciklama'), true)}
      </View>

      <AyarBolumBasligi>{t('bildirimAyarlari.insanlar')}</AyarBolumBasligi>
      <View style={stiller.kart}>
        {satir('arkadas', t('bildirimAyarlari.arkadaslik'), t('bildirimAyarlari.arkadaslikAciklama'), false, anaKapali)}
        {satir('mesaj', t('bildirimAyarlari.mesajlar'), t('bildirimAyarlari.mesajlarAciklama'), false, anaKapali)}
        {satir('ani', t('bildirimAyarlari.etiketler'), t('bildirimAyarlari.etiketlerAciklama'), true, anaKapali)}
      </View>

      <AyarBolumBasligi>{t('bildirimAyarlari.kesif')}</AyarBolumBasligi>
      <View style={stiller.kart}>
        {satir('aniHatirlatma', t('bildirimAyarlari.aniHatirlatma'), t('bildirimAyarlari.aniHatirlatmaAciklama'), true, anaKapali)}
      </View>

      <AyarBolumBasligi>{t('bildirimAyarlari.sessiz')}</AyarBolumBasligi>
      <View style={stiller.kart}>
        {satir('sessizGece', t('bildirimAyarlari.geceSessiz'), t('bildirimAyarlari.geceSessizAciklama'), true, anaKapali)}
      </View>
      <Text style={stiller.not}>{t('bildirimAyarlari.sessizNot')}</Text>

      <Pressable
        style={({ pressed }) => [stiller.cerceveli, pressed && stiller.basili]}
        onPress={() => setPencere(true)}
        accessibilityRole="button"
        testID="cihaz-bildirim-ayarlari"
      >
        <Text style={stiller.cerceveliYazi}>{t('bildirimAyarlari.cihazAyarlari')}</Text>
      </Pressable>

      {/* BILDIRIM IZNINI YONET penceresi (referans): zil ikonu, baslik,
          yol tarifi, Anladim (uygulama ayarlarina gider), Vazgec. */}
      <Modal visible={pencere} transparent animationType="fade" onRequestClose={() => setPencere(false)}>
        <Pressable style={stiller.perde} onPress={() => setPencere(false)} accessibilityRole="button" />
        <View style={stiller.pencereKabi} pointerEvents="box-none">
          <View style={stiller.pencere} testID="bildirim-izni-penceresi">
            <View style={stiller.pencereIkon}>
              <ZilIkonu boyut={26} />
            </View>
            <Text style={stiller.pencereBaslik}>{t('bildirimAyarlari.izinYonet')}</Text>
            <Text style={stiller.pencereMetin}>{t('bildirimAyarlari.izinYol')}</Text>
            <Pressable
              style={({ pressed }) => [stiller.birincil, pressed && stiller.basili]}
              onPress={() => {
                setPencere(false)
                if (Platform.OS !== 'web') Linking.openSettings()
              }}
              accessibilityRole="button"
              testID="bildirim-izni-anladim"
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
  metin: { flex: 1 },
  baslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin },
  pasif: { color: renk.metinSoluk },
  aciklama: { fontFamily: yazi.govde, fontSize: olcek.govde, lineHeight: 21, color: renk.metinIkincil, marginTop: 2 },
  not: { fontFamily: yazi.govde, fontSize: olcek.govde, lineHeight: 22, color: renk.metinIkincil, marginTop: bosluk.l },
  cerceveli: {
    marginTop: bosluk.l,
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart + 4,
    paddingVertical: 17,
    alignItems: 'center',
    backgroundColor: renk.yuzey,
  },
  cerceveliYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin },
  basili: { opacity: 0.8 },
  perde: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  pencereKabi: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: bosluk.sayfa },
  pencere: { backgroundColor: renk.yuzey, borderRadius: yuvarlak.buyuk, padding: bosluk.xl, ...golge.yuzer },
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
  birincilYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: '#FFFFFF' },
  vazgec: { alignItems: 'center', paddingVertical: bosluk.l, marginTop: bosluk.xs },
  vazgecYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 1, color: renk.metinIkincil },
})
