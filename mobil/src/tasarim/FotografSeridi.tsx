import { useState } from 'react'
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native'
import { yatayAlan } from '../../lib/yatay-kilit'
import { useDil } from '../../lib/dil'
import { YakinlastirilabilirGorsel } from './YakinlastirilabilirGorsel'
import { yazi, olcek, bosluk, type Renk } from './tema'
import { useStiller } from './tema-baglami'

/**
 * AKIS KARTININ FOTOGRAF ALANI (coklu fotograf, kullanicinin karari
 * 2026-09-21). 2:1 alan; birden fazla fotografta yatay SAYFALI kaydirma,
 * altta nokta gostergesi ve sag ustte "1/3" rozeti. Tek fotografta ne
 * nokta ne rozet var - eski gorunumle ayni.
 *
 * Her sayfa iki parmakla yakinlastirilabilir (2026-09-08 karari, "kart
 * icinde de zoom"); parmak kalkinca 1x'e doner. Tek dokunus cagirana
 * o sayfanin indeksini verir (kart ya kendi gezginini acar ya ekrana
 * bildirir).
 *
 * Genislik `onLayout` ile olculuyor: sayfali yatay listede her sayfanin
 * eni acikca verilmek zorunda (akis fotografinda "genislik sifir"
 * tuzagi 2026-09-08'de yasandi).
 */
export function FotografSeridi({
  urller,
  onDokun,
  testID = 'akis-fotografi',
}: {
  urller: string[]
  /** Dokunulan sayfanin indeksi. */
  onDokun: (indeks: number) => void
  /**
   * Kok `${testID}-serit`; TEK fotografta basilabilir kare `${testID}`
   * (eski tekil deseni korur), coklu fotografta sayfalar `${testID}-<i>`,
   * liste `${testID}-sayfalar`, rozet `${testID}-rozeti`.
   */
  testID?: string
}) {
  const stiller = useStiller(stilleriYap)
  const { t } = useDil()
  const [genislik, setGenislik] = useState(0)
  const [indeks, setIndeks] = useState(0)

  if (urller.length === 0) return null

  function sayfaDegisti(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (genislik <= 0) return
    const yeni = Math.round(e.nativeEvent.contentOffset.x / genislik)
    if (yeni !== indeks && yeni >= 0 && yeni < urller.length) setIndeks(yeni)
  }

  const cokluMu = urller.length > 1

  return (
    <View
      style={stiller.kap}
      testID={`${testID}-serit`}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && Math.abs(w - genislik) > 1) setGenislik(w)
      }}
    >
      {cokluMu ? (
        <FlatList
          {...yatayAlan}
          testID={`${testID}-sayfalar`}
          data={urller}
          keyExtractor={(u, i) => `${i}-${u}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          // Olcum gelmeden sayfalar cizilmesin: 0 px eninde sayfa
          // "genislik sifir" tuzagidir.
          getItemLayout={(_, i) => ({ length: genislik, offset: genislik * i, index: i })}
          onMomentumScrollEnd={sayfaDegisti}
          renderItem={({ item, index }) => (
            <Pressable
              testID={`${testID}-${index}`}
              onPress={() => onDokun(index)}
              accessibilityRole="button"
              accessibilityLabel={t('anaSayfa.fotografiBuyut')}
              style={{ width: genislik || undefined }}
            >
              <YakinlastirilabilirGorsel
                uri={item}
                stil={[stiller.fotograf, genislik ? { width: genislik } : null]}
                birakincaSifirla
              />
            </Pressable>
          )}
        />
      ) : (
        <Pressable
          testID={testID}
          onPress={() => onDokun(0)}
          accessibilityRole="button"
          accessibilityLabel={t('anaSayfa.fotografiBuyut')}
        >
          <YakinlastirilabilirGorsel uri={urller[0]} stil={stiller.fotograf} birakincaSifirla />
        </Pressable>
      )}

      {cokluMu && (
        <>
          <View style={stiller.rozet} pointerEvents="none">
            <Text style={stiller.rozetYazi} testID={`${testID}-rozeti`}>
              {indeks + 1}/{urller.length}
            </Text>
          </View>
          <View style={stiller.noktalar} pointerEvents="none">
            {urller.map((_, i) => (
              <View key={i} style={[stiller.nokta, i === indeks && stiller.noktaSecili]} />
            ))}
          </View>
        </>
      )}
    </View>
  )
}

const stilleriYap = (renk: Renk) =>
  StyleSheet.create({
    kap: {
      marginTop: bosluk.m,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: renk.cizgi,
    },
    // Referans olcusu 2:1 (2026-09-18).
    fotograf: {
      width: '100%',
      aspectRatio: 2,
      backgroundColor: renk.cizgi,
    },
    rozet: {
      position: 'absolute',
      top: bosluk.s,
      right: bosluk.s,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 999,
      paddingHorizontal: bosluk.s,
      paddingVertical: 3,
    },
    rozetYazi: { fontFamily: yazi.govdeKalin, fontSize: olcek.kucuk, color: '#FFFFFF' },
    noktalar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: bosluk.s,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 5,
    },
    nokta: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
    noktaSecili: { backgroundColor: '#FFFFFF' },
  })
