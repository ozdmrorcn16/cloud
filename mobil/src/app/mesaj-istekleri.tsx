import { useCallback, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import {
  mesajIsteklerimiGetir,
  mesajIsteginiKabulEt,
  mesajIsteginiReddet,
  type MesajIstegi,
} from '../../lib/sohbet'
import { useDil } from '../../lib/dil'
import { UstCubuk } from '../tasarim/UstCubuk'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'
import { renk, yazi, olcek, bosluk } from '../tasarim/tema'

/**
 * MESAJ ISTEKLERI - ayri sayfa.
 *
 * Kullanicinin karari (2026-09-01): "Istekler yazisi SABIT; basinca yeni
 * sayfa geliyor, orada istekler varsa gorunuyor, yoksa sayfa bos
 * duruyor." Bu yuzden giris satiri Mesajlar'da her zaman duruyor ve
 * liste burada.
 *
 * Bir istegi OKUMAK kabul etmez: satira basinca sohbet aciliyor, kabul
 * ya orada cevap yazmakla ya da buradaki "Kabul et" ile oluyor.
 * Reddetmek istegi siler; gonderen bunu gormez ve tekrar yazabilir
 * (kullanicinin karari - israrci biri icin koruma engellemedir).
 */
export default function MesajIstekleriEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [istekler, setIstekler] = useState<MesajIstegi[]>([])
  const [hata, setHata] = useState<string | null>(null)

  async function yukle() {
    try {
      setIstekler(await mesajIsteklerimiGetir())
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  // Sohbetten geri donulunce liste tazelensin: orada kabul edilmis bir
  // istek burada durmaya devam etmemeli.
  useFocusEffect(
    useCallback(() => {
      yukle()
    }, [])
  )

  /**
   * Iyimser guncelleme YOK: satir ancak sunucu onayladiktan sonra
   * listeden kalkiyor. Basarisiz bir red, istegi silinmis gibi
   * gostermemeli.
   */
  async function kabul(gonderenId: string) {
    try {
      await mesajIsteginiKabulEt(gonderenId)
      setIstekler((mevcut) => mevcut.filter((i) => i.gonderenId !== gonderenId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function reddet(gonderenId: string) {
    try {
      await mesajIsteginiReddet(gonderenId)
      setIstekler((mevcut) => mevcut.filter((i) => i.gonderenId !== gonderenId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <View style={stiller.kok}>
      <UstCubuk baslik={t('mesajIstekleri.baslik')} geriEtiketi={t('mesajIstekleri.geri')} />

      <View style={stiller.icerik}>
        {hata && <Text style={stiller.hata}>{hata}</Text>}

        <FlatList
          data={istekler}
          keyExtractor={(i) => i.gonderenId}
          contentContainerStyle={stiller.liste}
          ListHeaderComponent={
            istekler.length === 0 ? null : (
              <Text style={stiller.aciklama}>{t('mesajIstekleri.aciklama')}</Text>
            )
          }
          renderItem={({ item }) => (
            <View style={stiller.satir}>
              <Pressable
                style={stiller.satirIcerik}
                onPress={() => router.push(`/sohbet/${item.gonderenId}`)}
                accessibilityRole="button"
              >
                <Text style={stiller.ad} numberOfLines={1}>
                  {item.ad ?? item.kullaniciAdi ?? ''}
                </Text>
                <Text style={stiller.mesaj} numberOfLines={2}>
                  {item.sonMesaj ?? ''}
                </Text>
              </Pressable>

              <View style={stiller.eylemler}>
                <Pressable onPress={() => kabul(item.gonderenId)} accessibilityRole="button">
                  <Text style={stiller.kabul}>{t('mesajIstekleri.kabul')}</Text>
                </Pressable>
                <Pressable onPress={() => reddet(item.gonderenId)} accessibilityRole="button">
                  <Text style={stiller.reddet}>{t('mesajIstekleri.reddet')}</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={stiller.bosAlan}>
              <Text style={stiller.bosBaslik}>{t('mesajIstekleri.bosBaslik')}</Text>
              <Text style={stiller.bosAciklama}>{t('mesajIstekleri.bosAciklama')}</Text>
            </View>
          }
        />
      </View>
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: { flex: 1, paddingHorizontal: bosluk.xl },
  liste: { paddingBottom: ALT_GEZINME_PAYI },
  aciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginBottom: bosluk.l,
  },
  satir: {
    paddingVertical: bosluk.l,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
    gap: bosluk.s,
  },
  satirIcerik: { gap: 2 },
  ad: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  mesaj: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },
  eylemler: { flexDirection: 'row', gap: bosluk.xl, marginTop: bosluk.xs },
  kabul: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.turuncu },
  reddet: { fontFamily: yazi.govdeOrta, fontSize: olcek.govde, color: renk.metinIkincil },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginBottom: bosluk.m,
  },
  bosAlan: { paddingTop: bosluk.xxl, gap: bosluk.s },
  bosBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    textAlign: 'center',
  },
  bosAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    textAlign: 'center',
  },
})
