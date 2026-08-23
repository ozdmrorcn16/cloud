-- Arama: aramada_gorunsun tercihi ve engellemeler DIKKATE ALINMAZ.
-- Moderasyon gorunurlugu kullanici tercihlerinin uzerindedir; kapi
-- zaten aal2 + moderatorler satiri ile korunuyor.
create or replace function public.moderasyon_kullanici_ara(
  p_metin text,
  p_limit int default 20
)
returns table (
  id             uuid,
  ad             text,
  kullanici_adi  text,
  durum          text,
  sikayet_sayisi bigint
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_desen text;
begin
  perform moderasyon.yetkili_mi_zorla();

  if p_metin is null or length(trim(p_metin)) < 2 then
    raise exception 'En az 2 karakter gerekli';
  end if;

  -- Joker karakterler kacisli: kullanici girdisi desen olarak
  -- yorumlanmamali (kisi_ara'daki ayni kalip).
  v_desen := '%' || replace(replace(replace(trim(p_metin), '\', '\\'), '%', '\%'), '_', '\_') || '%';

  return query
  select p.id, p.ad, p.kullanici_adi,
         d.durum,
         (select count(*) from public.sikayetler s
           where s.hedef_tur = 'kullanici' and s.hedef_id = p.id)
    from public.profiller p
    left join public.hesap_durumlari d on d.kullanici_id = p.id
   where p.kullanici_adi ilike v_desen
      or p.ad ilike v_desen
   order by p.kullanici_adi
   limit least(coalesce(p_limit, 20), 100);
end;
$fn$;

-- Karar 64: detay GERCEKTEN her seyi gosterir. Karar 61: bu goruntuleme
-- ize duser (kisisel veriye erisim). Bildirim jetonunun KENDISI donmez,
-- yalnizca cihaz sayisi - jeton bir kimlik bilgisidir ve gosterilmesinin
-- moderasyon degeri yoktur.
create or replace function public.moderasyon_kullanici_detayi(p_kullanici_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v jsonb;
begin
  perform moderasyon.yetkili_mi_zorla();

  select jsonb_build_object(
    'profil', (select to_jsonb(p) from public.profiller p where p.id = p_kullanici_id),
    'hesap_durumu', (select to_jsonb(d) from public.hesap_durumlari d where d.kullanici_id = p_kullanici_id),
    -- Gizlenenler DAHIL: moderator kendi gizledigini de gormeli.
    'check_inler', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'mekan_adi', mk.ad, 'not_metni', c.not_metni,
               'fotograf', c.fotograf, 'olusturma_zamani', c.olusturma_zamani,
               'canli_mi', c.konum is not null,
               'gorunurluk', c.gorunurluk, 'bulunurluk', c.bulunurluk,
               'moderasyon_gizli', c.moderasyon_gizli)
             order by c.olusturma_zamani desc)
        from public.check_inler c join public.mekanlar mk on mk.id = c.mekan_id
       where c.kullanici_id = p_kullanici_id), '[]'::jsonb),
    'takipler', coalesce((
      select jsonb_agg(jsonb_build_object(
               'karsi_taraf', t.takip_edilen_id, 'durum', t.durum,
               'olusturuldu', t.olusturuldu))
        from public.takipler t where t.takip_eden_id = p_kullanici_id), '[]'::jsonb),
    'engelledikleri', coalesce((
      select jsonb_agg(e.engellenen_id) from public.engellemeler e
       where e.engelleyen_id = p_kullanici_id), '[]'::jsonb),
    'onu_engelleyenler', coalesce((
      select jsonb_agg(e.engelleyen_id) from public.engellemeler e
       where e.engellenen_id = p_kullanici_id), '[]'::jsonb),
    'sohbet_istekleri', coalesce((
      select jsonb_agg(jsonb_build_object(
               'gonderen_id', si.gonderen_id, 'alan_id', si.alan_id,
               'durum', si.durum, 'olusturuldu', si.olusturuldu))
        from public.sohbet_istekleri si
       where si.gonderen_id = p_kullanici_id or si.alan_id = p_kullanici_id), '[]'::jsonb),
    -- Spam incelemesi icin gunluk sayac.
    'bugunku_istek_sayisi', (
      select count(*) from public.istek_gunlugu g
       where g.gonderen_id = p_kullanici_id
         and g.olusturuldu >= date_trunc('day', now())),
    -- METADATA, icerik degil. Icerik ayri bir cagri ve ayri bir iz
    -- satiridir (moderasyon_konusma_mesajlari).
    'konusmalar', coalesce((
      select jsonb_agg(jsonb_build_object(
               'konusma_id', k.id,
               'karsi_taraf', (select u2.kullanici_id from public.konusma_uyeleri u2
                                where u2.konusma_id = k.id
                                  and u2.kullanici_id <> p_kullanici_id
                                limit 1),
               'mesaj_sayisi', (select count(*) from public.mesajlar m where m.konusma_id = k.id),
               'ilk_mesaj', (select min(m.olusturuldu) from public.mesajlar m where m.konusma_id = k.id),
               'son_mesaj', (select max(m.olusturuldu) from public.mesajlar m where m.konusma_id = k.id)))
        from public.konusmalar k
        join public.konusma_uyeleri u on u.konusma_id = k.id
       where u.kullanici_id = p_kullanici_id), '[]'::jsonb),
    -- Jetonun kendisi DEGIL, yalnizca sayi.
    'bildirim_cihazi', (
      select count(*) from public.bildirim_jetonlari b where b.kullanici_id = p_kullanici_id),
    'sikayet_ozeti', jsonb_build_object(
      'hakkinda', (select count(*) from public.sikayetler s
                    where s.hedef_tur = 'kullanici' and s.hedef_id = p_kullanici_id),
      'actigi',   (select count(*) from public.sikayetler s
                    where s.sikayet_eden_id = p_kullanici_id))
  ) into v;

  -- Kisisel veriye erisim izi (karar 61). Liste ekranlari kaydedilmez,
  -- detay kaydedilir.
  perform moderasyon.kaydet('kullanici_detayi_goruntulendi', 'kullanici', p_kullanici_id, null);

  return v;
end;
$fn$;

revoke execute on function public.moderasyon_kullanici_ara from public, anon;
revoke execute on function public.moderasyon_kullanici_detayi from public, anon;
grant execute on function public.moderasyon_kullanici_ara to authenticated;
grant execute on function public.moderasyon_kullanici_detayi to authenticated;
