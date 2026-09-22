-- HIKAYE YERLESIMI: yazi, ifade, mekan ve arkadas etiketleri fotografin
-- UZERINDE surukleniyor ve boyutlandiriliyor (kullanicinin referansi,
-- 2026-09-22: "Etiketler suruklenip boyutlandirilabilir"). Konumlar
-- ORANSAL saklanir (x,y 0..1; olcek) - telefon boyu degisince etiket
-- ayni yerde durur. Sunucu icerigi yorumlamaz, yalnizca bicimi ve
-- boyutu dogrular; cizim istemcide.
--
-- Not: `hikaye_ekle` ve `hikaye_akisi` bir onceki migrasyonda da
-- yeniden yazilmisti; imzaya alan eklendigi icin ikisi de yine
-- DUSURULUP yeniden olusturuluyor (asiri yukleme tuzagi).

alter table public.hikayeler
  add column if not exists yerlesim jsonb;

drop function if exists public.hikaye_ekle(text, text, uuid, text, uuid[], text);

create function public.hikaye_ekle(
  p_fotograf text,
  p_yazi text default null,
  p_mekan_id uuid default null,
  p_ifade text default null,
  p_etiketler uuid[] default null,
  p_gorunurluk text default 'arkadaslar',
  p_yerlesim jsonb default null
)
returns public.hikayeler
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_ben uuid := auth.uid();
  v_hikaye public.hikayeler;
  v_kisi uuid;
begin
  if v_ben is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;
  if not moderasyon.hesap_aktif_mi(v_ben) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;
  if p_fotograf is null or split_part(p_fotograf, '/', 1) <> v_ben::text then
    raise exception 'Bu fotograf sana ait degil';
  end if;
  if p_yazi is not null and length(p_yazi) > 200 then
    raise exception 'Hikaye yazisi en fazla 200 karakter olabilir';
  end if;
  if p_gorunurluk is null or p_gorunurluk not in ('arkadaslar', 'herkese_acik') then
    raise exception 'Gecersiz gorunurluk';
  end if;
  if p_yerlesim is not null and (jsonb_typeof(p_yerlesim) <> 'object' or length(p_yerlesim::text) > 4000) then
    raise exception 'Gecersiz yerlesim';
  end if;
  if p_mekan_id is not null and not exists (select 1 from public.mekanlar where id = p_mekan_id) then
    raise exception 'Mekan bulunamadi';
  end if;
  if p_ifade is not null and not exists (select 1 from public.ifadeler where slug = p_ifade) then
    raise exception 'Gecersiz ifade';
  end if;
  if (select count(*) from public.hikayeler
       where kullanici_id = v_ben and bitis > now()) >= 10 then
    raise exception 'Ayni anda en fazla 10 hikayen olabilir';
  end if;

  insert into public.hikayeler (kullanici_id, fotograf, yazi, mekan_id, ifade, gorunurluk, yerlesim)
  values (v_ben, p_fotograf, nullif(trim(p_yazi), ''), p_mekan_id, p_ifade, p_gorunurluk, p_yerlesim)
  returning * into v_hikaye;

  if p_etiketler is not null then
    foreach v_kisi in array p_etiketler loop
      if v_kisi = v_ben then
        raise exception 'Kendini etiketleyemezsin';
      end if;
      if not bag.takip_ediyor_mu(v_ben, v_kisi) then
        raise exception 'Yalnizca arkadaslarini etiketleyebilirsin';
      end if;
      insert into public.hikaye_etiketleri (hikaye_id, kullanici_id)
      values (v_hikaye.id, v_kisi)
      on conflict do nothing;
    end loop;
  end if;

  return v_hikaye;
end;
$$;

revoke execute on function public.hikaye_ekle(text, text, uuid, text, uuid[], text, jsonb) from public, anon;
grant execute on function public.hikaye_ekle(text, text, uuid, text, uuid[], text, jsonb) to authenticated, service_role;

drop function if exists public.hikaye_akisi(uuid);

create function public.hikaye_akisi(p_kullanici uuid default null)
returns table (
  id uuid, kullanici_id uuid, fotograf text, yazi text, ifade text,
  mekan_id uuid, mekan_adi text, etiketler jsonb,
  olusturuldu timestamptz, bitis timestamptz,
  gordum boolean, goruntulenme_sayisi integer, gorunurluk text, yerlesim jsonb
)
language sql
set search_path to 'public'
as $$
  select
    h.id,
    h.kullanici_id,
    h.fotograf,
    h.yazi,
    h.ifade,
    h.mekan_id,
    mk.ad,
    gizli.hikaye_etiketleri_json(h.id),
    h.olusturuldu,
    h.bitis,
    (h.kullanici_id = auth.uid())
      or exists (select 1 from public.hikaye_goruntulemeler g
                  where g.hikaye_id = h.id and g.kullanici_id = auth.uid()),
    case when h.kullanici_id = auth.uid()
      then (select count(*)::integer from public.hikaye_goruntulemeler g where g.hikaye_id = h.id)
      else 0 end,
    h.gorunurluk,
    h.yerlesim
  from public.hikayeler h
  left join public.mekanlar mk on mk.id = h.mekan_id
  where case
    when p_kullanici is not null then h.kullanici_id = p_kullanici
    else h.kullanici_id = auth.uid()
      or exists (
        select 1 from public.takipler t
        where t.takip_eden_id = auth.uid()
          and t.takip_edilen_id = h.kullanici_id
          and t.durum = 'kabul'
      )
  end
  order by h.olusturuldu asc;
$$;

revoke execute on function public.hikaye_akisi(uuid) from public, anon;
grant execute on function public.hikaye_akisi(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
