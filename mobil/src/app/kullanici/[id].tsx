import { useEffect, useState } from 'react'
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { baskasininProfiliniGetir, type BaskaProfil } from '../../../lib/profil'
import { engelle } from '../../../lib/engelleme'
import { kullanicininAnilariniGetir, type AniGorunumu } from '../../../lib/checkin'
import { profilFotograflariUrl, checkInFotografiUrl } from '../../../lib/fotograf-url'
import { useDil } from '../../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../../tasarim/tema'
import { AltGezinme, ALT_GEZINME_PAYI } from '../../tasarim/AltGezinme'
import {
  bagDurumunuGetir,
  takipIstegiGonder,
  takipIsteginiYanitla,
  takibiBirak,
  sohbetIstegiGonder,
  sohbetIsteginiYanitla,
  sohbetIsteginiGeriCek,
} from '../../../lib/bag'

function GeriIkonu() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d="M15 5l-7 7 7 7"
        stroke={renk.metin}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

function tarihiBicimlendir(zaman: string): string {
  const tarih = new Date(zaman)
  if (isNaN(tarih.getTime())) return ''
  const gun = String(tarih.getDate()).padStart(2, '0')
  const ay = String(tarih.getMonth() + 1).padStart(2, '0')
  return `${gun}.${ay}.${tarih.getFullYear()}`
}

type AniSatiri = AniGorunumu & { fotografUrl: string | null }

/**
 * Baskasinin profili.
 *
 * Kimlik blogu kendi profil ekraniyla ayni deseni kullaniyor (bas
 * harfli avatar, ad, @kullaniciadi, biyografi) - iki ekran arasinda
 * gecerken kisinin ayni kisi oldugu okunmali.
 *
 * Ekranin tek birincil turuncu eylemi var ve o eylem baga gore
 * degisiyor: bag varsa "Mesaj gonder", yoksa "Takip et". Diger butun
 * bag eylemleri zeminsiz ikincil metin butonu. Bu ayrim bilincli:
 * kullanici bu ekranda ne yapmasi bekleniyorsa o turuncu olan.
 *
 * Engelleme iki adimli. Tek dokunusla engellemek geri alinamaz bir
 * eylemi kazayla tetikliyordu ve uygulamada "engellediklerim" listesi
 * henuz yok, yani geri almanin ekranda karsiligi da yok.
 */
export default function KullaniciProfiliEkrani() {
  const router = useRouter()
  const { t } = useDil()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [profil, setProfil] = useState<BaskaProfil | null>(null)
  const [fotografUrlleri, setFotografUrlleri] = useState<string[]>([])
  const [anilar, setAnilar] = useState<AniSatiri[]>([])
  const [bagDurum, setBagDurum] = useState<Awaited<ReturnType<typeof bagDurumunuGetir>> | null>(
    null
  )
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [engelleOnayi, setEngelleOnayi] = useState(false)

  async function verileriYukle() {
    try {
      const [profilVerisi, anilarVerisi, bagVerisi] = await Promise.all([
        baskasininProfiliniGetir(id),
        kullanicininAnilariniGetir(id),
        bagDurumunuGetir(id),
      ])
      setProfil(profilVerisi)
      setFotografUrlleri(await profilFotograflariUrl(profilVerisi?.fotograflar ?? []))
      setAnilar(
        await Promise.all(
          anilarVerisi.map(async (ani) => ({
            ...ani,
            fotografUrl: ani.fotograf ? await checkInFotografiUrl(ani.fotograf) : null,
          }))
        )
      )
      setBagDurum(bagVerisi)
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    verileriYukle()
  }, [id])

  async function kullaniciyiEngelle() {
    try {
      await engelle(id)
      setHata(null)
      setProfil(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setEngelleOnayi(false)
    }
  }

  function sikayetEt() {
    router.push(`/sikayet?hedefTur=kullanici&hedefId=${id}`)
  }

  async function takipEt() {
    try {
      await takipIstegiGonder(id)
      setBagDurum((onceki) => (onceki ? { ...onceki, takip: 'beklemede' } : onceki))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function takibiBirakEt() {
    try {
      await takibiBirak(id)
      setBagDurum((onceki) => (onceki ? { ...onceki, takip: 'yok' } : onceki))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function sohbetIste() {
    try {
      await sohbetIstegiGonder(id)
      setBagDurum((onceki) => (onceki ? { ...onceki, sohbet: 'beklemede' } : onceki))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function sohbetIsteginiGeriCekEt() {
    try {
      await sohbetIsteginiGeriCek(id)
      setBagDurum((onceki) => (onceki ? { ...onceki, sohbet: 'yok' } : onceki))
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function takipIstegineYanitVer(kabul: boolean) {
    try {
      await takipIsteginiYanitla(id, kabul)
      setBagDurum((onceki) =>
        onceki ? { ...onceki, gelenTakip: kabul ? 'kabul' : 'yok' } : onceki
      )
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  async function sohbetIstegineYanitVer(kabul: boolean) {
    try {
      await sohbetIsteginiYanitla(id, kabul)
      setBagDurum((onceki) =>
        onceki ? { ...onceki, gelenSohbet: kabul ? 'kabul' : 'yok' } : onceki
      )
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    }
  }

  // Mesajlasma acildiysa ekranin birincil eylemi odur; degilse takip
  // istegi. Ikisi ayni anda turuncu olmaz.
  const mesajAcik =
    bagDurum?.takip === 'kabul' ||
    bagDurum?.sohbet === 'kabul' ||
    bagDurum?.gelenSohbet === 'kabul'

  const ustCubuk = (
    <View style={stiller.ustCubuk}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('kullanici.geri')}
        hitSlop={12}
      >
        <GeriIkonu />
      </Pressable>
      <Text style={stiller.ustBaslik} numberOfLines={1}>
        {profil ? `@${profil.kullaniciAdi}` : ''}
      </Text>
    </View>
  )

  if (!profil) {
    return (
      <View style={stiller.kok}>
        {ustCubuk}
        <View style={stiller.icerik}>
          {hata && <Text style={stiller.hata}>{hata}</Text>}
          {!yukleniyor && <Text style={stiller.durum}>{t('kullanici.bulunamadi')}</Text>}
        </View>
        <AltGezinme />
      </View>
    )
  }

  return (
    <View style={stiller.kok}>
      {ustCubuk}

      <ScrollView contentContainerStyle={stiller.icerik} showsVerticalScrollIndicator={false}>
        <View style={stiller.kimlik}>
          {fotografUrlleri.length > 0 ? (
            <Image
              testID="profil-fotografi"
              source={{ uri: fotografUrlleri[0] }}
              style={stiller.avatar}
            />
          ) : (
            <View style={[stiller.avatar, stiller.avatarYok]}>
              <Text style={stiller.basHarf}>
                {(profil.ad || profil.kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase()}
              </Text>
            </View>
          )}
          <View style={stiller.kimlikOrta}>
            <Text style={stiller.ad}>{profil.ad}</Text>
            <Text style={stiller.aniSayisi}>
              {t('kullanici.aniSayisi', { sayi: anilar.length })}
            </Text>
          </View>
        </View>

        {profil.biyografi && <Text style={stiller.biyografi}>{profil.biyografi}</Text>}

        {/* Ilk fotograf avatarda kullanildi; kalanlar serit halinde. */}
        {fotografUrlleri.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={stiller.serit}
          >
            {fotografUrlleri.slice(1).map((url) => (
              <Image
                key={url}
                testID="profil-fotografi"
                source={{ uri: url }}
                style={stiller.seritFotografi}
              />
            ))}
          </ScrollView>
        )}

        {hata && <Text style={stiller.hata}>{hata}</Text>}

        {bagDurum?.gelenTakip === 'beklemede' && (
          <View style={stiller.istekKarti}>
            <Text style={stiller.istekAciklama}>{t('kullanici.gelenIstekAciklama')}</Text>
            <View style={stiller.istekButonlari}>
              <Pressable
                style={stiller.birincilKucuk}
                onPress={() => takipIstegineYanitVer(true)}
                accessibilityRole="button"
              >
                <Text style={stiller.birincilKucukYazi}>{t('kullanici.kabulEt')}</Text>
              </Pressable>
              <Pressable
                onPress={() => takipIstegineYanitVer(false)}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={stiller.ikincilYazi}>{t('kullanici.reddet')}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {bagDurum?.gelenSohbet === 'beklemede' && (
          <View style={stiller.istekKarti}>
            <View style={stiller.istekButonlari}>
              <Pressable
                style={stiller.birincilKucuk}
                onPress={() => sohbetIstegineYanitVer(true)}
                accessibilityRole="button"
              >
                <Text style={stiller.birincilKucukYazi}>{t('kullanici.kabulEt')}</Text>
              </Pressable>
              <Pressable
                onPress={() => sohbetIstegineYanitVer(false)}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={stiller.ikincilYazi}>{t('kullanici.reddet')}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {mesajAcik && (
          <Pressable
            style={stiller.birincil}
            onPress={() => router.push(`/sohbet/${id}`)}
            accessibilityRole="button"
          >
            <Text style={stiller.birincilYazi}>{t('kullanici.mesajGonder')}</Text>
          </Pressable>
        )}

        {bagDurum?.takip === 'yok' && (
          <Pressable
            style={mesajAcik ? stiller.anahtarli : stiller.birincil}
            onPress={takipEt}
            accessibilityRole="button"
          >
            <Text style={mesajAcik ? stiller.anahtarliYazi : stiller.birincilYazi}>
              {t('kullanici.takipEt')}
            </Text>
          </Pressable>
        )}

        <View style={stiller.ikincilSatir}>
          {bagDurum?.takip === 'beklemede' && (
            <Pressable onPress={takibiBirakEt} accessibilityRole="button" hitSlop={8}>
              <Text style={stiller.ikincilYazi}>{t('kullanici.istegiGeriCek')}</Text>
            </Pressable>
          )}
          {bagDurum?.takip === 'kabul' && (
            <Pressable onPress={takibiBirakEt} accessibilityRole="button" hitSlop={8}>
              <Text style={stiller.ikincilYazi}>{t('kullanici.bagiKopar')}</Text>
            </Pressable>
          )}

          {bagDurum?.sohbet === 'yok' &&
            bagDurum?.gelenSohbet !== 'kabul' &&
            bagDurum?.gelenSohbet !== 'beklemede' && (
              <Pressable onPress={sohbetIste} accessibilityRole="button" hitSlop={8}>
                <Text style={stiller.ikincilYazi}>{t('kullanici.sohbetIste')}</Text>
              </Pressable>
            )}
          {bagDurum?.sohbet === 'beklemede' && bagDurum?.gelenSohbet !== 'kabul' && (
            <Pressable onPress={sohbetIsteginiGeriCekEt} accessibilityRole="button" hitSlop={8}>
              <Text style={stiller.ikincilYazi}>{t('kullanici.istegiGeriCek')}</Text>
            </Pressable>
          )}
          {(bagDurum?.sohbet === 'kabul' || bagDurum?.gelenSohbet === 'kabul') && (
            <Text style={stiller.durumEtiketi}>{t('kullanici.sohbetAcik')}</Text>
          )}
        </View>

        <Text style={stiller.bolumAd} accessibilityRole="header">
          {t('kullanici.anilar')}
        </Text>

        {anilar.length === 0 ? (
          <Text style={stiller.durum}>{t('kullanici.aniYok')}</Text>
        ) : (
          anilar.map((ani) => (
            <Pressable
              key={ani.id}
              style={stiller.aniSatiri}
              onPress={() => router.push(`/mekanlar/${ani.mekanId}`)}
              accessibilityRole="button"
            >
              {ani.fotografUrl && (
                <Image
                  testID="ani-fotografi"
                  source={{ uri: ani.fotografUrl }}
                  style={stiller.aniFotografi}
                />
              )}
              <View style={stiller.aniOrta}>
                <Text style={stiller.aniMekan} numberOfLines={1}>
                  {ani.mekanAdi}
                </Text>
                <Text style={stiller.aniAlt} numberOfLines={1}>
                  {[ani.notMetni, tarihiBicimlendir(ani.olusturmaZamani)]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </Pressable>
          ))
        )}

        {/* Guvenlik eylemleri sessiz duruyor ama saklanmiyor: bir tacizi
            bildirmek kolay olmali, kazayla engellemek zor. */}
        <View style={stiller.guvenlikAlani}>
          <Pressable onPress={sikayetEt} accessibilityRole="button" hitSlop={8}>
            <Text style={stiller.guvenlikYazi}>{t('kullanici.sikayetEt')}</Text>
          </Pressable>
          {!engelleOnayi ? (
            <Pressable
              onPress={() => setEngelleOnayi(true)}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={stiller.guvenlikYazi}>{t('kullanici.engelle')}</Text>
            </Pressable>
          ) : (
            <View style={stiller.onayAlani}>
              <Text style={stiller.onayMetni}>{t('kullanici.engelleOnayi')}</Text>
              <View style={stiller.onayButonlari}>
                <Pressable onPress={kullaniciyiEngelle} accessibilityRole="button" hitSlop={8}>
                  <Text style={stiller.tehlikeliYazi}>{t('kullanici.engelleEvet')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => setEngelleOnayi(false)}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Text style={stiller.guvenlikYazi}>{t('kullanici.vazgec')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <AltGezinme />
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },

  ustCubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.xxl + bosluk.m,
    paddingBottom: bosluk.m,
  },
  ustBaslik: {
    flexShrink: 1,
    fontFamily: yazi.baslik,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },

  icerik: {
    paddingHorizontal: bosluk.xl,
    paddingBottom: ALT_GEZINME_PAYI,
  },

  kimlik: { flexDirection: 'row', alignItems: 'center', gap: bosluk.l, marginTop: bosluk.s },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarYok: {
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: { fontFamily: yazi.baslikKalin, fontSize: 34, color: renk.turuncu },
  kimlikOrta: { flex: 1 },
  ad: {
    fontFamily: yazi.baslik,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
  },
  aniSayisi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
  },
  biyografi: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metinIkincil,
    marginTop: bosluk.l,
  },

  serit: { gap: bosluk.s, paddingVertical: bosluk.l },
  seritFotografi: { width: 88, height: 110, borderRadius: yuvarlak.kart - 4 },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    marginTop: bosluk.m,
  },
  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: bosluk.m,
  },

  istekKarti: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    borderWidth: 1,
    borderColor: renk.cizgi,
    padding: bosluk.l,
    marginTop: bosluk.l,
    ...golge.kart,
  },
  istekAciklama: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 20,
    color: renk.metinIkincil,
    marginBottom: bosluk.m,
  },
  istekButonlari: { flexDirection: 'row', alignItems: 'center', gap: bosluk.l },

  birincil: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: bosluk.l,
    ...golge.yuzer,
  },
  birincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: '#FFFFFF',
  },
  birincilKucuk: {
    backgroundColor: renk.turuncu,
    borderRadius: yuvarlak.hap,
    paddingVertical: 10,
    paddingHorizontal: bosluk.xl,
  },
  birincilKucukYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: '#FFFFFF',
  },
  anahtarli: {
    borderWidth: 1,
    borderColor: renk.cizgi,
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.hap,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: bosluk.m,
  },
  anahtarliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },

  ikincilSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.xl,
    marginTop: bosluk.l,
  },
  ikincilYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: renk.metin,
  },
  durumEtiketi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },

  bolumAd: {
    fontFamily: yazi.baslik,
    fontSize: olcek.altBaslik,
    color: renk.metin,
    letterSpacing: -0.3,
    marginTop: bosluk.xxl,
    marginBottom: bosluk.s,
  },
  aniSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingVertical: bosluk.m,
    borderBottomWidth: 1,
    borderBottomColor: renk.cizgi,
  },
  aniFotografi: { width: 48, height: 48, borderRadius: 10, backgroundColor: renk.cizgi },
  aniOrta: { flex: 1 },
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

  guvenlikAlani: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: bosluk.l,
    marginTop: bosluk.xxl,
  },
  guvenlikYazi: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    // metinSoluk denendi ve birakildi: sayfa zemininde kontrast ~2.3:1
    // kaliyordu. Sikayet ve engelleme guvenlik eylemleri; sessiz
    // durabilirler ama okunmaz olamazlar.
    color: renk.metinIkincil,
  },
  onayAlani: { flex: 1, alignItems: 'flex-end' },
  onayMetni: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    lineHeight: 19,
    color: renk.metinIkincil,
    textAlign: 'right',
  },
  onayButonlari: { flexDirection: 'row', gap: bosluk.l, marginTop: bosluk.s },
  tehlikeliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.kucuk,
    color: '#C0392B',
  },
})
