-- MEKAN DUZENLEME TALEPLERI
--
-- Kullanicinin istegi (2026-09-09): "konumlara duzenleme talebi gonder
-- ekle; talebe basan kisi konum ismi, adresi, kapak fotografi, turunu
-- secebilsin, moderatore talebini gondersin."
--
-- NEDEN BU IS ONEMLI: dis kaynakli mekanlarin turu GUVENILIR DEGIL ve
-- bu olculdu - Bursa'daki 6.105 "Kafe" kaydinin 5.992'si Foursquare'in
-- TEK bir genel "Café" kategorisinden geliyor; ayni kategoride pub,
-- yurt kantini ve waffle'ci da var. Ad kalibiyla duzeltmek yanlis
-- sonuc uretiyor (kullanicinin uyarisi: "sadece ada gore yapmak da
-- yanlis olabilir"). Orada bulunan insan, hicbir veri kaynagindan daha
-- iyi biliyor - bu tablo o bilgiyi almanin yolu.
--
-- ONAY SART: talep dogrudan uygulanmiyor. Moderator onaylayana kadar
-- `mekanlar` kaydi degismiyor; onay tek yazma yolu.

create table if not exists public.mekan_duzenleme_talepleri (
  id uuid primary key default gen_random_uuid(),
  mekan_id uuid not null references public.mekanlar(id) on delete cascade,
  -- Hesap silinince talep ANONIMLESIYOR, silinmiyor: moderasyon
  -- gecmisi ve denetim izi butun kalmali (ayni desen `sikayetler`de).
  kullanici_id uuid references auth.users(id) on delete set null,

  -- Dort alan da OPSIYONEL; kisi yalnizca bildigini duzeltiyor.
  -- En az birinin dolu olmasi RPC'de zorlaniyor.
  onerilen_ad text check (onerilen_ad is null or length(btrim(onerilen_ad)) between 2 and 120),
  onerilen_adres text check (onerilen_adres is null or length(btrim(onerilen_adres)) between 3 and 200),
  onerilen_tur text check (onerilen_tur is null or length(btrim(onerilen_tur)) between 2 and 60),
  -- Storage yolu (`mekan-fotograflari` kovasi). Onaylanana kadar
  -- yalnizca yukleyen ve moderator gorebiliyor.
  fotograf text,

  durum text not null default 'beklemede'
    check (durum in ('beklemede', 'onaylandi', 'reddedildi')),
  moderator_notu text,
  karar_veren_id uuid references auth.users(id) on delete set null,
  karar_zamani timestamptz,
  olusturuldu timestamptz not null default now()
);

create index if not exists mekan_duzenleme_talepleri_durum_idx
  on public.mekan_duzenleme_talepleri (durum, olusturuldu desc);
create index if not exists mekan_duzenleme_talepleri_mekan_idx
  on public.mekan_duzenleme_talepleri (mekan_id);
create index if not exists mekan_duzenleme_talepleri_kullanici_idx
  on public.mekan_duzenleme_talepleri (kullanici_id, olusturuldu desc);

alter table public.mekan_duzenleme_talepleri enable row level security;

-- KISI YALNIZCA KENDI TALEPLERINI GORUR. Baskasinin talebini gormek
-- "kim neyi yanlis buldu" bilgisini yayardi; moderator listesi ayri
-- bir RPC'den geciyor.
create policy "kendi duzenleme taleplerini gorur"
  on public.mekan_duzenleme_talepleri for select
  to authenticated
  using (kullanici_id = auth.uid());

-- YAZMA YALNIZCA RPC ILE. Dogrudan insert kapali: gunluk tavan, hesap
-- durumu ve mukerrer talep kontrolu istemcinin atlayamayacagi bir
-- yerde durmali (ayni gerekce `check_inler`de de gecerli).
revoke insert, update, delete on public.mekan_duzenleme_talepleri from authenticated;
grant select on public.mekan_duzenleme_talepleri to authenticated;

-- MEKAN KAYDINA IKI YENI SUTUN
--
-- `kapak_fotograf`: ONAYLANMIS talepten geliyor. 2026-08-24'teki
-- "mekanlarin fotografi yok" kurali BU YOLLA DEGISTI - o kural dis
-- kaynaktan gorsel cekmeyi (telif, kapsam, API bagimliligi)
-- reddediyordu; buradaki fotograf kullanicinin kendi cektigi ve
-- MODERATORDEN GECMIS bir gorsel.
--
-- `elle_duzenlendi`: aylik Foursquare tazelemesi bu satirlari
-- EZMEMELI. Onaylanmis bir duzeltmenin bir sonraki veri yuklemesinde
-- geri alinmasi, kullanicinin emegini cope atmak olurdu.
alter table public.mekanlar add column if not exists kapak_fotograf text;
alter table public.mekanlar add column if not exists elle_duzenlendi boolean not null default false;

-- DENETIM IZI YENI TURU TANIMALI. Iz yazilamazsa eylemin kendisi
-- olmuyor (2026-09-02'de yasandi: kisit ihlali islemin tamamini geri
-- aliyordu).
alter table public.moderasyon_kayitlari
  drop constraint if exists moderasyon_kayitlari_hedef_tur_check;

alter table public.moderasyon_kayitlari
  add constraint moderasyon_kayitlari_hedef_tur_check
  check (hedef_tur in ('kullanici', 'check_in', 'sikayet', 'konusma', 'yorum', 'mekan'));


-- TALEP GONDERME
--
-- Gunluk tavan 5: bir kisi gunde bes mekani duzeltebilir. Tek kisilik
-- teste degil gercek kullanima gore secildi - dogru duzeltme yapan
-- birinin onunu kesmiyor, toplu talep yagdirmayi engelliyor.
create or replace function public.mekan_duzenleme_talebi_gonder(
  p_mekan_id uuid,
  p_ad       text default null,
  p_adres    text default null,
  p_tur      text default null,
  p_fotograf text default null
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

  if v_ad is null and v_adres is null and v_tur is null and v_fotograf is null then
    raise exception 'En az bir alan doldurulmali';
  end if;

  -- TUR SERBEST METIN DEGIL: onay verildiginde bu deger dogrudan
  -- `mekanlar.tur` icine yaziliyor, yani uydurma bir tur butun
  -- suzgecleri kirletirdi. Yalnizca veritabaninda ZATEN VAR OLAN bir
  -- tur kabul ediliyor.
  if v_tur is not null and not exists (
    select 1 from public.mekanlar m where m.tur = v_tur limit 1
  ) then
    raise exception 'Bu tur listemizde yok';
  end if;

  -- Fotograf YALNIZCA kendi klasorunden: baskasinin yukledigi dosyayi
  -- kendi talebine iliştirmek mumkun olmamali.
  if v_fotograf is not null and split_part(v_fotograf, '/', 1) <> v_kisi::text then
    raise exception 'Bu fotograf sana ait degil';
  end if;

  if (
    select count(*) from public.mekan_duzenleme_talepleri
    where kullanici_id = v_kisi and olusturuldu > now() - interval '1 day'
  ) >= 5 then
    raise exception 'Gunluk duzenleme talebi sinirina ulastin';
  end if;

  -- MUKERRER TALEP YOK: ayni mekan icin bekleyen bir talebin varken
  -- ikincisi moderatorun onune ayni isi iki kez getirirdi.
  if exists (
    select 1 from public.mekan_duzenleme_talepleri
    where kullanici_id = v_kisi and mekan_id = p_mekan_id and durum = 'beklemede'
  ) then
    raise exception 'Bu mekan icin bekleyen bir talebin zaten var';
  end if;

  insert into public.mekan_duzenleme_talepleri
    (mekan_id, kullanici_id, onerilen_ad, onerilen_adres, onerilen_tur, fotograf)
  values (p_mekan_id, v_kisi, v_ad, v_adres, v_tur, v_fotograf)
  returning id into v_id;

  return v_id;
end;
$fn$;

revoke execute on function public.mekan_duzenleme_talebi_gonder from public, anon;
grant execute on function public.mekan_duzenleme_talebi_gonder to authenticated;


-- MODERATOR: TALEP LISTESI
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
         t.onerilen_ad, t.onerilen_adres, t.onerilen_tur, t.fotograf,
         t.durum, t.olusturuldu
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


-- MODERATOR: TEK TALEBIN AYRINTISI
--
-- Mevcut degerleri de donduruyor: moderator "ne vardi, ne oneriliyor"
-- karsilastirmasini yapmadan karar veremez.
create or replace function public.moderasyon_duzenleme_talebi_detayi(p_id uuid)
returns table (
  id uuid,
  mekan_id uuid,
  mevcut_ad text,
  mevcut_adres text,
  mevcut_tur text,
  mevcut_semt text,
  mevcut_il text,
  onerilen_ad text,
  onerilen_adres text,
  onerilen_tur text,
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
         m.ad, m.adres, m.tur, m.semt, m.il,
         t.onerilen_ad, t.onerilen_adres, t.onerilen_tur, t.fotograf,
         t.durum, t.moderator_notu, t.olusturuldu, t.karar_zamani,
         t.kullanici_id, p.kullanici_adi
  from public.mekan_duzenleme_talepleri t
  join public.mekanlar m on m.id = t.mekan_id
  left join public.profiller p on p.id = t.kullanici_id
  where t.id = p_id;
end;
$fn$;

revoke execute on function public.moderasyon_duzenleme_talebi_detayi from public, anon;
grant execute on function public.moderasyon_duzenleme_talebi_detayi to authenticated;


-- MODERATOR: KARAR
--
-- ONAY TEK YAZMA YOLU. `mekanlar` uzerinde authenticated rolunun
-- update yetkisi yok; bu fonksiyon security definer oldugu icin
-- degisikligi yalnizca moderator karariyla yapabiliyor.
--
-- Moderator alan alan secebiliyor (`p_alanlar`): talebin ucunden
-- ikisi dogru, biri yanlis olabilir - hepsini birden reddetmek
-- dogru duzeltmeyi de coepe atardi.
create or replace function public.moderasyon_duzenleme_talebini_karara_bagla(
  p_id      uuid,
  p_karar   text,
  p_alanlar text[] default array['ad', 'adres', 'tur', 'fotograf'],
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
           kapak_fotograf = case
                  when 'fotograf' = any (p_alanlar) and v_talep.fotograf is not null
                  then v_talep.fotograf else m.kapak_fotograf end,
           -- Bir kez elle duzeltilen kayit, toplu veri yuklemesinde
           -- artik ezilmiyor.
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
