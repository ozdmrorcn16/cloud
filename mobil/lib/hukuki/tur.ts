/** Hukuki metinlerin ortak sekli: baslikli bolumler, her bolumde paragraflar. */
export type HukukiBolum = { baslik: string; paragraflar: string[] }

export type HukukiMetin = {
  gizlilik: HukukiBolum[]
  kosullar: HukukiBolum[]
}
