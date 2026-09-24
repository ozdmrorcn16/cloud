import Svg, { Path, Rect } from 'react-native-svg'
import { useRenk } from './tema-baglami'

/**
 * Anlik arsivi ikonu - ana sayfanin sag ustu (2026-09-24). Kullanicinin
 * secimi B "arsiv kutusu" (`tasarim/anlik-arsivi/ikon-secenekleri.png`).
 */
export function AnlikArsiviIkonu({ boyut = 24, renk: verilen }: { boyut?: number; renk?: string } = {}) {
  const renk = useRenk()
  const c = verilen ?? renk.metin
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Rect x={3.5} y={4.5} width={17} height={4.5} rx={1.2} stroke={c} strokeWidth={2} fill="none" />
      <Path d="M5 9v9.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V9" stroke={c} strokeWidth={2} fill="none" />
      <Path d="M10 13h4" stroke={c} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}
