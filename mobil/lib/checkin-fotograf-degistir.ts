import { supabase } from './supabase'
import { checkinFotograflariniYukle } from './checkin-fotograf-yukle'
import { checkInFotografiUrlleri } from './fotograf-url'
import { hataMetni } from './hata-metni'

const KOVA = 'check-in-fotograflari'

export type FotografDegisikligi = {
  /** Kalan MEVCUT yollar (sirali). Kaldirilanlar bu listede yoktur. */
  kalanYollar: string[]
  /** Yeni secilen yerel dosyalar; kalanlarin ARKASINA eklenir. */
  yeniUriler: string[]
}

/**
 * Bir check-in'in fotograf listesini DEGISTIRIR (coklu fotograf,
 * kullanicinin istegi 2026-09-21: kaldirabilir ya da yenisini ekleyebilir).
 *
 * Sira onemli:
 *   1) yeni dosyalar kovaya yuklenir (yol `<uid>/<zaman>-<sira>.jpg`; RPC
 *      baskasinin yolunu reddediyor, 2026-09-19 kurali),
 *   2) RPC `check_in_fotograflarini_guncelle` diziyi yazar ve KALDIRILAN
 *      eski yollari dondurur,
 *   3) kaldirilanlar kovadan silinir (KVKK: kaldirilan fotograf sunucuda
 *      kalmaz). Silme basarisiz olursa hata FIRLATILMAZ: satir guncel,
 *      dosya artik hicbir satira bagli olmadigi icin sahibinden baskasina
 *      gorunmuyor.
 *   RPC reddederse yeni yuklenenler geri silinir - yetim birakilmaz.
 *
 * Doner: yeni yol listesi ve ayni siradaki imzali adresler (ekran karta
 * bunlari yazar).
 */
export async function checkInFotograflariniDegistir(
  checkInId: string,
  degisiklik: FotografDegisikligi
): Promise<{ yollar: string[]; urller: string[] }> {
  const yeniYollar: string[] = []
  if (degisiklik.yeniUriler.length > 0) {
    const { data: kullaniciVerisi } = await supabase.auth.getUser()
    const kullaniciId = kullaniciVerisi.user?.id
    if (!kullaniciId) throw new Error('Oturum bulunamadi')
    try {
      await checkinFotograflariniYukle(kullaniciId, degisiklik.yeniUriler, yeniYollar)
    } catch (hata) {
      if (yeniYollar.length > 0) await sessizceSil(yeniYollar)
      throw hata
    }
  }

  const yollar = [...degisiklik.kalanYollar, ...yeniYollar]
  const { data, error } = await supabase.rpc('check_in_fotograflarini_guncelle', {
    p_check_in_id: checkInId,
    p_fotograflar: yollar,
  })
  if (error) {
    if (yeniYollar.length > 0) await sessizceSil(yeniYollar)
    throw new Error(hataMetni(error))
  }

  const kaldirilanlar = (data as string[] | null) ?? []
  if (kaldirilanlar.length > 0) await sessizceSil(kaldirilanlar)

  return { yollar, urller: await checkInFotografiUrlleri(yollar) }
}

async function sessizceSil(yollar: string[]): Promise<void> {
  try {
    await supabase.storage.from(KOVA).remove(yollar)
  } catch {
    // bkz. ust yorum: satir guncel, dosya baskasina gorunmuyor.
  }
}
