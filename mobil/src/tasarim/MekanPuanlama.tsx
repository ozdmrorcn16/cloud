import { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import {
  mekanPuanOzetiniGetir,
  mekaniPuanla,
  type MekanPuanOzeti,
  type PuanSeviyesi,
} from '../../lib/mekan-sayfasi'
import { hataMetni } from '../../lib/hata-metni'
import { useDil } from '../../lib/dil'
import { YuzKotuIkonu, YuzIyiIkonu, YuzHarikaIkonu } from './mekan-ikonlari'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * MEKAN PUANLAMA (kullanicinin istegi 2026-09-13, referans: Swarm'in
 * "Puan" blogu).
 *
 * Solda buyuk puan (0-10) ve kac puanlama; sagda uc seviye cubugu
 * (Harika / Iyi / Kotu, sayilariyla). Altinda kart: "Bu mekani nasil
 * buldun?" + uc buyuk dugme + Gonder.
 *
 * KURALLAR SUNUCUDA (`20260913110000`), ekran yalnizca onceden
 * davraniyor:
 *   - puan 3+ oy olmadan gelmiyor -> "Henuz puan yok"
 *   - yalnizca orada check-in yapmis kisi oy verebiliyor -> kart
 *     dugme yerine sarti soyluyor (bosa is yaptirma kurali)
 *   - kisinin kendi oyu varsa dugme onceden secili, etiket "Puanini
 *     guncelle"; degistirmeden gonderilemiyor
 *
 * Kisinin OYU yalnizca kendisine gorunur; herkes toplamlari gorur.
 */

const SEVIYELER: { deger: PuanSeviyesi; anahtar: 'puanHarika' | 'puanIyi' | 'puanKotu' }[] = [
  { deger: 3, anahtar: 'puanHarika' },
  { deger: 2, anahtar: 'puanIyi' },
  { deger: 1, anahtar: 'puanKotu' },
]

function Yuz({ seviye, boyut, renk }: { seviye: PuanSeviyesi; boyut: number; renk: string }) {
  if (seviye === 3) return <YuzHarikaIkonu boyut={boyut} renk={renk} />
  if (seviye === 2) return <YuzIyiIkonu boyut={boyut} renk={renk} />
  return <YuzKotuIkonu boyut={boyut} renk={renk} />
}

export function MekanPuanlama({ mekanId }: { mekanId: string }) {
  const stiller = useStiller(stilleriYap)
  const renk = useRenk()
  const { t } = useDil()

  const [ozet, setOzet] = useState<MekanPuanOzeti | null>(null)
  const [secim, setSecim] = useState<PuanSeviyesi | null>(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [mesaj, setMesaj] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  useEffect(() => {
    let gecerli = true
    mekanPuanOzetiniGetir(mekanId)
      .then((o) => {
        if (!gecerli) return
        setOzet(o)
        setSecim(o.benimPuanim)
      })
      .catch(() => {})
    return () => {
      gecerli = false
    }
  }, [mekanId])

  async function gonder() {
    if (!secim || gonderiliyor) return
    setGonderiliyor(true)
    setHata(null)
    setMesaj(null)
    try {
      await mekaniPuanla(mekanId, secim)
      const yeni = await mekanPuanOzetiniGetir(mekanId)
      setOzet(yeni)
      setSecim(yeni.benimPuanim)
      setMesaj(t('mekanSayfasi.puanTesekkur'))
    } catch (e) {
      setHata(hataMetni(e))
    } finally {
      setGonderiliyor(false)
    }
  }

  if (!ozet) return null

  const enCok = Math.max(ozet.harika, ozet.iyi, ozet.kotu, 1)
  const sayilar: Record<PuanSeviyesi, number> = { 3: ozet.harika, 2: ozet.iyi, 1: ozet.kotu }
  const degisti = secim !== null && secim !== ozet.benimPuanim
  const puanMetni =
    ozet.puan === null ? null : ozet.puan.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  return (
    <View style={stiller.kok} testID="mekan-puanlama">
      <Text style={stiller.baslik}>{t('mekanSayfasi.puan')}</Text>

      <View style={stiller.ozet}>
        <View style={stiller.puanKutu}>
          {puanMetni ? (
            <Text style={stiller.puan} testID="mekan-puan">
              {puanMetni}
            </Text>
          ) : (
            <Text style={stiller.puanYok} testID="mekan-puan-yok">
              {t('mekanSayfasi.puanYok')}
            </Text>
          )}
          <Text style={stiller.puanAlt}>
            {t('mekanSayfasi.puanlamaSayisi', { sayi: ozet.toplam })}
          </Text>
          {ozet.toplam > 0 && ozet.puan === null && (
            <Text style={stiller.puanIpucu}>{t('mekanSayfasi.puanAzOy')}</Text>
          )}
        </View>

        <View style={stiller.cubuklar}>
          {SEVIYELER.map(({ deger }) => (
            <View key={deger} style={stiller.cubukSatiri} testID={`puan-cubuk-${deger}`}>
              <Yuz seviye={deger} boyut={22} renk={deger === 3 ? renk.metin : renk.metinSoluk} />
              <View style={stiller.cubukZemin}>
                <View
                  style={[
                    stiller.cubukDolgu,
                    { width: `${Math.round((sayilar[deger] / enCok) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={stiller.cubukSayi}>{sayilar[deger].toLocaleString('tr-TR')}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={stiller.kart}>
        {ozet.puanVerebilir ? (
          <>
            <Text style={stiller.soru}>{t('mekanSayfasi.puanSoru')}</Text>
            <View style={stiller.dugmeler}>
              {[...SEVIYELER].reverse().map(({ deger, anahtar }) => {
                const secili = secim === deger
                return (
                  <Pressable
                    key={deger}
                    onPress={() => setSecim(deger)}
                    style={[stiller.dugme, secili && stiller.dugmeSecili]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: secili }}
                    accessibilityLabel={t(`mekanSayfasi.${anahtar}`)}
                    testID={`puan-sec-${deger}`}
                  >
                    <Yuz seviye={deger} boyut={34} renk={secili ? '#FFFFFF' : renk.metin} />
                    <Text style={[stiller.dugmeYazi, secili && stiller.dugmeYaziSecili]}>
                      {t(`mekanSayfasi.${anahtar}`)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            <Pressable
              onPress={gonder}
              disabled={!degisti || gonderiliyor}
              style={[stiller.gonder, (!degisti || gonderiliyor) && stiller.gonderPasif]}
              accessibilityRole="button"
              testID="puan-gonder"
            >
              <Text style={[stiller.gonderYazi, (!degisti || gonderiliyor) && stiller.gonderYaziPasif]}>
                {gonderiliyor
                  ? t('mekanSayfasi.puanGonderiliyor')
                  : ozet.benimPuanim
                    ? t('mekanSayfasi.puanGuncelle')
                    : t('mekanSayfasi.puanGonder')}
              </Text>
            </Pressable>
            {mesaj && <Text style={stiller.mesaj}>{mesaj}</Text>}
            {hata && <Text style={stiller.hata}>{hata}</Text>}
          </>
        ) : (
          <Text style={stiller.sart} testID="puan-sart">
            {t('mekanSayfasi.puanSart')}
          </Text>
        )}
      </View>
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kok: { gap: bosluk.m },
    baslik: {
      fontFamily: yazi.ekranBasligi,
      fontSize: olcek.altBaslik,
      color: renk.metin,
    },
    ozet: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: bosluk.l,
    },
    puanKutu: { alignItems: 'center', minWidth: 96 },
    puan: {
      fontFamily: yazi.ekranBasligi,
      fontSize: 44,
      lineHeight: 50,
      color: renk.metin,
    },
    puanYok: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.govde,
      color: renk.metinIkincil,
      textAlign: 'center',
      paddingVertical: 10,
    },
    puanAlt: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metinIkincil,
    },
    puanIpucu: {
      fontFamily: yazi.govde,
      fontSize: olcek.minik,
      color: renk.metinSoluk,
      textAlign: 'center',
      marginTop: 2,
    },
    cubuklar: { flex: 1, gap: 10 },
    cubukSatiri: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
    cubukZemin: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: renk.cizgi,
      overflow: 'hidden',
    },
    cubukDolgu: { height: 6, borderRadius: 3, backgroundColor: renk.metin },
    cubukSayi: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metin,
      minWidth: 44,
      textAlign: 'right',
    },

    kart: {
      backgroundColor: renk.yuzey,
      borderRadius: yuvarlak.kart,
      borderWidth: 1,
      borderColor: renk.cizgi,
      padding: bosluk.m,
      gap: bosluk.m,
    },
    soru: {
      fontFamily: yazi.govde,
      fontSize: olcek.govde,
      color: renk.metinIkincil,
      textAlign: 'center',
    },
    dugmeler: { flexDirection: 'row', gap: bosluk.s },
    dugme: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: yuvarlak.kart,
      backgroundColor: renk.zemin,
      borderWidth: 1,
      borderColor: renk.cizgi,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    dugmeSecili: { backgroundColor: renk.turuncu, borderColor: renk.turuncu },
    dugmeYazi: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.kucuk,
      color: renk.metin,
    },
    dugmeYaziSecili: { color: '#FFFFFF' },
    gonder: {
      backgroundColor: renk.metin,
      borderRadius: yuvarlak.hap,
      paddingVertical: 14,
      alignItems: 'center',
    },
    // Pasif: degisiklik yok. Solduran sey DOLGU, etiket okunur kaliyor
    // (2026-09-07 denetiminin dersi).
    gonderPasif: { backgroundColor: renk.cizgi },
    gonderYazi: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.govde,
      color: '#FFFFFF',
    },
    gonderYaziPasif: { color: renk.metinIkincil },
    sart: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metinIkincil,
      textAlign: 'center',
    },
    mesaj: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.metinIkincil,
      textAlign: 'center',
    },
    hata: {
      fontFamily: yazi.govde,
      fontSize: olcek.kucuk,
      color: renk.yikici,
      textAlign: 'center',
    },
  })
