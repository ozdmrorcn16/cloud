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

/**
 * Bu segmentlerde kalinabilir mi, yoksa baska bir ekrana mi gidilmeli?
 *
 * Karar SENKRON: hem yonlendirmeyi tetikleyen efekt hem de "bu ekran
 * cizilsin mi" kontrolu ayni cevabi kullaniyor. Ikisi ayri yerde
 * hesaplansa birbirinden kayabilir.
 *
 * `null` donerse mevcut ekran dogru ekrandir.
 */
type Hedef = '/karsilama' | '/hesap-durumu' | '/profil-olustur' | '/'

function hedefRota(
  oturumVar: boolean,
  profilVarMi: boolean | null,
  hesapDurumuVar: boolean,
  segments: readonly string[]
): Hedef | null {
  const authGrubunda = segments[0] === '(auth)'
  // Dogrulama ekrani kod dogrulandiktan SONRA kendi karar veriyor:
  // profil yoksa profil olusturmaya gider, varsa oturumu kapatip
  // "bu numarada zaten hesap var" der. Bu karar bir kac istek suruyor;
  // o sirada buradan uygulamaya atilirsa mesaj hic gorunmez. Bu yuzden
  // /dogrula'dan zorla cikarilmiyor.
  const dogrulamaEkraninda = authGrubunda && segments[1] === 'dogrula'
  const profilOlusturEkraninda = segments[0] === 'profil-olustur'
  const hesapDurumuEkraninda = segments[0] === 'hesap-durumu'

  // HESABI OLMAYAN HERKES, HER ACILISTA karsilama ekranini gorur
  // (kullanicinin karari 2026-08-25). Once "yalnizca ilk indirene
  // gosterilsin" denmisti ve isaret cihazda saklaniyordu; o isaret
  // tamamen kaldirildi. Hesap olusturan kisi zaten oturum actigi icin
  // buraya hic dusmuyor.
  if (!oturumVar) return authGrubunda ? null : '/karsilama'

  // Moderasyon karari profil kontrolunden ONCE geliyor: askiya alinmis
  // bir kullanicinin profili hic olmayabilir (kayit yarida kalmis
  // olabilir) ve profil olusturma ekranina atilirsa orada da yazamadigi
  // icin sikisir. Bu kol zinciri BURADA bitirir: baska hicbir kol
  // degerlendirilmez. Aksi halde profil ve ana ekran kollari devreye
  // girip /hesap-durumu ile diger ekran arasinda sonsuz donme uretir.
  if (hesapDurumuVar) return hesapDurumuEkraninda ? null : '/hesap-durumu'

  if (profilVarMi === false) return profilOlusturEkraninda ? null : '/profil-olustur'

  if (
    profilVarMi &&
    (authGrubunda || profilOlusturEkraninda || hesapDurumuEkraninda) &&
    !dogrulamaEkraninda
  ) {
    return '/'
  }

  return null
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

  // Yonlendirme karari TEK yerde ve SENKRON hesaplaniyor. Once
  // yalnizca bir useEffect'in icindeydi; efekt render'dan SONRA
  // calistigi icin oturumu olmayan biri uygulamayi actiginda bir an
  // ANA SAYFA (`/`) ciziliyordu - en ustunde 88 px'lik kucuk kelime
  // markasiyla - ve ancak sonra karsilamaya geciliyordu. Kullanici bunu
  // "arada ustte yazi, altta yazi" diye bildirdi (2026-08-30).
  // Cozum: gidilecek bir yer varsa O EKRAN HIC CIZILMIYOR.
  const hedef = yukleniyor
    ? null
    : hedefRota(!!oturum, profilVarMi, !!hesapDurumu, segments)

  useEffect(() => {
    if (hedef) router.replace(hedef)
  }, [hedef, router])

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

  // ALTTA PAY YOK (kullanicinin istegi 2026-08-30, Instagram ornek):
  // icerik ekranin en altina kadar, gezinme cubugunun ALTINDAN akar;
  // ekranlar cubuk icin ALT_GEZINME_PAYI birakiyor, o pay alt inset'i
  // de iceriyor. Cubuk kendi konumunu insets'ten aliyor.
  // UST GUVENLI ALAN: SERIT YOK (kullanicinin istegi 2026-09-03,
  // referans Instagram'in ust kismi). Once dolu beyaz bir seritti ve
  // altindaki renkle arasinda SERT BIR CIZGI birakiyordu; sonra yari
  // saydam bir ortu denendi. Kullanici Instagram'i ornek gosterdi:
  // orada serit HIC YOK, icerik dogrudan saatin altindan geciyor.
  //
  // Profil ekraninda ust pay VERILMIYOR - gecis saatin ardina kadar
  // uzaniyor ve hicbir sinir gorunmuyor. Diger ekranlar ust payi
  // aliyor; orada saatin arkasi sayfa zemini (beyaz) oluyor, yine
  // cizgi yok cunku iki taraf da beyaz.
  //
  // Saat okunur kaliyor: seftali acik bir ton, sistem saati koyu.
  const profilKoku = segments[0] === 'profil' && !segments[1]

  return (
    <View style={stiller.kok}>
      <View style={[stiller.icerik, !profilKoku && { paddingTop: insets.top }]}>
        {/* Gidilecek baska bir ekran varsa mevcut ekran HIC cizilmez -
            yanlis ekranin bir kare gorunmesi bundan boyle mumkun degil. */}
        {yukleniyor || hedef ? null : <Slot />}
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
