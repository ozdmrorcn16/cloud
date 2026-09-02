-- MODERASYON PANELINE 'yorum' DESTEGI
--
-- Yorum sikayetleri 2026-09-02'de eklendi ama panel bu turu
-- tanimiyordu: sikayetler birikiyor, kimse detayina bakamiyordu.
--
-- EN ONEMLI PARCA: sikayet edilen yorum ANINDA gizleniyor
-- (`sikayet_gizli`). Karar verilmezse SONSUZA KADAR gizli kalir - yani
-- bir sikayet, moderator hic bakmasa bile kalici sansur olur. Bu yuzden
-- karara baglama artik o bayragi COZUYOR:
--   reddedildi  -> yorum GERI GELIR (sikayet haksizmis)
--   islem_yapildi -> moderasyon_gizli = true, yani kalici karar
--   diger durumlar -> gecici gizlilik surer (henuz karar yok)

-- Sikayet detayina yorum dali.
create or replace function public.moderasyon_sikayet_detayi(p_sikayet_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  s public.sikayetler%rowtype;
  v_hedef jsonb;
begin
  perform moderasyon.yetkili_mi_zorla();

  select * into s from public.sikayetler where id = p_sikayet_id;
  if s.id is null then
    raise exception 'Sikayet bulunamadi';
  end if;

  if s.hedef_tur = 'kullanici' then
    select to_jsonb(p) into v_hedef
      from public.profiller p where p.id = s.hedef_id;
  elsif s.hedef_tur = 'check_in' then
    select jsonb_build_object(
             'id', c.id, 'kullanici_id', c.kullanici_id,
             'not_metni', c.not_metni, 'fotograf', c.fotograf,
             'mekan_adi', mk.ad, 'olusturma_zamani', c.olusturma_zamani,
             'gorunurluk', c.gorunurluk, 'bulunurluk', c.bulunurluk,
             'moderasyon_gizli', c.moderasyon_gizli)
      into v_hedef
      from public.check_inler c
      join public.mekanlar mk on mk.id = c.mekan_id
     where c.id = s.hedef_id;
  elsif s.hedef_tur = 'mesaj' then
    select jsonb_build_object(
             'id', m.id, 'konusma_id', m.konusma_id,
             'gonderen_id', m.gonderen_id, 'metin', m.metin,
             'olusturuldu', m.olusturuldu)
      into v_hedef
      from public.mesajlar m where m.id = s.hedef_id;
  elsif s.hedef_tur = 'yorum' then
    -- Yorumun KENDISI ve hangi paylasima yazildigi birlikte gerekiyor:
    -- moderator "bu yorum bu baglamda taciz mi" sorusunu baglam
    -- olmadan cevaplayamaz.
    select jsonb_build_object(
             'id', y.id,
             'check_in_id', y.check_in_id,
             'kullanici_id', y.kullanici_id,
             'metin', y.metin,
             'olusturuldu', y.olusturuldu,
             'sikayet_gizli', y.sikayet_gizli,
             'moderasyon_gizli', y.moderasyon_gizli,
             'paylasim_sahibi', c.kullanici_id,
             'paylasim_notu', c.not_metni,
             'mekan_adi', mk.ad)
      into v_hedef
      from public.yorumlar y
      join public.check_inler c on c.id = y.check_in_id
      join public.mekanlar mk on mk.id = c.mekan_id
     where y.id = s.hedef_id;
  end if;

  return jsonb_build_object(
    'sikayet', to_jsonb(s),
    'sikayet_eden', (select to_jsonb(p) from public.profiller p where p.id = s.sikayet_eden_id),
    'hedef', v_hedef
  );
end;
$function$;

-- Yorumu kalici gizle / gizlemeyi kaldir.
create or replace function public.moderasyon_yorumu_gizle(
  p_yorum_id uuid,
  p_gerekce text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_sahip uuid;
begin
  perform moderasyon.yetkili_mi_zorla();

  if p_gerekce is null or length(trim(p_gerekce)) < 3 then
    raise exception 'Gerekce belirtilmeli';
  end if;

  select kullanici_id into v_sahip from public.yorumlar where id = p_yorum_id;
  if not found then
    raise exception 'Yorum bulunamadi';
  end if;

  update public.yorumlar set moderasyon_gizli = true where id = p_yorum_id;

  perform moderasyon.kaydet('icerik_gizlendi', 'yorum', p_yorum_id,
    jsonb_build_object('sahip', v_sahip, 'gerekce', p_gerekce));
end;
$function$;

create or replace function public.moderasyon_yorum_gizlemeyi_kaldir(
  p_yorum_id uuid,
  p_gerekce text
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  perform moderasyon.yetkili_mi_zorla();

  if p_gerekce is null or length(trim(p_gerekce)) < 3 then
    raise exception 'Gerekce belirtilmeli';
  end if;

  if not exists (select 1 from public.yorumlar where id = p_yorum_id) then
    raise exception 'Yorum bulunamadi';
  end if;

  -- IKI bayrak da kalkiyor: moderator "bu yorum kalsin" dediyse
  -- sikayet kaynakli gecici gizlilik de surmemeli.
  update public.yorumlar
     set moderasyon_gizli = false, sikayet_gizli = false
   where id = p_yorum_id;

  perform moderasyon.kaydet('icerik_gizlemesi_kaldirildi', 'yorum', p_yorum_id,
    jsonb_build_object('gerekce', p_gerekce));
end;
$function$;

-- Karara baglama artik yorumun GECICI gizliligini de cozuyor.
create or replace function public.moderasyon_sikayeti_karara_bagla(
  p_sikayet_id uuid,
  p_durum text,
  p_not text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_eski text;
  v_tur text;
  v_hedef uuid;
begin
  perform moderasyon.yetkili_mi_zorla();

  if p_durum not in ('yeni', 'incelendi', 'islem_yapildi', 'reddedildi') then
    raise exception 'Gecersiz sikayet durumu';
  end if;

  select durum, hedef_tur, hedef_id into v_eski, v_tur, v_hedef
    from public.sikayetler where id = p_sikayet_id;
  if v_eski is null then
    raise exception 'Sikayet bulunamadi';
  end if;

  update public.sikayetler
     set durum          = p_durum,
         moderator_notu = p_not,
         karar_veren_id = auth.uid(),
         karar_zamani   = now()
   where id = p_sikayet_id;

  -- YORUMUN GECICI GIZLILIGINI COZ.
  --
  -- Sikayet edilen yorum aninda gizleniyor; karar verilmezse sonsuza
  -- kadar gizli kalirdi, yani bir sikayet moderator hic bakmasa bile
  -- kalici sansur olurdu. Karar verildiginde:
  --   reddedildi    -> yorum GERI GELIR
  --   islem_yapildi -> kalici gizleme (moderasyon_gizli), gecici bayrak
  --                    kalkiyor cunku artik karar tasiyor
  if v_tur = 'yorum' then
    if p_durum = 'reddedildi' then
      update public.yorumlar set sikayet_gizli = false where id = v_hedef;
    elsif p_durum = 'islem_yapildi' then
      update public.yorumlar
         set sikayet_gizli = false, moderasyon_gizli = true
       where id = v_hedef;
    end if;
  end if;

  perform moderasyon.kaydet(
    'sikayet_karara_baglandi', 'sikayet', p_sikayet_id,
    jsonb_build_object('eski_durum', v_eski, 'yeni_durum', p_durum, 'not', p_not)
  );
end;
$function$;

revoke all on function public.moderasyon_yorumu_gizle(uuid, text) from public;
revoke all on function public.moderasyon_yorum_gizlemeyi_kaldir(uuid, text) from public;
grant execute on function public.moderasyon_yorumu_gizle(uuid, text) to authenticated;
grant execute on function public.moderasyon_yorum_gizlemeyi_kaldir(uuid, text) to authenticated;
