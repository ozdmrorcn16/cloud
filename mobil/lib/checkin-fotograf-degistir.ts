import { supabase } from './supabase'
import { checkinFotografYukle } from './checkin-fotograf-yukle'
import { checkInFotografiUrl } from './fotograf-url'
import { hataMetni } from './hata-metni'

const KOVA = 'check-in-fotograflari'

/**
 * Bir check-in'in fotografini sonradan DEGISTIRIR ya da KALDIRIR
 * (kullanicinin istegi 2026-09-21: kartin yerinde duzenlemesinde
 * "isterse koydugu fotografi kaldirabilir ya da yenisini ekleyebilir").
 *
 * Sira onemli:
 *   1) yeni fotograf varsa once kovaya yuklenir (yol `<uid>/<zaman>.jpg`;
 *      RPC baskasinin yolunu reddediyor, 2026-09-19 kurali),
 *   2) RPC satirdaki yolu degistirir ve ESKI yolu dondurur,
 *   3) eski dosya kovadan silinir (KVKK: kaldirilan fotograf sunucuda
 *      kalmaz). Silme basarisiz olursa hata FIRLATILMAZ: satir zaten
 *      guncel, eski dosya artik hicbir satira bagli olmadigi icin
 *      sahibinden baskasina gorunmuyor; yetim dosya bir sonraki
 *      denemede/temizlikte gider.
 *   RPC reddederse yeni yuklenen dosya geri silinir - yetim birakilmaz.
 *
 * Doner: yeni fotografin IMZALI adresi (ekran karta bunu yazar) ya da
 * kaldirildiysa null.
 */
export async function checkInFotografiniDegistir(
  checkInId: string,
  yerelUri: string | null
): Promise<string | null> {
  let yeniYol: string | null = null
  if (yerelUri) {
    const { data: kullaniciVerisi } = await supabase.auth.getUser()
    const kullaniciId = kullaniciVerisi.user?.id
    if (!kullaniciId) throw new Error('Oturum bulunamadi')
    yeniYol = await checkinFotografYukle(kullaniciId, yerelUri)
  }

  const { data, error } = await supabase.rpc('check_in_fotografini_guncelle', {
    p_check_in_id: checkInId,
    p_fotograf: yeniYol,
  })
  if (error) {
    if (yeniYol) await sessizceSil(yeniYol)
    throw new Error(hataMetni(error))
  }

  const eskiYol = (data as string | null) ?? null
  if (eskiYol) await sessizceSil(eskiYol)

  return yeniYol ? await checkInFotografiUrl(yeniYol) : null
}

async function sessizceSil(yol: string): Promise<void> {
  try {
    await supabase.storage.from(KOVA).remove([yol])
  } catch {
    // bkz. ust yorum: satir guncel, dosya baskasina gorunmuyor.
  }
}
