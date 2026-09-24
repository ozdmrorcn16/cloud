-- ANIYA IFADE TEPKISI (2026-09-24, kullanicinin karari).
--
-- "Ifade listesi baskalari aniyi gordugu ekranda ani fotografinin altinda
-- cikiyor; ani paylasan ifade ya da yazi ekleyemiyor, baskasi sadece o
-- aniya ifade atabiliyor." Tepki paylasana "Gorenler" listesinde gorunur
-- (kullanicinin secimi; sohbete dusmez, push yok).
--
-- Model: goruntuleme satirina bir ifade. Kisi basina anı basina TEK ifade;
-- degistirilebilir, null ile kaldirilir. Sozluk check-in ile ayni
-- (`public.ifadeler`).
--
-- KVKK: yeni veri = hangi kisinin hangi aniya hangi ifadeyi attigi.
-- Dayanak sozlesmenin ifasi (ozelligin kendisi). Sure: goruntuleme satiri
-- aniyla birlikte cascade silinir (24 saat + cron). Goren: yalnizca ani
-- sahibi (hikaye_goruntuleyenler) ve atan kisinin kendisi. Disa aktarim:
-- sahibin dosyasinda gorenlerle birlikte, atanin dosyasinda
-- 'hikaye_ifadelerim'.

alter table public.hikaye_goruntulemeler
  add column if not exists ifade text references public.ifadeler(slug) on update cascade on delete set null;

-- Gorme kaydi: artik izleyenin daha once attigi ifadeyi DONDURUR (aniyi
-- yeniden acinca secim gorunsun). Donus tipi degistigi icin drop + create.
drop function if exists public.hikaye_goruntulendi(uuid);
create function public.hikaye_goruntulendi(p_hikaye_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
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
  if v_sahip is null or v_sahip = auth.uid() then
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
$$;
revoke all on function public.hikaye_goruntulendi(uuid) from public, anon;
grant execute on function public.hikaye_goruntulendi(uuid) to authenticated;

-- Ifade at / degistir / kaldir (p_ifade null). Kurallar sunucuda:
-- aniyi GOREBILEN atar, kendi anina atamazsin, sozlukte olmayan slug red.
create function public.hikaye_ifadesi_gonder(p_hikaye_id uuid, p_ifade text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_sahip uuid;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;
  if p_ifade is not null and not exists (select 1 from public.ifadeler i where i.slug = p_ifade) then
    raise exception 'Gecersiz ifade';
  end if;
  select h.kullanici_id into v_sahip
    from public.hikayeler h
   where h.id = p_hikaye_id and h.bitis > now() and not h.moderasyon_gizli
     and public.hikaye_gorunur_mu(h.kullanici_id, h.gorunurluk);
  if v_sahip is null then
    raise exception 'Hikaye bulunamadi';
  end if;
  if v_sahip = auth.uid() then
    raise exception 'Kendi anina ifade atamazsin';
  end if;
  insert into public.hikaye_goruntulemeler (hikaye_id, kullanici_id, ifade)
  values (p_hikaye_id, auth.uid(), p_ifade)
  on conflict (hikaye_id, kullanici_id) do update set ifade = excluded.ifade;
end;
$$;
revoke all on function public.hikaye_ifadesi_gonder(uuid, text) from public, anon;
grant execute on function public.hikaye_ifadesi_gonder(uuid, text) to authenticated;

-- Gorenler listesi ifadeyi de tasir (yalnizca sahibine).
drop function if exists public.hikaye_goruntuleyenler(uuid);
create function public.hikaye_goruntuleyenler(p_hikaye_id uuid)
returns table(kullanici_id uuid, goruldu timestamptz, ifade text)
language sql
stable
security definer
set search_path to 'public'
as $$
  select g.kullanici_id, g.goruldu, g.ifade
  from public.hikaye_goruntulemeler g
  join public.hikayeler h on h.id = g.hikaye_id
  where g.hikaye_id = p_hikaye_id
    and h.kullanici_id = auth.uid()
  order by (g.ifade is null), g.goruldu desc
  limit 500;
$$;
revoke all on function public.hikaye_goruntuleyenler(uuid) from public, anon;
grant execute on function public.hikaye_goruntuleyenler(uuid) to authenticated;

-- Disa aktarim: CANLI tanimdan devam (CLAUDE.md kurali). Iki metin
-- degisikligi; biri bulunamazsa migrasyon DURUR.
do $$
declare
  d text;
  eski1 constant text := 'select g.hikaye_id, p.kullanici_adi as izleyen, g.goruldu';
  eski2 constant text := '''hikaye_etiketlerim'', coalesce((';
begin
  select pg_get_functiondef(p.oid) into d
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'verilerimi_disa_aktar';
  if position(eski1 in d) = 0 or position(eski2 in d) = 0 then
    raise exception 'verilerimi_disa_aktar beklenen metni icermiyor';
  end if;
  d := replace(d, eski1, eski1 || ', g.ifade');
  d := replace(d, eski2,
    '''hikaye_ifadelerim'', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.goruldu desc) from (
        select g.hikaye_id, g.ifade, g.goruldu
        from public.hikaye_goruntulemeler g
        where g.kullanici_id = v_kisi and g.ifade is not null
      ) x
    ), ''[]''::jsonb),

    ' || eski2);
  execute d;
end
$$;

notify pgrst, 'reload schema';
