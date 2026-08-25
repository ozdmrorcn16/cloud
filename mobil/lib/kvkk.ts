import type { Dil } from './dil'

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

/**
 * Kayit onayi TEK bir kutudur (kullanicinin karari, 2026-08-24:
 * "Kullanıcı onaylarını tek biryerde topla ayırma").
 *
 * Onceden iki ayri kutu vardi - aydinlatma ve konum acik rizasi. KVKK
 * acisindan gerekcesi vardi ama kullanici arayuzun sade kalmasini
 * istedi. Uyum onay SAYISINI artirarak degil, metnin kapsayici ve
 * dogru olmasiyla ve onayin kayit altina alinmasiyla saglaniyor:
 * tek kutu isaretlendiginde veritabanina HER IKI onay turu de
 * yaziliyor, boylece "konum verisinin islenmesine riza var miydi"
 * sorusu geriye donuk cevaplanabiliyor.
 */
export type KayitOnaylari = {
  /** Kapsayici kabul: aydinlatma metni + konum verisinin islenmesi. */
  kabul: boolean
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
export function kayitMetadatasi(onaylar: KayitOnaylari, dil: Dil) {
  return {
    // Tek kutu, iki kayit: arayuz sade kaliyor ama ispat kaydi eksiksiz.
    aydinlatma_onayi: onaylar.kabul,
    konum_rizasi: onaylar.kabul,
    gizlilik_metni_surumu: GIZLILIK_METNI_SURUMU,
    dil,
  }
}
