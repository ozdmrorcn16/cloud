import Svg, { Path, Circle, Line } from 'react-native-svg'
import { useRenk } from './tema-baglami'

/**
 * SIKAYET AKISI IKONLARI (kullanicinin referans gorseli, 2026-09-18:
 * "bu iki ekranin aynisini yap, hicbir seyi degistirme").
 *
 * Sebep ikonlari cizgi (1.8), turuncu; kalkan ikonlari basliktaki
 * kahraman rozet icin. Hepsi 24'luk viewBox, `boyut` ile olceklenir.
 */

type Props = { boyut?: number; renk?: string }

/** Kalkan, icinde kisa bir cizgi (unlem govdesi) - 1. ekranin rozeti. */
export function KalkanIkonu({ boyut = 32, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M12 3l7 2.6v5.2c0 4.6-3 8.3-7 9.7-4-1.4-7-5.1-7-9.7V5.6L12 3z"
        fill="none"
        stroke={c}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Line x1={12} y1={9} x2={12} y2={13} stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

/** Dolu turuncu kalkan + beyaz tik - 2. ekranin buyuk rozeti. */
export function KalkanTikIkonu({ boyut = 96 }: { boyut?: number }) {
  const renk = useRenk()
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" testID="sikayet-alindi-ikonu">
      <Path
        d="M12 2.5l7.5 2.8v5.4c0 4.9-3.2 8.9-7.5 10.3C7.7 19.6 4.5 15.6 4.5 10.7V5.3L12 2.5z"
        fill={renk.turuncu}
      />
      <Path
        d="M8.6 12.2l2.3 2.3 4.6-4.8"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

/** Konusma balonu icinde unlem - taciz. */
export function TacizIkonu({ boyut = 24, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.4c-.4.3-.8 0-.8-.5V16H6.5A2.5 2.5 0 0 1 4 13.5v-7z"
        fill="none"
        stroke={c}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Line x1={12} y1={7.5} x2={12} y2={11} stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={12} cy={13.6} r={0.9} fill={c} />
    </Svg>
  )
}

/** Resim cercevesi - uygunsuz icerik. */
export function UygunsuzIcerikIkonu({ boyut = 24, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.metin
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M4.5 6.5A2 2 0 0 1 6.5 4.5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11z"
        fill="none"
        stroke={c}
        strokeWidth={1.8}
      />
      <Path d="M5 16l4.2-4.2a1 1 0 0 1 1.4 0L15 16m-2.5-2.5l1.8-1.8a1 1 0 0 1 1.4 0L19 15" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={9} cy={9} r={1.3} fill={c} />
    </Svg>
  )
}

/** Kisi silueti - sahte hesap. */
export function SahteHesapIkonu({ boyut = 24, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.metin
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={12} cy={8.5} r={3.6} fill="none" stroke={c} strokeWidth={1.8} />
      <Path d="M5 20c.6-3.6 3.4-5.6 7-5.6s6.4 2 7 5.6" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

/** Megafon - spam veya reklam. */
export function SpamIkonu({ boyut = 24, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.metin
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M4 10v4a1 1 0 0 0 1 1h3l8 4V5L8 9H5a1 1 0 0 0-1 1z"
        fill="none"
        stroke={c}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M8 15v4" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M19 9.5a3.5 3.5 0 0 1 0 5" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

/** Uc nokta - diger. */
export function DigerIkonu({ boyut = 24, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.metin
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={6} cy={12} r={1.6} fill={c} />
      <Circle cx={12} cy={12} r={1.6} fill={c} />
      <Circle cx={18} cy={12} r={1.6} fill={c} />
    </Svg>
  )
}

/** Kisi + yasak isareti - engelleme karti. */
export function EngelleKisiIkonu({ boyut = 32 }: { boyut?: number }) {
  const renk = useRenk()
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={10} cy={8} r={3.4} fill="none" stroke={renk.metin} strokeWidth={1.8} />
      <Path d="M3.5 19.5c.6-3.4 3.2-5.3 6.5-5.3 1 0 1.9.2 2.7.5" fill="none" stroke={renk.metin} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={17} cy={17} r={4} fill="none" stroke={renk.turuncu} strokeWidth={1.8} />
      <Line x1={14.2} y1={14.2} x2={19.8} y2={19.8} stroke={renk.turuncu} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

/** Carpi - 2. ekranin sag ust kapatma dugmesi. */
export function KapatIkonu({ boyut = 24, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.metin
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}
