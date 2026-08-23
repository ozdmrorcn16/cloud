-- Ortak koruma: moderator kendini ya da baska bir moderatoru askiya
-- alamaz. Yoksa panel kendi kendini kilitleyebilir ve geri donusu
-- yalnizca dogrudan veritabani erisimi olur.
create or replace function moderasyon.hedef_uygun_mu(p_kullanici_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  if p_kullanici_id is null then
    raise exception 'Kullanici belirtilmeli';
  end if;
  if p_kullanici_id = auth.uid() then
    raise exception 'Kendine islem uygulayamazsin';
  end if;
  if exists (select 1 from public.moderatorler where kullanici_id = p_kullanici_id) then
    raise exception 'Bir moderatore islem uygulanamaz';
  end if;
end;
$fn$;

create or replace function public.moderasyon_hesabi_askiya_al(
  p_kullanici_id uuid,
  p_bitis        timestamptz,
  p_gerekce      text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();
  perform moderasyon.hedef_uygun_mu(p_kullanici_id);

  if p_bitis is null or p_bitis <= now() then
    raise exception 'Aski bitisi gelecekte olmali';
  end if;
  if p_gerekce is null or length(trim(p_gerekce)) < 3 then
    raise exception 'Gerekce belirtilmeli';
  end if;

  -- Kullanicinin kendi koydugu 'dondurulmus' durumu da bu satirla
  -- degisir; moderasyon karari kullanicinin tercihinin uzerindedir.
  insert into public.hesap_durumlari
    (kullanici_id, durum, aski_bitisi, gerekce, moderator_id, guncellendi)
  values (p_kullanici_id, 'askida', p_bitis, p_gerekce, auth.uid(), now())
  on conflict (kullanici_id) do update
    set durum = 'askida', aski_bitisi = excluded.aski_bitisi,
        gerekce = excluded.gerekce, moderator_id = excluded.moderator_id,
        guncellendi = now();

  perform moderasyon.kaydet('hesap_askiya_alindi', 'kullanici', p_kullanici_id,
    jsonb_build_object('bitis', p_bitis, 'gerekce', p_gerekce));
end;
$fn$;

create or replace function public.moderasyon_hesabi_yasakla(
  p_kullanici_id uuid,
  p_gerekce      text
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();
  perform moderasyon.hedef_uygun_mu(p_kullanici_id);

  if p_gerekce is null or length(trim(p_gerekce)) < 3 then
    raise exception 'Gerekce belirtilmeli';
  end if;

  -- Kalici yasak bitis tarihi TASIMAZ (hesap_durumlari_sure kisiti).
  insert into public.hesap_durumlari
    (kullanici_id, durum, aski_bitisi, gerekce, moderator_id, guncellendi)
  values (p_kullanici_id, 'yasakli', null, p_gerekce, auth.uid(), now())
  on conflict (kullanici_id) do update
    set durum = 'yasakli', aski_bitisi = null,
        gerekce = excluded.gerekce, moderator_id = excluded.moderator_id,
        guncellendi = now();

  perform moderasyon.kaydet('hesap_yasaklandi', 'kullanici', p_kullanici_id,
    jsonb_build_object('gerekce', p_gerekce));
end;
$fn$;

create or replace function public.moderasyon_hesap_durumunu_kaldir(
  p_kullanici_id uuid,
  p_gerekce      text
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

  select durum into v_eski from public.hesap_durumlari
   where kullanici_id = p_kullanici_id;

  -- Satirin YOKLUGU aktif demektir; kaldirmak satiri silmektir.
  -- Gecmis denetim izinde durur.
  delete from public.hesap_durumlari where kullanici_id = p_kullanici_id;

  perform moderasyon.kaydet('hesap_durumu_kaldirildi', 'kullanici', p_kullanici_id,
    jsonb_build_object('eski_durum', v_eski, 'gerekce', p_gerekce));
end;
$fn$;

revoke execute on function public.moderasyon_hesabi_askiya_al from public, anon;
revoke execute on function public.moderasyon_hesabi_yasakla from public, anon;
revoke execute on function public.moderasyon_hesap_durumunu_kaldir from public, anon;
grant execute on function public.moderasyon_hesabi_askiya_al to authenticated;
grant execute on function public.moderasyon_hesabi_yasakla to authenticated;
grant execute on function public.moderasyon_hesap_durumunu_kaldir to authenticated;
