-- KENDI ANLIGIMDA YENI / GORULDU (2026-09-26, kullanicinin istegi: "kendi
-- anligimda ana sayfada baskalarininki gibi yeni atilmis ve gorulmus
-- sekillerinde gorunsun").
--
-- Sahibin kendi anligini izlemesi hikaye_goruntulemeler'e YAZILMAZ (yoksa
-- kendi "Gorenler" listesinde kendini gorurdu); anligin kendi satirinda
-- bir bayrak tutulur. Yalnizca sahibine anlamli, kimseye gosterilmez.
-- Mevcut aktif anliklar "goruldu" sayilir (sahibi paylasirken gordu).

alter table public.hikayeler
  add column if not exists sahip_gordu boolean not null default false;

update public.hikayeler set sahip_gordu = true where sahip_gordu = false;

create or replace function public.hikaye_goruntulendi(p_hikaye_id uuid)
 returns text
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_sahip uuid;
  v_ifade text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;
  select h.kullanici_id into v_sahip
    from public.hikayeler h
   where h.id = p_hikaye_id and h.bitis > now() and not h.moderasyon_gizli
     and public.hikaye_gorunur_mu(h.kullanici_id, h.gorunurluk);
  if v_sahip is null then
    return null;
  end if;
  if v_sahip = auth.uid() then
    -- Sahibi kendi anligini izledi: yalnizca bayrak.
    update public.hikayeler set sahip_gordu = true
     where id = p_hikaye_id and not sahip_gordu;
    return null;
  end if;
  insert into public.hikaye_goruntulemeler (hikaye_id, kullanici_id)
  values (p_hikaye_id, auth.uid())
  on conflict do nothing;
  select g.ifade into v_ifade
    from public.hikaye_goruntulemeler g
   where g.hikaye_id = p_hikaye_id and g.kullanici_id = auth.uid();
  return v_ifade;
end;
$function$;

revoke execute on function public.hikaye_goruntulendi(uuid) from public, anon;
grant execute on function public.hikaye_goruntulendi(uuid) to authenticated;

create or replace function public.hikaye_akisi(p_kullanici uuid default null::uuid)
 returns table(id uuid, kullanici_id uuid, fotograf text, yazi text, ifade text, mekan_id uuid, mekan_adi text, etiketler jsonb, olusturuldu timestamp with time zone, bitis timestamp with time zone, gordum boolean, goruntulenme_sayisi integer, gorunurluk text, yerlesim jsonb)
 language sql
 set search_path to 'public'
as $function$
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
    -- Kendi anligimda "gordum" = sahip bayragi (2026-09-26).
    case when h.kullanici_id = auth.uid()
      then h.sahip_gordu
      else exists (select 1 from public.hikaye_goruntulemeler g
                    where g.hikaye_id = h.id and g.kullanici_id = auth.uid())
    end,
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
    -- Serit/izleyici yalnizca AKTIF anliklar (2026-09-24).
    and h.bitis > now()
  order by h.olusturuldu asc;
$function$;

revoke execute on function public.hikaye_akisi(uuid) from public, anon;
grant execute on function public.hikaye_akisi(uuid) to authenticated;
