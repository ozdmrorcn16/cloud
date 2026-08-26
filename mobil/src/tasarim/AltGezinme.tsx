import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import Svg, { Path, Circle } from 'react-native-svg'
import { konusmalarimiGetir } from '../../lib/sohbet'
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
 * ORTADA BUYUK CHECK-IN DUGMESI VAR (kullanicinin karari 2026-08-26:
 * "ortaya check-in yapma ikonu koyalim, turuncu belirgin renkte,
 * biraz obirlerinden buyuk"). Onceki notta "konmadi, cunku kesfet
 * sekmesini tekrarlardi" yaziyordu; cozum dugmeyi eklemek DEGIL,
 * KESFET SEKMESINI DUGMEYE DONUSTURMEK oldu.
 *
 * Neden boyle: Slooin'de check-in bir mekan secilerek yapiliyor ve o
 * secim ekrani zaten Kesfet. Dugme ayri bir sekme olarak eklenseydi
 * ya cubuk alti slota cikacak ve ortasi kaymis olacakti, ya da
 * "Kisiler" cikarilacakti - ama `/kisiler` ekranina cubuk disinda
 * baska giris yok, cikarilsa oksuz kalirdi.
 *
 * Sonuc: Ana sayfa / Kisiler / [CHECK-IN] / Mesajlar / Profil.
 * Dugme `/mekanlar`a gidiyor; `/mekanlar` ve `/check-in` yollarinda
 * aktif sayiliyor.
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
    // Ana sayfa: akis. Instagram'daki gibi en solda ve ev ikonuyla.
    ad: 'Ana sayfa',
    yol: '/',
    onEk: '/',
    ikon: (aktif) => (
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path
          d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5.5H9V20H5a1 1 0 0 1-1-1z"
          stroke={ikonRengi(aktif)}
          strokeWidth={1.8}
          fill={aktif ? renk.turuncuZemin : 'none'}
          strokeLinejoin="round"
        />
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

/**
 * Ortadaki check-in dugmesi.
 *
 * Sekme degil EYLEM: turuncu dolu daire, beyaz konum ignesi. Diger
 * ikonlar 24 px cizgi, bu 30 px dolu ve daire 54 px - kullanicinin
 * istegi "biraz obirlerinden buyuk". Turuncunun burada mesru oldugu
 * acik: hem tiklanabilir hem de uygulamanin ana eylemi (bkz. tema.ts
 * "turuncu yalnizca eylem ve canlilik icin").
 */
function CheckInDugmesi({ aktif, onPress }: { aktif: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={stiller.merkez}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: aktif }}
      accessibilityLabel="Check-in yap"
    >
      <View style={[stiller.merkezDaire, aktif && stiller.merkezDaireAktif]}>
        <Svg width={30} height={30} viewBox="0 0 24 24">
          <Path
            d="M12 2.4a7.3 7.3 0 0 0-7.3 7.3c0 5.5 7.3 11.9 7.3 11.9s7.3-6.4 7.3-11.9A7.3 7.3 0 0 0 12 2.4z"
            fill="#FFFFFF"
          />
          <Circle cx={12} cy={9.6} r={2.8} fill={aktif ? renk.turuncuKoyu : renk.turuncu} />
        </Svg>
      </View>
      <Text style={stiller.merkezEtiket} numberOfLines={1}>
        Check-in
      </Text>
    </Pressable>
  )
}

export function AltGezinme() {
  const router = useRouter()
  const yol = usePathname()
  const [okunmamisMesaj, setOkunmamisMesaj] = useState(0)

  // Rozet cubugun kendi isi: cubuk artik her ekranda duruyor (kullanicinin
  // karari 2026-08-25), dolayisiyla sayiyi tek tek ekranlardan prop olarak
  // gecirmek hem tekrar hem de eksik kalma riski demekti. Yol her
  // degistiginde tazeleniyor; bir konusma okununca kullanici zaten baska
  // bir yola gidiyor.
  useEffect(() => {
    let iptal = false
    konusmalarimiGetir()
      .then((konusmalar) => {
        if (!iptal) setOkunmamisMesaj(konusmalar.reduce((t, k) => t + k.okunmamis, 0))
      })
      .catch(() => {
        if (!iptal) setOkunmamisMesaj(0)
      })
    return () => {
      iptal = true
    }
  }, [yol])

  return (
    <View style={stiller.kapsayici} pointerEvents="box-none">
      <View style={stiller.cubuk}>
        {SEKMELER.map((s, sira) => {
          // Dugme ORTAYA giriyor: iki sekme solda, iki sekme sagda.
          const merkez =
            sira === 2 ? (
              <CheckInDugmesi
                key="check-in"
                aktif={yol.startsWith('/mekanlar') || yol.startsWith('/check-in')}
                onPress={() => router.replace('/mekanlar' as never)}
              />
            ) : null
          // Ana sayfanin oneki "/" oldugu icin startsWith her yolu
          // eslestirirdi; o sekme yalnizca tam eslesmede aktif.
          const aktif = s.onEk === '/' ? yol === '/' : yol.startsWith(s.onEk)
          const rozet = s.yol === '/mesajlar' ? okunmamisMesaj : 0
          return (
            <React.Fragment key={s.yol}>
            {merkez}
            <Pressable
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
              <Text
                style={[stiller.etiket, aktif && stiller.etiketAktif]}
                numberOfLines={1}
              >
                {s.ad}
              </Text>
            </Pressable>
            </React.Fragment>
          )
        })}
      </View>
    </View>
  )
}

/** Cubugun altinda kalmamasi icin sayfa iceriginin birakmasi gereken pay. */
export const ALT_GEZINME_PAYI = 104

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
  sekme: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 2 },

  // Merkez dugme cubugun USTUNE tasiyor: buyuklugu ancak boyle
  // gorunuyor, yoksa cubugun ic yuksekligi onu diger ikonlarla ayni
  // hizaya sikistiriyor.
  merkez: { flex: 1, alignItems: 'center', gap: 4, marginTop: -18 },
  merkezDaire: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: renk.turuncu,
    alignItems: 'center',
    justifyContent: 'center',
    // Cubukla arasinda ince bir zemin halkasi: dugme cubugun uzerine
    // tasidiginda kenari kayboluyordu.
    borderWidth: 4,
    borderColor: renk.zemin,
    ...golge.yuzer,
  },
  merkezDaireAktif: { backgroundColor: renk.turuncuKoyu },
  merkezEtiket: {
    fontFamily: yazi.govdeKalin,
    fontSize: olcek.minik,
    color: renk.turuncu,
    // Daire diger ikonlardan 30 px buyuk ve 18 px yukarida; etiket
    // aksi halde komsu etiketlerden asagida kaliyor. -12 fazlaydi,
    // yazi dairenin altina biniyordu; -4 hem cakismiyor hem komsu
    // etiketlere yakin duruyor.
    marginTop: -4,
  },
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
