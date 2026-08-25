import { useCallback, useState } from 'react'
import { View, Text, Image, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import { akisiGetir, type AkisOgesi } from '../../lib/akis'
import { konusmalarimiGetir } from '../../lib/sohbet'
import { useDil } from '../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../tasarim/tema'
import { MarkaYazisi } from '../tasarim/MarkaYazisi'
import { AltGezinme, ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'

const DAKIKA = 60 * 1000
const SAAT = 60 * DAKIKA
const GUN = 24 * SAAT

/**
 * Akista zaman "ne kadar once" olarak okunur; tam saat kimseye lazim
 * degil. Bir haftayi geceni tarihe donuyor, cunku "23 gün" artik
 * yakinlik bilgisi tasimiyor.
 */
function gorecelZaman(
  iso: string,
  t: (anahtar: string, secenekler?: Record<string, unknown>) => string
): string {
  const gecen = Date.now() - new Date(iso).getTime()
  if (gecen < DAKIKA) return t('anaSayfa.azOnce')
  if (gecen < SAAT) return t('anaSayfa.dakika', { sayi: Math.floor(gecen / DAKIKA) })
  if (gecen < GUN) return t('anaSayfa.saat', { sayi: Math.floor(gecen / SAAT) })
  if (gecen < 7 * GUN) return t('anaSayfa.gun', { sayi: Math.floor(gecen / GUN) })

  const tarih = new Date(iso)
  const gun = String(tarih.getDate()).padStart(2, '0')
  const ay = String(tarih.getMonth() + 1).padStart(2, '0')
  return `${gun}.${ay}.${tarih.getFullYear()}`
}

function KonumIkonu() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Path
        d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"
        stroke={renk.metinIkincil}
        strokeWidth={2}
        fill="none"
      />
      <Circle cx={12} cy={10} r={2.4} stroke={renk.metinIkincil} strokeWidth={2} fill="none" />
    </Svg>
  )
}

/**
 * Ana sayfa: akis.
 *
 * Kullanicinin karari (2026-08-25): giristen sonra Instagram'daki gibi
 * bir ana sayfa gelir ve alt cubugun en solundaki ev ikonu buraya
 * doner. Akista kullanicinin KENDI check-in'leri ve karsilikli bag
 * kurdugu kisilerin check-in'leri birlikte akar; fotografli olanlar
 * fotografiyla gorunur.
 *
 * Burasi eskiden bir "ana ekran menusu"ydu (Kisi ara / Baglar /
 * Mesajlar satirlari). Gezinme alt cubuga tasindigi icin o menu
 * gereksizdi; yerini icerik aldi.
 */
export default function AnaSayfa() {
  const router = useRouter()
  const { t } = useDil()
  const [ogeler, setOgeler] = useState<AkisOgesi[]>([])
  const [okunmamisMesaj, setOkunmamisMesaj] = useState(0)
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [yenileniyor, setYenileniyor] = useState(false)

  async function yukle() {
    try {
      setOgeler(await akisiGetir())
      setHata(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('ortak.birSorunOldu'))
    } finally {
      setYukleniyor(false)
    }
  }

  // Ekran her odaklandiginda tazeleniyor: kullanici check-in yapip geri
  // donunce kendi paylasimini akisin basinda gormeli.
  useFocusEffect(
    useCallback(() => {
      yukle()
      konusmalarimiGetir()
        .then((konusmalar) =>
          setOkunmamisMesaj(konusmalar.reduce((toplam, k) => toplam + k.okunmamis, 0))
        )
        .catch(() => setOkunmamisMesaj(0))
    }, [])
  )

  async function yenile() {
    setYenileniyor(true)
    await yukle()
    setYenileniyor(false)
  }

  return (
    <View style={stiller.kok}>
      <View style={stiller.ustCubuk}>
        <MarkaYazisi genislik={104} />
      </View>

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <FlatList
        data={ogeler}
        keyExtractor={(o) => o.id}
        contentContainerStyle={stiller.liste}
        showsVerticalScrollIndicator={false}
        refreshing={yenileniyor}
        onRefresh={yenile}
        renderItem={({ item }) => (
          <View style={stiller.kart}>
            <View style={stiller.kartUst}>
              <Pressable
                style={stiller.kisi}
                onPress={() =>
                  // `as never`: uretilen rota tipleri profil ana ekranini
                  // "/profil/index" diye yaziyor, calisma zamaninda ise yol
                  // "/profil". Ayni takla AltGezinme'de de var.
                  router.push(
                    (item.benimMi ? '/profil' : `/kullanici/${item.kullaniciId}`) as never
                  )
                }
                accessibilityRole="button"
              >
                <View style={stiller.avatar}>
                  <Text style={stiller.basHarf}>
                    {(item.kullaniciAdi || '?').trim().charAt(0).toLocaleUpperCase()}
                  </Text>
                </View>
                <View style={stiller.kisiOrta}>
                  <Text style={stiller.kullaniciAdi} numberOfLines={1}>
                    {item.kullaniciAdi ?? ''}
                  </Text>
                  <Pressable
                    onPress={() => router.push(`/mekanlar/${item.mekanId}`)}
                    accessibilityRole="button"
                    hitSlop={6}
                  >
                    <View style={stiller.mekanSatiri}>
                      <KonumIkonu />
                      <Text style={stiller.mekanAdi} numberOfLines={1}>
                        {item.mekanAdi}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </Pressable>

              {item.canliMi ? (
                // Turuncunun mesru kullanimi: "su an oluyor".
                <View style={stiller.canliRozet}>
                  <View style={stiller.canliNokta} />
                  <Text style={stiller.canliYazi}>{t('anaSayfa.suAnBurada')}</Text>
                </View>
              ) : (
                <Text style={stiller.zaman}>{gorecelZaman(item.olusturmaZamani, t)}</Text>
              )}
            </View>

            {item.fotografUrl && (
              <Image
                testID="akis-fotografi"
                source={{ uri: item.fotografUrl }}
                style={stiller.fotograf}
                resizeMode="cover"
              />
            )}

            {item.notMetni && <Text style={stiller.not}>{item.notMetni}</Text>}
          </View>
        )}
        ListEmptyComponent={
          yukleniyor ? (
            <Text style={stiller.durum}>{t('ortak.yukleniyor')}</Text>
          ) : (
            // Bos akis yon veriyor: nasil dolacagini soyluyor.
            <View style={stiller.bosAlan}>
              <Text style={stiller.bosBaslik}>{t('anaSayfa.bosBaslik')}</Text>
              <Text style={stiller.bosAciklama}>{t('anaSayfa.bosAciklama')}</Text>
              <Pressable
                style={stiller.birincil}
                onPress={() => router.push('/mekanlar')}
                accessibilityRole="button"
              >
                <Text style={stiller.birincilYazi}>{t('anaSayfa.kesfet')}</Text>
              </Pressable>
            </View>
          )
        }
      />

      <AltGezinme okunmamisMesaj={okunmamisMesaj} />
    </View>
  )
}

const stiller = StyleSheet.create({
  kok: { flex: 1, backgroundColor: renk.zemin },

  ustCubuk: {
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.xxl + bosluk.m,
    paddingBottom: bosluk.m,
  },

  hata: {
    fontFamily: yazi.govdeOrta,
    fontSize: olcek.kucuk,
    color: '#C0392B',
    paddingHorizontal: bosluk.xl,
    marginBottom: bosluk.s,
  },
  durum: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    paddingHorizontal: bosluk.xl,
  },

  liste: { paddingHorizontal: bosluk.l, paddingBottom: ALT_GEZINME_PAYI },

  kart: {
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.kart,
    padding: bosluk.m,
    marginBottom: bosluk.m,
    ...golge.kart,
  },
  kartUst: { flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  kisi: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: bosluk.m },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: renk.turuncuZemin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  basHarf: {
    fontFamily: yazi.baslikKalin,
    fontSize: olcek.govde,
    color: renk.turuncu,
  },
  kisiOrta: { flex: 1 },
  kullaniciAdi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  mekanSatiri: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  mekanAdi: {
    flexShrink: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
  },

  zaman: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinSoluk,
  },
  canliRozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: renk.turuncuZemin,
    borderRadius: yuvarlak.hap,
    paddingHorizontal: bosluk.s,
    paddingVertical: 4,
  },
  canliNokta: { width: 7, height: 7, borderRadius: 4, backgroundColor: renk.turuncu },
  canliYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.turuncuKoyu,
  },

  fotograf: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: yuvarlak.kart - 4,
    marginTop: bosluk.m,
    backgroundColor: renk.cizgi,
  },
  not: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metin,
    marginTop: bosluk.m,
  },

  bosAlan: { paddingHorizontal: bosluk.s, paddingTop: bosluk.xxl },
  bosBaslik: {
    fontFamily: yazi.baslik,
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
})
