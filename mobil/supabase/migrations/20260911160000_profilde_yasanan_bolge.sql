-- PROFILDE "YASADIGIN BOLGE" (IL + ILCE)
--
-- Kullanicinin istegi (2026-09-11): "profili duzenlemeye yasadigin
-- bolge diye bir sey ekleyelim, il ilce secilsin, sadece opsiyonel;
-- secerse profilinde biyografi kisimlarinin orada gorunur."
--
-- ------------------------------------------------------------------ --
-- ILCE LISTESI TURETILMIS DEGIL, GERCEK KAYIT
--
-- Kullanicinin kurali: "turetilmis veri degil gercek kayit". Bu yuzden
-- ilce listesi `mekanlar.semt` sutunundan CIKARILMADI - o sutun karma
-- bir kaynak (poligon testi + Foursquare `locality`) ve icinde
-- "Avustralya", "Bilinmez", "Marmara Bölgesi" gibi copler var; Bursa
-- icin 17 gercek ilcenin yaninda 33 cop kayit olcuIdue.
--
-- Liste `mahalle_hazirlik` tablosundan geliyor: o tablo 2026-08-31'de
-- OSM IDARI SINIR POLIGONLARIYLA nokta-icinde-poligon testi yapilarak
-- uretildi, yani her satir "bu koordinat su ilcenin SINIRLARI ICINDE"
-- diyor. Cikan liste 968 (il, ilce) cifti; Turkiye'de 973 ilce var ve
-- Bursa kontrol edildiginde TAM 17 ilce, sifir cop.
-- ------------------------------------------------------------------ --

create table if not exists public.ilceler (
  il text not null,
  ilce text not null,
  primary key (il, ilce)
);

insert into public.ilceler (il, ilce)
select distinct il, ilce
from public.mahalle_hazirlik
where il is not null and ilce is not null
on conflict do nothing;

alter table public.ilceler enable row level security;

-- HERKES OKUYABILIR: bu bir referans listesi, kisisel veri degil.
-- Yazma yolu yok - liste yalnizca migrasyonla degisir.
create policy "ilce listesi okunabilir"
  on public.ilceler for select
  to authenticated
  using (true);

revoke insert, update, delete on public.ilceler from authenticated;
grant select on public.ilceler to authenticated;

comment on table public.ilceler is
  'Il/ilce referans listesi. Kaynak: OSM idari sinir poligonlariyla yapilan nokta-icinde-poligon testi (mahalle_hazirlik). Turetilmis tahmin DEGIL.';


-- PROFIL SUTUNLARI
--
-- IKISI BIRDEN ya da HICBIRI: yalnizca ilce secilmis bir profil
-- anlamsiz olurdu ("Nilüfer" hangi ilde?). Kullanici da ikisini
-- birlikte istedi.
alter table public.profiller
  add column if not exists yasadigi_il text,
  add column if not exists yasadigi_ilce text;

-- DEGER LISTEDEN GELMEK ZORUNDA. Uydurma bir il/ilce profilde
-- gosterildigi anda yanlis bilgi olurdu; ayni gerekce mekan
-- duzenleme talebinde de vardi (orada `iller` tablosu dogruluyor).
--
-- MATCH SIMPLE (varsayilan): sutunlardan biri NULL ise kisit
-- SAGLANMIS sayiliyor, yani alan bos birakilabiliyor. Ikisinin
-- birlikte dolmasi asagidaki CHECK ile zorlaniyor.
alter table public.profiller
  drop constraint if exists profiller_yasadigi_bolge_fk;
alter table public.profiller
  add constraint profiller_yasadigi_bolge_fk
  foreign key (yasadigi_il, yasadigi_ilce)
  references public.ilceler (il, ilce)
  on update cascade
  on delete set null;

alter table public.profiller
  drop constraint if exists profiller_yasadigi_bolge_ikisi_birden;
alter table public.profiller
  add constraint profiller_yasadigi_bolge_ikisi_birden
  check ((yasadigi_il is null) = (yasadigi_ilce is null));

-- Sutun duzeyinde yazma yetkisi (Faz 2c deseni): serbest alanlar
-- dogrudan yazilabiliyor, kurala bagli olanlar (kullanici_adi) degil.
grant update (yasadigi_il, yasadigi_ilce) on public.profiller to authenticated;


-- BASKASININ PROFILI de bolgeyi donduruyor. Donus tipi degistigi icin
-- DROP + CREATE sart (42P13); drop yetkileri de siliyor.
drop function if exists public.baskasinin_profili(uuid);

create or replace function public.baskasinin_profili(p_kullanici_id uuid)
returns table (
  id uuid,
  kullanici_adi text,
  ad text,
  biyografi text,
  instagram text,
  yasadigi_il text,
  yasadigi_ilce text,
  fotograflar text[],
  profil_gizli boolean,
  arkadas_sayisi integer
)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid())
     or not moderasyon.hesap_aktif_mi(p_kullanici_id) then
    return;
  end if;

  if exists (
    select 1 from public.engellemeler e
    where (e.engelleyen_id = auth.uid() and e.engellenen_id = p_kullanici_id)
       or (e.engelleyen_id = p_kullanici_id and e.engellenen_id = auth.uid())
  ) then
    return;
  end if;

  return query
    select p.id, p.kullanici_adi, p.ad, p.biyografi, p.instagram,
           p.yasadigi_il, p.yasadigi_ilce,
           p.fotograflar, p.profil_gizli,
           (
             select count(*)::int
             from public.takipler t
             where t.takip_eden_id = p.id and t.durum = 'kabul'
           )
    from public.profiller p
    where p.id = p_kullanici_id;
end;
$function$;

revoke execute on function public.baskasinin_profili from public, anon;
grant execute on function public.baskasinin_profili to authenticated;
