/**
 * KVKK onaylarinin tek kaynagi.
 *
 * Acik riza GOSTERILMEKLE kalmaz, ISPAT EDILEBILIR olmali: kimin, ne
 * zaman, HANGI METIN SURUMUNE onay verdigi kayitli olmali. Surum
 * numarasi olmadan "neye onay verdi" sorusu geriye donuk
 * cevaplanamaz.
 */

/**
 * Gizlilik metninin yururlukteki surumu.
 *
 * `docs/gizlilik-metni.md` ve `src/app/gizlilik.tsx` ayni icerigi
 * tasir. O METIN DEGISTIGINDE BU SURUM DE ARTIRILMALI - yoksa yeni
 * metne eski surum numarasiyla onay verilmis gorunur ve kayit
 * yaniltici olur.
 */
export const GIZLILIK_METNI_SURUMU = '2026-08-22'

/** Kayit sirasinda alinan onaylar; signUp metadata'sina bu bicimde gider. */
export type KayitOnaylari = {
  /** Aydinlatma metni okundu ve kabul edildi (KVKK m.10). */
  aydinlatma: boolean
  /** Konum verisinin islenmesine acik riza. */
  konumRizasi: boolean
}

/**
 * signUp cagrisinin `options.data` alanina konacak nesne.
 *
 * Neden metadata: kayit aninda oturum henuz acilmamis olabiliyor
 * (telefon dogrulamasi bekleniyor), yani istemci o anda tabloya
 * yazamaz. Metadata ise kullanici satiriyla birlikte atomik olusuyor
 * ve veritabanindaki tetikleyici onu `kvkk_onaylari` tablosuna
 * aliyor - onay kaydinin kacirilmasi mumkun degil.
 */
export function kayitMetadatasi(onaylar: KayitOnaylari, dil: 'tr' | 'en') {
  return {
    aydinlatma_onayi: onaylar.aydinlatma,
    konum_rizasi: onaylar.konumRizasi,
    gizlilik_metni_surumu: GIZLILIK_METNI_SURUMU,
    dil,
  }
}
