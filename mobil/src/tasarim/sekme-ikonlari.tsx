import Svg, { Path, Circle } from 'react-native-svg'

/**
 * PROFIL SEKME IKONLARI - "Anılar" ve "En sık" etiketlerinin solunda.
 *
 * Kullanicinin referans gorseli (2026-09-18): Anılar = takvim icinde
 * konum ignesi, En sık = konum ignesi cevresinde donen iki ok. Cizgi
 * ikonu, rengi etiketle AYNI (secili turuncu, degilse soluk) - sekme
 * cubugu rengi kendisi veriyor.
 */

export function AnilarSekmeIkonu({ renk, boyut = 22 }: { renk: string; boyut?: number }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none">
      {/* Takvim govdesi ve iki ust kulak */}
      <Path
        d="M4 7.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7.5z"
        stroke={renk}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M8 3.5v4M16 3.5v4M4 10h16" stroke={renk} strokeWidth={1.8} strokeLinecap="round" />
      {/* Konum ignesi */}
      <Path
        d="M12 18.2s-2.8-2.6-2.8-4.6a2.8 2.8 0 0 1 5.6 0c0 2-2.8 4.6-2.8 4.6z"
        stroke={renk}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={13.5} r={0.9} fill={renk} />
    </Svg>
  )
}

export function EnSikSekmeIkonu({ renk, boyut = 22 }: { renk: string; boyut?: number }) {
  return (
    /* Cizim takvimle AYNI alani doldursun diye kutu 2..22 araligina
       kirpildi (kullanicinin bildirimi 2026-09-18: "ikon cok kucuk
       olmus"); cizgi kalinligi buyumeyi dengelemek icin biraz ince. */
    <Svg width={boyut} height={boyut} viewBox="2 2 20 20" fill="none">
      {/* Cevrede donen iki yay: ustteki saga, alttaki sola akiyor;
          ok uclari yaylarin bittigi yerde (referanstaki "sync" deseni). */}
      <Path
        d="M4 10.5A8.3 8.3 0 0 1 19.3 8M20 13.5A8.3 8.3 0 0 1 4.7 16"
        stroke={renk}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M19.3 4v4h-4M4.7 20v-4h4"
        stroke={renk}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Konum ignesi ortada */}
      <Path
        d="M12 16.6s-3.1-3-3.1-5.3a3.1 3.1 0 0 1 6.2 0c0 2.3-3.1 5.3-3.1 5.3z"
        stroke={renk}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={11.3} r={1} fill={renk} />
    </Svg>
  )
}
