import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useRenk } from './tema-baglami'

/**
 * HESAP VE GUVENLIK IKONLARI (kullanicinin referans gorselleri,
 * 2026-09-18): anahtar (ayarlar satiri), zarf (e-posta), kilit (sifre),
 * telefon (acik oturumlar), kalkan-tik (hesabini koru). Hepsi cizgi
 * ikonu, 1.8 kalinlik, turuncu; seftali kare kutuda dururlar.
 */

type Props = { boyut?: number; renk?: string }

export function AnahtarIkonu({ boyut = 22, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={8} cy={15} r={4.2} fill="none" stroke={c} strokeWidth={1.8} />
      <Circle cx={7.2} cy={15.8} r={1} fill={c} />
      <Path d="M11 12l7.5-7.5M15.5 7.5l2.2 2.2M18 5l2.2 2.2" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function ZarfIkonu({ boyut = 22, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Rect x={3.5} y={6} width={17} height={12} rx={2.5} fill="none" stroke={c} strokeWidth={1.8} />
      <Path d="M4.5 7.5l7.5 5.5 7.5-5.5" fill="none" stroke={c} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  )
}

export function KilitIkonu({ boyut = 22, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Rect x={5} y={10.5} width={14} height={10} rx={2.5} fill="none" stroke={c} strokeWidth={1.8} />
      <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={12} cy={15.5} r={1.2} fill={c} />
    </Svg>
  )
}

export function TelefonIkonu({ boyut = 22, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Rect x={7} y={3} width={10} height={18} rx={2.2} fill="none" stroke={c} strokeWidth={1.8} />
      <Circle cx={12} cy={17.5} r={0.9} fill={c} />
    </Svg>
  )
}

export function KalkanTikCizgiIkonu({ boyut = 22, renk: verilen }: Props) {
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
      <Path d="M9 12l2.2 2.2L15.5 10" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

/** Dizustu - tarayici oturumlari icin (acik oturumlar ekrani). */
export function DizustuIkonu({ boyut = 22, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Rect x={5} y={5.5} width={14} height={9.5} rx={1.8} fill="none" stroke={c} strokeWidth={1.8} />
      <Path d="M3 18h18" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

/** Yon oku (kagit ucak) - "Konum erisimi" satiri. */
export function YonOkuIkonu({ boyut = 22, renk: verilen }: Props) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M20 4L4 10.5l7.5 2 2 7.5L20 4z"
        fill="none"
        stroke={c}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M11.5 12.5L20 4" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}
