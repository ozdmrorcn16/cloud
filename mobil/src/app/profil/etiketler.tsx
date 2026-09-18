import { useCallback, useState } from 'react'
import { View, Text, Switch, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { AyarSayfasi, IkonKutusu } from '../../tasarim/AyarSayfasi'
import { Bolum, Satir } from '../../tasarim/Liste'
import { EtiketIkonu } from '../../tasarim/ayar-ikonlari'
import { etiketOnayiGerekliGetir, etiketOnayiGerekliAyarla } from '../../../lib/ayarlar'
import { bekleyenEtiketleriGetir } from '../../../lib/etiket'
import { yazi, olcek, bosluk, type Renk } from '../../tasarim/tema'
import { useRenk, useStiller } from '../../tasarim/tema-baglami'
import { useDil } from '../../../lib/dil'
import { useHataStili } from '../../tasarim/hata-stili'

/**
 * ETIKETLER (kullanicinin referans gorseli 2026-09-18): tek kartta
 * "Etiketleri once ben onaylayayim" anahtari + "Bekleyen etiketler"
 * satiri (sayi + ok). Anahtar `etiket_onayi_gerekli` (2026-09-06).
 */
export default function EtiketlerEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const hataStili = useHataStili()
  const [onay, setOnay] = useState<boolean | null>(null)
  const [bekleyen, setBekleyen] = useState<number | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      let gecerli = true
      etiketOnayiGerekliGetir().then((d) => gecerli && setOnay(d)).catch(() => {})
      bekleyenEtiketleriGetir().then((d) => gecerli && setBekleyen(d.length)).catch(() => {})
      return () => {
        gecerli = false
      }
    }, [])
  )

  async function degistir(deger: boolean) {
    const onceki = onay
    setOnay(deger)
    try {
      await etiketOnayiGerekliAyarla(deger)
      setHata(null)
    } catch (e) {
      setOnay(onceki)
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <AyarSayfasi baslik={t('gizlilikEtkilesim.etiketler')} altBaslik={t('gizlilikEtkilesim.etiketlerAlt')}>
      {hata && <Text style={hataStili}>{hata}</Text>}
      <Bolum>
        <View style={stiller.anahtarSatiri}>
          <View style={stiller.anahtarMetin}>
            <Text style={stiller.anahtarBaslik}>{t('gizlilikEtkilesim.etiketOnayBaslik')}</Text>
            <Text style={stiller.anahtarAciklama}>{t('gizlilikEtkilesim.etiketOnayAciklama')}</Text>
          </View>
          <Switch
            accessibilityLabel={t('gizlilikEtkilesim.etiketOnayBaslik')}
            value={onay ?? false}
            onValueChange={degistir}
            disabled={onay === null}
            trackColor={{ true: renk.turuncu, false: renk.cizgi }}
            thumbColor={renk.yuzey}
            {...({ activeThumbColor: renk.yuzey } as object)}
            testID="etiket-onayi"
          />
        </View>
        <Satir
          ikon={<IkonKutusu><EtiketIkonu /></IkonKutusu>}
          etiket={t('gizlilikEtkilesim.bekleyenEtiketler')}
          aciklama={t('gizlilikEtkilesim.bekleyenEtiketlerAciklama')}
          deger={bekleyen === null ? undefined : String(bekleyen)}
          sonuncu
          onPress={() => router.push('/profil/bekleyen-etiketler' as never)}
        />
      </Bolum>
    </AyarSayfasi>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  anahtarSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.l,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  anahtarMetin: { flex: 1 },
  anahtarBaslik: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde + 2, color: renk.metin },
  anahtarAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metinIkincil,
    marginTop: 2,
  },
})
