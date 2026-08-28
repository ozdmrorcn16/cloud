import { useCallback, useState } from 'react'
import { View, Text, Image, FlatList, Pressable, StyleSheet } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import { akisiGetir, type AkisOgesi } from '../../lib/akis'
import { checkIniSil } from '../../lib/checkin'
import { TunelSatiri, GunAyraci, gunEtiketi } from '../tasarim/AniTuneli'
import { gorecelZaman } from '../../lib/zaman'
import { useDil } from '../../lib/dil'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from '../tasarim/tema'
import { MarkaYazisi } from '../tasarim/MarkaYazisi'
import { ALT_GEZINME_PAYI } from '../tasarim/AltGezinme'

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
  const [hata, setHata] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [yenileniyor, setYenileniyor] = useState(false)
  // Silme GERI ALINAMAZ, bu yuzden iki adimli: once onay satiri acilir.
  const [silOnayi, setSilOnayi] = useState<string | null>(null)

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
    }, [])
  )

  async function sil(id: string) {
    try {
      await checkIniSil(id)
      // Satir tek yerde duruyor: profildeki anilardan ve canli
      // seritten de kalkmis oluyor. Burada yalnizca listeyi
      // guncelliyoruz, yeniden yuklemeye gerek yok.
      setOgeler((mevcut) => mevcut.filter((o) => o.id !== id))
      setSilOnayi(null)
    } catch (e) {
      setHata(e instanceof Error ? e.message : t('anaSayfa.silAriza'))
    }
  }

  async function yenile() {
    setYenileniyor(true)
    await yukle()
    setYenileniyor(false)
  }

  return (
    <View style={stiller.kok}>
      <View style={stiller.ustCubuk}>
        <MarkaYazisi genislik={88} />
      </View>

      {hata && <Text style={stiller.hata}>{hata}</Text>}

      <FlatList
        data={ogeler}
        keyExtractor={(o) => o.id}
        contentContainerStyle={stiller.liste}
        showsVerticalScrollIndicator={false}
        refreshing={yenileniyor}
        onRefresh={yenile}
        renderItem={({ item, index }) => {
          // ZAMAN TUNELI (kullanicinin karari 2026-08-28): akis artik
          // kart yigini degil, profildekiyle AYNI dikey serit. Gun
          // ayraci yalnizca gun degistiginde ciziliyor; karsilastirma
          // bir onceki ogeyle yapiliyor cunku liste zaten en yeniden
          // eskiye sirali.
          const etiket = gunEtiketi(item.olusturmaZamani)
          const oncekiEtiket =
            index > 0 ? gunEtiketi(ogeler[index - 1].olusturmaZamani) : null

          return (
            <>
              {etiket !== oncekiEtiket && <GunAyraci etiket={etiket} />}
              <TunelSatiri
                ani={{
                  id: item.id,
                  mekanId: item.mekanId,
                  mekanAdi: item.mekanAdi,
                  semt: item.mekanSemti,
                  notMetni: item.notMetni,
                  fotografUrl: item.fotografUrl,
                  olusturmaZamani: item.olusturmaZamani,
                  kisiAdi: item.kullaniciAdi,
                  avatarUrl: item.avatarUrl,
                  canliMi: item.canliMi,
                  benimMi: item.benimMi,
                }}
                sonuncu={index === ogeler.length - 1}
                onAniSec={(ani) => router.push(`/mekanlar/${ani.mekanId}`)}
                onKisiSec={() => {
                  // `as never`: '/profil' klasor rotasi oldugu icin
                  // expo-router'in urettigi tiplenmis rota birlesiminde
                  // gorunmuyor. CheckInKarti da ayni kacisi kullaniyordu.
                  const kisiYolu = item.benimMi
                    ? '/profil'
                    : `/kullanici/${item.kullaniciId}`
                  router.push(kisiYolu as never)
                }}
                silOnayiAcik={silOnayi === item.id}
                onSilOnayi={(id) => setSilOnayi(silOnayi === id ? null : id)}
                onSil={sil}
              />
            </>
          )
        }}
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

    </View>
  )
}

const stiller = StyleSheet.create({
  satir: {
    flex: 1,
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    lineHeight: 21,
    color: renk.metin,
  },
  kullaniciAdi: { fontFamily: yazi.govdeKalin, color: renk.metin },
  ayirac: { color: renk.metinSoluk },
  // Mekan adi TURUNCU (kullanicinin istegi): satirdaki tek renkli oge
  // ve ayni zamanda tiklanabilir - turuncu kurali bozulmuyor.
  mekanAdi: { fontFamily: yazi.govdeKalin, color: renk.turuncu },
  etiket: { fontFamily: yazi.govdeOrta, color: renk.metin },

  silDugmesi: { padding: 4, marginRight: 2 },
  silOnayAlani: { marginTop: 12, gap: 8 },
  silOnaySoru: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
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

  // Marka ORTADA ve yukarida (kullanicinin istegi 2026-08-27:
  // "slooin yazisini biraz kucult ve yukari ortaya koy"). Onceden
  // sola dayaliydi ve 104 genisligindeydi.
  ustCubuk: {
    alignItems: 'center',
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.xl,
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
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.govde,
    color: renk.turuncu,
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
