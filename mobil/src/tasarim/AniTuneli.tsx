import { Fragment } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import Svg, { Path, Circle } from 'react-native-svg'
import { renk, yazi, olcek, bosluk, yuvarlak } from './tema'

/**
 * ANI ZAMAN TUNELI.
 *
 * Kullanicinin karari (2026-08-28): profil ekranindaki anilar dikey bir
 * zaman tuneli olarak gosteriliyor. Desen eski Swarm'dan alindi -
 * kullanici o ekranlari gonderip "buna donucez" dedi, alti secenek
 * icinden bunu secti.
 *
 * NEDEN IZGARA DEGIL: bizim anilarimiz FOTOGRAF DEGIL, YER VE ZAMAN.
 * Anilarin cogunda fotograf olmayacak; Instagram tipi bir izgarada bu
 * bos kareler demek. Tunelde ise fotografsiz bir ani da kendi basina
 * anlamli bir satir: mekan adi, semt, saat, not. Fotograf varsa ayni
 * satirin icine giriyor, ayri bir duzen gerekmiyor.
 *
 * SWARM'DAN ALINMAYAN: renkli kutular (turuncu/yesil/mavi/kirmizi/mor).
 * Slooin'de turuncu bir anlam tasiyor - bir sey turuncuysa ya
 * tiklanabilir ya "su an oluyor" demektir. Alti ayri renk o anlami
 * siler. Burada turuncu yalnizca serit ve isaretlerde.
 */

export type TunelAnisi = {
  id: string
  mekanId: string
  mekanAdi: string
  semt?: string | null
  notMetni: string | null
  fotografUrl: string | null
  olusturmaZamani: string
}

function Igne() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24">
      <Path
        d="M12 2.4a7.4 7.4 0 0 0-7.4 7.4c0 5.5 7.4 11.8 7.4 11.8s7.4-6.3 7.4-11.8A7.4 7.4 0 0 0 12 2.4z"
        fill="#FFFFFF"
      />
      <Circle cx={12} cy={9.7} r={2.8} fill={renk.turuncu} />
    </Svg>
  )
}

/** Gunun basina konan ayrac metni: Bugun / Dun / 12 Ağustos. */
function gunEtiketi(iso: string, simdi = new Date()): string {
  const tarih = new Date(iso)
  const gunFarki = Math.floor(
    (yeniGun(simdi).getTime() - yeniGun(tarih).getTime()) / 86400000
  )
  if (gunFarki <= 0) return 'Bugün'
  if (gunFarki === 1) return 'Dün'

  const aylar = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ]
  const gun = `${tarih.getDate()} ${aylar[tarih.getMonth()]}`
  // Yil ancak GECEN yillarda yaziliyor; bu yil icin gereksiz gurultu.
  return tarih.getFullYear() === simdi.getFullYear()
    ? gun
    : `${gun} ${tarih.getFullYear()}`
}

/** Gunun basi - gun farkini saat kaymalarindan bagimsiz hesaplamak icin. */
function yeniGun(t: Date): Date {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate())
}

function saat(iso: string): string {
  const t = new Date(iso)
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
}

type Props = {
  anilar: readonly TunelAnisi[]
  /** Bir aniya dokununca cagriliyor. */
  onAniSec: (ani: TunelAnisi) => void
  /** Verilirse yalnizca ilk bu kadar ani ciziliyor (profil onizlemesi). */
  enFazla?: number
}

export function AniTuneli({ anilar, onAniSec, enFazla }: Props) {
  const gosterilecek = enFazla ? anilar.slice(0, enFazla) : anilar

  let oncekiGun: string | null = null

  return (
    <View style={stiller.tunel}>
      {/* Dikey serit. Mutlak konumlu; son aninin ortasinda bitmesi icin
          alt payi var, yoksa bosluga sarkiyor. */}
      <View style={stiller.serit} />

      {gosterilecek.map((ani) => {
        const etiket = gunEtiketi(ani.olusturmaZamani)
        const gunDegisti = etiket !== oncekiGun
        oncekiGun = etiket

        const altSatir = [ani.semt ?? '', saat(ani.olusturmaZamani)]
          .filter(Boolean)
          .join(' · ')

        return (
          <Fragment key={ani.id}>
            {gunDegisti && (
              <View style={stiller.gunSatiri}>
                <Text style={stiller.gunYazi}>{etiket}</Text>
              </View>
            )}

            <Pressable
              style={stiller.ani}
              onPress={() => onAniSec(ani)}
              accessibilityRole="button"
              accessibilityLabel={`${ani.mekanAdi}, ${altSatir}`}
            >
              <View style={stiller.isaret}>
                <Igne />
              </View>

              <Text style={stiller.mekanAdi} numberOfLines={1}>
                {ani.mekanAdi}
              </Text>
              {altSatir.length > 0 && <Text style={stiller.bilgi}>{altSatir}</Text>}

              {ani.notMetni ? <Text style={stiller.not}>{ani.notMetni}</Text> : null}

              {ani.fotografUrl ? (
                <Image
                  source={{ uri: ani.fotografUrl }}
                  style={stiller.fotograf}
                  contentFit="cover"
                  transition={150}
                />
              ) : null}
            </Pressable>
          </Fragment>
        )
      })}
    </View>
  )
}

const SERIT_SOL = 15
const ISARET_CAP = 30

const stiller = StyleSheet.create({
  tunel: { paddingLeft: 40, position: 'relative' },
  serit: {
    position: 'absolute',
    left: SERIT_SOL,
    top: 6,
    bottom: 10,
    width: 2,
    backgroundColor: '#FFD9B8',
  },

  gunSatiri: {
    alignSelf: 'flex-start',
    marginLeft: -40,
    marginTop: bosluk.m,
    marginBottom: bosluk.s,
    backgroundColor: '#F6F1EB',
    borderRadius: yuvarlak.hap,
    paddingVertical: 4,
    paddingHorizontal: bosluk.m,
  },
  gunYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },

  ani: { marginBottom: bosluk.l, position: 'relative' },
  isaret: {
    position: 'absolute',
    left: -40,
    top: 0,
    width: ISARET_CAP,
    height: ISARET_CAP,
    borderRadius: yuvarlak.hap,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
    // Beyaz halka seridi isaretin arkasinda kesiyor.
    borderWidth: 3,
    borderColor: renk.zemin,
  },

  mekanAdi: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.govde,
    color: renk.metin,
  },
  bilgi: {
    fontFamily: yazi.govde,
    fontSize: olcek.kucuk,
    color: renk.metinIkincil,
    marginTop: 2,
  },
  not: {
    fontFamily: yazi.govde,
    fontSize: olcek.govde,
    color: renk.metin,
    marginTop: bosluk.s,
    lineHeight: 21,
  },
  fotograf: {
    height: 150,
    borderRadius: yuvarlak.kart,
    marginTop: bosluk.s,
    backgroundColor: '#F6F1EB',
  },
})
