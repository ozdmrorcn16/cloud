import Svg, { Path, Circle, Line, Rect } from 'react-native-svg'
import { useRenk } from './tema-baglami'

/**
 * Ayar satirlarinin ikonlari.
 *
 * Hepsi ayni dilde: 20 px, 1.8 kalinlikta cizgi, dolgusuz - alt gezinme
 * cubugundaki ikonlarla ayni aile. Ikon burada suslemedir demiyoruz:
 * gruplanmis bir listede satiri gozle ayirmanin en hizli yolu.
 */

const B = 20
const K = 1.8

function govde(children: React.ReactNode) {
  return (
    <Svg width={B} height={B} viewBox="0 0 24 24">
      {children}
    </Svg>
  )
}

export const KisiIkonu = () => {
  const renk = useRenk()
  return govde(
    <>
      <Circle cx={12} cy={8} r={3.6} stroke={renk.metin} strokeWidth={K} fill="none" />
      <Path
        d="M5 19.5c0-3.4 3.1-5.5 7-5.5s7 2.1 7 5.5"
        stroke={renk.metin}
        strokeWidth={K}
        fill="none"
        strokeLinecap="round"
      />
    </>
  )
}

export const BelgeIkonu = () => {
  const renk = useRenk()
  return govde(
    <>
      <Path
        d="M6 3.5h8l4 4v13H6z"
        stroke={renk.metin}
        strokeWidth={K}
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M9 12h6M9 16h6" stroke={renk.metin} strokeWidth={K} strokeLinecap="round" />
    </>
  )
}

export const EngelIkonu = () => {
  const renk = useRenk()
  return govde(
    <>
      <Circle cx={12} cy={12} r={8} stroke={renk.metin} strokeWidth={K} fill="none" />
      <Line x1={6.5} y1={6.5} x2={17.5} y2={17.5} stroke={renk.metin} strokeWidth={K} />
    </>
  )
}

export const KonumIkonu = () => {
  const renk = useRenk()
  return govde(
    <>
      <Path
        d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"
        stroke={renk.metin}
        strokeWidth={K}
        fill="none"
      />
      <Circle cx={12} cy={10} r={2.6} stroke={renk.metin} strokeWidth={K} fill="none" />
    </>
  )
}

export const GozIkonu = () => {
  const renk = useRenk()
  return govde(
    <>
      <Path
        d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"
        stroke={renk.metin}
        strokeWidth={K}
        fill="none"
      />
      <Circle cx={12} cy={12} r={2.8} stroke={renk.metin} strokeWidth={K} fill="none" />
    </>
  )
}

export const AramaIkonu = () => {
  const renk = useRenk()
  return govde(
    <>
      <Circle cx={11} cy={11} r={6.2} stroke={renk.metin} strokeWidth={K} fill="none" />
      <Path d="M15.6 15.6L20 20" stroke={renk.metin} strokeWidth={K} strokeLinecap="round" />
    </>
  )
}

export const DurdurIkonu = () => {
  const renk = useRenk()
  return govde(
    <>
      <Rect
        x={4}
        y={4}
        width={16}
        height={16}
        rx={4}
        stroke={renk.metin}
        strokeWidth={K}
        fill="none"
      />
      <Path d="M10 9v6M14 9v6" stroke={renk.metin} strokeWidth={K} strokeLinecap="round" />
    </>
  )
}

export const CopIkonu = () => {
  const renk = useRenk()
  return govde(
    <>
      <Path
        d="M5 7h14M9 7V4.5h6V7M7 7l1 13h8l1-13"
        stroke="#C0392B"
        strokeWidth={K}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </>
  )
}

export const CikisIkonu = () => {
  const renk = useRenk()
  return govde(
    <>
      <Path
        d="M14 4.5H6v15h8"
        stroke={renk.metin}
        strokeWidth={K}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.5 12H20m0 0l-3-3m3 3l-3 3"
        stroke={renk.metin}
        strokeWidth={K}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  )
}
