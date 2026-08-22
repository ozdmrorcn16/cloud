import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type HesapDurumu = {
  durum: 'askida' | 'yasakli' | 'dondurulmus'
  askiBitisi: string | null
  gerekce: string
}

// hesap_durumlari'nin RLS'i yalnizca kendi satirini gosteriyor, bu
// yuzden ayri bir kimlik filtresi zorunlu degil; yine de acikca
// filtreliyoruz ki niyet okunur olsun.
//
// `.or(...)` satiri sunucudaki moderasyon.hesap_aktif_mi ile AYNI
// kurali istemciye tasir: suresi dolmus bir aski (aski_bitisi <= now)
// sunucuya gore zaten AKTIF sayilir. Bu filtre olmadan satir sureye
// bakmadan donerdi ve suresi dolmus bir 'askida' satiri, budama
// cron'u onu 90 gun sonra silene kadar kullaniciyi /hesap-durumu
// ekranina kilitlerdi. Karsilastirma BILEREK istemci saatiyle degil
// PostgREST/Postgres tarafinda ('now' ozel zaman damgasi degeri)
// yapiliyor; istemci saatine guvenilmez.
export async function hesapDurumunuGetir(): Promise<HesapDurumu | null> {
  const { data: kullanici } = await supabase.auth.getUser()
  const kimlik = kullanici?.user?.id
  if (!kimlik) throw new Error('Oturum bulunamadı')

  const { data, error } = await supabase
    .from('hesap_durumlari')
    .select('durum, aski_bitisi, gerekce')
    .eq('kullanici_id', kimlik)
    .or('durum.in.(yasakli,dondurulmus),aski_bitisi.gt.now')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    durum: data.durum as HesapDurumu['durum'],
    askiBitisi: data.aski_bitisi ?? null,
    gerekce: data.gerekce,
  }
}

export async function hesabiDondur(gerekce?: string): Promise<void> {
  const { error } = await supabase.rpc('hesabimi_dondur', {
    p_gerekce: gerekce ?? null,
  })
  if (error) throw new Error(error.message)
}

// Her oturum acilisinda cagriliyor (spec karar 66). Bu yuzden HATA
// FIRLATMIYOR: gecici bir ag hatasi kullaniciyi uygulamanin disinda
// birakmamali. Donen deger yalnizca "gercekten geri acildi mi" bilgisi.
export async function hesabiGeriAc(): Promise<boolean> {
  const { data, error } = await supabase.rpc('hesabimi_geri_ac')
  if (error) return false
  return data === true
}

// Silme, RPC degil Edge Function: auth.users satirini kaldirmak Admin
// API gerektiriyor (spec karar 67). Parola dogrulamasi (Edge Function
// icinde signInWithPassword ile) SUNUCUDA zorlaniyor - kullanici adi
// herkese acik oldugu icin onu sormak gercek bir koruma degildi;
// parolayi bilmeyen biri (ornegin calinmis bir oturum jetonuyla) hesabi
// silemez.
export async function hesabiSil(parola: string): Promise<void> {
  const { error } = await supabase.functions.invoke('hesap-sil', {
    body: { parola },
  })
  if (error) {
    // Duzeltme turu 2 (N2, kod incelemesi): `data` burada HER ZAMAN
    // null oluyor - functions-js bir 4xx/5xx aldiginda govdeyi
    // ayristirmiyor, `data: null` donup `FunctionsHttpError` firlatiyor
    // (bkz. @supabase/functions-js FunctionsClient.ts: `throw new
    // FunctionsHttpError(response)`). Onceki surum bu yuzden HER ZAMAN
    // `error.message`e (Ingilizce, "Edge Function returned a non-2xx
    // status code") dusuyordu; sunucudaki 400/503 ayrimi (bkz.
    // hesap-sil/index.ts) kullaniciya hic ulasmiyordu. Asil govde
    // `error.context`te (ham fetch Response) duruyor, burada ayristirip
    // okunuyor.
    let sunucuHatasi: string | undefined
    if (error instanceof FunctionsHttpError) {
      try {
        const govde = await error.context.json()
        sunucuHatasi = typeof govde?.hata === 'string' ? govde.hata : undefined
      } catch {
        // Govde JSON degilse (beklenmeyen bir durum) genel mesaja dus.
      }
    }
    throw new Error(sunucuHatasi ?? 'Silme su anda tamamlanamadi, tekrar dene')
  }
}
