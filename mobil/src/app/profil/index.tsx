import { useCallback, useState } from 'react'
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native'
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
            {profil ? `@${profil.kullaniciAdi}` : ''}
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
            </View>


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

            <View style={stiller.bolumBasligi}>
              <Text style={stiller.bolumAd} accessibilityRole="header">
                {t('profil.anilarBaslik')}
              </Text>
              {anilar.length > ONIZLEME_ADEDI && (
                <Pressable
                  onPress={() => router.push('/profil/anilar')}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text style={stiller.tumu}>{t('profil.tumu')}</Text>
                </Pressable>
              )}
            </View>

            {anilar.length === 0 ? (
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
    paddingTop: bosluk.xxl + bosluk.m,
    paddingBottom: ALT_GEZINME_PAYI,
  },

  ustCubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: bosluk.m,
    marginBottom: bosluk.l,
  },
  kullaniciAdi: {
    flexShrink: 1,
    fontFamily: yazi.ekranBasligi,
    // Kucultuldu (kullanicinin istegi 2026-08-27): baslik boyutunda
    // sayfanin en agir ogesiydi ve profil fotografiyla yarisiyordu.
    fontSize: olcek.altBaslik,
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

  kimlik: { alignItems: 'center', gap: bosluk.l },
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
    borderColor: renk.zemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotografDurumu: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },
  // Buyutuldu (kullanicinin istegi 2026-08-27): profilin capasi bu.
  avatar: { width: 104, height: 104, borderRadius: 52 },
  avatarYok: {
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: {
    fontFamily: yazi.ekranBasligi,
    fontSize: 34,
    color: renk.turuncu,
  },

  sayilar: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  sayiHucre: { flex: 1, alignItems: 'center', paddingVertical: bosluk.s },
  sayiAyirici: { width: 1, height: 28, backgroundColor: renk.cizgi },
  sayi: {
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.4,
  },
  sayiEtiket: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
  },

  ad: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    textAlign: 'center',
  },
  biyografi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
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
    marginTop: bosluk.xxl,
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
