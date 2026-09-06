import { Image } from 'react-native'
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

/**
 * IKI kisi silueti - "su an kac kisi burada".
 *
 * Kullanicinin gonderdigi yakin cekime gore cizildi (2026-09-06).
 * Ilk surumde ikinci kisi %55 opakligtaydi ve neredeyse gorunmuyordu;
 * referansta ikisi de belirgin, yalnizca arkadaki BIR TIK acik. Kafalar
 * da daha buyuk ve govdeler daha yuvarlak.
 */
export function KisilerIkonu({ boyut = 22, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      {/* ARKADAKI kisi - bir tik acik, soldan tasiyor. */}
      <Circle cx={7.4} cy={7.6} r={3.1} fill={c} opacity={0.78} />
      <Path
        d="M1.6 18.6c0-3.2 2.6-5.4 5.8-5.4s5.8 2.2 5.8 5.4z"
        fill={c}
        opacity={0.78}
      />
      {/* ONDEKI kisi - tam doygun, sagda ve biraz daha buyuk. */}
      <Circle cx={15.6} cy={7.2} r={3.5} fill={c} />
      <Path
        d="M9.2 18.6c0-3.5 2.9-5.9 6.4-5.9s6.4 2.4 6.4 5.9z"
        fill={c}
      />
    </Svg>
  )
}

/**
 * Yukselen cubuklar - "bugun kac check-in".
 *
 * Referansta ORTADAKI en uzun, soldaki en kisa ve bir tik acik,
 * sagdaki ortada. Ilk surumde soldan saga duz artan bir merdiven
 * cizilmisti; referanstaki ritim o degil.
 */
export function CubukIkonu({ boyut = 22, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Rect x={2.8} y={12.4} width={4.6} height={8.4} rx={2.1} fill={c} opacity={0.62} />
      <Rect x={9.7} y={3.4} width={4.6} height={17.4} rx={2.1} fill={c} />
      <Rect x={16.6} y={8.4} width={4.6} height={12.4} rx={2.1} fill={c} />
    </Svg>
  )
}

/**
 * Yildiz - "ilcedeki sirasi".
 *
 * KOSELERI YUVARLAK. Referanstaki yildiz keskin uclu degil, yumusak
 * hatli; ayni dolgu rengiyle kalin bir `strokeLinejoin="round"` konturu
 * cizmek bunu tek path ile veriyor.
 */
export function YildizIkonu({ boyut = 22, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M12 3.6l2.65 5.35 5.9.86-4.27 4.16 1.01 5.87L12 17.02l-5.29 2.78 1.01-5.87L3.45 9.77l5.9-.86z"
        fill={c}
        stroke={c}
        strokeWidth={2.4}
        strokeLinejoin="round"
        strokeLinecap="round"
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

/**
 * Araba - "Yol tarifi al".
 *
 * BU BIR SVG DEGIL, KULLANICININ GONDERDIGI GORSEL. Talimat aciktı:
 * "Bu attigimi direk kullan" (2026-09-06). Ondan once ayni ikon uc kez
 * elle cizilmis ve ucu de referansi tutturamamisti - once kutu gibi bir
 * govde, sonra dolu bir siluet, sonra tekerlekleri "iki bacak" gibi
 * duran bir cizgi ikonu.
 *
 * Varlik `araclar/araba-ikonu-uret.py` ile uretiliyor. Kaynak gorsel
 * SIYAH zeminliydi ve arabanin cevresinde genis bir turuncu parilti
 * vardi; parilti gövdeyle NEREDEYSE AYNI RENKTE oldugu icin (govde
 * 253,117,2 - parilti 240,127,15) renk esigiyle ayrilamiyordu.
 * Ayiran tek sey keskinlik oldu: maske gradyandan cikariliyor.
 *
 * `renk` prop'u burada ISLEMIYOR - gorsel kendi rengini tasiyor. Ikon
 * yalnizca turuncu kenarlikli "Yol tarifi al" dugmesinde kullaniliyor,
 * yani koyu modda da dogru duruyor.
 */
export function ArabaIkonu({ boyut = 18 }: { boyut?: number }) {
  // Kaynak 240x175; en/boy orani sabit tutuluyor ki araba ezilmesin.
  const yukseklik = Math.round((boyut * 175) / 240)
  return (
    <Image
      source={require('../../assets/araba.png')}
      style={{ width: boyut, height: yukseklik }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
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

/**
 * KESFET EKRANININ IKONLARI (kullanicinin istegi 2026-09-06, referans
 * gorselle). Durum ikonlari RENKLERINI disaridan aliyor: sakin yesil,
 * yogun kirmizi, populer sari - bunlar marka turuncusundan bagimsiz bir
 * TRAFIK ISIGI dili, cunku bir durum anlatiyorlar, bir eylem degil.
 */

/** Katmanli harita - "Harita" gorunumu. */
export function HaritaIkonu({ boyut = 16, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M9 3.6L3.4 5.9v14.5L9 18.1l6 2.3 5.6-2.3V3.6L15 5.9z"
        fill="none"
        stroke={c}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M9 3.6v14.5M15 5.9v14.5" fill="none" stroke={c} strokeWidth={1.8} />
    </Svg>
  )
}

/** Satirlar - "Liste" gorunumu. */
export function ListeIkonu({ boyut = 16, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.metinIkincil
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Rect x={3.4} y={4.6} width={17.2} height={14.8} rx={2.6} fill="none" stroke={c} strokeWidth={1.8} />
      <Path d="M9.2 4.6v14.8" fill="none" stroke={c} strokeWidth={1.8} />
    </Svg>
  )
}

/** Kaydiraclar - tur suzgecini acan dugme. */
export function SuzgecIkonu({ boyut = 20, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path d="M3.4 7.4h17.2M3.4 12h17.2M3.4 16.6h17.2" fill="none" stroke={c} strokeWidth={1.9} strokeLinecap="round" />
      <Circle cx={8.4} cy={7.4} r={2.4} fill={c} />
      <Circle cx={15.6} cy={12} r={2.4} fill={c} />
      <Circle cx={10.4} cy={16.6} r={2.4} fill={c} />
    </Svg>
  )
}

/** Yaprak - "Sakin". */
export function YaprakIkonu({ boyut = 15, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? '#2FBF5B'
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M20.4 3.6c0 9.4-4.2 14.2-10.2 14.2-3.2 0-5.4-1.9-5.4-4.8 0-5.6 6.4-6.6 15.6-9.4z"
        fill={c}
      />
      <Path d="M4.2 20.4c2.6-5.6 6.6-9.2 11.6-11.4" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  )
}

/** Dolu konum ignesi - durum ciplerinde ve haritada. */
export function IgneIkonu({ boyut = 17, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.turuncu
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M12 2.2c-4 0-7.2 3.15-7.2 7.05 0 5.2 7.2 12.55 7.2 12.55s7.2-7.35 7.2-12.55c0-3.9-3.2-7.05-7.2-7.05z"
        fill={c}
      />
      <Circle cx={12} cy={9.2} r={2.7} fill="#FFFFFF" />
    </Svg>
  )
}

/** Geri oku - ust cubuk. */
export function GeriOkIkonu({ boyut = 24, renk: verilen }: IkonProps) {
  const renk = useRenk()
  const c = verilen ?? renk.metin
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24">
      <Path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
