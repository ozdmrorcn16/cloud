-- DUZENLEME TALEBINE MAHALLE, IL VE ILCE
--
-- Kullanicinin istegi (2026-09-09): "bilgileri duzeltte adres kismina
-- mahalle yazisi da ekle basa, ayri bir de il ilce sutunu ekle."
--
-- MAHALLE GERI GELDI ama BASKA BIR YOLDAN. 2026-08-31'de
-- `mekanlar.mahalle` sutunu DUSURULMUSTU ve gerekcesi gizlilik ya da
-- maliyet degil DOGRULUKTU: mahalle uc kez TURETILMEYE calisildi (en
-- yakin OSM yerlesim noktasi, komsuluga yayma, kirli adres kaydi) ve
-- ucu de yanlis sonuc verdi. Kullanicinin kurali oydu: "turetilmis
-- veri degil gercek kayit".
--
-- Buradaki mahalle TURETILMIYOR: orada bulunan bir insan yaziyor ve
-- MODERATOR onayliyor. Yani eski itiraz kapaniyor - kaynak bir tahmin
-- degil, bir beyan.
--
-- IL SERBEST METIN DEGIL: 81 ilin listesi zaten elimizde
-- (`public.iller`, poligonlariyla). Uydurma bir il, il bazli aramayi ve
-- tur suzgecini bozardi - ikisi de `mekanlar.il` uzerinden calisiyor.
-- ILCE icin ayni kontrol YOK: ilce listesi `iller` tablosunda durmuyor
-- ve 945 ilcenin adini ikinci bir yerde tutmak, onlari guncel tutma
-- yukumlulugu getirirdi. Moderator zaten her talebi gozuyle goruyor.

alter table public.mekan_duzenleme_talepleri
  add column if not exists onerilen_mahalle text
    check (onerilen_mahalle is null or length(btrim(onerilen_mahalle)) between 2 and 80),
  add column if not exists onerilen_il text
    check (onerilen_il is null or length(btrim(onerilen_il)) between 2 and 40),
  add column if not exists onerilen_ilce text
    check (onerilen_ilce is null or length(btrim(onerilen_ilce)) between 2 and 40);

alter table public.mekanlar add column if not exists mahalle text;

-- ESKI IMZA DUSURULUYOR: yeni parametreler eklenince ayni adla ikinci
-- bir fonksiyon olusuyor, `grant`/`revoke` "is not unique" diye
-- reddediliyor (yasandi) ve istemcinin hangisine duestuegue belirsiz
-- kaliyor.
drop function if exists public.mekan_duzenleme_talebi_gonder(uuid, text, text, text, text);

create or replace function public.mekan_duzenleme_talebi_gonder(
  p_mekan_id uuid,
  p_ad       text default null,
  p_adres    text default null,
  p_tur      text default null,
  p_fotograf text default null,
  p_mahalle  text default null,
  p_il       text default null,
  p_ilce     text default null
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
begin
  if v_kisi is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(v_kisi) then
    raise exception 'Hesabin su an bu islemi yapamaz';
  end if;

  if not exists (select 1 from public.mekanlar where id = p_mekan_id) then
    raise exception 'Bu mekan bulunamadi';
  end if;

  if v_ad is null and v_adres is null and v_tur is null and v_fotograf is null
     and v_mahalle is null and v_il is null and v_ilce is null then
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
     onerilen_mahalle, onerilen_il, onerilen_ilce)
  values (p_mekan_id, v_kisi, v_ad, v_adres, v_tur, v_fotograf, v_mahalle, v_il, v_ilce)
  returning id into v_id;

  return v_id;
end;
$fn$;

revoke execute on function public.mekan_duzenleme_talebi_gonder from public, anon;
grant execute on function public.mekan_duzenleme_talebi_gonder to authenticated;

-- Moderator RPC'leri: donus tipi degistigi icin DROP + CREATE
-- (`create or replace` yeni sutunu kabul etmiyor, 42P13). Drop yetkileri
-- de siliyor, o yuzden `grant` hemen altinda yeniden veriliyor.
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
  onerilen_ad text,
  onerilen_adres text,
  onerilen_tur text,
  onerilen_mahalle text,
  onerilen_il text,
  onerilen_ilce text,
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
         m.ad, m.adres, m.tur, m.mahalle, m.semt, m.il,
         t.onerilen_ad, t.onerilen_adres, t.onerilen_tur,
         t.onerilen_mahalle, t.onerilen_il, t.onerilen_ilce,
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

-- ONAY: yeni alanlar da uygulaniyor. ILCE `mekanlar.semt` sutununa
-- yaziliyor - o sutunun adi tarihsel, icerigi 2026-08-31'den beri
-- ILCE (poligon testiyle atanmis).
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
      'talep_id', p_id, 'karar', p_karar, 'alanlar', p_alanlar, 'not', p_not
    )
  );
end;
$fn$;

revoke execute on function public.moderasyon_duzenleme_talebini_karara_bagla from public, anon;
grant execute on function public.moderasyon_duzenleme_talebini_karara_bagla to authenticated;
