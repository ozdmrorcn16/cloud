/**
 * Sitenin dilleri.
 *
 * KURAL: bir dil ancak DORT hukuki metni de tam yazildiginda bu listeye
 * girer. Yarim cevrilmis bir hukuki metin, cevrilmemisten kotudur - o
 * dildeki eksik cumle, o dildeki kullaniciya baglayici olan cumledir.
 *
 * KOK_DIL onek ALMAZ: `/gizlilik` Turkce'dir, `/tr/gizlilik` degil.
 * Magaza basvurusuna ve gizlilik metnine yazilan adresler bunlar.
 */
export const DILLER = ['tr'] as const
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
