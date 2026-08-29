import { useCallback, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { gelenIstekleriGetir } from '../../lib/bag-listeleri'
import { takipIsteginiYanitla, type BagKisi } from '../../lib/bag'
import {
  bekleyenEtiketleriGetir,
  etiketiYanitla,
  type BekleyenEtiket,
} from '../../lib/etiket'
import { useDil } from '../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../tasarim/tema'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'

/**
 * BILDIRIMLER.
 *
 * Kullanicinin karari (2026-08-29): alt cubuktaki "Kisiler" sekmesi
 * kaldirildi, yerine bu ekran geldi. Kisi arama artik ana sayfanin
 * ustundeki sutunda oldugu icin ayri bir sekmeye gerek kalmadi.
 *
 * Iki tur bildirim var ve ikisi de KARAR BEKLIYOR:
 *   - gelen arkadaslik (takip) istekleri
 *   - seni etiketlemek isteyen check-in'ler
 *
 * Bilgilendirme amacli bildirim (ornegin "isteginiz kabul edildi")
 * BURADA YOK; bu ekran yalnizca senden bir sey bekleyen seyleri
 * gosteriyor. Okundu/okunmadi durumu da tutulmuyor - bir sey
 * yanitlandiginda listeden kalkiyor, sayac da o listeden geliyor.
 */
export default function BildirimlerEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [takipIstekleri, setTakipIstekleri] = useState<BagKisi[]>([])
  const [etiketler, setEtiketler] = useState<BekleyenEtiket[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState<string | null>(null)

  async function yukle() {
    try {
      const [istekler, bekleyen] = await Promise.all([
        gelenIstekleriGetir(),
        bekleyenEtiketleriGetir(),
      ])
      setTakipIstekleri(istekler.takip)
      setEtiketler(bekleyen)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setYukleniyor(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      yukle()
    }, [])
  )

  async function takibiYanitla(kullaniciId: string, kabul: boolean) {
    try {
      await takipIsteginiYanitla(kullaniciId, kabul)
      setTakipIstekleri((mevcut) => mevcut.filter((k) => k.id !== kullaniciId))
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function etiketiKararaBagla(checkInId: string, onay: boolean) {
    try {
      await etiketiYanitla(checkInId, onay)
      setEtiketler((mevcut) => mevcut.filter((e) => e.checkInId !== checkInId))
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  const bosMu = takipIstekleri.length === 0 && etiketler.length === 0

  return (
    <View style={stiller.kok}>
      <ScrollView contentContainerStyle={stiller.icerik} showsVerticalScrollIndicator={false}>
        <Text style={stiller.baslik} accessibilityRole="header">
          {t('bildirimler.baslik')}
        </Text>

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {yukleniyor && bosMu && <Text style={stiller.durum}>{t('ortak.yukleniyor')}</Text>}

        {!yukleniyor && bosMu && (
          <View style={stiller.bosAlan}>
            <Text style={stiller.bosBaslik}>{t('bildirimler.bosBaslik')}</Text>
            <Text style={stiller.bosAciklama}>{t('bildirimler.bosAciklama')}</Text>
          </View>
        )}

        {takipIstekleri.length > 0 && (
          <>
            <Text style={stiller.bolumAd}>{t('bildirimler.arkadaslikBolumu')}</Text>
            {takipIstekleri.map((kisi) => (
              <View key={kisi.id} style={stiller.satir}>
                <Pressable
                  style={stiller.satirMetin}
                  onPress={() => router.push(`/kullanici/${kisi.id}`)}
                  accessibilityRole="button"
                >
                  <Text style={stiller.satirBaslik} numberOfLines={2}>
                    {t('bildirimler.arkadaslikMetni', { ad: kisi.ad ?? kisi.kullaniciAdi })}
                  </Text>
                  <Text style={stiller.satirAlt}>@{kisi.kullaniciAdi}</Text>
                </Pressable>
                <View style={stiller.eylemler}>
                  <Pressable
                    style={[stiller.dugme, stiller.dugmeDolu]}
                    onPress={() => takibiYanitla(kisi.id, true)}
                    accessibilityRole="button"
                  >
                    <Text style={[stiller.dugmeYazi, stiller.dugmeYaziDolu]}>
                      {t('bildirimler.kabul')}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={stiller.dugme}
                    onPress={() => takibiYanitla(kisi.id, false)}
                    accessibilityRole="button"
                  >
                    <Text style={stiller.dugmeYazi}>{t('bildirimler.reddet')}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}

        {etiketler.length > 0 && (
          <>
            <Text style={stiller.bolumAd}>{t('bildirimler.etiketBolumu')}</Text>
            {etiketler.map((e) => (
              <View key={e.checkInId} style={stiller.satir}>
                <Pressable
                  style={stiller.satirMetin}
                  onPress={() => router.push(`/kullanici/${e.etiketleyenId}`)}
                  accessibilityRole="button"
                >
                  <Text style={stiller.satirBaslik} numberOfLines={3}>
                    {t('bildirimler.etiketMetni', { ad: e.etiketleyenAd, mekan: e.mekanAdi })}
                  </Text>
                  <Text style={stiller.satirAlt}>@{e.etiketleyenKullaniciAdi}</Text>
                </Pressable>
                <View style={stiller.eylemler}>
                  <Pressable
                    style={[stiller.dugme, stiller.dugmeDolu]}
                    onPress={() => etiketiKararaBagla(e.checkInId, true)}
                    accessibilityRole="button"
                  >
                    <Text style={[stiller.dugmeYazi, stiller.dugmeYaziDolu]}>
                      {t('bildirimler.onayla')}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={stiller.dugme}
                    onPress={() => etiketiKararaBagla(e.checkInId, false)}
                    accessibilityRole="button"
                  >
                    <Text style={stiller.dugmeYazi}>{t('bildirimler.reddet')}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  icerik: {
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.l,
    paddingBottom: ALT_GEZINME_PAYI,
  },
  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
    marginBottom: bosluk.l,
  },
  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginBottom: bosluk.m,
  },
  durum: { fontFamily: yazi.govde, fontSize: olcek.kucuk, color: renk.metinIkincil },

  bolumAd: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.l,
    marginBottom: bosluk.s,
  },

  satir: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    borderRadius: yuvarlak.kart,
    padding: bosluk.l,
    marginBottom: bosluk.m,
  },
  satirMetin: {},
  satirBaslik: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
    lineHeight: 21,
  },
  satirAlt: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
  },

  eylemler: { flexDirection: 'row', gap: bosluk.s, marginTop: bosluk.m },
  dugme: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: renk.cizgi,
  },
  dugmeDolu: { backgroundColor: renk.turuncu, borderColor: renk.turuncu },
  dugmeYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: renk.metin },
  dugmeYaziDolu: { color: '#FFFFFF' },

  bosAlan: { paddingVertical: bosluk.xl },
  bosBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  bosAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: bosluk.xs,
  },
})
