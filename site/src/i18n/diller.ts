/**
 * Sitenin dilleri.
 *
 * KURAL: bir dil ancak butun sayfalari tam yazildiginda bu listeye
 * girer. Yarim cevrilmis bir hukuki metin, cevrilmemisten kotudur - o
 * dildeki eksik cumle, o dildeki kullaniciya baglayici olan cumledir.
 *
 * 2026-09-13: yedi dil. Gizlilik ve kosullar uygulamayla ORTAK
 * kaynaktan (`mobil/lib/hukuki/<dil>.ts`) geliyor; kabuk, ana sayfa,
 * destek ve hesap silme `src/i18n/sozlukler.ts` icinde. Uygulamadaki
 * `DESTEKLENEN_DILLER` ile ayni liste, ayni sira.
 *
 * KOK_DIL onek ALMAZ: `/gizlilik` Turkce'dir, `/tr/gizlilik` degil.
 * Magaza basvurusuna ve gizlilik metnine yazilan adresler bunlar.
 */
export const DILLER = ['tr', 'en', 'de', 'es', 'fr', 'ru', 'ar'] as const
export const KOK_DIL = 'tr'

export type Dil = (typeof DILLER)[number]

/** Bir dilin adres oneki: kok dil icin bos, digerleri icin `/en` gibi. */
export function dilOneki(dil: Dil): string {
  return dil === KOK_DIL ? '' : '/' + dil
}

/**
 * `getStaticPaths` icin: her dil bir yol olur, kok dil oneksiz
 * ([[dil]] optional route parametresi icin `undefined` sart).
 */
export function dilYollari() {
  return DILLER.map((dil) => ({
    params: { dil: dil === KOK_DIL ? undefined : dil },
    props: { dil },
  }))
}
