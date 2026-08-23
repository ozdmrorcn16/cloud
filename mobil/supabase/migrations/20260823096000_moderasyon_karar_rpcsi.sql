create or replace function public.moderasyon_sikayeti_karara_bagla(
  p_sikayet_id uuid,
  p_durum      text,
  p_not        text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_eski text;
begin
  perform moderasyon.yetkili_mi_zorla();

  if p_durum not in ('yeni', 'incelendi', 'islem_yapildi', 'reddedildi') then
    raise exception 'Gecersiz sikayet durumu';
  end if;

  select durum into v_eski from public.sikayetler where id = p_sikayet_id;
  if v_eski is null then
    raise exception 'Sikayet bulunamadi';
  end if;

  update public.sikayetler
     set durum          = p_durum,
         moderator_notu = p_not,
         karar_veren_id = auth.uid(),
         karar_zamani   = now()
   where id = p_sikayet_id;

  perform moderasyon.kaydet(
    'sikayet_karara_baglandi', 'sikayet', p_sikayet_id,
    jsonb_build_object('eski_durum', v_eski, 'yeni_durum', p_durum, 'not', p_not)
  );
end;
$fn$;

revoke execute on function public.moderasyon_sikayeti_karara_bagla from public, anon;
grant execute on function public.moderasyon_sikayeti_karara_bagla to authenticated;
