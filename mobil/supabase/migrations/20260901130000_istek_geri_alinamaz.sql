-- MESAJ ISTEGI GERI ALINAMAZ; ENGELLEME KONUSMAYI SILER
--
-- Kullanicinin kurali (2026-09-01):
--   "Gonderdigi mesaj istegini geri cekme diye bir islem yok. Mesaj bir
--    kere gonderildikten sonra geri alinamaz. Ancak mesaj gonderdigi
--    kisiyi engelleyip geri acarsa mesajlari ve istegi kaybolur."
--
-- ONCEKI DAVRANIS OLCULDU ve iki hata gosterdi (araclar/ olcum betigi,
-- iki gercek test hesabi):
--
--   1. "Istegi geri cek" istegi geri ALMIYOR, ONAYLIYOR. Geri cekme
--      yalnizca sohbet_istekleri satirini siliyordu; konusma ve mesaj
--      yerinde kaliyordu. konusmalarim() bir konusmayi "istek" saymak
--      icin BEKLEYEN istek satiri aradigi icin, satir silinince konusma
--      normal konusma sayiliyor ve aliciin MESAJLAR kutusuna dusuyordu.
--      Olculen: once "Istekler'de VAR / Mesajlar'da yok", sonra
--      "Istekler'de yok / Mesajlar'da VAR".
--
--   2. Engelleyip geri acmak da ayni sonucu veriyordu: engelle() istek
--      satirini siliyor ama konusmaya dokunmuyordu, engel kalkinca
--      konusma Mesajlar'da beliriyordu. Yani "kaybolur" kurali
--      calismiyordu, tam tersi oluyordu.
--
-- KOK NEDEN tek: istek satiri ile konusma AYRISABILIYORDU. Cozum de
-- kok nedeni kapatiyor - ikisi artik hic ayrismiyor:
--   * geri cekme kaldirildi   -> istek satiri geri cekmeyle silinemez
--   * engelleme konusmayi siler -> istek ve konusma birlikte gider
-- Boylece "istek satiri yok ama konusma var" durumu hic olusmuyor ve
-- konusmalarim() icindeki mevcut suzgec dogru calismaya devam ediyor.
-- Suzgeci degistirmedik cunku "bag koparsa gecmis silinmez, konusma
-- salt-okunur olur" karari (Faz 3b) korunmali; yazma hakkini olcut
-- yapmak o kararı bozardi.

-- 1) GERI CEKME KALDIRILDI.
-- Islev tamamen dusuruluyor, istemciden gizlemek yetmez: RPC acik
-- kaldigi surece dogrudan cagrilarak kural atlatilabilirdi.
drop function if exists public.sohbet_istegini_geri_cek(uuid);

-- 2) ENGELLEME KONUSMAYI DA SILER.
-- Kullanicinin karari: silme KABUL EDILMIS konusmalari da kapsar
-- ("tum konusmalara yay"). Yani engelleme yalnizca bir istegi degil,
-- o kisiyle olan butun birebir yazismayi kaliciolarak siler.
--
-- DIKKAT, bilerek yapiliyor: bu KARSI TARAFIN kopyasini da siler ve
-- geri donusu yoktur. Engelleme ekranindaki onay metni bunu soyluyor
-- ve gizlilik metnine de yazildi. Mesajlar ve konusma_uyeleri
-- konusmalar'a CASCADE bagli, bu yuzden tek delete yetiyor.
create or replace function public.engelle(p_kullanici_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_kullanici_id = auth.uid() then
    raise exception 'Kendini engelleyemezsin';
  end if;

  insert into public.engellemeler (engelleyen_id, engellenen_id)
  values (auth.uid(), p_kullanici_id)
  on conflict do nothing;

  -- Iki yonde de: hem benim ona, hem onun bana olan bagi.
  delete from public.takipler
    where (takip_eden_id = auth.uid() and takip_edilen_id = p_kullanici_id)
       or (takip_eden_id = p_kullanici_id and takip_edilen_id = auth.uid());

  delete from public.sohbet_istekleri
    where (gonderen_id = auth.uid() and alan_id = p_kullanici_id)
       or (gonderen_id = p_kullanici_id and alan_id = auth.uid());

  -- Ikimizin de uye oldugu birebir konusmalar: mesajlariyla birlikte
  -- gider (CASCADE).
  delete from public.konusmalar k
    where k.tur = 'birebir'
      and exists (
        select 1 from public.konusma_uyeleri u
        where u.konusma_id = k.id and u.kullanici_id = auth.uid()
      )
      and exists (
        select 1 from public.konusma_uyeleri u
        where u.konusma_id = k.id and u.kullanici_id = p_kullanici_id
      );
end;
$function$;
