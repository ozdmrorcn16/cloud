import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useRenk } from './tema-baglami'

/**
 * "Check-in'i duzenle" sayfasinin bolum ikonlari (kullanicinin
 * referansi 2026-09-22): ince cizgili, turuncu. Notun = kalem,
 * Fotograflar = resim, Ifade = gulen yuz; Birlikte icin
 * `mekan-ikonlari`ndaki `KisilerIkonu` kullaniliyor.
 */
type Props = { boyut?: number; renk?: string }

export function KalemInceIkonu({ boyut = 20, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M4 20h4l10-10-4-4L4 16v4z M13.5 6.5l4 4"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

export function ResimIkonu({ boyut = 20, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Rect x={4} y={5} width={16} height={14} rx={2.5} stroke={c} strokeWidth={1.8} fill="none" />
      <Circle cx={9} cy={10} r={1.4} fill={c} />
      <Path d="M4.5 16.5l4.5-4.5 3 3 2.5-2.5 5 5" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  )
}

export function GulenYuzIkonu({ boyut = 24, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={1.8} fill="none" />
      <Circle cx={9} cy={10} r={1.1} fill={c} />
      <Circle cx={15} cy={10} r={1.1} fill={c} />
      <Path d="M8.5 14.5c1 1.3 2.1 2 3.5 2s2.5-.7 3.5-2" stroke={c} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    </Svg>
  )
}

export function OkSagIkonu({ boyut = 18, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.metinSoluk
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path d="M9 6l6 6-6 6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  )
}
