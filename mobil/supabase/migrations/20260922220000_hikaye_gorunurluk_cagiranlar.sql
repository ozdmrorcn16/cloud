-- HIKAYE GORUNURLUGU - CAGIRANLAR (2026-09-22). `hikaye_gorunur_mu`
-- tek parametreliyken iki fonksiyon daha onu cagiriyordu; imza
-- degisince ikisi de "function does not exist" ile patladi ve bunu
-- CANLI test yakaladi (test:sema, "sikayet_gonder 'hikaye' hedefini
-- taniyor"). Ders: bir fonksiyonun imzasi degisirse `pg_proc.prosrc`
-- icinde adini arayip BUTUN cagiranlar ayni migrasyonda guncellenir.

create or replace function public.hikaye_goruntulendi(p_hikaye_id uuid)
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
  select h.kullanici_id into v_sahip
    from public.hikayeler h
   where h.id = p_hikaye_id and h.bitis > now() and not h.moderasyon_gizli
     and public.hikaye_gorunur_mu(h.kullanici_id, h.gorunurluk);
  if v_sahip is null or v_sahip = auth.uid() then
    return;
  end if;
  insert into public.hikaye_goruntulemeler (hikaye_id, kullanici_id)
  values (p_hikaye_id, auth.uid())
  on conflict do nothing;
end;
$$;

-- sikayet_gonder: yalnizca hikaye dalindaki cagri degisti, govdenin
-- geri kalani canli tanimdan aynen alindi (pg_get_functiondef).
create or replace function public.sikayet_gonder(p_hedef_tur text, p_hedef_id uuid, p_sebep text, p_aciklama text default null::text, p_fotograf text default null::text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_gonderen uuid;
  v_konusma  uuid;
  v_fotograf text;
  v_hikaye_sahibi uuid;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_hedef_tur is null or p_hedef_tur not in ('kullanici', 'check_in', 'mesaj', 'hikaye') then
    raise exception 'Gecersiz sikayet hedefi';
  end if;

  if p_hedef_id is null then
    raise exception 'Gecersiz sikayet hedefi';
  end if;

  if p_sebep is null or trim(p_sebep) = '' then
    raise exception 'Sikayet sebebi belirtilmeli';
  end if;

  if p_hedef_tur = 'kullanici' and p_hedef_id = auth.uid() then
    raise exception 'Kendini sikayet edemezsin';
  end if;

  v_fotograf := nullif(btrim(coalesce(p_fotograf, '')), '');
  if v_fotograf is not null
     and (split_part(v_fotograf, '/', 1) <> auth.uid()::text
          or split_part(v_fotograf, '/', 2) = '') then
    raise exception 'Bu fotograf sana ait degil';
  end if;

  if p_hedef_tur = 'mesaj' then
    select m.gonderen_id, m.konusma_id
      into v_gonderen, v_konusma
      from public.mesajlar m
     where m.id = p_hedef_id;

    if v_konusma is null then
      raise exception 'Bu mesaji sikayet edemezsin';
    end if;

    if not exists (
      select 1 from public.konusma_uyeleri u
       where u.konusma_id = v_konusma
         and u.kullanici_id = auth.uid()
    ) then
      raise exception 'Bu mesaji sikayet edemezsin';
    end if;

    if v_gonderen is not null and v_gonderen = auth.uid() then
      raise exception 'Kendi mesajini sikayet edemezsin';
    end if;
  end if;

  if p_hedef_tur = 'hikaye' then
    select h.kullanici_id into v_hikaye_sahibi
      from public.hikayeler h
     where h.id = p_hedef_id
       and h.bitis > now()
       and h.kullanici_id <> auth.uid()
       and public.hikaye_gorunur_mu(h.kullanici_id, h.gorunurluk);
    if v_hikaye_sahibi is null then
      raise exception 'Bu hikayeyi sikayet edemezsin';
    end if;
  end if;

  insert into public.sikayetler (sikayet_eden_id, hedef_tur, hedef_id, sebep, aciklama, fotograf)
  values (auth.uid(), p_hedef_tur, p_hedef_id, p_sebep, p_aciklama, v_fotograf);
end;
$$;

revoke execute on function public.hikaye_goruntulendi(uuid) from public, anon;
grant execute on function public.hikaye_goruntulendi(uuid) to authenticated, service_role;
revoke execute on function public.sikayet_gonder(text, uuid, text, text, text) from public, anon;
grant execute on function public.sikayet_gonder(text, uuid, text, text, text) to authenticated, service_role;

notify pgrst, 'reload schema';
