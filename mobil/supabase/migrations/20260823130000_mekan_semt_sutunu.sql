-- Semt / mahalle bilgisi. Kaynakta (Overture addresses.locality) %97
-- dolu ama bugune kadar hic alinmiyordu. Kullanicinin istegi: mekan
-- satirinda "Köfteci Yusuf · Restoran · Osmangazi · 240 m" gibi
-- konumun neresi oldugu anlasilsin.
alter table public.mekanlar
  add column semt text;

comment on column public.mekanlar.semt is
  'Semt/mahalle (Overture addresses.locality). Kullaniciya mekan satirinda gosterilir.';

-- Donus tipine yeni sutun eklendigi icin fonksiyon once DUSURULUYOR:
-- Postgres 'create or replace' ile OUT parametre kumesini degistirmiyor.
drop function if exists public.yakin_mekanlar_yogunluk(double precision, double precision, integer, text);

create function public.yakin_mekanlar_yogunluk(
  p_lat double precision,
  p_lng double precision,
  p_yaricap_metre integer default 5000,
  p_arama text default null
)
returns table(
  id uuid, ad text, tur text, semt text, konum geography, adres text,
  osm_id bigint, ekleyen_kullanici uuid,
  olusturuldu timestamp with time zone, kisi_sayisi integer
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
    select m.id, m.ad, m.tur, m.semt, m.konum, m.adres, m.osm_id,
           m.ekleyen_kullanici, m.olusturuldu,
           (
             select count(*)::int
             from public.check_inler c
             where c.mekan_id = m.id
               and c.konum is not null
               and c.bitis_zamani > now()
               and moderasyon.hesap_aktif_mi(c.kullanici_id)
               and not c.moderasyon_gizli
           ) as kisi_sayisi
    from public.mekanlar m
    where ST_DWithin(m.konum, ST_MakePoint(p_lng, p_lat)::geography, p_yaricap_metre)
      and (p_arama is null or m.ad ilike '%' || p_arama || '%')
      and m.tur <> 'test'
    order by m.konum <-> ST_MakePoint(p_lng, p_lat)::geography
    limit 50;
end;
$fn$;

revoke execute on function public.yakin_mekanlar_yogunluk from public, anon;
grant execute on function public.yakin_mekanlar_yogunluk to authenticated;
