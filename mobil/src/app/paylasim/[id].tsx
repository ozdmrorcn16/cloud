import { useCallback, useState } from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams, useFocusEffect } from 'expo-router'
import { checkInGetir, type AkisOgesi } from '../../../lib/akis'
import {
  etkilesimOzetleriniGetir,
  begen,
  begeniyiKaldir,
  paylas,
  type EtkilesimOzeti,
} from '../../../lib/etkilesim'
import { gorecelZaman } from '../../../lib/zaman'
import { useDil } from '../../../lib/dil'
import { CheckInKarti } from '../../tasarim/CheckInKarti'
import { UstCubuk } from '../../tasarim/UstCubuk'
import { yazi, olcek, bosluk, type Renk } from '../../tasarim/tema'
import { useStiller } from '../../tasarim/tema-baglami'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'

/**
 * TEK PAYLASIM EKRANI (2026-09-22): Bildirimler'deki begeni/yorum
 * satiri ve push'un `checkInId` verisi buraya acilir. Akistaki AYNI
 * kart; begeni, yorum, paylas calisir. Duzenleme/silme yok - o is ana
 * sayfa ve profilde (kart menusu `onDuzenle`/`onSilOnayi` verilmeyince
 * cizilmiyor). RLS gostermiyorsa (silinmis, gizlenmis, arkadaslik
 * kopmus) "artik gorunmuyor" satiri.
 */
export default function PaylasimEkrani() {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [oge, setOge] = useState<AkisOgesi | null>(null)
  const [ozet, setOzet] = useState<EtkilesimOzeti | undefined>(undefined)
  const [durum, setDurum] = useState<'yukleniyor' | 'hazir' | 'yok' | 'hata'>('yukleniyor')
  const [hata, setHata] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      let gecerli = true
      if (!id) return
      checkInGetir(id)
        .then(async (gelen) => {
          if (!gecerli) return
          if (!gelen) {
            setDurum('yok')
            return
          }
          setOge(gelen)
          setDurum('hazir')
          const ozetler = await etkilesimOzetleriniGetir([gelen.id]).catch(() => ({}) as Record<string, EtkilesimOzeti>)
          if (gecerli) setOzet(ozetler[gelen.id])
        })
        .catch((e) => {
          if (!gecerli) return
          setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
          setDurum('hata')
        })
      return () => {
        gecerli = false
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
  )

  // Ana sayfadaki iyimser begeni deseni (basarisizsa geri alinir).
  async function begeniDegistir() {
    if (!ozet || !oge) return
    const onceki = ozet
    const yeni = { ...onceki, begendim: !onceki.begendim, begeni: onceki.begeni + (onceki.begendim ? -1 : 1) }
    setOzet(yeni)
    try {
      if (onceki.begendim) await begeniyiKaldir(oge.id)
      else await begen(oge.id)
    } catch {
      setOzet(onceki)
    }
  }

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik={t('etkilesim.paylasimBaslik')} geriEtiketi={t('ortak.geri')} />
      <ScrollView contentContainerStyle={stiller.icerik} showsVerticalScrollIndicator={false}>
        {durum === 'yukleniyor' && <Text style={stiller.durum}>{t('ortak.yukleniyor')}</Text>}
        {durum === 'yok' && (
          <Text style={stiller.durum} testID="paylasim-yok">
            {t('etkilesim.paylasimBulunamadi')}
          </Text>
        )}
        {durum === 'hata' && hata && <Text style={stiller.hata}>{hata}</Text>}
        {oge && (
          <CheckInKarti
            oge={oge}
            zamanYazisi={gorecelZaman(oge.olusturmaZamani, t)}
            ozet={ozet}
            onBegen={begeniDegistir}
            onYorumSayisi={(_id, sayi) => setOzet((o) => (o ? { ...o, yorum: sayi } : o))}
            onPaylas={() => paylas(oge.mekanAdi, oge.kullaniciAdi ?? '').catch(() => {})}
          />
        )}
      </ScrollView>
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kok: { flex: 1, backgroundColor: renk.zemin },
    icerik: { paddingBottom: ALT_GEZINME_PAYI, paddingTop: bosluk.s },
    durum: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil, textAlign: 'center', padding: bosluk.l },
    hata: { fontFamily: yazi.govdeOrta, fontSize: olcek.kucuk, color: renk.yikici, textAlign: 'center', padding: bosluk.l },
  })
