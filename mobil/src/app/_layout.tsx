import { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useFonts } from 'expo-font'
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
      (authGrubunda || profilOlusturEkraninda || hesapDurumuEkraninda)
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

  return (
    <View style={stiller.kok}>
      <Slot />
      {uygulamaIcinde && <AltGezinme />}
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1 },
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
    <DilSaglayici>
      <OturumSaglayici>
        <DilBekleyerek />
      </OturumSaglayici>
    </DilSaglayici>
  )
}
