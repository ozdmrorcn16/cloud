import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useDil } from '../../lib/dil'
import { bosluk, golge, olcek, yazi, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import type { YakinTur } from '../../lib/mekan'

/**
 * TUR SECICI - kesfet ekranindaki suzgec dugmesinin actigi pencere.
 *
 * Kullanicinin istegi (2026-09-06): "Filtre tusuna basinca bizim
 * mevcuttaki turlerimizin listesi ciksin, o listeden sectigi turlere
 * gore sadece o konumlar listelensin." Ardindan: "Filtredeki
 * secenekleri kaydetme tusu da ekle ya da tumu/vazgec gibi secenek
 * ekle."
 *
 * SECIM PENCEREDE GECICI. Disaridaki liste ancak KAYDET'e basilinca
 * degisiyor; pencereyi kapatmak (perde ya da carpi) hicbir sey
 * uygulamiyor. Aksi halde "Vazgec"in bir anlami kalmazdi - her
 * dokunus listeyi yeniden yukler, kullanici yanlislikla actigi bir
 * turden geri donemezdi.
 *
 * LISTE SUNUCUDAN, cevreye gore geliyor (`yakin_turler`). Sabit bir
 * tur listesi gosterilmiyor: veritabaninda 162 tur var ve cogu
 * herhangi bir cevrede hic bulunmuyor - kullanici "Marina" secip bos
 * bir listeyle karsilasirdi. Yanindaki sayi kac mekan oldugunu
 * soyluyor, yani secimden once sonucu tahmin edilebiliyor.
 */

function OnayIkonu({ renk: c }: { renk: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M5 12.6l4.6 4.6L19 7.8"
        fill="none"
        stroke={c}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function TurSecici({
  acikMi,
  turler,
  yukleniyor,
  secili,
  onKapat,
  onKaydet,
}: {
  acikMi: boolean
  turler: YakinTur[]
  yukleniyor: boolean
  /** Disarida SU AN uygulanan secim. Pencere her acilista bunu aliyor. */
  secili: string[]
  onKapat: () => void
  onKaydet: (yeni: string[]) => void
}) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()

  // Pencerenin KENDI taslagi. Disaridaki secimden kopyalaniyor ve
  // yalnizca Kaydet'te geri veriliyor.
  const [taslak, setTaslak] = useState<string[]>(secili)

  // Pencere her ACILISTA disaridaki secimle eslesiyor: bir onceki
  // acilistan kalan yarim secim tasinmamali.
  useEffect(() => {
    if (acikMi) setTaslak(secili)
  }, [acikMi, secili])

  if (!acikMi) return null

  function degistir(tur: string) {
    setTaslak((onceki) =>
      onceki.includes(tur) ? onceki.filter((x) => x !== tur) : [...onceki, tur]
    )
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onKapat}>
      <View style={stiller.kok}>
        <Pressable
          style={stiller.perde}
          onPress={onKapat}
          accessibilityRole="button"
          accessibilityLabel={t('ortak.vazgec')}
          testID="tur-secici-perde"
        />

        <View style={stiller.sayfa} testID="tur-secici">
          <View style={stiller.baslikSatiri}>
            <Text style={stiller.baslik}>{t('kesfet.turFiltresi')}</Text>
            <Pressable
              onPress={onKapat}
              accessibilityRole="button"
              accessibilityLabel={t('ortak.vazgec')}
              hitSlop={10}
              testID="tur-secici-kapat"
            >
              <Text style={stiller.carpi}>✕</Text>
            </Pressable>
          </View>

          {yukleniyor ? (
            <View style={stiller.ortala}>
              <ActivityIndicator size="small" color={renk.turuncu} />
            </View>
          ) : turler.length === 0 ? (
            <Text style={stiller.bos}>{t('kesfet.turBulunamadi')}</Text>
          ) : (
            <ScrollView style={stiller.liste} showsVerticalScrollIndicator={false}>
              {turler.map((tur) => {
                const isaretli = taslak.includes(tur.tur)
                return (
                  <Pressable
                    key={tur.tur}
                    style={stiller.satir}
                    onPress={() => degistir(tur.tur)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isaretli }}
                    testID={`tur-${tur.tur}`}
                  >
                    <View style={[stiller.kutu, isaretli && stiller.kutuIsaretli]}>
                      {isaretli && <OnayIkonu renk="#FFFFFF" />}
                    </View>
                    <Text style={stiller.turAdi} numberOfLines={1}>
                      {tur.tur}
                    </Text>
                    {/* Adet: secimden ONCE sonucu tahmin ettiriyor. */}
                    <Text style={stiller.adet}>{tur.adet}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          )}

          <View style={stiller.eylemler}>
            {/* "Tumu" secimi TEMIZLIYOR - yani suzgec kalkiyor ve butun
                turler gorunuyor. Ayri bir "temizle" kelimesi yerine
                sonucu soyleyen bir etiket. */}
            <Pressable
              style={[stiller.dugme, stiller.ikincil]}
              onPress={() => setTaslak([])}
              accessibilityRole="button"
              testID="tur-tumu"
            >
              <Text style={stiller.ikincilYazi}>{t('kesfet.tumu')}</Text>
            </Pressable>

            <Pressable
              style={[stiller.dugme, stiller.birincil]}
              onPress={() => onKaydet(taslak)}
              accessibilityRole="button"
              testID="tur-kaydet"
            >
              <Text style={stiller.birincilYazi}>
                {taslak.length > 0
                  ? t('kesfet.kaydetSayili', { sayi: taslak.length })
                  : t('kesfet.kaydet')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: { flex: 1, justifyContent: 'flex-end' },
  perde: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(23, 19, 15, 0.55)',
  },
  sayfa: {
    // Yukseklik SABIT degil ama TAVANLI: az tur varsa pencere kisa
    // kaliyor, cok varsa ekranin ucte ikisinde duruyor ve liste kendi
    // icinde kayiyor.
    maxHeight: '72%',
    backgroundColor: renk.yuzey,
    borderTopLeftRadius: yuvarlak.buyuk,
    borderTopRightRadius: yuvarlak.buyuk,
    paddingTop: bosluk.l,
    paddingBottom: bosluk.xl,
    ...golge.yuzer,
  },
  baslikSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: bosluk.sayfa,
    paddingBottom: bosluk.m,
  },
  baslik: {
    flex: 1,
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  carpi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.altBaslik,
    color: renk.metinSoluk,
  },
  ortala: { paddingVertical: bosluk.xxl, alignItems: 'center' },
  bos: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    textAlign: 'center',
    paddingVertical: bosluk.xl,
  },
  liste: { paddingHorizontal: bosluk.sayfa },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  kutu: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.6,
    borderColor: renk.cizgi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kutuIsaretli: { backgroundColor: renk.turuncu, borderColor: renk.turuncu },
  turAdi: {
    flex: 1,
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  adet: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
  },
  eylemler: {
    flexDirection: 'row',
    gap: bosluk.s,
    paddingHorizontal: bosluk.sayfa,
    paddingTop: bosluk.m,
  },
  dugme: {
    flex: 1,
    borderRadius: yuvarlak.hap,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ikincil: { borderWidth: 1.4, borderColor: renk.cizgi },
  ikincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
  birincil: { backgroundColor: renk.turuncu },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
})
