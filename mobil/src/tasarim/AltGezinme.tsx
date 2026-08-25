import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import { renk, yazi, olcek, bosluk, yuvarlak, golge } from './tema'

/**
 * Yuzer alt gezinme cubugu.
 *
 * Kullanicinin istegi (2026-08-25): tasarim Instagram ve eski Swarm
 * referans alinarak kurulacak. Ikisinin de omurgasi ayni sey: ekranin
 * altinda sabit duran sekme cubugu. Slooin'de bu YOKTU - gezinme bir
 * "ana ekran menusu" uzerinden yapiliyordu, yani her bolume gitmek
 * icin once menuye donmek gerekiyordu.
 *
 * Cubuk YUZUYOR (kenarlardan bosluklu, yuvarlak, golgeli). Bu, kimlik
 * kararlarinda zaten yaziliydi (bkz. tema.ts basligi).
 *
 * Dort sekme: Kesfet / Kisiler / Mesajlar / Profil. Swarm'daki gibi
 * ortada buyuk bir check-in dugmesi KONMADI, cunku Slooin'de check-in
 * bir mekan secilerek yapiliyor - o dugme kullaniciyi yine ayni
 * kesfet listesine goturur ve sekmeyi tekrarlardi.
 */

type Sekme = {
  ad: string
  yol: string
  /** Bu sekme hangi yollarda aktif sayilir. */
  onEk: string
  ikon: (aktif: boolean) => React.ReactNode
}

function ikonRengi(aktif: boolean) {
  return aktif ? renk.turuncu : renk.metinIkincil
}

const SEKMELER: Sekme[] = [
  {
    ad: 'Keşfet',
    yol: '/mekanlar',
    onEk: '/mekanlar',
    ikon: (aktif) => (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path
          d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"
          stroke={ikonRengi(aktif)}
          strokeWidth={1.8}
          fill={aktif ? renk.turuncuZemin : 'none'}
        />
        <Circle cx={12} cy={10} r={2.6} stroke={ikonRengi(aktif)} strokeWidth={1.8} fill="none" />
      </Svg>
    ),
  },
  {
    ad: 'Kişiler',
    yol: '/kisiler',
    onEk: '/kisiler',
    ikon: (aktif) => (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Circle cx={9} cy={8} r={3.4} stroke={ikonRengi(aktif)} strokeWidth={1.8} fill="none" />
        <Path
          d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
          stroke={ikonRengi(aktif)}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M16 8.5a3 3 0 0 1 0 5M17.5 19c0-2.2-.8-3.8-2-4.8"
          stroke={ikonRengi(aktif)}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    ),
  },
  {
    ad: 'Mesajlar',
    yol: '/mesajlar',
    onEk: '/mesajlar',
    ikon: (aktif) => (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path
          d="M4 5.5h16v10H9.5L5.5 19v-3.5H4z"
          stroke={ikonRengi(aktif)}
          strokeWidth={1.8}
          fill={aktif ? renk.turuncuZemin : 'none'}
          strokeLinejoin="round"
        />
      </Svg>
    ),
  },
  {
    ad: 'Profil',
    yol: '/profil',
    onEk: '/profil',
    ikon: (aktif) => (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Circle cx={12} cy={8} r={3.6} stroke={ikonRengi(aktif)} strokeWidth={1.8} fill="none" />
        <Path
          d="M5 19.5c0-3.4 3.1-5.5 7-5.5s7 2.1 7 5.5"
          stroke={ikonRengi(aktif)}
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    ),
  },
]

export function AltGezinme({ okunmamisMesaj = 0 }: { okunmamisMesaj?: number }) {
  const router = useRouter()
  const yol = usePathname()

  return (
    <View style={stiller.kapsayici} pointerEvents="box-none">
      <View style={stiller.cubuk}>
        {SEKMELER.map((s) => {
          const aktif = yol.startsWith(s.onEk)
          const rozet = s.yol === '/mesajlar' ? okunmamisMesaj : 0
          return (
            <Pressable
              key={s.yol}
              style={stiller.sekme}
              onPress={() => router.replace(s.yol as never)}
              accessibilityRole="tab"
              accessibilityState={{ selected: aktif }}
              accessibilityLabel={s.ad}
            >
              <View>
                {s.ikon(aktif)}
                {rozet > 0 && (
                  <View style={stiller.rozet}>
                    <Text style={stiller.rozetYazi}>{rozet > 9 ? '9+' : rozet}</Text>
                  </View>
                )}
              </View>
              <Text style={[stiller.etiket, aktif && stiller.etiketAktif]}>{s.ad}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

/** Cubugun altinda kalmamasi icin sayfa iceriginin birakmasi gereken pay. */
export const ALT_GEZINME_PAYI = 96

const stiller = StyleSheet.create({
  kapsayici: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: bosluk.l,
    paddingBottom: bosluk.l,
  },
  cubuk: {
    flexDirection: 'row',
    backgroundColor: renk.yuzey,
    borderRadius: yuvarlak.buyuk,
    borderWidth: 1,
    borderColor: renk.cizgi,
    paddingVertical: bosluk.m,
    ...golge.yuzer,
  },
  sekme: { flex: 1, alignItems: 'center', gap: 4 },
  etiket: {
    fontFamily: yazi.govde,
    fontSize: olcek.minik,
    color: renk.metinIkincil,
  },
  etiketAktif: { fontFamily: yazi.govdeKalin, color: renk.turuncu },

  rozet: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: yuvarlak.hap,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rozetYazi: {
    fontFamily: yazi.govdeKalin,
    fontSize: 10,
    lineHeight: 13,
    color: '#FFFFFF',
  },
})
