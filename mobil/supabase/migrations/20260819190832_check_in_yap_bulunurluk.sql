-- Parametre tipi degistigi icin eski imza dusuruluyor.
drop function if exists public.check_in_yap(uuid, double precision, double precision, text, text, boolean);

create or replace function public.check_in_yap(
  p_mekan_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_not_metni text default null,
  p_fotograf text default null,
  p_bulunurluk text default 'herkese_acik'
) returns public.check_inler
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mekan_konum geography;
  v_kullanici_adi text;
  v_yeni public.check_inler;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_bulunurluk not in ('herkese_acik', 'takipcilerim', 'gizli') then
    raise exception 'Gecersiz bulunurluk degeri';
  end if;

  select konum into v_mekan_konum from public.mekanlar where id = p_mekan_id;
  if v_mekan_konum is null then
    raise exception 'Mekan bulunamadi';
  end if;

  if not ST_DWithin(v_mekan_konum, ST_MakePoint(p_lng, p_lat)::geography, 500) then
    raise exception 'Mekana cok uzaksin (~500 m icinde olmalisin)';
  end if;

  select ad into v_kullanici_adi from public.profiller where id = auth.uid();

  update public.check_inler
  set konum = null
  where kullanici_id = auth.uid()
    and konum is not null
    and bitis_zamani > now();

  insert into public.check_inler (
    kullanici_id, mekan_id, not_metni, fotograf, bitis_zamani, konum,
    kullanici_adi, bulunurluk
  )
  values (
    auth.uid(), p_mekan_id, p_not_metni, p_fotograf, now() + interval '4 hours',
    ST_MakePoint(p_lng, p_lat)::geography, v_kullanici_adi, p_bulunurluk
  )
  returning * into v_yeni;

  return v_yeni;
end;
$$;

revoke execute on function public.check_in_yap from public, anon;
grant execute on function public.check_in_yap to authenticated;

-- Ani donusumu: gorunurluk HICBIR ZAMAN genislemez.
--   gizli        -> kimse
--   takipcilerim -> en fazla takipcilerim (herkese_acik ise geri cekilir)
--   herkese_acik -> kullanicinin ani tercihi neyse o kalir
create or replace function public.check_inden_ayril(p_check_in_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  update public.check_inler
  set konum = null,
      gorunurluk = case
        when bulunurluk = 'gizli' then 'kimse'
        when bulunurluk = 'takipcilerim' and gorunurluk = 'herkese_acik' then 'takipcilerim'
        else gorunurluk
      end
  where id = p_check_in_id
    and kullanici_id = auth.uid()
    and konum is not null;
end;
$$;

revoke execute on function public.check_inden_ayril from public, anon;
grant execute on function public.check_inden_ayril to authenticated;

select cron.schedule(
  'check-in-suresi-dolanlari-aniya-cevir',
  '*/10 * * * *',
  $$ update public.check_inler
     set konum = null,
         gorunurluk = case
           when bulunurluk = 'gizli' then 'kimse'
           when bulunurluk = 'takipcilerim' and gorunurluk = 'herkese_acik' then 'takipcilerim'
           else gorunurluk
         end
     where konum is not null and bitis_zamani <= now(); $$
);
