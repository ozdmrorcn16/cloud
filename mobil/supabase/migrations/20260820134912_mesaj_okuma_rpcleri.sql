-- Mesaj kutusu. Gizlenmis konusmalar listede cikmaz.
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
as $$
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
        and m.gonderen_id <> auth.uid()
        and (benim.son_okuma is null or m.olusturuldu > benim.son_okuma)
    ),
    bag.yazabilir_mi(d.kullanici_id)
  from public.konusmalar k
  join public.konusma_uyeleri benim
    on benim.konusma_id = k.id and benim.kullanici_id = auth.uid()
  join public.konusma_uyeleri d
    on d.konusma_id = k.id and d.kullanici_id <> auth.uid()
  join public.profiller p on p.id = d.kullanici_id
  left join lateral (
    select m.metin, m.olusturuldu
    from public.mesajlar m
    where m.konusma_id = k.id
    order by m.olusturuldu desc
    limit 1
  ) sm on true
  where k.tur = 'birebir'
    and benim.gizlendi_mi = false
    and not gizli.engelli_mi(d.kullanici_id)
  order by sm.olusturuldu desc nulls last;
end;
$$;

revoke execute on function public.konusmalarim() from public, anon;
grant execute on function public.konusmalarim() to authenticated;

-- Sayfali gecmis, yeniden eskiye. p_once null ise en yeniden baslar.
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
as $$
declare
  v_diger_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not exists (
    select 1 from public.konusma_uyeleri u
    where u.konusma_id = p_konusma_id and u.kullanici_id = auth.uid()
  ) then
    raise exception 'Konusma bulunamadi';
  end if;

  -- Bu fonksiyon security definer oldugu icin mesajlar tablosunun RLS'ini
  -- (dolayisiyla "not gizli.engelli_mi" kosulunu) TAMAMEN atlar. O kural
  -- burada AYRICA zorlanmazsa, engellenen taraf RPC uzerinden RLS'in
  -- gizledigi mesajlari okuyabilir. Karsi uye burada bulunup ayni "Konusma
  -- bulunamadi" hatasi donduruluyor - "engellendin" ile "boyle bir konusma
  -- yok" ayirt edilmiyor, uygulamanin sessizlik ilkesiyle tutarli.
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
  order by m.olusturuldu desc
  limit least(coalesce(p_limit, 50), 100);
end;
$$;

revoke execute on function public.mesajlari_getir(uuid, timestamptz, int) from public, anon;
grant execute on function public.mesajlari_getir(uuid, timestamptz, int) to authenticated;

create or replace function public.konusmayi_okundu_isaretle(p_konusma_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  update public.konusma_uyeleri
     set son_okuma = now()
   where konusma_id = p_konusma_id and kullanici_id = auth.uid();

  if not found then
    raise exception 'Konusma bulunamadi';
  end if;
end;
$$;

revoke execute on function public.konusmayi_okundu_isaretle(uuid) from public, anon;
grant execute on function public.konusmayi_okundu_isaretle(uuid) to authenticated;

-- "Gizle", "sil" degil: karar 44. Yalnizca cagiranin tarafinda gizler.
create or replace function public.konusmayi_gizle(p_konusma_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  update public.konusma_uyeleri
     set gizlendi_mi = true
   where konusma_id = p_konusma_id and kullanici_id = auth.uid();

  if not found then
    raise exception 'Konusma bulunamadi';
  end if;
end;
$$;

revoke execute on function public.konusmayi_gizle(uuid) from public, anon;
grant execute on function public.konusmayi_gizle(uuid) to authenticated;
