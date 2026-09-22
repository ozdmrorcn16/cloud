import { useCallback, useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { useRouter, useFocusEffect } from 'expo-router'
import {
  konusmalarimiGetir,
  konusmayiSil,
  mesajIsteklerimiGetir,
  type Konusma,
} from '../../lib/sohbet'
import { avatarlariGetir } from '../../lib/akis'
import { useDil } from '../../lib/dil'
import { Avatar } from '../tasarim/Avatar'
import { OnayPenceresi } from '../tasarim/OnayPenceresi'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from '../tasarim/tema'
import { useRenk, useStiller } from '../tasarim/tema-baglami'
import { BosDurumGirisi } from '../tasarim/KademeliGiris'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'
import { ANAHTAR, onbellekOku, onbellekYaz } from '../../lib/onbellek'

export default function MesajlarEkrani() {
  const stiller = useStiller(stilleriYap)
  const router = useRouter()
  const { t } = useDil()
  // ONBELLEKTEN BASLA (2026-09-22): sekme her donuste sifirdan kuruluyordu.
  const onbelleklenmis = onbellekOku<{
    konusmalar: Konusma[]
    istekSayisi: number
    avatarlar: Record<string, string | null>
  }>(ANAHTAR.mesajlar)
  const [konusmalar, setKonusmalar] = useState<Konusma[]>(onbelleklenmis?.konusmalar ?? [])
  const [istekSayisi, setIstekSayisi] = useState(onbelleklenmis?.istekSayisi ?? 0)
  const [avatarlar, setAvatarlar] = useState<Record<string, string | null>>(
    onbelleklenmis?.avatarlar ?? {}
  )
  // Silme onayi (kullanicinin istegi 2026-09-14): kaydirip Sil'e basmak
  // sormaya yeter, silmeye yetmez. Bekleyen konusma id'si.
  const [silOnayi, setSilOnayi] = useState<string | null>(null)
  const [hata, setHata] = useState<string | null>(null)

  // Iki istek PARALEL gidiyor: rozet, konusma listesinin donmesini
  // beklemesin. allSettled kullaniliyor cunku ikisi ayni agirlikta
  // degil - istek sayisi cekilemezse rozet cizilmez ve ekran calismaya
  // devam eder; mesaj kutusunu ikincil bir bilgi yuzunden hata
  // ekranina cevirmek orantisiz olur.
  async function konusmalariYukle() {
    const [gelenKonusmalar, gelenIstekler] = await Promise.allSettled([
      konusmalarimiGetir(),
      mesajIsteklerimiGetir(),
    ])

    if (gelenKonusmalar.status === 'fulfilled') {
      setKonusmalar(gelenKonusmalar.value)
      setHata(null)
      onbellegeYaz({ konusmalar: gelenKonusmalar.value })
      avatarlariYukle(gelenKonusmalar.value)
    } else {
      const e = gelenKonusmalar.reason
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }

    const yeniIstekSayisi = gelenIstekler.status === 'fulfilled' ? gelenIstekler.value.length : 0
    setIstekSayisi(yeniIstekSayisi)
    onbellegeYaz({ istekSayisi: yeniIstekSayisi })
  }

  /** Onbellegi PARCA PARCA gunceller: konusmalar, rozet ve avatarlar ayri ayri geliyor. */
  function onbellegeYaz(parca: {
    konusmalar?: Konusma[]
    istekSayisi?: number
    avatarlar?: Record<string, string | null>
  }) {
    const mevcut = onbellekOku<{
      konusmalar: Konusma[]
      istekSayisi: number
      avatarlar: Record<string, string | null>
    }>(ANAHTAR.mesajlar) ?? { konusmalar: [], istekSayisi: 0, avatarlar: {} }
    onbellekYaz(ANAHTAR.mesajlar, { ...mevcut, ...parca })
  }

  // PROFIL RESMI (kullanicinin istegi 2026-09-14). Bildirimler
  // ekraniyla AYNI yol: avatarlar listeden SONRA ve ayri geliyor; kova
  // okunamazsa liste yine gorunur, yalnizca bas harf cizilir. Silinmis
  // hesabin (kisiId null) fotografi sorulmaz.
  async function avatarlariYukle(liste: Konusma[]) {
    const kimlikler = Array.from(
      new Set(liste.map((k) => k.kisiId).filter((id): id is string => id !== null))
    )
    if (kimlikler.length === 0) return
    try {
      const gelen = await avatarlariGetir(kimlikler)
      setAvatarlar(gelen)
      onbellegeYaz({ avatarlar: gelen })
    } catch {
      // sessiz: fotograf ikincil bilgi
    }
  }

  // useEffect yalnizca ilk acilista bir kez cekiyordu: kullanici bir
  // konusmayi acip okuyup geri donunce okunmamis rozeti eski deger de
  // kaliyordu. useFocusEffect ekran her odaklandiginda yeniden cekiyor.
  useFocusEffect(
    useCallback(() => {
      konusmalariYukle()
    }, [])
  )

  // "SIL" (kullanicinin karari 2026-09-14, "Gizle"nin yerine): satir sola
  // kaydirilinca sagda. Benden silinir, karsi tarafta kalir; biri
  // yazinca yalnizca yeni mesajlarla geri gelir (sunucu `konusmayi_sil`).
  // Durum yalnizca await cozuldukten SONRA degisiyor: basarisiz bir
  // silme satiri kaldirmis gibi yalan soylemesin - hata gosterilir,
  // satir yerinde kalir.
  async function sil(konusmaId: string) {
    setSilOnayi(null)
    try {
      await konusmayiSil(konusmaId)
      setKonusmalar((mevcut) => mevcut.filter((k) => k.konusmaId !== konusmaId))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <View style={stiller.kok}>
      <View style={stiller.icerikAlani}>
        {/* ISTEKLER GIRISI - baslik satirinin SAG UCUNDA (kullanicinin
            karari 2026-09-01: "Istekler yazisi Mesajlar yazisinin
            karsisinda sag ustte olsun"). Satir SABIT: bekleyen istek
            olmasa da duruyor, sayfa acildiginda bos durum metni
            gorunuyor. Yazi notr gri, dikkati sayi rozeti cekiyor. */}
        <View style={stiller.baslikSatiri}>
          {/* GERI OKU YOK (kullanicinin istegi 2026-09-18): bu bir sekme
              ekrani, alt cubuktan aciliyor; 2026-09-14'te konan ok
              kaldirildi. Sohbet ekrani kendi okunu tasiyor. */}
          <Text style={stiller.baslik}>{t('mesajlar.baslik')}</Text>
          <Pressable
            style={stiller.istekGirisi}
            onPress={() => router.push('/mesaj-istekleri')}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={stiller.istekGirisiYazi}>{t('mesajlar.istekler')}</Text>
            {istekSayisi > 0 && (
              <View style={stiller.istekRozeti}>
                <Text testID="istek-sayisi" style={stiller.istekRozetiYazi}>
                  {istekSayisi}
                </Text>
              </View>
            )}
            <Text style={stiller.istekGirisiOk}>›</Text>
          </Pressable>
        </View>

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        <FlatList
          data={konusmalar}
          keyExtractor={(k) => k.konusmaId}
          contentContainerStyle={stiller.liste}
          renderItem={({ item }) => {
            // Karsi taraf hesabini silmisse uyelik satiri yok; konusma
            // listede kalir ama kime ait oldugu artik bilinmiyor (spec
            // karar 69). Rota kullaniciId istiyor, null ile acilamaz.
            const gorunenAd = item.ad ?? t('mesajlar.silinmisKullanici')
            const acilabilirMi = item.kisiId !== null
            const okunmamis = item.okunmamis > 0

            return (
              <Swipeable
                friction={2}
                rightThreshold={40}
                overshootRight={false}
                renderRightActions={() => (
                  <Pressable
                    style={stiller.silButonu}
                    onPress={() => setSilOnayi(item.konusmaId)}
                    accessibilityRole="button"
                    accessibilityLabel={t('mesajlar.sil')}
                    testID={`konusma-sil-${item.konusmaId}`}
                  >
                    <Text style={stiller.silButonuYazi}>{t('mesajlar.sil')}</Text>
                  </Pressable>
                )}
              >
              <View style={stiller.satir}>
                <Pressable
                  onPress={() => acilabilirMi && router.push(`/sohbet/${item.kisiId}`)}
                  disabled={!acilabilirMi}
                  accessibilityRole="button"
                  accessibilityLabel={gorunenAd}
                >
                  <Avatar
                    fotografUrl={item.kisiId ? avatarlar[item.kisiId] ?? null : null}
                    ad={item.ad}
                    kullaniciAdi={item.kullaniciAdi ?? ''}
                    cap={AVATAR_CAPI}
                    testID={`konusma-avatar-${item.kisiId ?? 'silinmis'}`}
                  />
                </Pressable>
                <Pressable
                  style={stiller.icerik}
                  onPress={() => acilabilirMi && router.push(`/sohbet/${item.kisiId}`)}
                  disabled={!acilabilirMi}
                  accessibilityRole="button"
                >
                  <View style={stiller.ustSatir}>
                    <Text
                      style={[stiller.ad, okunmamis && stiller.adOkunmamis]}
                      numberOfLines={1}
                    >
                      {gorunenAd}
                    </Text>
                  </View>
                  <Text
                    style={[stiller.sonMesaj, okunmamis && stiller.sonMesajOkunmamis]}
                    numberOfLines={1}
                  >
                    {item.sonMesaj ?? ''}
                  </Text>
                </Pressable>
                {/* Okunmamis sayaci satirin SAG UCUNDA (kullanicinin istegi
                    2026-09-19: "sohbete girilmeden mesajin okunmadigi belli
                    olsun"). Adin yanindayken kisa adlarda goze carpmiyordu;
                    ad ve onizleme de koyu + kalin. */}
                {okunmamis && (
                  <View style={stiller.rozet} testID={`okunmamis-${item.konusmaId}`}>
                    <Text style={stiller.rozetYazi}>{item.okunmamis}</Text>
                  </View>
                )}
              </View>
              </Swipeable>
            )
          }}
          ListEmptyComponent={
            // Yalnizca baslik (kullanicinin karari 2026-09-01): altindaki
            // "kimlerle mesajlasabilirsin" cumlesi kaldirildi.
            <BosDurumGirisi style={stiller.bosAlan}>
              <Text style={stiller.bosBaslik}>{t('mesajlar.bosBaslik')}</Text>
            </BosDurumGirisi>
          }
        />
      </View>

      <OnayPenceresi
        acikMi={silOnayi !== null}
        // Yalnizca baslik (kullanicinin istegi 2026-09-14: "altindaki
        // yazilari sil"); ne olacagi KVKK listesinde ve gizlilik metninde.
        baslik={t('mesajlar.silBaslik')}
        eylemEtiketi={t('mesajlar.sil')}
        onOnay={() => silOnayi && sil(silOnayi)}
        onVazgec={() => setSilOnayi(null)}
      />
    </View>
  )
}

// Bildirim satirlariyla ayni cap: ayni sey her ekranda ayni gorunsun.
const AVATAR_CAPI = 48

const stilleriYap = (renk: Renk) => StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },
  baslikSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: bosluk.m,
  },
  istekGirisi: { flexDirection: 'row', alignItems: 'center', gap: bosluk.xs },
  // Notr gri: baslikla yarismiyor. Dikkati ceken sey yazi degil, yaninda
  // beliren turuncu sayi - yani "bakilacak bir sey oldugunda" one cikiyor.
  istekGirisiYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metinIkincil,
  },
  istekGirisiOk: { fontFamily: yazi.govde, fontSize: olcek.altBaslik, color: renk.metinSoluk },
  istekRozeti: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: yuvarlak.hap,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  istekRozetiYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  icerikAlani: {
    flex: 1,
    paddingHorizontal: bosluk.sayfa,
    paddingTop: bosluk.xxl + bosluk.m,
  },

  baslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
  },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.yikici,
    marginBottom: bosluk.m,
  },

  liste: { paddingBottom: ALT_GEZINME_PAYI },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    backgroundColor: renk.zemin,
    // Satirlar arasinda cizgi YOK (kullanicinin istegi 2026-09-19:
    // "sohbetlerin altinda cizik olmasin, alt alta siralansinlar").
    paddingVertical: bosluk.m,
  },
  icerik: { flex: 1 },
  ustSatir: { flexDirection: 'row', alignItems: 'center', gap: bosluk.s },
  ad: {
    flexShrink: 1,
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  // Okunmamis konusma daha koyu ve kalin: liste icinde goz once oraya
  // gitsin.
  adOkunmamis: { fontFamily: yazi.govdeKalin },
  sonMesaj: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
    marginTop: 2,
  },
  sonMesajOkunmamis: { fontFamily: yazi.govdeKalin, color: renk.metin },

  rozet: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: yuvarlak.hap,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rozetYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    lineHeight: 16,
    color: '#FFFFFF',
  },

  // Kaydirinca acilan Sil: kirmizi, satir boyunca, iOS Mail deseni.
  // Satir zemini sayfa zeminiyle ayni (beyaz) olsun ki kaydirirken
  // altta ne oldugu gorulmesin - kirmizi yalnizca acilan alan.
  silButonu: {
    backgroundColor: renk.yikici,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: bosluk.xl,
    marginVertical: 0,
  },
  silButonuYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },

  bosAlan: { paddingTop: bosluk.xxl, alignItems: 'center' },
  bosBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
  },
})
