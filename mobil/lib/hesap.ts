import { supabase } from './supabase'

export type HesapDurumu = {
  durum: 'askida' | 'yasakli' | 'dondurulmus'
  askiBitisi: string | null
  gerekce: string
}

// hesap_durumlari'nin RLS'i yalnizca kendi satirini gosteriyor, bu
// yuzden ayri bir kimlik filtresi zorunlu degil; yine de acikca
// filtreliyoruz ki niyet okunur olsun.
export async function hesapDurumunuGetir(): Promise<HesapDurumu | null> {
  const { data: kullanici } = await supabase.auth.getUser()
  const kimlik = kullanici?.user?.id
  if (!kimlik) throw new Error('Oturum bulunamadi')

  const { data, error } = await supabase
    .from('hesap_durumlari')
    .select('durum, aski_bitisi, gerekce')
    .eq('kullanici_id', kimlik)
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
  const { data, error } = await supabase.functions.invoke('hesap-sil', {
    body: { parola },
  })
  if (error) {
    // Edge Function 4xx dondugunde supabase-js genel bir mesaj veriyor;
    // asil sebep govdededir ve kullaniciya onu gostermek gerekiyor.
    const sunucuHatasi = (data as { hata?: string } | null)?.hata
    throw new Error(sunucuHatasi ?? error.message)
  }
}
