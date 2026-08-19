-- Gunluk istek tavani artik CANLI satirlari degil, ekle-only bir gunlugu
-- sayiyor. Sebep: engelleme (ve red) istek satirlarini siliyor; tavan
-- canli satir saydigi surece gonderen kendi sayacini dusurebiliyordu
-- (istek gonder -> engelle -> sayac geri duser -> tekrarla). Bu, tavanin
-- tek amacini (tek hesabin dizini taramasini engellemek) tamamen
-- etkisiz birakiyordu.
--
-- Gunluge yazilan satir HICBIR ZAMAN silinmiyor; engelle da, red de
-- dokunmuyor. mekan_ekle'nin gunluk limiti de silinmeyen `mekanlar`
-- satirlarini sayar; kalip ayni.
create table public.istek_gunlugu (
  id uuid primary key default gen_random_uuid(),
  gonderen_id uuid not null references auth.users(id) on delete cascade,
  olusturuldu timestamptz not null default now()
);

create index istek_gunlugu_gonderen_zaman
  on public.istek_gunlugu (gonderen_id, olusturuldu);

-- RLS acik, POLITIKA YOK: bu tabloya istemci hicbir sekilde erisemez,
-- yalnizca security definer fonksiyonlar yazar/okur. takipler ve
-- sohbet_istekleri'nde yazma politikasinin bilerek yoklugu ile ayni
-- gerekce; burada okuma da gerekmiyor.
alter table public.istek_gunlugu enable row level security;

-- Tavan artik gunlugu sayiyor. Fonksiyonun geri kalani
-- 20260819190203_bag_rpcleri.sql'den birebir kopyalandi; yalnizca
-- select ifadesi degisti.
create or replace function bag.istek_on_kontrol(p_hedef uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gunluk int;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_hedef = auth.uid() then
    raise exception 'Kendine istek gonderemezsin';
  end if;

  -- Engelli iliskide sessiz davraniyoruz: "engellendin" demiyoruz,
  -- kullanici yokmus gibi cevap veriyoruz (Faz 2b sessizlik ilkesi).
  if gizli.engelli_mi(p_hedef) then
    raise exception 'Bu kullanici bulunamadi';
  end if;

  select count(*) into v_gunluk
  from public.istek_gunlugu
  where gonderen_id = auth.uid()
    and olusturuldu > now() - interval '1 day';

  -- Kisi basi sinir yok (karar #37); bu tavan tek hesabin yuzlerce
  -- kisiye istek atarak dizini taramasini engelliyor.
  if v_gunluk >= 50 then
    raise exception 'Bugunluk istek sinirina ulastin';
  end if;
end;
$$;

-- 20260819190203_bag_rpcleri.sql'de bu fonksiyon icin yalnizca bu satir
-- vardi (revoke yok); CREATE OR REPLACE FUNCTION izinleri korudugu icin
-- bu satir olmasa bile mevcut yetki kalirdi, ama kaynaga birebir sadik
-- kalmak icin yeniden yaziliyor.
grant execute on function bag.istek_on_kontrol(uuid) to authenticated;

-- Gonderme RPC'leri basarili gonderimde gunluge bir satir yaziyor.
-- Govdeler 20260819190203_bag_rpcleri.sql'den birebir kopyalandi;
-- yalnizca sondaki gunluk insert'i eklendi. Herhangi bir raise butun
-- islemi geri aldigi icin gunluge yalnizca gercekten gonderilmis
-- istekler yaziliyor.
create or replace function public.takip_istegi_gonder(p_kullanici_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  perform bag.istek_on_kontrol(p_kullanici_id);

  if exists (
    select 1 from public.takipler
    where takip_eden_id = auth.uid() and takip_edilen_id = p_kullanici_id
  ) then
    raise exception 'Istegin zaten gonderilmis';
  end if;

  insert into public.takipler (takip_eden_id, takip_edilen_id, durum)
  values (auth.uid(), p_kullanici_id, 'beklemede');

  insert into public.istek_gunlugu (gonderen_id) values (auth.uid());
end;
$$;

create or replace function public.sohbet_istegi_gonder(p_kullanici_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  perform bag.istek_on_kontrol(p_kullanici_id);

  if exists (
    select 1 from public.sohbet_istekleri
    where gonderen_id = auth.uid() and alan_id = p_kullanici_id
  ) then
    raise exception 'Istegin zaten gonderilmis';
  end if;

  insert into public.sohbet_istekleri (gonderen_id, alan_id, durum)
  values (auth.uid(), p_kullanici_id, 'beklemede');

  insert into public.istek_gunlugu (gonderen_id) values (auth.uid());
end;
$$;

revoke execute on function public.takip_istegi_gonder(uuid) from public, anon;
grant execute on function public.takip_istegi_gonder(uuid) to authenticated;
revoke execute on function public.sohbet_istegi_gonder(uuid) from public, anon;
grant execute on function public.sohbet_istegi_gonder(uuid) to authenticated;
