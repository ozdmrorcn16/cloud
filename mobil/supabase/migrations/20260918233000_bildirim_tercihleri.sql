-- BILDIRIM TERCIHLERI (2026-09-18 gece, kullanicinin referans gorseli:
-- Ayarlar > Gizlilik ve etkilesim > "Bildirimler - Mesajlar, arkadaslar
-- ve anilar"). Uc anahtar, uc sutun; varsayilan ACIK (bugune kadarki
-- davranis). Edge Function `bildirim-gonder` gondermeden once ALICININ
-- tercihini okur (surum 6):
--   mesaj                                  -> bildirim_mesaj
--   takip_istegi/kabul/eklendi, sohbet_*   -> bildirim_arkadas
--   etiket_istegi/eklendi                  -> bildirim_ani
-- Uygulama ici bildirim listesi (Bildirimler sekmesi) etkilenmez; bu
-- yalnizca PUSH.
--
-- KVKK: tercih kisinin kendi ayari; yalnizca kendisi gorur (RLS kendi
-- satiri), service role okur. Profiller UPDATE sutun bazinda oldugu
-- icin GRANT SART (2026-09-18 profil_gizli dersi).

alter table public.profiller
  add column if not exists bildirim_mesaj boolean not null default true,
  add column if not exists bildirim_arkadas boolean not null default true,
  add column if not exists bildirim_ani boolean not null default true;

grant update (bildirim_mesaj, bildirim_arkadas, bildirim_ani) on public.profiller to authenticated;
