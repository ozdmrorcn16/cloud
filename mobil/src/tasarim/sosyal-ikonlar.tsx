import Svg, { Path } from 'react-native-svg'

/**
 * "Apple ile devam et" ve "Google ile devam et" dugmelerindeki marka
 * isaretleri.
 *
 * MARKA KURALLARI: ikisi de saglayicinin kendi logosu ve yeniden
 * cizilmez, rengi degistirilmez. Apple'in ve Google'in oturum acma
 * rehberleri buna acikca yer veriyor; marka rengimiz (turuncu) bu
 * ikonlara UYGULANMAZ. Dugmenin kendisi notr kaliyor - yalnizca
 * "Devam" birincil turuncu eylem (bkz. slooin-tasarim becerisi:
 * "ekranda genelde TEK birincil turuncu eylem olur").
 *
 * Ikisi de saf `react-native-svg`; ek bir bagimlilik ya da gorsel
 * dosya gerekmiyor, yani OTA ile gidiyorlar.
 */

/** Apple isareti. Tek renk; koyu metnin yaninda siyah duruyor. */
export function AppleIkonu({ boyut = 17, renk = '#000000' }: { boyut?: number; renk?: string }) {
  return (
    <Svg width={boyut} height={boyut * 1.22} viewBox="0 0 24 29">
      <Path
        fill={renk}
        d="M17.05 15.54c-.03-2.85 2.33-4.22 2.44-4.29-1.33-1.95-3.4-2.21-4.13-2.24-1.76-.18-3.43 1.03-4.32 1.03-.89 0-2.26-1-3.72-.98-1.91.03-3.68 1.11-4.66 2.82-1.99 3.45-.51 8.55 1.43 11.35.95 1.37 2.08 2.9 3.56 2.85 1.43-.06 1.97-.92 3.7-.92 1.72 0 2.21.92 3.72.89 1.54-.03 2.51-1.39 3.45-2.77 1.09-1.59 1.54-3.13 1.56-3.21-.03-.01-2.99-1.15-3.03-4.53"
      />
      <Path
        fill={renk}
        d="M14.27 7c.79-.96 1.32-2.29 1.17-3.62-1.14.05-2.51.76-3.32 1.71-.73.85-1.37 2.2-1.2 3.5 1.27.1 2.57-.64 3.35-1.59"
      />
    </Svg>
  )
}

/**
 * Google "G" isareti - DORT RESMI RENGIYLE. Tek renge indirmek marka
 * rehberine aykiri; renkler burada sabit yazili.
 */
export function GoogleIkonu({ boyut = 18 }: { boyut?: number }) {
  return (
    <Svg width={boyut} height={boyut} viewBox="0 0 18 18">
      <Path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <Path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <Path
        fill="#FBBC05"
        d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.96H.96a9 9 0 0 0 0 8.08l3.02-2.32z"
      />
      <Path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </Svg>
  )
}
