-- KONUSMAYI KENDI TARAFIMDAN SILME (2026-09-14, kullanicinin karari:
-- "Sil'e basinca benden silinir, karsi tarafta kalir").
--
-- "Gizle" (karar 44) konusmayi yalnizca listeden kaldiriyordu; karsi
-- taraf yazinca butun gecmisiyle geri geliyordu ve kullanici "mesaj
-- nereye gitti" diye sordu. "Sil" farkli: silme ANI kaydedilir ve o
-- andan onceki mesajlar bu uyeye bir daha GOSTERILMEZ. Satirlar
-- silinmez - karsi tarafin kopyasi, sikayetler ve moderasyon izi
-- oldugu gibi durur (Instagram'in "sohbeti sil"i ile ayni).
--
-- Konusma, iki taraftan biri yeni mesaj yazinca geri gelir (mesaj_gonder
-- gizlendi_mi'yi zaten sifirliyor) ama yalnizca silme anindan sonraki
-- mesajlarla.

alter table public.konusma_uyeleri
  add column if not exists silme_zamani timestamptz;

comment on column public.konusma_uyeleri.silme_zamani is
  'Uyenin konusmayi kendi tarafindan sildigi an; oncesindeki mesajlar ona gosterilmez.';

create or replace function public.konusmayi_sil(p_konusma_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  update public.konusma_uyeleri
     set gizlendi_mi = true,
         silme_zamani = now()
   where konusma_id = p_konusma_id
     and kullanici_id = auth.uid();

  if not found then
    raise exception 'Konusma bulunamadi';
  end if;
end;
$fn$;

revoke execute on function public.konusmayi_sil(uuid) from public, anon;
grant execute on function public.konusmayi_sil(uuid) to authenticated;

-- konusmalarim: son mesaj ve okunmamis sayisi silme anindan sonrakilerle.
-- Govde 20260822100000_tek_uyeli_konusma.sql'den kopyalandi; degisen
-- yalnizca iki `silme_zamani` kosulu ve son mesaji olmayan (silinmis)
-- konusmanin listelenmemesi.
create or replace function public.konusmalarim()
returns table (
  konusma_id uuid,
  kisi_id uuid,
  kullanici_adi text,
  ad text,
  son_mesaj text,
  son_mesaj_zamani timestamptz,
  okunmamis int,
  yazilabilir_mi boolean
)
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  return query
  select
    k.id,
    d.kullanici_id,
    p.kullanici_adi,
    p.ad,
    sm.metin,
    sm.olusturuldu,
    (
      select count(*)::int from public.mesajlar m
      where m.konusma_id = k.id
        and (m.gonderen_id is null or m.gonderen_id <> auth.uid())
        and (benim.son_okuma is null or m.olusturuldu > benim.son_okuma)
        and (benim.silme_zamani is null or m.olusturuldu > benim.silme_zamani)
    ),
    bag.yazabilir_mi(d.kullanici_id)
  from public.konusmalar k
  join public.konusma_uyeleri benim
    on benim.konusma_id = k.id and benim.kullanici_id = auth.uid()
  left join public.konusma_uyeleri d
    on d.konusma_id = k.id and d.kullanici_id <> auth.uid()
  left join public.profiller p on p.id = d.kullanici_id
  left join lateral (
    select m.metin, m.olusturuldu
    from public.mesajlar m
    where m.konusma_id = k.id
      and (benim.silme_zamani is null or m.olusturuldu > benim.silme_zamani)
    order by m.olusturuldu desc
    limit 1
  ) sm on true
  where k.tur = 'birebir'
    and benim.gizlendi_mi = false
    and (d.kullanici_id is null or not gizli.engelli_mi(d.kullanici_id))
  order by sm.olusturuldu desc nulls last;
end;
$fn$;

-- mesajlari_getir: silme anindan oncekiler donmez. Govde ayni dosyadan
-- kopyalandi; degisen tek satir `silme_zamani` kosulu.
create or replace function public.mesajlari_getir(
  p_konusma_id uuid,
  p_once timestamptz default null,
  p_limit int default 50
) returns table (
  id uuid,
  gonderen_id uuid,
  metin text,
  olusturuldu timestamptz
)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_diger_id uuid;
  v_silme timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  select u.silme_zamani into v_silme
  from public.konusma_uyeleri u
  where u.konusma_id = p_konusma_id and u.kullanici_id = auth.uid();

  if not found then
    raise exception 'Konusma bulunamadi';
  end if;

  select u.kullanici_id into v_diger_id
  from public.konusma_uyeleri u
  where u.konusma_id = p_konusma_id and u.kullanici_id <> auth.uid()
  limit 1;

  if v_diger_id is not null and gizli.engelli_mi(v_diger_id) then
    raise exception 'Konusma bulunamadi';
  end if;

  return query
  select m.id, m.gonderen_id, m.metin, m.olusturuldu
  from public.mesajlar m
  where m.konusma_id = p_konusma_id
    and (p_once is null or m.olusturuldu < p_once)
    and (v_silme is null or m.olusturuldu > v_silme)
  order by m.olusturuldu desc
  limit least(coalesce(p_limit, 50), 100);
end;
$fn$;
