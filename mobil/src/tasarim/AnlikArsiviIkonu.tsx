import Svg, { Path } from 'react-native-svg'
import { useRenk } from './tema-baglami'

/**
 * Anlik arsivi ikonu - ana sayfanin sag ustu (2026-09-24). Secenek A
 * "gecmis": saat + geri ok (`tasarim/anlik-arsivi/ikon-secenekleri.png`).
 */
export function AnlikArsiviIkonu({ boyut = 24, renk: verilen }: { boyut?: number; renk?: string } = {}) {
  const renk = useRenk()
  const c = verilen ?? renk.metin
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" stroke={c} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d="M4 4.5v3.8h3.8" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M12 8v4.3l2.8 1.8" stroke={c} strokeWidth={2} strokeLinecap="round" fill="none" />
    </Svg>
  )
}
