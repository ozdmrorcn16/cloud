import Svg, { Circle, Line, Path } from 'react-native-svg'
import { useRenk } from './tema-baglami'

/**
 * ARKADASLARIM SAYFASI IKONLARI (kullanicinin referans gorseli
 * 2026-09-20): kisi, kisi-ekle (ust cubuk), kisi-cikar (menu), yasak
 * dairesi (engelle), konusma balonu (mesaj). Hepsi 1,8 kalinlikta
 * cizgi ikon; renk cagirandan (varsayilan metin rengi).
 */
type IkonProps = { boyut?: number; renk?: string }

function Kisi({ c, dx = 0 }: { c: string; dx?: number }) {
  return (
    <>
      <Circle cx={10 + dx} cy={8} r={3.6} stroke={c} strokeWidth={1.8} fill="none" />
      <Path
        d={`M${3.2 + dx} 20c0-3.8 3-6.4 6.8-6.4s6.8 2.6 6.8 6.4`}
        stroke={c}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    </>
  )
}

export function KisiIkonu({ boyut = 24, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.metin
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Kisi c={c} dx={2} />
    </Svg>
  )
}

export function KisiEkleIkonu({ boyut = 26, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Kisi c={c} />
      <Line x1={19} y1={7} x2={19} y2={13} stroke={c} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={16} y1={10} x2={22} y2={10} stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function KisiCikarIkonu({ boyut = 24, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.yikici
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Kisi c={c} />
      <Line x1={16} y1={10} x2={22} y2={10} stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

/** Daire icinde egik cizgi: engelleme. */
export function YasakIkonu({ boyut = 24, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.yikici
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.5} stroke={c} strokeWidth={1.8} fill="none" />
      <Line x1={6.2} y1={6.2} x2={17.8} y2={17.8} stroke={c} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function KonusmaBalonuIkonu({ boyut = 24, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.metin
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.6 3.6a.5.5 0 0 1-.8-.4V16H5.5A1.5 1.5 0 0 1 4 14.5z"
        stroke={c}
        strokeWidth={1.8}
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
