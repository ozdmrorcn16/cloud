import { useRef, type ReactNode } from 'react'
import { Animated, PanResponder, StyleSheet, View } from 'react-native'
import type { HikayeKonum } from '../../lib/hikaye'

/**
 * HIKAYE OGESI (2026-09-22, kullanicinin referansi: "Etiketler
 * suruklenip boyutlandirilabilir"). Fotografin uzerindeki yazi, ifade,
 * mekan ve arkadas etiketlerini saran kap: tek parmakla suruklenir,
 * iki parmakla buyutulup kucultulur.
 *
 * KONUM ORANSAL tutuluyor (x,y 0..1, ogenin merkezi): hikayeyi baska
 * boyda bir telefon aciyor ve etiket ayni yerde durmali. Piksele
 * cevirme yalnizca cizim aninda, olculen alan boyuyla yapiliyor.
 *
 * REANIMATED DEGIL `Animated` + `PanResponder` (2026-09-20 karari:
 * reanimated'in jest kurulumu yok). Pinch icin ayri bir kutuphane de
 * gerekmiyor - PanResponder olayi iki dokunusu da tasiyor, olcek iki
 * parmak arasi UZAKLIK ORANINDAN hesaplaniyor.
 */

const EN_KUCUK_OLCEK = 0.5
const EN_BUYUK_OLCEK = 3

/** Iki dokunus arasi uzaklik; tek dokunusta 0. */
export function parmakAraligi(dokunuslar: { pageX: number; pageY: number }[]): number {
  if (dokunuslar.length < 2) return 0
  const [a, b] = dokunuslar
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY)
}

/** Suruklemenin oransal karsiligi; alan olculmediyse konum degismez. */
export function yeniKonum(
  baslangic: HikayeKonum,
  kayma: { dx: number; dy: number },
  alan: { en: number; boy: number },
  olcekCarpani: number
): HikayeKonum {
  const sinirla = (deger: number) => Math.min(1, Math.max(0, deger))
  return {
    x: alan.en > 0 ? sinirla(baslangic.x + kayma.dx / alan.en) : baslangic.x,
    y: alan.boy > 0 ? sinirla(baslangic.y + kayma.dy / alan.boy) : baslangic.y,
    olcek: Math.min(EN_BUYUK_OLCEK, Math.max(EN_KUCUK_OLCEK, baslangic.olcek * olcekCarpani)),
  }
}

export function HikayeOgesi({
  konum,
  alan,
  onDegis,
  duzenlenebilir = true,
  testID,
  children,
}: {
  konum: HikayeKonum
  /** Fotograf alaninin olculen boyu; 0 ise surukleme konumu degistirmez. */
  alan: { en: number; boy: number }
  onDegis?: (konum: HikayeKonum) => void
  /** Izleyicide false: oge yalnizca ciziliyor, dokunus alta geciyor. */
  duzenlenebilir?: boolean
  testID?: string
  children: ReactNode
}) {
  // Surukleme suresince baslangic degerleri sabit kalmali; her karede
  // guncel konumdan hesaplamak birikimli kaymaya yol aciyor.
  const baslangicRef = useRef<HikayeKonum>(konum)
  const ilkAralikRef = useRef(0)
  const konumRef = useRef(konum)
  konumRef.current = konum

  const tepki = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => duzenlenebilir,
      onMoveShouldSetPanResponder: () => duzenlenebilir,
      onPanResponderGrant: (olay) => {
        baslangicRef.current = konumRef.current
        ilkAralikRef.current = parmakAraligi(olay.nativeEvent.touches ?? [])
      },
      onPanResponderMove: (olay, durum) => {
        const aralik = parmakAraligi(olay.nativeEvent.touches ?? [])
        // Iki parmak SONRADAN da konabilir: ilk aralik o anda yakalanir.
        if (aralik > 0 && ilkAralikRef.current === 0) {
          ilkAralikRef.current = aralik
          baslangicRef.current = konumRef.current
        }
        const carpan = aralik > 0 && ilkAralikRef.current > 0 ? aralik / ilkAralikRef.current : 1
        onDegis?.(yeniKonum(baslangicRef.current, durum, alan, carpan))
      },
      onPanResponderRelease: () => {
        ilkAralikRef.current = 0
      },
    })
  ).current

  const stil = {
    left: `${konum.x * 100}%` as const,
    top: `${konum.y * 100}%` as const,
    transform: [{ translateX: '-50%' as const }, { translateY: '-50%' as const }, { scale: konum.olcek }],
  }

  return (
    <Animated.View
      testID={testID}
      style={[stiller.oge, stil]}
      pointerEvents={duzenlenebilir ? 'auto' : 'box-none'}
      {...(duzenlenebilir ? tepki.panHandlers : {})}
    >
      <View pointerEvents={duzenlenebilir ? 'none' : 'auto'}>{children}</View>
    </Animated.View>
  )
}

const stiller = StyleSheet.create({
  oge: { position: 'absolute', alignItems: 'center' },
})
