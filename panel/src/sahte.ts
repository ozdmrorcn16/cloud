/**
 * SAHTE VERI KIPI - yalnizca gelistirme (`VITE_SAHTE=1 npm run dev`).
 *
 * Panelin her ekrani AAL2 oturum ister; tasarim uzerinde calisirken
 * her seferinde TOTP ile girmek ve gercek veriyi kirletmek yerine RPC
 * cagrilarina ornek veri donduren bir istemci. Uretim paketine
 * GIRMEZ: `supabase.ts` bunu yalnizca `import.meta.env.DEV` ve
 * `VITE_SAHTE === '1'` iken kullanir. Ornek veriler UYDURMA, kisisel
 * veri degil.
 */

const simdi = Date.now()
const saat = (n: number) => new Date(simdi - n * 3600000).toISOString()

const KISI = { id: 'b2c3d4e5-0000-4000-8000-000000000002', ad: 'Ada Yılmaz', kullanici_adi: 'ada123', biyografi: 'Kahve ve kitap.', fotograflar: [], dogum_tarihi: '1996-04-02', aramada_gorunsun: true }
const HEDEF_KISI = { id: 'c3d4e5f6-0000-4000-8000-000000000003', ad: 'Test Kullanıcı', kullanici_adi: 'test_1787150858', biyografi: null, fotograflar: [], dogum_tarihi: '1994-01-10', aramada_gorunsun: true }

const SIKAYETLER = [
  { id: 's1', hedef_tur: 'mesaj', hedef_id: 'm1', sebep: 'taciz', aciklama: 'Sürekli mesaj atıyor, engelledim ama başka hesaptan yazıyor.', durum: 'yeni', olusturuldu: saat(48), sikayet_eden_adi: 'ada123', hedef_adi: 'test_1787150858', hedefin_sikayeti: 2 },
  { id: 's2', hedef_tur: 'check_in', hedef_id: 'c1', sebep: 'uygunsuz_icerik', aciklama: null, durum: 'yeni', olusturuldu: saat(26), sikayet_eden_adi: 'mehmet.k', hedef_adi: 'Hadim erikli şubesi', hedefin_sikayeti: 1 },
  { id: 's3', hedef_tur: 'kullanici', hedef_id: HEDEF_KISI.id, sebep: 'sahte_hesap', aciklama: 'Profil fotoğrafı bir ünlünün.', durum: 'yeni', olusturuldu: saat(5), sikayet_eden_adi: 'byorcun', hedef_adi: 'test_1787150858', hedefin_sikayeti: 1 },
  { id: 's4', hedef_tur: 'yorum', hedef_id: 'y1', sebep: 'spam', aciklama: null, durum: 'islem_yapildi', olusturuldu: saat(140), sikayet_eden_adi: 'ozdemrs', hedef_adi: 'Kent Meydanı', hedefin_sikayeti: 1 },
  { id: 's5', hedef_tur: 'kullanici', hedef_id: KISI.id, sebep: 'diger', aciklama: 'Beni takip ediyor.', durum: 'reddedildi', olusturuldu: saat(210), sikayet_eden_adi: 'ada123', hedef_adi: 'ada123', hedefin_sikayeti: 1 },
]

const CEVAPLAR: Record<string, (p: Record<string, unknown>) => unknown> = {
  moderator_muyum: () => true,
  moderasyon_ozet: () => [{ bekleyen_sikayet: 3, en_eski_bekleyen: saat(48), bugun_karar: 0, yedi_gun_karar: 4, askida_hesap: 1, yasakli_hesap: 0, bekleyen_talep: 1 }],
  moderasyon_sikayetleri_listele: (p) => {
    let l = SIKAYETLER.filter((s) => !p.p_durum || s.durum === p.p_durum).filter((s) => !p.p_hedef_tur || s.hedef_tur === p.p_hedef_tur)
    if (p.p_sirala === 'eski_once') l = [...l].reverse()
    return l.slice(0, Number(p.p_limit ?? 50))
  },
  moderasyon_sikayet_detayi: (p) => {
    const s = SIKAYETLER.find((x) => x.id === p.p_sikayet_id) ?? SIKAYETLER[0]
    const hedef =
      s.hedef_tur === 'mesaj' ? { id: 'm1', konusma_id: 'k1', gonderen_id: HEDEF_KISI.id, metin: 'Neredesin, gel buluşalım. Cevap ver.', olusturuldu: saat(49) }
      : s.hedef_tur === 'check_in' ? { id: 'c1', kullanici_id: HEDEF_KISI.id, mekan_adi: 'Hadim erikli şubesi', not_metni: 'Kdkdmdm', fotograf: null, olusturma_zamani: saat(30), canli_mi: false, gorunurluk: 'ani', bulunurluk: 'herkese_acik', moderasyon_gizli: false }
      : s.hedef_tur === 'yorum' ? { id: 'y1', check_in_id: 'c2', kullanici_id: HEDEF_KISI.id, metin: 'www.ucuz-takipci.com hemen al!!!', olusturuldu: saat(141), sikayet_gizli: true, moderasyon_gizli: true, paylasim_sahibi: 'byorcun', paylasim_notu: 'Harika bir akşam', mekan_adi: 'Kent Meydanı' }
      : HEDEF_KISI
    return {
      sikayet: { id: s.id, sikayet_eden_id: KISI.id, hedef_tur: s.hedef_tur, hedef_id: s.hedef_id, sebep: s.sebep, aciklama: s.aciklama, durum: s.durum, olusturuldu: s.olusturuldu, karar_veren_id: null, karar_zamani: s.durum === 'yeni' ? null : saat(100), moderator_notu: s.durum === 'yeni' ? null : 'Spam bağlantısı, kalıcı gizlendi.' },
      sikayet_eden: KISI,
      hedef,
    }
  },
  moderasyon_hedef_gecmisi: () => [
    { id: 's5', sebep: 'sahte_hesap', durum: 'reddedildi', olusturuldu: saat(210), moderator_notu: 'kanıt yok' },
    { id: 's1', sebep: 'taciz', durum: 'yeni', olusturuldu: saat(48), moderator_notu: null },
  ],
  moderasyon_kullanici_ara: () => [
    { id: HEDEF_KISI.id, ad: HEDEF_KISI.ad, kullanici_adi: HEDEF_KISI.kullanici_adi, durum: 'askida', sikayet_sayisi: 2 },
    { id: KISI.id, ad: KISI.ad, kullanici_adi: KISI.kullanici_adi, durum: null, sikayet_sayisi: 0 },
  ],
  moderasyon_kullanici_detayi: () => ({
    profil: HEDEF_KISI,
    hesap_durumu: { kullanici_id: HEDEF_KISI.id, durum: 'askida', aski_bitisi: new Date(simdi + 5 * 86400000).toISOString(), gerekce: 'İkinci taciz şikayeti, mesaj içeriği doğruluyor.', moderator_id: 'mod', guncellendi: saat(40) },
    check_inler: [
      { id: 'c1', mekan_adi: 'Hadim erikli şubesi', not_metni: 'Kdkdmdm', fotograf: null, olusturma_zamani: saat(30), canli_mi: false, gorunurluk: 'ani', bulunurluk: 'herkese_acik', moderasyon_gizli: false },
      { id: 'c9', mekan_adi: 'Kent Meydanı', not_metni: null, fotograf: null, olusturma_zamani: saat(300), canli_mi: false, gorunurluk: 'ani', bulunurluk: 'herkese_acik', moderasyon_gizli: true },
    ],
    takipler: [{ karsi_taraf: KISI.id, durum: 'kabul', olusturuldu: saat(400) }],
    engelledikleri: [],
    onu_engelleyenler: [KISI.id],
    sohbet_istekleri: [],
    bugunku_istek_sayisi: 0,
    konusmalar: [{ konusma_id: 'k1', karsi_taraf: KISI.id, mesaj_sayisi: 14, ilk_mesaj: saat(120), son_mesaj: saat(49) }],
    bildirim_cihazi: 1,
    sikayet_ozeti: { hakkinda: 2, actigi: 0 },
  }),
  moderasyon_konusma_mesajlari: (p) => ({
    kademe: p.p_merkez_mesaj_id ? 1 : 2,
    uyeler: [KISI.id, HEDEF_KISI.id],
    mesajlar: [
      { id: 'm0', konusma_id: 'k1', gonderen_id: KISI.id, metin: 'Merhaba, tanışıyor muyuz?', olusturuldu: saat(52) },
      { id: 'm1', konusma_id: 'k1', gonderen_id: HEDEF_KISI.id, metin: 'Neredesin, gel buluşalım. Cevap ver.', olusturuldu: saat(49) },
      { id: 'm2', konusma_id: 'k1', gonderen_id: KISI.id, metin: 'Lütfen yazma.', olusturuldu: saat(48.5) },
    ],
  }),
  moderasyon_duzenleme_talepleri: () => [
    { id: 't1', mekan_id: 'mk1', mekan_adi: 'Nilüfer Tüvtürk Araç Muayene İstasyonu', mekan_turu: 'diger', onerilen_ad: null, onerilen_adres: null, onerilen_tur: 'hizmet', onerilen_mahalle: null, onerilen_il: null, onerilen_ilce: null, kapali_bildirimi: false, fotograf: null, durum: 'beklemede', olusturuldu: saat(20) },
  ],
  moderasyon_duzenleme_talebi_detayi: () => [
    { id: 't1', mekan_id: 'mk1', mevcut_ad: 'Nilüfer Tüvtürk Araç Muayene İstasyonu', mevcut_adres: null, mevcut_tur: 'diger', mevcut_mahalle: null, mevcut_semt: 'Nilüfer', mevcut_il: 'Bursa', mevcut_kapali: false, onerilen_ad: null, onerilen_adres: null, onerilen_tur: 'hizmet', onerilen_mahalle: null, onerilen_il: null, onerilen_ilce: null, kapali_bildirimi: false, fotograf: null, durum: 'beklemede', gonderen_adi: 'byorcun', olusturuldu: saat(20) },
  ],
  moderasyon_kayitlarini_listele: () => [
    { id: 'i1', moderator_id: 'mod-1234', eylem: 'kullanici_detayi_goruntulendi', hedef_tur: 'kullanici', hedef_id: HEDEF_KISI.id, ayrinti: null, olusturuldu: saat(1) },
    { id: 'i2', moderator_id: 'mod-1234', eylem: 'mesaj_baglami', hedef_tur: 'konusma', hedef_id: 'k1', ayrinti: { gerekce: 'Taciz şikayeti s1 için bağlam' }, olusturuldu: saat(2) },
    { id: 'i3', moderator_id: 'mod-1234', eylem: 'hesap_askiya_alindi', hedef_tur: 'kullanici', hedef_id: HEDEF_KISI.id, ayrinti: { gerekce: 'İkinci taciz şikayeti, mesaj içeriği doğruluyor.' }, olusturuldu: saat(40) },
    { id: 'i4', moderator_id: 'mod-1234', eylem: 'sikayet_karara_baglandi', hedef_tur: 'sikayet', hedef_id: 's4', ayrinti: { not: 'Spam bağlantısı, kalıcı gizlendi.' }, olusturuldu: saat(100) },
  ],
}

export function sahteIstemci() {
  const rpc = async (ad: string, p: Record<string, unknown> = {}) => {
    await new Promise((r) => setTimeout(r, 120))
    const c = CEVAPLAR[ad]
    if (!c) return { data: null, error: null }
    return { data: c(p), error: null }
  }
  return {
    rpc,
    auth: {
      getUser: async () => ({ data: { user: { email: 'moderator@slooin.com' } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ error: null }),
      mfa: {
        listFactors: async () => ({ data: { totp: [{ id: 'f', status: 'verified' }] }, error: null }),
        enroll: async () => ({ data: null, error: { message: 'sahte' } }),
        challenge: async () => ({ data: { id: 'ch' }, error: null }),
        verify: async () => ({ error: null }),
      },
    },
    storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: null } }) }) },
  }
}
