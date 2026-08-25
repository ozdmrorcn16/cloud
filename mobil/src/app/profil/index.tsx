import { useCallback, useState } from 'react'
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { kendiProfilimiGetir, type KendiProfil } from '../../../lib/profil'
import { profilFotografiUrl } from '../../../lib/fotograf-url'
import {
  kullanicininAnilariniGetir,
  aktifCheckInimiGetir,
  checkIndenAyril,
  type AniGorunumu,
  type AktifCheckIn,
} from '../../../lib/checkin'
import { takipcilerimiGetir } from '../../../lib/bag-listeleri'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'
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
function AyarlarIkonu() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M4 7h16M4 12h16M4 17h16"
        stroke={renk.metin}
        strokeWidth={1.8}
        strokeLinecap="round"
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
export default function ProfilEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const [profil, setProfil] = useState<KendiProfil | null>(null)
  const [fotografUrl, setFotografUrl] = useState<string | null>(null)
  const [anilar, setAnilar] = useState<AniGorunumu[]>([])
  const [bagSayisi, setBagSayisi] = useState(0)
  const [aktifCheckIn, setAktifCheckIn] = useState<AktifCheckIn | null>(null)
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
            <View style={stiller.kimlik}>
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

            <Text style={stiller.ad}>{profil.ad}</Text>
            {profil.biyografi && <Text style={stiller.biyografi}>{profil.biyografi}</Text>}

            {aktifCheckIn ? (
              <View style={stiller.canliKart}>
                <View style={stiller.canliNokta} />
                <View style={stiller.canliOrta}>
                  <Text style={stiller.canliEtiket}>{t('profil.canliEtiket')}</Text>
                  <Text style={stiller.canliMekan} numberOfLines={1}>
                    {aktifCheckIn.mekanAdi}
                  </Text>
                </View>
                <Pressable onPress={ayril} accessibilityRole="button" hitSlop={8}>
                  <Text style={stiller.ayril}>{t('profil.ayril')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={stiller.kart}>
                <Text style={stiller.kartBaslik}>{t('profil.bosCanliBaslik')}</Text>
                <Text style={stiller.kartAciklama}>{t('profil.bosCanliAciklama')}</Text>
                {/* Sayfanin tek birincil turuncu eylemi. */}
                <Pressable
                  style={stiller.birincil}
                  onPress={() => router.push('/mekanlar')}
                  accessibilityRole="button"
                >
                  <Text style={stiller.birincilYazi}>{t('profil.checkInYap')}</Text>
                </Pressable>
              </View>
            )}

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
              anilar.slice(0, ONIZLEME_ADEDI).map((ani) => (
                <Pressable
                  key={ani.id}
                  style={stiller.aniSatiri}
                  onPress={() => router.push(`/mekanlar/${ani.mekanId}`)}
                  accessibilityRole="button"
                >
                  <Text style={stiller.aniMekan} numberOfLines={1}>
                    {ani.mekanAdi}
                  </Text>
                  <Text style={stiller.aniAlt} numberOfLines={1}>
                    {[ani.notMetni, tarihiBicimlendir(ani.olusturmaZamani)]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </Pressable>
              ))
            )}
          </>
        )}
      </ScrollView>

    </View>
  )
}

const stiller = StyleSheet.create({
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
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
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

  kimlik: { flexDirection: 'row', alignItems: 'center', gap: bosluk.xl },
  avatar: { width: 84, height: 84, borderRadius: 42 },
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

  sayilar: { flex: 1, flexDirection: 'row', alignItems: 'center' },
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
    fontSize: olcek.govde,
    color: renk.metin,
    marginTop: bosluk.l,
  },
  biyografi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginTop: bosluk.xs,
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
  canliNokta: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: renk.turuncu,
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
