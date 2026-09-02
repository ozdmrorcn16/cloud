// RPC donuslerinin tipleri. Alanlar migrasyonlardaki imzalarla birebir
// eslesir; bir imza degisirse burasi da degismeli.

export type SikayetDurumu = 'yeni' | 'incelendi' | 'islem_yapildi' | 'reddedildi'
// 'yorum' 2026-09-02'de eklendi (begeni/yorum ozelligiyle birlikte).
export type HedefTuru = 'kullanici' | 'check_in' | 'mesaj' | 'yorum'

export type SikayetSatiri = {
  id: string
  hedef_tur: HedefTuru
  hedef_id: string
  sebep: string
  aciklama: string | null
  durum: SikayetDurumu
  olusturuldu: string
  sikayet_eden_adi: string | null
  hedef_adi: string | null
  hedefin_sikayeti: number
}

export type Profil = {
  id: string
  ad: string
  kullanici_adi: string
  biyografi: string | null
  fotograflar: string[]
  dogum_tarihi: string
  aramada_gorunsun: boolean
}

export type HesapDurumu = {
  kullanici_id: string
  durum: 'askida' | 'yasakli' | 'dondurulmus'
  aski_bitisi: string | null
  gerekce: string
  moderator_id: string | null
  guncellendi: string
}

export type CheckInOzeti = {
  id: string
  mekan_adi: string
  not_metni: string | null
  fotograf: string | null
  olusturma_zamani: string
  canli_mi: boolean
  gorunurluk: string
  bulunurluk: string
  moderasyon_gizli: boolean
}

/**
 * Sikayet edilen yorum ve YAZILDIGI PAYLASIM.
 *
 * Baglam olmadan "bu yorum taciz mi" sorusu cevaplanamaz; bu yuzden
 * sunucu yorumun metniyle birlikte paylasimin notunu ve mekani da
 * donduruyor.
 */
export type YorumOzeti = {
  id: string
  check_in_id: string
  kullanici_id: string | null
  metin: string
  olusturuldu: string
  /** Sikayet uzerine ANINDA konan gecici gizlilik. */
  sikayet_gizli: boolean
  /** Moderatorun kalici karari. */
  moderasyon_gizli: boolean
  paylasim_sahibi: string | null
  paylasim_notu: string | null
  mekan_adi: string
}

export type Mesaj = {
  id: string
  konusma_id: string
  gonderen_id: string | null
  metin: string
  olusturuldu: string
}

export type SikayetDetayi = {
  sikayet: {
    id: string
    sikayet_eden_id: string | null
    hedef_tur: HedefTuru
    hedef_id: string
    sebep: string
    aciklama: string | null
    durum: SikayetDurumu
    olusturuldu: string
    karar_veren_id: string | null
    karar_zamani: string | null
    moderator_notu: string | null
  }
  sikayet_eden: Profil | null
  hedef: Profil | CheckInOzeti | Mesaj | YorumOzeti | null
}

export type KullaniciOzeti = {
  id: string
  ad: string
  kullanici_adi: string
  durum: string | null
  sikayet_sayisi: number
}

export type KonusmaOzeti = {
  konusma_id: string
  karsi_taraf: string | null
  mesaj_sayisi: number
  ilk_mesaj: string | null
  son_mesaj: string | null
}

export type KullaniciDetayi = {
  profil: Profil | null
  hesap_durumu: HesapDurumu | null
  check_inler: CheckInOzeti[]
  takipler: { karsi_taraf: string; durum: string; olusturuldu: string }[]
  engelledikleri: string[]
  onu_engelleyenler: string[]
  sohbet_istekleri: {
    gonderen_id: string
    alan_id: string
    durum: string
    olusturuldu: string
  }[]
  bugunku_istek_sayisi: number
  konusmalar: KonusmaOzeti[]
  bildirim_cihazi: number
  sikayet_ozeti: { hakkinda: number; actigi: number }
}

// Kademe 1 = sikayet baglami (varsayilan), kademe 2 = tum konusma.
// Ayrim yalnizca gorsel degil: denetim izine de ayri turde duser.
export type KonusmaIcerigi = {
  kademe: 1 | 2
  uyeler: string[]
  mesajlar: Mesaj[]
}

export type IzSatiri = {
  id: string
  moderator_id: string | null
  eylem: string
  hedef_tur: string
  hedef_id: string
  ayrinti: Record<string, unknown> | null
  olusturuldu: string
}
