import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { useRenk } from './tema-baglami'

/**
 * MEKAN SAYFASININ IKONLARI (kullanicinin istegi 2026-09-06).
 *
 * Hepsi DOLU ve TURUNCU: bu ikonlar bir eylem degil, bir OLCU
 * anlatiyorlar (kac kisi, kac check-in, kacinci sira). Uygulamanin geri
 * kalaninda cizgi ikonlari eylem icin kullaniliyor; olcuyu doluyla
 * ayirmak ikisini karistirmayi onluyor.
 *
 * Renk disaridan verilebiliyor, cunku ayni ikon hem turuncu seritte hem
 * de notr bir satirda kullanilabiliyor.
 */

type IkonProps = { boyut?: number; renk?: string }

/** Uc kisi silueti - "su an kac kisi burada". */
export function KisilerIkonu({ boyut = 22, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={9} cy={8} r={3.4} fill={c} />
      <Path d="M2.6 19c0-3.1 2.9-5.2 6.4-5.2s6.4 2.1 6.4 5.2z" fill={c} />
      <Circle cx={17.4} cy={8.8} r={2.6} fill={c} opacity={0.55} />
      <Path d="M17.4 13.2c2.6 0 4.4 1.6 4.4 3.9h-5.3c0-1.6-.5-2.9-1.4-3.8.7-.1 1.5-.1 2.3-.1z" fill={c} opacity={0.55} />
    </Svg>
  )
}

/** Yukselen cubuklar - "bugun kac check-in". */
export function CubukIkonu({ boyut = 22, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Rect x={3} y={13} width={4.4} height={8} rx={1.6} fill={c} opacity={0.5} />
      <Rect x={9.8} y={8} width={4.4} height={13} rx={1.6} fill={c} opacity={0.75} />
      <Rect x={16.6} y={3.5} width={4.4} height={17.5} rx={1.6} fill={c} />
    </Svg>
  )
}

/** Yildiz - "ilcedeki sirasi". */
export function YildizIkonu({ boyut = 22, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M12 2.8l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.65l-5.8 3.05 1.1-6.45-4.7-4.6 6.5-.95z"
        fill={c}
      />
    </Svg>
  )
}

/** Kupa - liderlik tablosu sekmesi. */
export function KupaIkonu({ boyut = 18, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.metinIkincil
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M7 4h10v4.5a5 5 0 0 1-10 0zM9.6 14.2h4.8l.5 3.3H9.1zM7.4 20.4h9.2v1.4H7.4z"
        fill={c}
      />
      <Path
        d="M7 6.2H5.2a2.4 2.4 0 0 0 2.3 3.6M17 6.2h1.8a2.4 2.4 0 0 1-2.3 3.6"
        fill="none"
        stroke={c}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  )
}

/** Saat - son check-inler sekmesi. */
export function SaatIkonu({ boyut = 18, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.metinIkincil
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.6} fill="none" stroke={c} strokeWidth={1.8} />
      <Path d="M12 7.2v5.1l3.3 2" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

/** Araba - "Yol tarifi al". */
export function ArabaIkonu({ boyut = 17, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M4.4 12.6l1.5-4.3A2.4 2.4 0 0 1 8.2 6.7h7.6a2.4 2.4 0 0 1 2.3 1.6l1.5 4.3v4.5a1 1 0 0 1-1 1h-1.2a1 1 0 0 1-1-1v-.8H7.6v.8a1 1 0 0 1-1 1H5.4a1 1 0 0 1-1-1z"
        fill={c}
      />
      <Circle cx={7.9} cy={13.6} r={1.15} fill="#FFFFFF" />
      <Circle cx={16.1} cy={13.6} r={1.15} fill="#FFFFFF" />
    </Svg>
  )
}

/** Navigasyon oku - harita uzerindeki yuvarlak dugme. */
export function NavigasyonIkonu({ boyut = 20, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path d="M20.6 3.4L3.9 10.2c-.9.35-.8 1.65.15 1.9l6.5 1.6 1.6 6.5c.25.95 1.55 1.05 1.9.15z" fill={c} />
    </Svg>
  )
}

/**
 * Uc nokta - ust cubuktaki menu. DIKEY; `SecimPenceresi` icindeki
 * yatay `UcNoktaIkonu` ile ayni sey degil, bu yuzden ayri ad tasiyor.
 */
export function DikeyUcNoktaIkonu({ boyut = 20, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.metin
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={12} cy={5} r={1.75} fill={c} />
      <Circle cx={12} cy={12} r={1.75} fill={c} />
      <Circle cx={12} cy={19} r={1.75} fill={c} />
    </Svg>
  )
}

/**
 * Ilk uc sirayi tasiyan madalya.
 *
 * Profildeki basari madalyalari GORSEL dosyalar (PNG); burada onlar
 * KULLANILMADI, cunku bunlar bir basari degil bir SIRA gosteriyor ve
 * yaninda sayi tasiyorlar. Ayni gorsel dili iki farkli anlamda
 * kullanmak ikisini de zayiflatirdi.
 */
export function SiraMadalyasi({ sira, boyut = 30 }: { sira: number; boyut?: number }) {
  const renk = useRenk()
  const dolgular: Record<number, [string, string]> = {
    1: ['#F5B21C', '#C98A05'],
    2: ['#BFC3C7', '#93999E'],
    3: ['#C88A5A', '#9C6535'],
  }
  const [ust, alt] = dolgular[sira] ?? [renk.cizgi, renk.cizgi]
  const yaziRengi = dolgular[sira] ? '#FFFFFF' : renk.metinIkincil

  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={13} fill={alt} />
      <Circle cx={16} cy={14.6} r={11.2} fill={ust} />
      <Path
        d={
          sira === 1
            ? 'M14.6 10.6h2.6v10.4h-2.6v-7.9l-1.9.9v-2.2z'
            : sira === 2
              ? 'M12.6 21v-2c3.6-2.7 4.8-3.8 4.8-5.1 0-.9-.6-1.4-1.5-1.4s-1.6.6-1.7 1.7h-2.3c.1-2.4 1.7-3.8 4.1-3.8 2.3 0 3.9 1.3 3.9 3.3 0 1.8-1.3 3.1-3.7 4.9h3.9V21z'
              : sira === 3
                ? 'M16 21.2c-2.5 0-4.1-1.4-4.2-3.5h2.3c.1 1 .8 1.6 1.9 1.6 1.1 0 1.8-.6 1.8-1.5 0-1-.7-1.5-2-1.5h-.9v-1.8h.9c1.1 0 1.7-.5 1.7-1.4 0-.8-.6-1.3-1.5-1.3-1 0-1.6.5-1.7 1.5h-2.3c.1-2.1 1.6-3.4 4-3.4 2.3 0 3.8 1.2 3.8 3 0 1.2-.7 2.1-1.8 2.4 1.3.3 2.1 1.2 2.1 2.6 0 2-1.7 3.3-4.1 3.3z'
                : ''
        }
        fill={yaziRengi}
      />
    </Svg>
  )
}

/** Nisangah - haritanin uzerindeki ust yuvarlak dugme (konumu goster). */
export function NisangahIkonu({ boyut = 20, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.metin
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4.2} fill="none" stroke={c} strokeWidth={2} />
      <Path
        d="M12 2.2v3.2M12 18.6v3.2M2.2 12h3.2M18.6 12h3.2"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  )
}

/**
 * Tac - liderlik tablosunda YALNIZCA birincinin yaninda.
 *
 * Ikinci ve ucuncude madalya zaten sirayi soyluyor; tac orada anlamsiz
 * bir tekrar olurdu.
 */
export function TacIkonu({ boyut = 22, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M3.2 8.4l3.5 3 5.3-6 5.3 6 3.5-3-1.8 10.2H5z"
        fill={c}
      />
    </Svg>
  )
}

/** Sag ok - bolum basligindaki "7 kisi ›". */
export function OkIkonu({ boyut = 17, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.metinSoluk
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M9.5 5.5l6.5 6.5-6.5 6.5"
        fill="none"
        stroke={c}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
