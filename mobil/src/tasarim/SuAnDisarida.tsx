import { useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import type { AkisOgesi } from '../../lib/akis'
import { useDil } from '../../lib/dil'
import { suAnBuradaMi } from '../../lib/zaman'
import { yazi, olcek, bosluk, yuvarlak, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'
import { Avatar } from './Avatar'

/**
 * "SU AN DISARIDA" SERIDI - anasayfanin en ustunde, akisin uzerinde.
 *
 * Kullanicinin istegi (2026-09-07, referans gorselle): arkadaslarindan
 * su an CANLI check-in'i olanlar yatay bir avatar seridinde; her
 * avatarin altinda kisinin adi, onun altinda BULUNDUGU MEKAN.
 *
 * VERI YENI BIR ISTEK ATMIYOR. Serit, ekranin zaten cektigi akistan
 * (`akisiGetir`) turetiliyor: `canliMi` alani check-in'in `konum`u dolu
 * mu diye bakiyor ve suresi dolan check-in'lerde cron o konumu siliyor.
 * Yani "canli" bilgisi akista hazir; ayri bir RPC yazmak ikinci bir ag
 * cagrisi olurdu.
 *
 * CANLILIK OLCUTU KARTLA AYNI: `suAnBuradaMi` yardimcisi hem burada hem
 * `CheckInKarti` icinde kullaniliyor. Ayri bir kural yazilsaydi serit
 * birini "disarida" sayarken kart ayni kisiye tarih basabilirdi.
 *
 * REFERANSTAN IKI SAPMA, ikisi de veri yoklugundan:
 *
 *   1. YESIL CEVRIMICI NOKTASI YOK. Uygulamada presence sistemi yok
 *      (son_gorulme sutunu, Realtime presence - hicbiri); o noktayi
 *      "aktif kullanici" anlaminda koymak uydurma veri olurdu. Ustelik
 *      seritteki herkes tanim geregi canli oldugu icin nokta zaten
 *      bilgi tasimazdi.
 *   2. "Tumunu gor >" YOK. Gidecegi bir ekran yok; onun yerine
 *      "+N" dairesi seridi YERINDE aciyor, yani hicbir kisi
 *      erisilemez kalmiyor.
 */

/** Seritte kacinci avatardan sonra "+N" dairesi cikar. */
const ILK_GOSTERILEN = 6

/** Serit ogesi: akis ogesinden yalnizca gerekli alanlar. */
export type DisaridakiKisi = {
  kullaniciId: string
  ad: string
  mekanAdi: string
  mekanId: string
  avatarUrl: string | null
  kullaniciAdi: string
  benimMi: boolean
}

/**
 * Akistan su an disarida olanlari cikarir.
 *
 * Ayri export cunku kuralin kendisi test edilebilir olmali: "canli
 * olanlar, kisi basina bir kez, akistaki sirayla".
 *
 * Kisi basina teklestirme SAVUNMA AMACLI: sunucuda "tek aktif
 * check-in" kurali var, ama suresi dolmus bir satirin konumu henuz
 * silinmemisse (cron 10 dakikada bir kosuyor) ayni kisi iki kez
 * gorunebilirdi.
 */
export function disaridakileriCikar(ogeler: AkisOgesi[]): DisaridakiKisi[] {
  const gorulen = new Set<string>()
  const cikti: DisaridakiKisi[] = []

  for (const oge of ogeler) {
    if (!suAnBuradaMi(oge.olusturmaZamani, oge.canliMi)) continue
    if (gorulen.has(oge.kullaniciId)) continue
    gorulen.add(oge.kullaniciId)
    cikti.push({
      kullaniciId: oge.kullaniciId,
      // Rumuz varsa o, yoksa kullanici adi - kartin kullandigi ayni
      // sira (CheckInKarti icindeki `gosterilenAd`).
      ad: oge.rumuz ?? oge.kullaniciAdi ?? '',
      mekanAdi: oge.mekanAdi,
      mekanId: oge.mekanId,
      avatarUrl: oge.avatarUrl,
      kullaniciAdi: oge.kullaniciAdi ?? '',
      benimMi: oge.benimMi,
    })
  }

  return cikti
}

export function SuAnDisarida({ ogeler }: { ogeler: AkisOgesi[] }) {
  const stiller = useStiller(stilleriYap)
  const renk = useRenk()
  const router = useRouter()
  const { t } = useDil()
  const [hepsiAcik, setHepsiAcik] = useState(false)

  const kisiler = disaridakileriCikar(ogeler)

  // Kimse disarida degilse serit HIC cizilmiyor. Bos bir serit
  // ("kimse yok" yazisi ya da bos daireler) ekranin en ustunde yer
  // kaplayip hicbir sey soylemezdi; akis dogrudan basliyor.
  if (kisiler.length === 0) return null

  const gizli = hepsiAcik ? 0 : Math.max(0, kisiler.length - ILK_GOSTERILEN)
  const gosterilenler = gizli > 0 ? kisiler.slice(0, ILK_GOSTERILEN) : kisiler

  return (
    <View style={stiller.kok} testID="su-an-disarida">
      <View style={stiller.baslikSatiri}>
        {/* Turuncu nokta: "su an oluyor". Turuncunun mesru kullanimi. */}
        <View style={stiller.canliNokta} />
        <Text style={stiller.baslik}>{t('anaSayfa.suAnDisarida')}</Text>
        {/* Sayi rozeti: gercek, akistan sayiliyor. */}
        <View style={stiller.sayiRozeti}>
          <IgneCizimi renk={renk.metin} />
          <Text style={stiller.sayiYazi}>
            {t('anaSayfa.disaridaSayi', { sayi: kisiler.length })}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={stiller.serit}
      >
        {gosterilenler.map((kisi) => (
          <View key={kisi.kullaniciId} style={stiller.kisi}>
            {/* Avatar ve ad KISININ PROFILINE gider; kendi satirinda
                kendi profiline. Mekan adi ise MEKAN SAYFASINA - akis
                kartindaki ayni ayrim. */}
            <Pressable
              onPress={() =>
                router.push(
                  (kisi.benimMi ? '/profil' : `/kullanici/${kisi.kullaniciId}`) as never
                )
              }
              accessibilityRole="link"
              accessibilityLabel={t('anaSayfa.disaridaErisim', {
                ad: kisi.ad,
                mekan: kisi.mekanAdi,
              })}
              hitSlop={4}
            >
              {/* Turuncu halka: seritteki herkes canli. Halka renk
                  TASIMIYOR - hepsi ayni - ama serit disindaki
                  avatarlardan ayirt ediyor. */}
              <View style={stiller.halka}>
                <Avatar
                  fotografUrl={kisi.avatarUrl}
                  ad={kisi.ad}
                  kullaniciAdi={kisi.kullaniciAdi}
                  cap={44}
                />
              </View>
              <Text style={stiller.ad} numberOfLines={1}>
                {kisi.ad}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/harita/${kisi.mekanId}` as never)}
              accessibilityRole="link"
              accessibilityLabel={t('mekanSayfasi.haritadaGoster')}
              hitSlop={4}
            >
              <Text style={stiller.mekan} numberOfLines={1}>
                {kisi.mekanAdi}
              </Text>
            </Pressable>
          </View>
        ))}

        {gizli > 0 && (
          <Pressable
            style={stiller.kisi}
            onPress={() => setHepsiAcik(true)}
            accessibilityRole="button"
            testID="disarida-hepsi"
          >
            <View style={stiller.digerDaire}>
              <Text style={stiller.digerSayi}>+{gizli}</Text>
            </View>
            <Text style={stiller.diger} numberOfLines={1}>
              {t('anaSayfa.disaridaDiger')}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  )
}

/** Rozetteki kucuk konum ignesi. Ayri bilesene cikarilacak kadar buyuk degil. */
function IgneCizimi({ renk }: { renk: string }) {
  return (
    <Svg width={9} height={9} viewBox="0 0 24 24">
      <Path
        d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"
        fill={renk}
      />
      <Circle cx={12} cy={9} r={2.4} fill="#FFFFFF" />
    </Svg>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kok: {
      paddingTop: bosluk.xs,
      paddingBottom: bosluk.m,
      borderBottomWidth: 1,
      borderBottomColor: renk.cizgi,
      marginBottom: bosluk.s,
    },
    baslikSatiri: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: bosluk.s,
      paddingHorizontal: bosluk.sayfa,
      marginBottom: bosluk.m,
    },
    canliNokta: {
      width: 8,
      height: 8,
      borderRadius: yuvarlak.hap,
      backgroundColor: renk.turuncu,
    },
    baslik: {
      fontFamily: yazi.ekranBasligi,
      fontSize: olcek.govde,
      color: renk.metin,
      letterSpacing: -0.2,
    },
    sayiRozeti: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: renk.turuncuZemin,
      borderRadius: yuvarlak.hap,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    sayiYazi: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.minik,
      color: renk.metin,
    },

    serit: { paddingHorizontal: bosluk.sayfa, gap: bosluk.m },
    // Genislik avatardan (44) biraz GENIS: ad ve mekan adi iki yana
    // birkac piksel tasabilsin, yoksa kisa adlar bile kirpiliyor.
    kisi: { width: 56, alignItems: 'center' },
    halka: {
      width: 52,
      height: 52,
      borderRadius: yuvarlak.hap,
      borderWidth: 2,
      borderColor: renk.turuncu,
      padding: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ad: {
      fontFamily: yazi.govdeKalin,
      fontSize: olcek.minik,
      color: renk.metin,
      marginTop: 5,
      textAlign: 'center',
      alignSelf: 'stretch',
    },
    mekan: {
      fontFamily: yazi.govde,
      fontSize: 10,
      color: renk.metinIkincil,
      textAlign: 'center',
      alignSelf: 'stretch',
    },

    digerDaire: {
      width: 52,
      height: 52,
      borderRadius: yuvarlak.hap,
      backgroundColor: renk.turuncuZemin,
      alignItems: 'center',
      justifyContent: 'center',
    },
    digerSayi: {
      fontFamily: yazi.ekranBasligi,
      fontSize: olcek.kucuk,
      color: renk.turuncuYazi,
    },
    diger: {
      fontFamily: yazi.govde,
      fontSize: olcek.minik,
      color: renk.metinIkincil,
      marginTop: 5,
      textAlign: 'center',
      alignSelf: 'stretch',
    },
  })
