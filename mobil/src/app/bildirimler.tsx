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
import { avatarlariGetir } from '../../lib/akis'
import { useDil } from '../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak } from '../tasarim/tema'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'
import { Avatar } from '../tasarim/Avatar'

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
 *
 * SATIR DUZENI (kullanicinin karari 2026-08-30, Instagram'in bildirim
 * satiri ornek): solda yuvarlak profil fotografi, yaninda AD-SOYAD
 * kalin (ayni gun ikinci karar: "bildirim isim soyisimle gelmeli";
 * kullanici adi ise check-in kartinda) ve ayni cumlenin icinde devam
 * eden bildirim metni. Kart
 * kenarligi yok; satirlar ince cizgiyle ayriliyor. Eylem dugmeleri
 * metnin altinda, fotografin degil metnin hizasinda.
 *
 * Avatarlar `profil_fotograflari` RPC'sinden geliyor (akisla ayni
 * yol): kimin fotografinin gorunecegine sunucu karar veriyor,
 * fotografi olmayan ya da okunamayan kisi bas harfe dusuyor.
 */
export default function BildirimlerEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [takipIstekleri, setTakipIstekleri] = useState<BagKisi[]>([])
  const [etiketler, setEtiketler] = useState<BekleyenEtiket[]>([])
  const [avatarlar, setAvatarlar] = useState<Record<string, string | null>>({})
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

      // Avatarlar listeden SONRA ve ayri geliyor: fotograf okunamazsa
      // bildirimler yine gorunur, yalnizca bas harf cizilir.
      const kimlikler = Array.from(
        new Set([
          ...istekler.takip.map((k) => k.id),
          ...bekleyen.map((e) => e.etiketleyenId),
        ])
      )
      setAvatarlar(await avatarlariGetir(kimlikler))
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
              <BildirimSatiri
                key={kisi.id}
                kullaniciId={kisi.id}
                gosterilenAd={kisi.ad || kisi.kullaniciAdi}
                ad={kisi.ad}
                kullaniciAdi={kisi.kullaniciAdi}
                fotografUrl={avatarlar[kisi.id] ?? null}
                metin={t('bildirimler.arkadaslikMetni')}
                olumluYazi={t('bildirimler.kabul')}
                olumsuzYazi={t('bildirimler.reddet')}
                onProfil={() => router.push(`/kullanici/${kisi.id}`)}
                onOlumlu={() => takibiYanitla(kisi.id, true)}
                onOlumsuz={() => takibiYanitla(kisi.id, false)}
              />
            ))}
          </>
        )}

        {etiketler.length > 0 && (
          <>
            <Text style={stiller.bolumAd}>{t('bildirimler.etiketBolumu')}</Text>
            {etiketler.map((e) => (
              <BildirimSatiri
                key={e.checkInId}
                kullaniciId={e.etiketleyenId}
                gosterilenAd={e.etiketleyenAd || e.etiketleyenKullaniciAdi}
                ad={e.etiketleyenAd}
                kullaniciAdi={e.etiketleyenKullaniciAdi}
                fotografUrl={avatarlar[e.etiketleyenId] ?? null}
                metin={t('bildirimler.etiketMetni', { mekan: e.mekanAdi })}
                olumluYazi={t('bildirimler.onayla')}
                olumsuzYazi={t('bildirimler.reddet')}
                onProfil={() => router.push(`/kullanici/${e.etiketleyenId}`)}
                onOlumlu={() => etiketiKararaBagla(e.checkInId, true)}
                onOlumsuz={() => etiketiKararaBagla(e.checkInId, false)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  )
}

/**
 * Tek bildirim satiri. Iki bildirim turu de ayni satiri kullaniyor;
 * degisen yalnizca metin ve dugme yazilari.
 *
 * Ad ile metin TEK Text icinde ic ice: boylece uzun mekan
 * adlarinda satir dogal olarak kiriliyor ve kalin ad ile normal metin
 * ayni satir yuksekligini paylasiyor.
 */
function BildirimSatiri({
  kullaniciId,
  gosterilenAd,
  kullaniciAdi,
  ad,
  fotografUrl,
  metin,
  olumluYazi,
  olumsuzYazi,
  onProfil,
  onOlumlu,
  onOlumsuz,
}: {
  kullaniciId: string
  /** Kalin basilan: ad-soyad (yoksa kullanici adi). */
  gosterilenAd: string
  kullaniciAdi: string
  ad: string | null
  fotografUrl: string | null
  metin: string
  olumluYazi: string
  olumsuzYazi: string
  onProfil: () => void
  onOlumlu: () => void
  onOlumsuz: () => void
}) {
  return (
    <View style={stiller.satir} testID={`bildirim-${kullaniciId}`}>
      <Pressable onPress={onProfil} accessibilityRole="button" accessibilityLabel={gosterilenAd}>
        <Avatar
          fotografUrl={fotografUrl}
          ad={ad}
          kullaniciAdi={kullaniciAdi}
          cap={AVATAR_CAPI}
          testID="bildirim-avatar"
        />
      </Pressable>

      <View style={stiller.sag}>
        <Pressable onPress={onProfil} accessibilityRole="button">
          <Text style={stiller.metin}>
            <Text style={stiller.kullaniciAdi}>{gosterilenAd}</Text> {metin}
          </Text>
        </Pressable>

        <View style={stiller.eylemler}>
          <Pressable
            style={[stiller.dugme, stiller.dugmeDolu]}
            onPress={onOlumlu}
            accessibilityRole="button"
          >
            <Text style={[stiller.dugmeYazi, stiller.dugmeYaziDolu]}>{olumluYazi}</Text>
          </Pressable>
          <Pressable style={stiller.dugme} onPress={onOlumsuz} accessibilityRole="button">
            <Text style={stiller.dugmeYazi}>{olumsuzYazi}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const AVATAR_CAPI = 48

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
    marginBottom: bosluk.xs,
  },

  satir: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  sag: { flex: 1 },
  metin: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
    lineHeight: 21,
  },
  kullaniciAdi: {
    fontFamily: yazi.govdeKalin,
    color: renk.metin,
  },

  eylemler: { flexDirection: 'row', gap: bosluk.s, marginTop: bosluk.s },
  dugme: {
    minWidth: 96,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: bosluk.l,
    borderRadius: yuvarlak.hap,
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
