-- KAPALI MEKAN BILDIRIMI
--
-- Kullanicinin sorusu (2026-09-10): "Konum verilerimizde kapali,
-- gercekte olmayan yerler var, bunlari tespit etmek mumkun mu?"
--
-- OTOMATIK TESPIT OLCULDU VE ELENDI, tekrar denenmesin:
--
--   * Foursquare'in `date_closed` alani var ama INDIRME SIRASINDA zaten
--     filtrelenmis. Yani elimizdeki 5,98 milyon kaydin hepsi kaynaga
--     gore "acik"; kapali oldugu bilinenler bize hic gelmiyor.
--   * Elimizdeki tek dolayli sinyal `date_refreshed` ve ZAYIF:
--     kayitlarin %61'i 2020 oncesinde son kez guncellenmis (barlarda
--     %66). "Alti yildir dokunulmamis" ile "kapandi" ayni sey degil -
--     on bes yillik bir esnaf da guncellenmemis olabilir. Bu sinyale
--     bakip kayit gizlemek ACIK yerleri de silerdi.
--
-- Dolayisiyla kaynak makine degil INSAN: orada bulunan kisi bildiriyor,
-- moderator onayliyor. Ayni gerekce tur duzeltmesinde de gecerliydi
-- (2026-09-09) ve altyapinin tamami zaten burada duruyor.
--
-- ------------------------------------------------------------------ --
-- NEDEN AYRI SUTUN, `tur = 'yer-degil'` DEGIL
--
-- 2026-08-23'te mekan olmayan ~15 bin kayit (yol parcasi, koy adi, SEO
-- ilani) `tur = 'yer-degil'` yapilarak gizlenmisti. Kapali bir kafe
-- BASKA BIR SEY: o bir mekandi, kapandi. Ikisini ayni degere yikmak
--   (a) asil `tur` verisini geri alinamaz sekilde silerdi,
--   (b) "burasi hic mekan degildi" ile "burasi artik yok"u ayirt
--       edilemez yapardi - moderator yanlis bildirim geldiginde karari
--       geri alamazdi.
-- Ayri bir bayrak tek satirda geri alinabiliyor.
-- ------------------------------------------------------------------ --

-- 5,98 milyon satirlik tabloya SABIT varsayilanla sutun eklemek
-- PostgreSQL 11+'ta yalnizca katalog islemi, tablo yeniden yazilmiyor.
alter table public.mekanlar
  add column if not exists kapali boolean not null default false;

comment on column public.mekanlar.kapali is
  'Moderator onayli "burasi kalici olarak kapandi" bildirimi. Kayit SILINMIYOR: check_inler cascade oldugu icin silme insanlarin anilarini goturur.';

alter table public.mekan_duzenleme_talepleri
  add column if not exists kapali_bildirimi boolean not null default false;


-- ------------------------------------------------------------------ --
-- TALEP GONDERME: yeni `p_kapali` parametresi
--
-- ESKI IMZA ONCE DUSURULUYOR. Yeni parametre eklemek ayni adla IKINCI
-- bir fonksiyon uretiyor; `grant`/`revoke` "function name is not
-- unique" diye reddediliyor ve migrasyonun TAMAMI geri aliniyor. Bu
-- tuzak bu depoda iki kez yasandi.
-- ------------------------------------------------------------------ --
drop function if exists public.mekan_duzenleme_talebi_gonder(
  uuid, text, text, text, text, text, text, text
);

create or replace function public.mekan_duzenleme_talebi_gonder(
  p_mekan_id uuid,
  p_ad       text default null,
  p_adres    text default null,
  p_tur      text default null,
  p_fotograf text default null,
  p_mahalle  text default null,
  p_il       text default null,
  p_ilce     text default null,
  p_kapali   boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_kisi uuid := auth.uid();
  v_id uuid;
  v_ad text := nullif(btrim(p_ad), '');
  v_adres text := nullif(btrim(p_adres), '');
  v_tur text := nullif(btrim(p_tur), '');
  v_fotograf text := nullif(btrim(p_fotograf), '');
  v_mahalle text := nullif(btrim(p_mahalle), '');
  v_il text := nullif(btrim(p_il), '');
  v_ilce text := nullif(btrim(p_ilce), '');
  v_kapali boolean := coalesce(p_kapali, false);
  v_zaten_kapali boolean;
begin
  if v_kisi is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(v_kisi) then
    raise exception 'Hesabin su an bu islemi yapamaz';
  end if;

  select m.kapali into v_zaten_kapali from public.mekanlar m where m.id = p_mekan_id;
  if v_zaten_kapali is null then
    raise exception 'Bu mekan bulunamadi';
  end if;

  -- ZATEN KAPALI ISARETLI BIR MEKANI TEKRAR BILDIRMEK bosa is: karar
  -- verilmis, moderatorun onune ayni bildirim ikinci kez gelmemeli.
  if v_kapali and v_zaten_kapali then
    raise exception 'Bu mekan zaten kapali olarak isaretli';
  end if;

  if v_ad is null and v_adres is null and v_tur is null and v_fotograf is null
     and v_mahalle is null and v_il is null and v_ilce is null and not v_kapali then
    raise exception 'En az bir alan doldurulmali';
  end if;

  if v_tur is not null and not exists (
    select 1 from public.mekanlar m where m.tur = v_tur limit 1
  ) then
    raise exception 'Bu tur listemizde yok';
  end if;

  if v_il is not null and not exists (
    select 1 from public.iller i where i.ad = v_il limit 1
  ) then
    raise exception 'Bu il listemizde yok';
  end if;

  if v_fotograf is not null and split_part(v_fotograf, '/', 1) <> v_kisi::text then
    raise exception 'Bu fotograf sana ait degil';
  end if;

  if (
    select count(*) from public.mekan_duzenleme_talepleri
    where kullanici_id = v_kisi and olusturuldu > now() - interval '1 day'
  ) >= 5 then
    raise exception 'Gunluk duzenleme talebi sinirina ulastin';
  end if;

  if exists (
    select 1 from public.mekan_duzenleme_talepleri
    where kullanici_id = v_kisi and mekan_id = p_mekan_id and durum = 'beklemede'
  ) then
    raise exception 'Bu mekan icin bekleyen bir talebin zaten var';
  end if;

  insert into public.mekan_duzenleme_talepleri
    (mekan_id, kullanici_id, onerilen_ad, onerilen_adres, onerilen_tur, fotograf,
     onerilen_mahalle, onerilen_il, onerilen_ilce, kapali_bildirimi)
  values (p_mekan_id, v_kisi, v_ad, v_adres, v_tur, v_fotograf,
          v_mahalle, v_il, v_ilce, v_kapali)
  returning id into v_id;

  return v_id;
end;
$fn$;

revoke execute on function public.mekan_duzenleme_talebi_gonder from public, anon;
grant execute on function public.mekan_duzenleme_talebi_gonder to authenticated;


-- ------------------------------------------------------------------ --
-- MODERATOR RPC'LERI: donus tipi degisti, DROP + CREATE sart
-- (`create or replace` yeni sutunu kabul etmiyor, 42P13). Drop
-- yetkileri de siliyor; `grant` hemen altinda yeniden veriliyor.
-- ------------------------------------------------------------------ --
drop function if exists public.moderasyon_duzenleme_talepleri(text, integer, integer);
drop function if exists public.moderasyon_duzenleme_talebi_detayi(uuid);

create or replace function public.moderasyon_duzenleme_talepleri(
  p_durum  text default 'beklemede',
  p_limit  integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  mekan_id uuid,
  mekan_adi text,
  mekan_turu text,
  onerilen_ad text,
  onerilen_adres text,
  onerilen_tur text,
  onerilen_mahalle text,
  onerilen_il text,
  onerilen_ilce text,
  kapali_bildirimi boolean,
  fotograf text,
  durum text,
  olusturuldu timestamptz
)
language plpgsql
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();

  return query
  select t.id, t.mekan_id, m.ad, m.tur,
         t.onerilen_ad, t.onerilen_adres, t.onerilen_tur,
         t.onerilen_mahalle, t.onerilen_il, t.onerilen_ilce,
         t.kapali_bildirimi,
         t.fotograf, t.durum, t.olusturuldu
  from public.mekan_duzenleme_talepleri t
  join public.mekanlar m on m.id = t.mekan_id
  where p_durum is null or t.durum = p_durum
  order by t.olusturuldu desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$fn$;

revoke execute on function public.moderasyon_duzenleme_talepleri from public, anon;
grant execute on function public.moderasyon_duzenleme_talepleri to authenticated;

create or replace function public.moderasyon_duzenleme_talebi_detayi(p_id uuid)
returns table (
  id uuid,
  mekan_id uuid,
  mevcut_ad text,
  mevcut_adres text,
  mevcut_tur text,
  mevcut_mahalle text,
  mevcut_semt text,
  mevcut_il text,
  mevcut_kapali boolean,
  onerilen_ad text,
  onerilen_adres text,
  onerilen_tur text,
  onerilen_mahalle text,
  onerilen_il text,
  onerilen_ilce text,
  kapali_bildirimi boolean,
  fotograf text,
  durum text,
  moderator_notu text,
  olusturuldu timestamptz,
  karar_zamani timestamptz,
  gonderen_id uuid,
  gonderen_adi text
)
language plpgsql
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();

  return query
  select t.id, t.mekan_id,
         m.ad, m.adres, m.tur, m.mahalle, m.semt, m.il, m.kapali,
         t.onerilen_ad, t.onerilen_adres, t.onerilen_tur,
         t.onerilen_mahalle, t.onerilen_il, t.onerilen_ilce,
         t.kapali_bildirimi,
         t.fotograf, t.durum, t.moderator_notu, t.olusturuldu, t.karar_zamani,
         t.kullanici_id, p.kullanici_adi
  from public.mekan_duzenleme_talepleri t
  join public.mekanlar m on m.id = t.mekan_id
  left join public.profiller p on p.id = t.kullanici_id
  where t.id = p_id;
end;
$fn$;

revoke execute on function public.moderasyon_duzenleme_talebi_detayi from public, anon;
grant execute on function public.moderasyon_duzenleme_talebi_detayi to authenticated;


-- ------------------------------------------------------------------ --
-- ONAY: `kapali` de alan alan onaydan geciyor
--
-- Bir talep hem "adi su" hem "burasi kapandi" diyebilir ve ikisi ayri
-- ayri dogru/yanlis olabilir. Kapatma en agir sonucu olan alan:
-- mekan butun listelerden duesuyor. Moderator onu ayrica isaretlemek
-- zorunda kalsin diye VARSAYILAN LISTEDE YOK - `p_alanlar` acikca
-- 'kapali' tasimadikca kapatma uygulanmiyor.
-- ------------------------------------------------------------------ --
create or replace function public.moderasyon_duzenleme_talebini_karara_bagla(
  p_id      uuid,
  p_karar   text,
  p_alanlar text[] default array['ad', 'adres', 'tur', 'fotograf', 'mahalle', 'il', 'ilce'],
  p_not     text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_talep public.mekan_duzenleme_talepleri%rowtype;
begin
  perform moderasyon.yetkili_mi_zorla();

  if p_karar not in ('onaylandi', 'reddedildi') then
    raise exception 'Gecersiz karar';
  end if;

  select * into v_talep from public.mekan_duzenleme_talepleri where id = p_id;
  if v_talep.id is null then
    raise exception 'Talep bulunamadi';
  end if;

  if v_talep.durum <> 'beklemede' then
    raise exception 'Bu talep zaten karara baglanmis';
  end if;

  if p_karar = 'onaylandi' then
    update public.mekanlar m
       set ad = case
                  when 'ad' = any (p_alanlar) and v_talep.onerilen_ad is not null
                  then v_talep.onerilen_ad else m.ad end,
           adres = case
                  when 'adres' = any (p_alanlar) and v_talep.onerilen_adres is not null
                  then v_talep.onerilen_adres else m.adres end,
           tur = case
                  when 'tur' = any (p_alanlar) and v_talep.onerilen_tur is not null
                  then v_talep.onerilen_tur else m.tur end,
           mahalle = case
                  when 'mahalle' = any (p_alanlar) and v_talep.onerilen_mahalle is not null
                  then v_talep.onerilen_mahalle else m.mahalle end,
           il = case
                  when 'il' = any (p_alanlar) and v_talep.onerilen_il is not null
                  then v_talep.onerilen_il else m.il end,
           semt = case
                  when 'ilce' = any (p_alanlar) and v_talep.onerilen_ilce is not null
                  then v_talep.onerilen_ilce else m.semt end,
           kapak_fotograf = case
                  when 'fotograf' = any (p_alanlar) and v_talep.fotograf is not null
                  then v_talep.fotograf else m.kapak_fotograf end,
           kapali = case
                  when 'kapali' = any (p_alanlar) and v_talep.kapali_bildirimi
                  then true else m.kapali end,
           elle_duzenlendi = true
     where m.id = v_talep.mekan_id;
  end if;

  update public.mekan_duzenleme_talepleri
     set durum = p_karar,
         moderator_notu = p_not,
         karar_veren_id = auth.uid(),
         karar_zamani = now()
   where id = p_id;

  perform moderasyon.kaydet(
    'mekan_duzenleme_talebi_karara_baglandi', 'mekan', v_talep.mekan_id,
    jsonb_build_object(
      'talep_id', p_id, 'karar', p_karar, 'alanlar', p_alanlar, 'not', p_not,
      'kapali_bildirimi', v_talep.kapali_bildirimi
    )
  );
end;
$fn$;

revoke execute on function public.moderasyon_duzenleme_talebini_karara_bagla from public, anon;
grant execute on function public.moderasyon_duzenleme_talebini_karara_bagla to authenticated;


-- ------------------------------------------------------------------ --
-- MODERATOR: KAPATMAYI GERI AL
--
-- Yanlis bildirim gelebilir ve kapatma bir mekani butun listelerden
-- duesueruyor. Geri alinamayan bir moderasyon eylemi birakmak, tek bir
-- hatali onayi kalici hale getirirdi - ayni gerekceyle yorum gizleme de
-- geri alinabilir (2026-09-02).
-- ------------------------------------------------------------------ --
create or replace function public.moderasyon_mekani_geri_ac(p_mekan_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();

  if not exists (select 1 from public.mekanlar where id = p_mekan_id) then
    raise exception 'Bu mekan bulunamadi';
  end if;

  update public.mekanlar set kapali = false where id = p_mekan_id;

  perform moderasyon.kaydet(
    'mekan_geri_acildi', 'mekan', p_mekan_id, jsonb_build_object()
  );
end;
$fn$;

revoke execute on function public.moderasyon_mekani_geri_ac from public, anon;
grant execute on function public.moderasyon_mekani_geri_ac to authenticated;


-- ------------------------------------------------------------------ --
-- GIZLEME YOLLARI
--
-- Kapali mekan LISTELERDEN ve ARAMADAN duesueyor. Kayit duruyor ve
-- sayfasi aciliyor: eski bir check-in kartindan oraya gidilebilir ve
-- o ani silinmemeli. Sayfa "kalici olarak kapandi" diyor, check-in
-- cubugu kapali.
-- ------------------------------------------------------------------ --
create or replace function public.yakin_mekanlar_yogunluk(
  p_lat double precision,
  p_lng double precision,
  p_yaricap_metre integer default null,
  p_arama text default null,
  p_turler text[] default null,
  p_limit integer default null,
  p_ofset integer default 0
)
returns table (
  id uuid, ad text, tur text, semt text, il text, kaynak text,
  konum geography, adres text, osm_id bigint, ekleyen_kullanici uuid,
  olusturuldu timestamptz, kisi_sayisi integer, toplam_check_in integer
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 200);
  v_ofset integer := greatest(coalesce(p_ofset, 0), 0);
  v_il text := null;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_yaricap_metre is null and (p_arama is not null or p_turler is not null) then
    select i.ad into v_il
    from public.iller i
    where ST_Within(ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), i.sinir)
    limit 1;

    if v_il is null then
      return;
    end if;
  end if;

  return query
  with suzulmus as (
    select m.*
    from public.mekanlar m
    where m.tur not in ('test', 'yer-degil')
      -- KAPALI MEKAN LISTELENMIYOR (2026-09-11).
      and not m.kapali
      and (
        p_yaricap_metre is null
        or ST_DWithin(m.konum, ST_MakePoint(p_lng, p_lat)::geography, p_yaricap_metre)
      )
      and (
        p_arama is null
        or public.tr_kucuk(m.ad) like '%' || public.tr_kucuk(p_arama) || '%'
      )
      and (p_turler is null or m.tur = any (p_turler))
      and (v_il is null or m.il = v_il)
    order by m.konum <-> ST_MakePoint(p_lng, p_lat)::geography
    limit v_limit
    offset v_ofset
  )
  select s.id, s.ad, s.tur, s.semt, s.il, s.kaynak, s.konum, s.adres,
         s.osm_id, s.ekleyen_kullanici, s.olusturuldu,
         (
           select count(*)::int
           from public.check_inler c
           where c.mekan_id = s.id
             and c.konum is not null
             and c.bitis_zamani > now()
             and moderasyon.hesap_aktif_mi(c.kullanici_id)
             and not c.moderasyon_gizli
         ) as kisi_sayisi,
         (
           select count(*)::int
           from public.check_inler c
           where c.mekan_id = s.id
             and moderasyon.hesap_aktif_mi(c.kullanici_id)
             and not c.moderasyon_gizli
         ) as toplam_check_in
  from suzulmus s
  order by s.konum <-> ST_MakePoint(p_lng, p_lat)::geography;
end;
$function$;

revoke execute on function public.yakin_mekanlar_yogunluk from public, anon;
grant execute on function public.yakin_mekanlar_yogunluk to authenticated;


-- TUR SECICIDEKI ADETLER de kapali mekani saymamali: yoksa "Kafe 23"
-- yazip 22 sonuc gelirdi ve ekranin iki yarisi birbirini tutmazdi.
drop materialized view if exists public.mekan_turleri;

create materialized view public.mekan_turleri as
select il, tur, count(*)::int as toplam
from public.mekanlar
where tur not in ('test', 'yer-degil')
  and not kapali
  and il is not null
group by il, tur;

create unique index mekan_turleri_il_tur_idx
  on public.mekan_turleri (il, tur);

comment on materialized view public.mekan_turleri is
  'Tur secicideki adetler: il basina tur sayilari. Ham sayim 13,5 sn, o yuzden onceden hesaplaniyor. Kapali mekan sayilmiyor.';

grant select on public.mekan_turleri to authenticated;


-- ------------------------------------------------------------------ --
-- KAPALI MEKANA CHECK-IN YOK
--
-- Mekan listelerden duesueyor ama sayfasi hala aciliyor (eski check-in
-- karti). Orada check-in'e izin vermek, kapatma kararini anlamsiz
-- kilardi. Kural SUNUCUDA: ekran cubugu kapatiyor, ama istemci
-- atlayabilecegi icin asil kapi burasi.
-- ------------------------------------------------------------------ --
create or replace function public.check_in_yap(
  p_mekan_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_not_metni text default null,
  p_fotograf text default null,
  p_bulunurluk text default 'herkese_acik'
)
returns check_inler
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_mekan_konum geography;
  v_mekan_kapali boolean;
  v_kullanici_adi text;
  v_not text;
  v_yeni public.check_inler;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  if p_bulunurluk is null or p_bulunurluk not in ('herkese_acik', 'takipcilerim', 'gizli') then
    raise exception 'Gecersiz bulunurluk degeri';
  end if;

  v_not := nullif(btrim(coalesce(p_not_metni, '')), '');
  if length(coalesce(v_not, '')) > 500 then
    raise exception 'Not en fazla 500 karakter olabilir';
  end if;

  select konum, kapali into v_mekan_konum, v_mekan_kapali
  from public.mekanlar where id = p_mekan_id;
  if v_mekan_konum is null then
    raise exception 'Mekan bulunamadi';
  end if;

  if v_mekan_kapali then
    raise exception 'Bu mekan kalici olarak kapandi';
  end if;

  if not ST_DWithin(v_mekan_konum, ST_MakePoint(p_lng, p_lat)::geography, 1000) then
    raise exception 'Mekana cok uzaksin (~1 km icinde olmalisin)';
  end if;

  select ad into v_kullanici_adi from public.profiller where id = auth.uid();

  update public.check_inler
  set konum = null,
      gorunurluk = bag.ani_gorunurlugu(bulunurluk, gorunurluk)
  where kullanici_id = auth.uid()
    and konum is not null
    and bitis_zamani > now();

  insert into public.check_inler (
    kullanici_id, mekan_id, not_metni, fotograf, bitis_zamani, konum,
    kullanici_adi, bulunurluk
  )
  values (
    auth.uid(), p_mekan_id, v_not, p_fotograf, now() + interval '1 hour',
    ST_MakePoint(p_lng, p_lat)::geography, v_kullanici_adi, p_bulunurluk
  )
  returning * into v_yeni;

  return v_yeni;
end;
$function$;

grant execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text) to authenticated;
