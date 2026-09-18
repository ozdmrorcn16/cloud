import Svg, { Path } from 'react-native-svg'
import { useRenk } from './tema-baglami'

/** Zil - ayarlardaki "Bildirimler" satiri (alt gezinmedekiyle ayni cizim, turuncu). */
export function ZilIkonu({ boyut = 22, renk: verilen }: { boyut?: number; renk?: string }) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M12 3.5a5.5 5.5 0 0 0-5.5 5.5v3.2L5 15.5h14l-1.5-3.3V9A5.5 5.5 0 0 0 12 3.5z"
        stroke={c}
        strokeWidth={1.8}
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M10 18.5a2 2 0 0 0 4 0" stroke={c} strokeWidth={1.8} strokeLinecap="round" fill="none" />
    </Svg>
  )
}
