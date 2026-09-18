import Svg, { Path, Circle, Line } from 'react-native-svg'
import { useRenk } from './tema-baglami'

/**
 * UYGULAMA / HAKKINDA / HESAP ISLEMLERI IKONLARI (kullanicinin referans
 * gorselleri 2026-09-19): gunes-ay (Gorunum), soru isareti (Yardim
 * merkezi), bilgi (Slooin hakkinda), el sikisan kalp (Topluluk
 * kurallari), kilitli belge (Gizlilik politikasi), satirli belge
 * (Kullanim kosullari), disli kisi (Hesap yonetimi). Hesap
 * ikonlariyla ayni dil: cizgi, 1.8 kalinlik, turuncu, seftali kutu.
 */

type Props = { boyut?: number; renk?: string }

function useC(verilen?: string) {
  const renk = useRenk()
  return verilen ?? renk.turuncu
}

export function GunesAyIkonu({ boyut = 22, renk }: Props) {
  const c = useC(renk)
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4.5} fill="none" stroke={c} strokeWidth={1.8} />
      <Path d="M12 12a4.5 4.5 0 0 1 0-9" fill={c} stroke="none" />
      <Path
        d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  )
}

export function SoruIkonu({ boyut = 22, renk }: Props) {
  const c = useC(renk)
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} fill="none" stroke={c} strokeWidth={1.8} />
      <Path
        d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8v.3"
        fill="none"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={17} r={1.1} fill={c} />
    </Svg>
  )
}

export function BilgiIkonu({ boyut = 22, renk }: Props) {
  const c = useC(renk)
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} fill="none" stroke={c} strokeWidth={1.8} />
      <Line x1={12} y1={11} x2={12} y2={16.5} stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={12} cy={7.8} r={1.1} fill={c} />
    </Svg>
  )
}

export function KalpElIkonu({ boyut = 22, renk }: Props) {
  const c = useC(renk)
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10z"
        fill="none"
        stroke={c}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 11.5l2.2-2.2a1.3 1.3 0 0 1 1.8 0l1.2 1.2M11 12.5l1.5 1.5M12.8 10.7l2.7 2.7"
        fill="none"
        stroke={c}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  )
}

export function KilitliBelgeIkonu({ boyut = 22, renk }: Props) {
  const c = useC(renk)
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M14 3H7.5A1.5 1.5 0 0 0 6 4.5v15A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V7l-4-4z"
        fill="none"
        stroke={c}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M14 3v4h4" fill="none" stroke={c} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9.8 14v-1.2a2.2 2.2 0 0 1 4.4 0V14" fill="none" stroke={c} strokeWidth={1.6} />
      <Path d="M9 14h6v4H9z" fill="none" stroke={c} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  )
}

export function BelgeIkonu({ boyut = 22, renk }: Props) {
  const c = useC(renk)
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M14 3H7.5A1.5 1.5 0 0 0 6 4.5v15A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V7l-4-4z"
        fill="none"
        stroke={c}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M14 3v4h4M9 12h6M9 15.5h6M9 9h2" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function KisiDisliIkonu({ boyut = 22, renk }: Props) {
  const c = useC(renk)
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={10} cy={8} r={3.6} fill="none" stroke={c} strokeWidth={1.8} />
      <Path d="M3.5 20c0-3.4 2.9-5.5 6.5-5.5 1 0 1.9.2 2.7.5" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={17.5} cy={17.5} r={2.2} fill="none" stroke={c} strokeWidth={1.6} />
      <Path
        d="M17.5 13.6v1.2M17.5 20.2v1.2M13.6 17.5h1.2M20.2 17.5h1.2M14.7 14.7l.9.9M19.4 19.4l.9.9M14.7 20.3l.9-.9M19.4 15.6l.9-.9"
        stroke={c}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  )
}

/** Iki dikey cubuk - "Hesabi dondur" (referans). */
export function DuraklatIkonu({ boyut = 22, renk }: Props) {
  const c = useC(renk)
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path d="M8.5 5v14M15.5 5v14" stroke={c} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  )
}

/** Cop kutusu - "Hesabi sil" (referans, kirmizi). */
export function CopKutusuIkonu({ boyut = 22, renk }: Props) {
  const c = useC(renk)
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5M10 10.5v6M14 10.5v6"
        stroke={c}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

/** Tepsiye inen ok - "Anilarin sende kalsin" karti. */
export function IndirIkonu({ boyut = 22, renk }: Props) {
  const c = useC(renk)
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 15.5v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3"
        stroke={c}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

