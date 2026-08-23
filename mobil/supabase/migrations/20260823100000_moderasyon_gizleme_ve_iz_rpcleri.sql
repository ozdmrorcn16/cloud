create or replace function public.moderasyon_icerigi_gizle(
  p_check_in_id uuid,
  p_gerekce     text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_sahip uuid;
begin
  perform moderasyon.yetkili_mi_zorla();

  if p_gerekce is null or length(trim(p_gerekce)) < 3 then
    raise exception 'Gerekce belirtilmeli';
  end if;

  select kullanici_id into v_sahip from public.check_inler where id = p_check_in_id;
  if v_sahip is null then
    raise exception 'Check-in bulunamadi';
  end if;

  update public.check_inler set moderasyon_gizli = true where id = p_check_in_id;

  perform moderasyon.kaydet('icerik_gizlendi', 'check_in', p_check_in_id,
    jsonb_build_object('sahip', v_sahip, 'gerekce', p_gerekce));
end;
$fn$;

create or replace function public.moderasyon_gizlemeyi_kaldir(
  p_check_in_id uuid,
  p_gerekce     text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();

  update public.check_inler set moderasyon_gizli = false where id = p_check_in_id;

  perform moderasyon.kaydet('gizleme_kaldirildi', 'check_in', p_check_in_id,
    jsonb_build_object('gerekce', p_gerekce));
end;
$fn$;

create or replace function public.moderasyon_kayitlarini_listele(
  p_hedef_tur text default null,
  p_hedef_id  uuid default null,
  p_limit     int default 100,
  p_ofset     int default 0
)
returns table (
  id           uuid,
  moderator_id uuid,
  eylem        text,
  hedef_tur    text,
  hedef_id     uuid,
  ayrinti      jsonb,
  olusturuldu  timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();

  return query
  select k.id, k.moderator_id, k.eylem, k.hedef_tur, k.hedef_id,
         k.ayrinti, k.olusturuldu
    from public.moderasyon_kayitlari k
   where (p_hedef_tur is null or k.hedef_tur = p_hedef_tur)
     and (p_hedef_id is null or k.hedef_id = p_hedef_id)
   order by k.olusturuldu desc
   limit least(coalesce(p_limit, 100), 500)
  offset greatest(coalesce(p_ofset, 0), 0);
end;
$fn$;

revoke execute on function public.moderasyon_icerigi_gizle from public, anon;
revoke execute on function public.moderasyon_gizlemeyi_kaldir from public, anon;
revoke execute on function public.moderasyon_kayitlarini_listele from public, anon;
grant execute on function public.moderasyon_icerigi_gizle to authenticated;
grant execute on function public.moderasyon_gizlemeyi_kaldir to authenticated;
grant execute on function public.moderasyon_kayitlarini_listele to authenticated;
