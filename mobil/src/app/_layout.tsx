import { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useFonts } from 'expo-font'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans'
import { OturumSaglayici, useOturum } from '../../lib/oturum'
import { DilSaglayici, useDil } from '../../lib/dil'
import { bildirimleriBaslat, bildirimeDokunmaDinle } from '../../lib/bildirim'
import { AltGezinme } from '../tasarim/AltGezinme'
import { renk } from '../tasarim/tema'

/**
 * Dil tercihi cihazdan okunana kadar ekran cizilmiyor. Yazi tipleriyle
 * ayni gerekce: once Turkce cizip sonra Ingilizceye atlamak gozle
 * gorulur bir sicrama uretiyor.
 */
function DilBekleyerek() {
  const { hazir } = useDil()
  if (!hazir) return null
  return <YonlendirmeKontrolu />
}

function YonlendirmeKontrolu() {
  const { oturum, profilVarMi, hesapDurumu, yukleniyor } = useOturum()
  const segments = useSegments()
  const router = useRouter()
  // GUVENLI ALAN (2026-08-30, TestFlight'taki ilk denemede bulundu):
  // gercek uygulamada ekran centigin/saatin ALTINA giriyordu, ustteki
  // basliklar okunmuyordu. Tarayicida bu alani Safari kendisi
  // birakiyor, native'de biz birakmak zorundayiz. Pay cihazdan
  // okunuyor (her iPhone modelinde farkli), tek yerde - kokte -
  // uygulaniyor; ekranlar kendi ic paylarini oldugu gibi koruyor.
  // Web'de deger sifir, yani web gorunumu degismiyor.
  const insets = useSafeAreaInsets()
  // Oturum acik ve profil hazir oldugunda push jetonunu kaydet ve
  // bildirime dokunma dinleyicisini kur. bildirimleriBaslat web'de,
  // izin reddinde ve gercek cihaz olmayan ortamda sessizce doner.
  useEffect(() => {
    if (!oturum || !profilVarMi) return
    bildirimleriBaslat(oturum.user.id)
    const dinleyiciyiKaldir = bildirimeDokunmaDinle((rota) => {
      router.push(rota as never)
    })
    return dinleyiciyiKaldir
  }, [oturum, profilVarMi])

  useEffect(() => {
    if (yukleniyor) return
    const authGrubunda = segments[0] === '(auth)'
    // Dogrulama ekrani kod dogrulandiktan SONRA kendi karar veriyor:
    // profil yoksa profil olusturmaya gider, varsa oturumu kapatip
    // "bu numarada zaten hesap var" der. Bu karar bir kac istek
    // suruyor; o sirada buradan uygulamaya atilirsa mesaj hic
    // gorunmez. Bu yuzden /dogrula'dan zorla cikarilmiyor.
    const dogrulamaEkraninda = authGrubunda && segments[1] === 'dogrula'
    const profilOlusturEkraninda = segments[0] === 'profil-olustur'
    const hesapDurumuEkraninda = segments[0] === 'hesap-durumu'

    if (!oturum && !authGrubunda) {
      // HESABI OLMAYAN HERKES, HER ACILISTA karsilama ekranini gorur
      // (kullanicinin karari 2026-08-25). Once "yalnizca ilk indirene
      // gosterilsin" denmisti ve isaret cihazda saklaniyordu; o isaret
      // tamamen kaldirildi. Hesap olusturan kisi zaten oturum actigi
      // icin buraya hic dusmuyor.
      router.replace('/karsilama')
    } else if (oturum && hesapDurumu) {
      // Moderasyon karari profil kontrolunden ONCE geliyor: askiya alinmis
      // bir kullanicinin profili hic olmayabilir (kayit yarida kalmis
      // olabilir) ve profil olusturma ekranina atilirsa orada da yazamadigi
      // icin sikisir. Bu kol zinciri BURADA bitirir: baska hicbir kol
      // degerlendirilmez. Aksi halde profil ve ana ekran kollari devreye
      // girip /hesap-durumu ile diger ekran arasinda sonsuz donme uretir.
      if (!hesapDurumuEkraninda) router.replace('/hesap-durumu')
    } else if (oturum && profilVarMi === false && !profilOlusturEkraninda) {
      router.replace('/profil-olustur')
    } else if (
      oturum &&
      profilVarMi &&
      (authGrubunda || profilOlusturEkraninda || hesapDurumuEkraninda) &&
      !dogrulamaEkraninda
    ) {
      router.replace('/')
    }
  }, [oturum, profilVarMi, hesapDurumu, yukleniyor, segments])

  // Alt gezinme cubugu HER ekranda duruyor (kullanicinin karari
  // 2026-08-25: "hangi sayfaya girilirse girilsin alttaki sutun sabit
  // kalacak"). Bu yuzden tek tek ekranlara degil, koke konuyor.
  //
  // Uygulamaya girilmemis durumlar disarida: giris/kayit ekranlari,
  // profil olusturma ve askidaki hesap ekrani. Oralarda cubuk gorunse
  // bile her dokunus yonlendirme kontrolu tarafindan geri alinirdi.
  const uygulamaIcinde =
    !!oturum &&
    profilVarMi === true &&
    !hesapDurumu &&
    segments[0] !== '(auth)' &&
    segments[0] !== 'profil-olustur' &&
    segments[0] !== 'hesap-durumu'

  // Alt pay AYRI bir kutuda: gezinme cubugu kendi konumunu insets'ten
  // aliyor; ekran icerigi ise ana ekran gostergesinin ustunde bitiyor.
  return (
    <View style={[stiller.kok, { paddingTop: insets.top }]}>
      <View style={[stiller.icerik, { paddingBottom: insets.bottom }]}>
        <Slot />
      </View>
      {uygulamaIcinde && <AltGezinme />}
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: { flex: 1 },
})

export default function KokLayout() {
  // Uygulamanin yazi ailesi. Yuklenmeden once ekran cizilmez:
  // sistem fontuyla bir kare cizip sonra marka fontuna atlamak gozle
  // gorulur bir sicrama uretiyor.
  const [yaziHazir] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  })

  if (!yaziHazir) return null

  return (
    <SafeAreaProvider>
      <DilSaglayici>
        <OturumSaglayici>
          <DilBekleyerek />
        </OturumSaglayici>
      </DilSaglayici>
    </SafeAreaProvider>
  )
}
