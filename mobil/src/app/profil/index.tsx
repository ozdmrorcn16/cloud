import { useCallback, useState } from 'react'
import { View, Text, Image, ScrollView, Pressable, Share, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import * as ImagePicker from 'expo-image-picker'
import { kendiProfilimiGetir, type KendiProfil } from '../../../lib/profil'
import { profilFotografiUrl } from '../../../lib/fotograf-url'
import {
  kullanicininAnilariniGetir,
  aktifCheckInimiGetir,
  checkIniSil,
  checkIndenAyril,
  type AniGorunumu,
  type AktifCheckIn,
} from '../../../lib/checkin'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import { profilFotografiniDegistir } from '../../../lib/profil'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'
import { AniTuneli } from '../../tasarim/AniTuneli'
import { ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'

/** Anilar bolumunde kac satir onizlenir. Tamami ayri ekranda. */
const ONIZLEME_ADEDI = 3

function tarihiBicimlendir(zaman: string): string {
  const tarih = new Date(zaman)
  const gun = String(tarih.getDate()).padStart(2, '0')
  const ay = String(tarih.getMonth() + 1).padStart(2, '0')
  return `${gun}.${ay}.${tarih.getFullYear()}`
}

/**
 * Ayarlar girisi.
 *
 * Disli cark denendi ve 22 px'te gunes gibi okundu (isinlar disliden
 * uzun kaliyor). Instagram'in cozumu burada da dogru: uc cizgi. Ne
 * oldugunu sesli okuyucuya `accessibilityLabel` soyluyor.
 */
/**
 * Ayarlar ikonu: DISLI.
 *
 * Onceden uc yatay cizgiydi (kullanicinin istegi 2026-08-27: "appleın
 * ayarlar ikonu gibi bir ikon koy, belirgin boyutta olsun"). Uc cizgi
 * "menu" demek; disli dogrudan ayarlari anlatiyor. Boyut 22 -> 26.
 *
 * Sekil disaridaki disli halkasi + ortadaki delik: iOS'un ayarlar
 * ikonunun okunusu bu. Dis cizgi yerine DOLU cizilse kucuk boyutta
 * disler birbirine giriyor.
 */
function AyarlarIkonu() {
  const R = renk.metin
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path
        d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8z"
        stroke={R}
        strokeWidth={1.7}
        fill="none"
      />
      <Path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.84 2.84l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.11a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.84-2.84l.06-.06a1.7 1.7 0 0 0 .34-1.88 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.11a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.84-2.84l.06.06a1.7 1.7 0 0 0 1.88.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.11a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.84 2.84l-.06.06a1.7 1.7 0 0 0-.34 1.88V9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.11a1.7 1.7 0 0 0-1.49 1.03z"
        stroke={R}
        strokeWidth={1.7}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

/**
 * Profil sekmesinin ana ekrani.
 *
 * Bu ekran daha once YOKTU: alt gezinmedeki "Profil" dogrudan anilar
 * listesine gidiyordu. Instagram ve Swarm'da o sekme kisinin kendisini
 * gosterir, bir alt sayfasini degil.
 *
 * Ekranin omurgasi uygulamanin tek sorusudur - "su an nerede insan
 * var?" - kendine cevrilmis hali: en ustte kimlik, hemen altinda SU AN
 * neredesin seridi, sonra gecmis (anilar). Canli seritteki turuncu
 * kimligin mesru kullanimi: "su an oluyor" demek.
 */
/**
 * Canli seritteki check-in isareti.
 *
 * Onceden yalnizca turuncu bir noktaydi (kullanicinin istegi
 * 2026-08-26: "checkin yaninda turuncu nokta degil checkin ikonu
 * olsun"). Nokta "bir sey aktif" diyordu ama NE oldugunu
 * soylemiyordu; igne dogrudan check-in'i anlatiyor.
 */
function CanliCheckInIkonu() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M12 2.6a7.2 7.2 0 0 0-7.2 7.2c0 5.4 7.2 11.6 7.2 11.6s7.2-6.2 7.2-11.6A7.2 7.2 0 0 0 12 2.6z"
        fill={renk.turuncu}
      />
      <Circle cx={12} cy={9.7} r={2.7} fill={renk.turuncuZemin} />
    </Svg>
  )
}

export default function ProfilEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [profil, setProfil] = useState<KendiProfil | null>(null)
  const [fotografUrl, setFotografUrl] = useState<string | null>(null)
  const [anilar, setAnilar] = useState<AniGorunumu[]>([])
  // Sekme (kullanicinin secimi 2026-08-29): ayni veriye iki bakis -
  // zaman sirasi (anilar) ve yer sirasi (en cok gidilenler).
  const [sekme, setSekme] = useState<'anilar' | 'yerler'>('anilar')
  const [bagSayisi, setBagSayisi] = useState(0)
  const [aktifCheckIn, setAktifCheckIn] = useState<AktifCheckIn | null>(null)
  // Silme geri alinamaz: once onay.
  const [silOnayi, setSilOnayi] = useState(false)
  const [fotografYukleniyor, setFotografYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  async function yukle() {
    try {
      const kendi = await kendiProfilimiGetir()
      setProfil(kendi)

      if (!kendi) {
        setHata(null)
        return
      }

      const [anilarVerisi, baglar, canli, foto] = await Promise.all([
        kullanicininAnilariniGetir(kendi.id),
        takipcilerimiGetir(),
        aktifCheckInimiGetir(),
        kendi.fotograflar[0] ? profilFotografiUrl(kendi.fotograflar[0]) : Promise.resolve(null),
      ])
      setAnilar(anilarVerisi)
      setBagSayisi(baglar.length)
      setAktifCheckIn(canli)
      setFotografUrl(foto)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setYukleniyor(false)
    }
  }

  // Ekran her odaklandiginda yeniden cekiliyor: kullanici check-in yapip
  // ya da bir aniyi silip buraya donunce sayilar ve canli serit eski
  // degerde kalmasin.
  useFocusEffect(
    useCallback(() => {
      yukle()
    }, [])
  )

  /**
   * YERLER: kullanicinin gittigi mekanlar, cok gidilenden aza.
   *
   * Sunucuda yeni bir sorgu YOK - ekran zaten butun anilari cekiyor,
   * gruplama burada yapiliyor. Aktif check-in de sayiliyor: su an
   * bulundugun yer de "gittigin yer"dir.
   */
  const yerler = (() => {
    const sayac = new Map<string, { ad: string; semt: string | null; adet: number }>()
    const ekle = (mekanId: string, ad: string, semt: string | null) => {
      const mevcut = sayac.get(mekanId)
      if (mevcut) mevcut.adet += 1
      else sayac.set(mekanId, { ad, semt, adet: 1 })
    }
    anilar.forEach((a) => ekle(a.mekanId, a.mekanAdi, a.mekanSemti))
    if (aktifCheckIn) ekle(aktifCheckIn.mekanId, aktifCheckIn.mekanAdi, null)
    return [...sayac.entries()]
      .map(([mekanId, v]) => ({ mekanId, ...v }))
      .sort((a, b) => b.adet - a.adet || a.ad.localeCompare(b.ad, 'tr'))
  })()

  async function profiliPaylas() {
    if (!profil) return
    try {
      // Baglanti giris istiyor; paylasilan sey bir davet, herkese acik
      // bir sayfa degil. Metin bunu ima ediyor.
      await Share.share({
        message: `Slooin'de beni bul: @${profil.kullaniciAdi}\nhttps://slooin.expo.app/kullanici/${profil.id}`,
      })
    } catch {
      // Web'de paylasim penceresi olmayabilir; akisi kilitlemiyoruz.
      setHata(t('profil.paylasilamadi'))
    }
  }

  async function fotografDegistir() {
    const sonuc = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (sonuc.canceled) return

    setFotografYukleniyor(true)
    try {
      await profilFotografiniDegistir(sonuc.assets[0].uri)
      // Profili yeniden okuyoruz: imzali adres sunucudan geliyor.
      await yukle()
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setFotografYukleniyor(false)
    }
  }

  async function canliyiSil() {
    if (!aktifCheckIn) return
    try {
      await checkIniSil(aktifCheckIn.id)
      // Ayrilmaktan FARKI: ayrilma check-in'i aniya cevirir, silme
      // satiri tamamen kaldirir - akista da anilarda da kalmaz.
      setAktifCheckIn(null)
      setSilOnayi(false)
      await yukle()
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function ayril() {
    if (!aktifCheckIn) return
    try {
      await checkIndenAyril(aktifCheckIn.id)
      await yukle()
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  return (
    <View style={stiller.kok}>
      <ScrollView
        style={stiller.sayfa}
        contentContainerStyle={stiller.icerik}
        showsVerticalScrollIndicator={false}
      >
        <View style={stiller.ustCubuk}>
          <Text style={stiller.kullaniciAdi} numberOfLines={1}>
            {/* @ ISARETI YOK (kullanicinin istegi 2026-08-29).
                Bu satir sayfanin kimlik basligi; isaret sus kaliyordu.
                Baska ekranlarda @ DURUYOR - orada ad ile kullanici
                adini birbirinden ayirmaya yariyor. */}
            {profil ? profil.kullaniciAdi : ''}
          </Text>
          <Pressable
            onPress={() => router.push('/profil/ayarlar')}
            accessibilityRole="button"
            accessibilityLabel={t('profil.ayarlar')}
            hitSlop={12}
          >
            <AyarlarIkonu />
          </Pressable>
        </View>

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {yukleniyor && !profil && <Text style={stiller.durum}>{t('ortak.yukleniyor')}</Text>}

        {!yukleniyor && !profil && (
          <View style={stiller.kart}>
            <Text style={stiller.kartBaslik}>{t('profil.profilYok')}</Text>
            <Text style={stiller.kartAciklama}>{t('profil.profilYokAciklama')}</Text>
            <Pressable
              style={stiller.birincil}
              onPress={() => router.push('/profil-olustur')}
              accessibilityRole="button"
            >
              <Text style={stiller.birincilYazi}>{t('profil.profilOlustur')}</Text>
            </Pressable>
          </View>
        )}

        {profil && (
          <>
            {/* AVATAR YUKARIDA VE ORTADA (kullanicinin karari
                2026-08-26). Basilinca fotograf secilir: profil
                fotografinin TEK GIRIS NOKTASI burasi - hesap olusturma
                adiminda artik sorulmuyor. */}
            <View style={stiller.kimlik}>
              <Pressable
                onPress={fotografDegistir}
                disabled={fotografYukleniyor}
                accessibilityRole="button"
                accessibilityLabel="Profil fotoğrafını değiştir"
                style={stiller.avatarBasilir}
              >
                {fotografUrl ? (
                  <Image
                    testID="profil-fotografi"
                    source={{ uri: fotografUrl }}
                    style={stiller.avatar}
                  />
                ) : (
                  // Fotografi olmayanda bos daire birakmak profili eksik
                  // gosteriyor; bas harf kimligi tasiyor.
                  <View style={[stiller.avatar, stiller.avatarYok]}>
                    <Text style={stiller.basHarf}>
                      {(profil.ad || profil.kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase()}
                    </Text>
                  </View>
                )}
                {/* Rozet KOYU, turuncu degil: ekrandaki turuncu eylem
                    canli check-in seridi. */}
                <View style={stiller.fotografRozeti}>
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Path
                      d="M12 5v14M5 12h14"
                      stroke="#FFFFFF"
                      strokeWidth={2.6}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
              </Pressable>

              {fotografYukleniyor && (
                <Text style={stiller.fotografDurumu}>Yükleniyor…</Text>
              )}

              {/* Ad ve biyografi AVATARIN HEMEN ALTINDA ve ortali
                  (kullanicinin istegi 2026-08-27). Onceden sayilarin
                  altinda ve sola dayaliydi. */}
              <Text style={stiller.ad}>{profil.ad}</Text>
              {profil.biyografi && <Text style={stiller.biyografi}>{profil.biyografi}</Text>}

              <View style={stiller.sayilar}>
                <Pressable
                  style={stiller.sayiHucre}
                  onPress={() => router.push('/profil/anilar')}
                  accessibilityRole="button"
                >
                  <Text style={stiller.sayi}>{anilar.length}</Text>
                  <Text style={stiller.sayiEtiket}>{t('profil.aniSayisi')}</Text>
                </Pressable>

                {/* YER SAYISI (kullanicinin secimi 2026-08-29): kac
                    FARKLI mekana gidildigi. Bu uygulamanin asil olcusu
                    bu; mevcut veriden hesaplaniyor, yeni sorgu yok. */}
                <View style={stiller.sayiAyirici} />
                <Pressable
                  style={stiller.sayiHucre}
                  onPress={() => setSekme('yerler')}
                  accessibilityRole="button"
                >
                  <Text style={stiller.sayi}>{yerler.length}</Text>
                  <Text style={stiller.sayiEtiket}>{t('profil.yerSayisi')}</Text>
                </Pressable>
                <View style={stiller.sayiAyirici} />
                <Pressable
                  style={stiller.sayiHucre}
                  onPress={() => router.push('/baglar')}
                  accessibilityRole="button"
                >
                  <Text style={stiller.sayi}>{bagSayisi}</Text>
                  <Text style={stiller.sayiEtiket}>{t('profil.bagSayisi')}</Text>
                </Pressable>
              </View>

              {/* Profili duzenle ARTIK BURADA (kullanicinin secimi
                  2026-08-29). Onceden Ayarlar'in icine gomuluydu; en
                  cok kullanilan islem iki dokunus uzaktaydi. */}
              <View style={stiller.bandDugmeleri}>
                <Pressable
                  style={[stiller.bandDugme, stiller.bandDugmeDolu]}
                  onPress={() => router.push('/profil/duzenle')}
                  accessibilityRole="button"
                >
                  <Text style={[stiller.bandDugmeYazi, stiller.bandDugmeYaziDolu]}>
                    {t('profil.duzenle')}
                  </Text>
                </Pressable>
                <Pressable
                  style={stiller.bandDugme}
                  onPress={profiliPaylas}
                  accessibilityRole="button"
                >
                  <Text style={stiller.bandDugmeYazi}>{t('profil.paylas')}</Text>
                </Pressable>
              </View>

              {/* CANLI DURUM BANDIN ICINDE (kullanicinin secimi
                  2026-08-29). Onceden bandin altinda ayri bir kartti;
                  uygulamanin tek sorusu artik profilde de en ustte
                  cevaplaniyor. */}
              {aktifCheckIn ? (
              <>
              <View style={stiller.canliKart}>
                <CanliCheckInIkonu />
                <View style={stiller.canliOrta}>
                  <Text style={stiller.canliEtiket}>{t('profil.canliEtiket')}</Text>
                  <Text style={stiller.canliMekan} numberOfLines={1}>
                    {aktifCheckIn.mekanAdi}
                  </Text>
                </View>
                <View style={stiller.canliEylemler}>
                  <Pressable onPress={ayril} accessibilityRole="button" hitSlop={8}>
                    <Text style={stiller.ayril}>{t('profil.ayril')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSilOnayi(!silOnayi)}
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Text style={stiller.canliSil}>{t('profil.canliSil')}</Text>
                  </Pressable>
                </View>
              </View>

              {/* SILME GERI ALINAMAZ. Ayrilmaktan farki burada yaziyor:
                  ayrilma check-in'i aniya cevirir, silme satiri
                  tamamen kaldirir. */}
              {silOnayi && (
                <View style={stiller.silOnayAlani}>
                  <Text style={stiller.silOnaySoru}>{t('profil.canliSilOnay')}</Text>
                  <View style={stiller.silOnayDugmeleri}>
                    <Pressable
                      onPress={() => setSilOnayi(false)}
                      accessibilityRole="button"
                      hitSlop={8}
                    >
                      <Text style={stiller.vazgecYazi}>{t('ortak.vazgec')}</Text>
                    </Pressable>
                    <Pressable onPress={canliyiSil} accessibilityRole="button" hitSlop={8}>
                      <Text style={stiller.silYazi}>{t('ortak.sil')}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
              </>
            ) : null}
            </View>

            {/* SEKMELER: ayni veriye iki bakis (kullanicinin secimi
                2026-08-29). Anilar zaman sirasi, Yerler ise en cok
                gidilenden aza. Ikincisi sunucuda yeni bir sorgu
                gerektirmiyor; ayni anilardan gruplaniyor. */}
            <View style={stiller.sekmeler}>
              {(['anilar', 'yerler'] as const).map((s) => (
                <Pressable
                  key={s}
                  style={[stiller.sekme, sekme === s && stiller.sekmeAktif]}
                  onPress={() => setSekme(s)}
                  accessibilityRole="button"
                >
                  <Text style={[stiller.sekmeYazi, sekme === s && stiller.sekmeYaziAktif]}>
                    {s === 'anilar' ? t('profil.sekmeAnilar') : t('profil.sekmeYerler')}
                  </Text>
                </Pressable>
              ))}
            </View>

            {sekme === 'anilar' && anilar.length > ONIZLEME_ADEDI && (
              <View style={stiller.tumuSatiri}>
                <Pressable
                  onPress={() => router.push('/profil/anilar')}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text style={stiller.tumu}>{t('profil.tumu')}</Text>
                </Pressable>
              </View>
            )}

            {sekme === 'yerler' ? (
              yerler.length === 0 ? (
                <View style={stiller.bosAlan}>
                  <Text style={stiller.bosBaslik}>{t('profil.bosYerBaslik')}</Text>
                  <Text style={stiller.bosAciklama}>{t('profil.bosYerAciklama')}</Text>
                </View>
              ) : (
                yerler.map((yer, i) => (
                  <Pressable
                    key={yer.mekanId}
                    style={stiller.yerSatiri}
                    onPress={() => router.push(`/mekanlar/${yer.mekanId}`)}
                    accessibilityRole="button"
                  >
                    <Text style={stiller.yerSira}>{i + 1}</Text>
                    <View style={stiller.yerOrta}>
                      <Text style={stiller.yerAd} numberOfLines={1}>
                        {yer.ad}
                      </Text>
                      {yer.semt ? <Text style={stiller.yerSemt}>{yer.semt}</Text> : null}
                    </View>
                    <Text style={stiller.yerAdet}>
                      {t('profil.kezSayisi', { sayi: yer.adet })}
                    </Text>
                  </Pressable>
                ))
              )
            ) : anilar.length === 0 ? (
              <View style={stiller.bosAlan}>
                <Text style={stiller.bosBaslik}>{t('profil.bosAniBaslik')}</Text>
                <Text style={stiller.bosAciklama}>{t('profil.bosAniAciklama')}</Text>
              </View>
            ) : (
              /* ZAMAN TUNELI (kullanicinin karari 2026-08-28). Onceden
                 her ani duz bir satirdi: mekan adi + "not · 12.08.2026".
                 Tunel ayni veriyi gun ayraclariyla, saatle, semtle ve
                 varsa fotografla gosteriyor - anilarin cogunda fotograf
                 olmadigi icin izgara yerine bu desen secildi. */
              <AniTuneli
                anilar={anilar.map((ani) => ({
                  id: ani.id,
                  mekanId: ani.mekanId,
                  mekanAdi: ani.mekanAdi,
                  semt: ani.mekanSemti,
                  notMetni: ani.notMetni,
                  fotografUrl: ani.fotografUrl,
                  olusturmaZamani: ani.olusturmaZamani,
                }))}
                enFazla={ONIZLEME_ADEDI}
                onAniSec={(ani) => router.push(`/mekanlar/${ani.mekanId}`)}
              />
            )}
          </>
        )}
      </ScrollView>

    </View>
  )
}

const stiller = StyleSheet.create({
  canliEylemler: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  canliSil: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: '#C0392B',
  },
  silOnayAlani: {
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 8,
  },
  silOnaySoru: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 18,
    color: renk.metinIkincil,
  },
  silOnayDugmeleri: { flexDirection: 'row', gap: 20 },
  vazgecYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },
  silYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: '#C0392B',
  },

  kok: { flex: 1, backgroundColor: renk.zemin },
  sayfa: { flex: 1 },
  icerik: {
    paddingHorizontal: bosluk.xl,
    // Ust pay 44 -> 16 (kullanicinin istegi 2026-08-29: "biraz daha
    // kucultup yukari tasi"). Durum cubugunun altindaki bosluk
    // gereginden genisti.
    paddingTop: bosluk.l,
    paddingBottom: ALT_GEZINME_PAYI,
  },

  ustCubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: bosluk.m,
    marginBottom: bosluk.m,
  },
  kullaniciAdi: {
    flexShrink: 1,
    fontFamily: yazi.ekranBasligi,
    // Iki kez kucultuldu (2026-08-27 ve 2026-08-29): baslik boyutunda
    // sayfanin en agir ogesiydi ve profil fotografiyla yarisiyordu.
    // Olcegin disina cikilmadi: 19 -> 15.
    fontSize: olcek.govde,
    color: renk.metin,
    letterSpacing: -0.3,
  },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginBottom: bosluk.m,
  },
  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },

  /**
   * KIMLIK BLOGU TURUNCU ZEMINDE (kullanicinin istegi 2026-08-28,
   * referans: eski Swarm profil basligi).
   *
   * Tam genislik icin negatif yatay pay: sayfanin kendi yan payi
   * `icerik` uzerinde duruyor, blok onu geri aliyor ve kendi payini
   * koyuyor. Boylece renk kenardan kenara gidiyor.
   *
   * NOT - kimlik kurali gerilimi: "turuncu yalnizca eylem ve canlilik
   * icindir" kurali duruyor ve bu blok dekoratif bir turuncu. Kullanici
   * bilerek istedi; blogun icindeki hicbir sey turuncu DEGIL, yani
   * ekranin geri kalaninda turuncunun anlami korunuyor.
   */
  kimlik: {
    alignItems: 'center',
    // Band KUCULDU (kullanicinin istegi 2026-08-29): ogeler arasi
    // bosluk 16 -> 12, ust pay 24 -> 16, alt pay 16 -> 12.
    gap: bosluk.m,
    backgroundColor: renk.turuncu,
    marginHorizontal: -bosluk.xl,
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.l,
    paddingBottom: bosluk.m,
    // Bandin altindaki bosluk DARALTILDI (kullanicinin istegi
    // 2026-08-28): band ile "Anilar" arasinda genis bir beyaz aralik
    // kaliyordu. Alt pay bolum basliginin kendi ust payiyla toplaniyor,
    // bu yuzden buradan tamamen kaldirildi.
    marginBottom: 0,
  },
  avatarBasilir: { marginBottom: bosluk.xs },
  fotografRozeti: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: renk.metin,
    borderWidth: 2.5,
    borderColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotografDurumu: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: '#FFFFFF',
  },
  // Buyutuldu (kullanicinin istegi 2026-08-27): profilin capasi bu.
  avatar: {
    // 104 -> 88: band kuculurken capa da orantili kuculdu.
    width: 88,
    height: 88,
    borderRadius: 44,
    // Turuncu zeminde fotografi ayiran beyaz halka.
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarYok: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 30,
    color: renk.turuncu,
  },

  sayilar: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },

  // Bandin icindeki dugmeler: dolu olan birincil (Profili duzenle),
  // hayalet olan ikincil (Paylas). Ikisi de turuncu zemin uzerinde.
  bandDugmeleri: { flexDirection: 'row', gap: bosluk.s, alignSelf: 'stretch' },
  bandDugme: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  bandDugmeDolu: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  bandDugmeYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: '#FFFFFF' },
  bandDugmeYaziDolu: { color: renk.turuncuKoyu },

  // Sekmeler: alt cizgi secili olani gosteriyor.
  sekmeler: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
    marginTop: bosluk.l,
  },
  sekme: { flex: 1, alignItems: 'center', paddingVertical: bosluk.m },
  sekmeAktif: { borderBottomWidth: 2, borderBottomColor: renk.metin, marginBottom: -1 },
  sekmeYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: renk.metinSoluk },
  sekmeYaziAktif: { color: renk.metin },
  tumuSatiri: { alignItems: 'flex-end', marginTop: bosluk.m },

  // Yerler sekmesi: sira, ad/semt, kac kez gidildigi.
  yerSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  yerSira: {
    width: 22,
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.kucuk,
    color: renk.metinSoluk,
  },
  yerOrta: { flex: 1 },
  yerAd: { fontFamily: yazi.govdeKalin, fontSize: olcek.govde, color: renk.metin },
  yerSemt: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 1,
  },
  yerAdet: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.turuncuKoyu,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    paddingVertical: 4,
    paddingHorizontal: bosluk.m,
    overflow: 'hidden',
  },
  sayiHucre: { flex: 1, alignItems: 'center', paddingVertical: bosluk.s },
  // Turuncu zeminde: ayirici ve ikincil metinler beyazin soluk hali.
  sayiAyirici: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.35)' },
  sayi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  sayiEtiket: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  ad: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.altBaslik,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  biyografi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 2,
  },

  // Canli serit: ekranin imza ogesi. Turuncu nokta "su an oluyor" der.
  canliKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.kart,
    paddingHorizontal: bosluk.l,
    paddingVertical: bosluk.l,
    marginTop: bosluk.xl,
  },
  canliOrta: { flex: 1 },
  canliEtiket: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.turuncuKoyu,
  },
  canliMekan: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
    marginTop: 2,
  },
  ayril: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },

  kart: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    padding: bosluk.l,
    marginTop: bosluk.xl,
    ...golge.kart,
  },
  kartBaslik: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  kartAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: bosluk.xs,
  },
  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: bosluk.l,
  },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },

  bolumBasligi: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // xxl -> l: turuncu band gelince aradaki bosluk fazla kaciyordu.
    marginTop: bosluk.l,
    marginBottom: bosluk.s,
  },
  bolumAd: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  tumu: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },

  aniSatiri: {
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  aniMekan: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  aniAlt: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
  },

  bosAlan: { paddingTop: bosluk.m },
  bosBaslik: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  bosAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: bosluk.xs,
  },
})
