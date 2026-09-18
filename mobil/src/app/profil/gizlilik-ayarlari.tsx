import { useCallback, useState } from 'react'
import { useRouter, useFocusEffect } from 'expo-router'
import { Bolum, Satir } from '../../tasarim/Liste'
import { AyarSayfasi, AyarBolumBasligi, IkonKutusu, BilgiKarti } from '../../tasarim/AyarSayfasi'
import { KalkanTikCizgiIkonu } from '../../tasarim/hesap-ikonlari'
import { GozIkonu, AramaIkonu, EtiketIkonu, EngelIkonu } from '../../tasarim/ayar-ikonlari'
import { YorumIkonu } from '../../tasarim/etkilesim-ikonlari'
import {
  profilGizliGetir,
  aramadaGorunsunGetir,
  etiketOnayiGerekliGetir,
  mesajIzniGetir,
  type MesajIzni,
} from '../../../lib/ayarlar'
import { engellediklerimiGetir } from '../../../lib/engelleme'
import { useDil } from '../../../lib/dil'

/**
 * GIZLILIK (kullanicinin referans gorselleri 2026-09-18). Ana ekran:
 * bilgi karti, "Gorunurlugun" (profil gorunurlugu, aramada gorunurluk)
 * ve "Sosyal izinlerin" (etiketler, mesaj izinleri, engellenen kisiler).
 * Her satir sagda MEVCUT DEGERI gosterir ve kendi ekranina gider;
 * degerler odakta yeniden okunur (alt ekrandan donunce guncel).
 */
export default function GizlilikAyarlariEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [profilGizli, setProfilGizli] = useState<boolean | null>(null)
  const [aramada, setAramada] = useState<boolean | null>(null)
  const [etiketOnayi, setEtiketOnayi] = useState<boolean | null>(null)
  const [mesajIzni, setMesajIzni] = useState<MesajIzni | null>(null)
  const [engelSayisi, setEngelSayisi] = useState<number | null>(null)

  useFocusEffect(
    useCallback(() => {
      let gecerli = true
      profilGizliGetir().then((d) => gecerli && setProfilGizli(d)).catch(() => {})
      aramadaGorunsunGetir().then((d) => gecerli && setAramada(d)).catch(() => {})
      etiketOnayiGerekliGetir().then((d) => gecerli && setEtiketOnayi(d)).catch(() => {})
      mesajIzniGetir().then((d) => gecerli && setMesajIzni(d)).catch(() => {})
      engellediklerimiGetir().then((d) => gecerli && setEngelSayisi(d.length)).catch(() => {})
      return () => {
        gecerli = false
      }
    }, [])
  )

  const mesajIzniMetni =
    mesajIzni === 'herkes'
      ? t('gizlilikEtkilesim.herkes')
      : mesajIzni === 'arkadaslar'
        ? t('gizlilikEtkilesim.arkadaslar')
        : mesajIzni === 'hic_kimse'
          ? t('gizlilikEtkilesim.hicKimse')
          : undefined

  return (
    <AyarSayfasi baslik={t('gizlilikEtkilesim.gizlilik')} altBaslik={t('gizlilikEtkilesim.gizlilikAlt')}>
      <BilgiKarti
        ikon={<KalkanTikCizgiIkonu />}
        baslik={t('gizlilikEtkilesim.kartBaslik')}
        metin={t('gizlilikEtkilesim.kartMetin')}
      />

      <AyarBolumBasligi>{t('gizlilikEtkilesim.gorunurlugun')}</AyarBolumBasligi>
      <Bolum>
        <Satir
          ikon={<IkonKutusu><GozIkonu /></IkonKutusu>}
          etiket={t('gizlilikEtkilesim.profilGorunurlugu')}
          aciklama={t('gizlilikEtkilesim.profilGorunurluguAciklama')}
          deger={
            profilGizli === null
              ? undefined
              : profilGizli
                ? t('gizlilikEtkilesim.sadeceArkadaslar')
                : t('gizlilikEtkilesim.herkeseAcik')
          }
          onPress={() => router.push('/profil/profil-gorunurlugu' as never)}
        />
        <Satir
          ikon={<IkonKutusu><AramaIkonu /></IkonKutusu>}
          etiket={t('gizlilikEtkilesim.aramaGorunurlugu')}
          aciklama={t('gizlilikEtkilesim.aramaGorunurluguAciklama')}
          deger={aramada === null ? undefined : aramada ? t('gizlilikEtkilesim.acik') : t('gizlilikEtkilesim.kapali')}
          sonuncu
          onPress={() => router.push('/profil/arama-gorunurlugu' as never)}
        />
      </Bolum>

      <AyarBolumBasligi>{t('gizlilikEtkilesim.sosyalIzinlerin')}</AyarBolumBasligi>
      <Bolum>
        <Satir
          ikon={<IkonKutusu><EtiketIkonu /></IkonKutusu>}
          etiket={t('gizlilikEtkilesim.etiketler')}
          aciklama={t('gizlilikEtkilesim.etiketlerAciklama')}
          deger={
            etiketOnayi === null ? undefined : etiketOnayi ? t('gizlilikEtkilesim.onayli') : t('gizlilikEtkilesim.otomatik')
          }
          onPress={() => router.push('/profil/etiketler' as never)}
        />
        <Satir
          ikon={<IkonKutusu><YorumIkonu boyut={20} /></IkonKutusu>}
          etiket={t('gizlilikEtkilesim.mesajIzinleri')}
          aciklama={t('gizlilikEtkilesim.mesajIzinleriAciklama')}
          deger={mesajIzniMetni}
          onPress={() => router.push('/profil/mesaj-izinleri' as never)}
        />
        <Satir
          ikon={<IkonKutusu><EngelIkonu /></IkonKutusu>}
          etiket={t('gizlilikEtkilesim.engellenenKisiler')}
          aciklama={t('gizlilikEtkilesim.engellenenAciklama')}
          deger={engelSayisi === null ? undefined : String(engelSayisi)}
          sonuncu
          onPress={() => router.push('/profil/engellenenler')}
        />
      </Bolum>
    </AyarSayfasi>
  )
}
