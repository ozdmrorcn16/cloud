import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Svg, { Path } from 'react-native-svg'
import { yazi, olcek, bosluk, type Renk } from './tema'
import { useRenk, useStiller } from './tema-baglami'

/**
 * Detay ekranlarinin ust cubugu: geri oku + baslik.
 *
 * Uygulamada `Stack` yok, `Slot` var (bkz. src/app/_layout.tsx). Yani
 * hicbir ekranin kendiliginden gelen basligi ya da geri dugmesi yok;
 * detay ekranlarindan cikmanin tek yolu cihazin kendi hareketiydi.
 * Bu bilesen o boslugu dolduruyor.
 *
 * Baslik ORTALI degil sola yasli: Instagram ayarlarinda ortali duruyor
 * ama "Engellenenler" gibi uzun bir baslikta iki yana esit bosluk
 * birakmak geri okunu sikistiriyor.
 */
export function UstCubuk({ baslik, geriEtiketi }: { baslik: string; geriEtiketi: string }) {
  const renk = useRenk()
  const stiller = useStiller(stilleriYap)
  const router = useRouter()

  return (
    <View style={stiller.cubuk}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={geriEtiketi}
        hitSlop={12}
      >
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
      </Pressable>
      <Text style={stiller.baslik} accessibilityRole="header" numberOfLines={1}>
        {baslik}
      </Text>
    </View>
  )
}

const stilleriYap = (renk: Renk) => StyleSheet.create({
  cubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.m,
    paddingHorizontal: bosluk.xl,
    paddingTop: bosluk.xxl + bosluk.m,
    paddingBottom: bosluk.m,
  },
  baslik: {
    flexShrink: 1,
    fontFamily: yazi.ekranBasligi,
    fontSize: olcek.baslik,
    color: renk.metin,
    letterSpacing: -0.4,
  },
})
