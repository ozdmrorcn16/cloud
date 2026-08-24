import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import {
  useFonts,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque'
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from '@expo-google-fonts/instrument-sans'
import { OturumSaglayici, useOturum } from '../../lib/oturum'
import { bildirimleriBaslat, bildirimeDokunmaDinle } from '../../lib/bildirim'

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
      // Oturumu olmayan kullanici once KARSILAMA ekranini goruyor,
      // dogrudan giris formunu degil: uygulamayi yeni indiren birine
      // once ne oldugunu soylemek gerekiyor. Giris ve kayit oradan
      // aciliyor.
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

  return <Slot />
}

export default function KokLayout() {
  // Marka yazi tipleri (karar 73). Yuklenmeden once ekran cizilmez:
  // sistem fontuyla bir kare cizip sonra marka fontuna atlamak gozle
  // gorulur bir sicrama uretiyor.
  const [yaziHazir] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
  })

  if (!yaziHazir) return null

  return (
    <OturumSaglayici>
      <YonlendirmeKontrolu />
    </OturumSaglayici>
  )
}
