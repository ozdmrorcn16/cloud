-- ANLIGA STANDART EMOJI (2026-09-26, kullanicinin istegi: "anliklarin
-- altindaki ifade setini standart emoji seti yap"). Isleyis ayni: en sik
-- birkac emoji + arti (butun liste); dokunmak emojiyi ANLIGA birakir,
-- sahibi Gorenler'de gorur, 24 saatte silinir. 108'lik `ifade` sutunu
-- eski veriler icin duruyor, istemci artik yazmiyor.

alter table public.hikaye_goruntulemeler
  add column if not exists emoji text;

alter table public.hikaye_goruntulemeler
  drop constraint if exists hikaye_goruntulemeler_emoji_kontrol;
-- Emoji: 1-16 karakter, harf/rakam/bosluk YOK (metin yazilamasin).
alter table public.hikaye_goruntulemeler
  add constraint hikaye_goruntulemeler_emoji_kontrol
  check (emoji is null or (char_length(emoji) between 1 and 16 and emoji !~ '[[:alnum:][:space:]]'));

create or replace function public.hikaye_emojisi_birak(p_hikaye_id uuid, p_emoji text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_sahip uuid;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;
  if p_emoji is not null and (char_length(p_emoji) not between 1 and 16 or p_emoji ~ '[[:alnum:][:space:]]') then
    raise exception 'Gecersiz emoji';
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
  insert into public.hikaye_goruntulemeler (hikaye_id, kullanici_id, emoji)
  values (p_hikaye_id, auth.uid(), p_emoji)
  on conflict (hikaye_id, kullanici_id) do update set emoji = excluded.emoji;
end;
$function$;

revoke execute on function public.hikaye_emojisi_birak(uuid, text) from public, anon;
grant execute on function public.hikaye_emojisi_birak(uuid, text) to authenticated;

-- Gorme kaydi artik birakilan EMOJIYI doner (satir secili acilsin).
create or replace function public.hikaye_goruntulendi(p_hikaye_id uuid)
 returns text
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_sahip uuid;
  v_emoji text;
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
    update public.hikayeler set sahip_gordu = true
     where id = p_hikaye_id and not sahip_gordu;
    return null;
  end if;
  insert into public.hikaye_goruntulemeler (hikaye_id, kullanici_id)
  values (p_hikaye_id, auth.uid())
  on conflict do nothing;
  select g.emoji into v_emoji
    from public.hikaye_goruntulemeler g
   where g.hikaye_id = p_hikaye_id and g.kullanici_id = auth.uid();
  return v_emoji;
end;
$function$;

revoke execute on function public.hikaye_goruntulendi(uuid) from public, anon;
grant execute on function public.hikaye_goruntulendi(uuid) to authenticated;

-- Gorenler: emoji de doner (donus tipi degisti -> drop + create).
drop function if exists public.hikaye_goruntuleyenler(uuid);
create function public.hikaye_goruntuleyenler(p_hikaye_id uuid)
 returns table(kullanici_id uuid, goruldu timestamp with time zone, ifade text, emoji text)
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  select g.kullanici_id, g.goruldu, g.ifade, g.emoji
  from public.hikaye_goruntulemeler g
  join public.hikayeler h on h.id = g.hikaye_id
  where g.hikaye_id = p_hikaye_id
    and h.kullanici_id = auth.uid()
  order by (g.emoji is null and g.ifade is null), g.goruldu desc
  limit 500;
$function$;

revoke execute on function public.hikaye_goruntuleyenler(uuid) from public, anon;
grant execute on function public.hikaye_goruntuleyenler(uuid) to authenticated;

-- En sik emojiler: once kisinin kendisi, sonra genel ADET, sonra varsayilan
-- set (Instagram'in hizli tepkileri).
create or replace function public.sik_emojiler(p_adet integer default 6)
 returns table(emoji text)
 language sql
 stable
 security definer
 set search_path to 'public'
as $function$
  with varsayilan as (
    select e as emoji, o as sira
      from unnest(array['❤️','😂','😮','😢','👏','🔥','🎉','😍','🥰','😎','🙌','💯']) with ordinality as v(e, o)
  ),
  kendi as (
    select g.emoji, count(*) as adet from public.hikaye_goruntulemeler g
     where g.kullanici_id = auth.uid() and g.emoji is not null group by g.emoji
  ),
  genel as (
    select g.emoji, count(*) as adet from public.hikaye_goruntulemeler g
     where g.emoji is not null group by g.emoji
  ),
  aday as (
    select emoji from varsayilan union select emoji from kendi union select emoji from genel
  )
  select a.emoji from aday a
    left join kendi k on k.emoji = a.emoji
    left join genel g on g.emoji = a.emoji
    left join varsayilan v on v.emoji = a.emoji
   where auth.uid() is not null
   order by coalesce(k.adet, 0) desc, coalesce(g.adet, 0) desc, coalesce(v.sira, 999) asc
   limit least(greatest(coalesce(p_adet, 6), 1), 20);
$function$;

revoke execute on function public.sik_emojiler(integer) from public, anon;
grant execute on function public.sik_emojiler(integer) to authenticated;

-- Veri disa aktarma: emoji de girsin (canli tanimdan metin degisimiyle).
do $$
declare
  d text := pg_get_functiondef('public.verilerimi_disa_aktar'::regproc);
begin
  if position('g.emoji' in d) = 0 then
    d := replace(d, 'select g.hikaye_id, p.kullanici_adi as izleyen, g.goruldu, g.ifade',
                    'select g.hikaye_id, p.kullanici_adi as izleyen, g.goruldu, g.ifade, g.emoji');
    d := replace(d, 'select g.hikaye_id, g.ifade, g.goruldu',
                    'select g.hikaye_id, g.ifade, g.emoji, g.goruldu');
    d := replace(d, 'where g.kullanici_id = v_kisi and g.ifade is not null',
                    'where g.kullanici_id = v_kisi and (g.ifade is not null or g.emoji is not null)');
    execute d;
  end if;
end $$;
