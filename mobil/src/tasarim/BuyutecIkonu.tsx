import Svg, { Circle, Path } from 'react-native-svg'
import { useRenk } from './tema-baglami'

/** Buyutec: ana sayfa ust cubugu (24, metin) ve arama kutulari (20, ikincil). */
export function BuyutecIkonu({ boyut = 24, renk: verilen }: { boyut?: number; renk?: string } = {}) {
  const renk = useRenk()
  const c = verilen ?? renk.metin
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={11} cy={11} r={7} stroke={c} strokeWidth={2} fill="none" />
      <Path d="M16.5 16.5 21 21" stroke={c} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}
