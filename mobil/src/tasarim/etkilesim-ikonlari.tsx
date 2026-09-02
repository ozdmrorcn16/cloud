import Svg, { Path } from 'react-native-svg'
import { renk } from './tema'

/**
 * Akis kartindaki uc eylem: begeni, yorum, paylasma.
 *
 * Hepsi CIZGI ikonu ve notr renkte; yalnizca BEGENILMIS kalp doluyor ve
 * turuncuya donuyor. Slooin'de turuncu "eylem ya da su an oluyor"
 * demek - uc ikonu birden turuncu yapmak o anlami tuketirdi.
 */

export function KalpIkonu({ dolu = false, boyut = 22 }: { dolu?: boolean; boyut?: number }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M12 20.5s-7.5-4.7-7.5-9.7a4.3 4.3 0 0 1 7.5-2.9 4.3 4.3 0 0 1 7.5 2.9c0 5-7.5 9.7-7.5 9.7z"
        fill={dolu ? renk.turuncu : 'none'}
        stroke={dolu ? renk.turuncu : renk.metinIkincil}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function YorumIkonu({ boyut = 22 }: { boyut?: number }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M20.5 11.5c0 4-3.8 7.2-8.5 7.2-1 0-2-.15-2.9-.42L4 20l1.4-3.6C4.3 15.1 3.5 13.4 3.5 11.5c0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2z"
        fill="none"
        stroke={renk.metinIkincil}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function PaylasIkonu({ boyut = 22 }: { boyut?: number }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M21 3L10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8 21 3z"
        fill="none"
        stroke={renk.metinIkincil}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
