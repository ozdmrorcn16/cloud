-- OTURDUGU BOLGE: ULKE + GIZLILIK (2026-09-18). Kullanicinin istekleri
-- (ayni gun, sirayla): "hesap olusturma adimina oturdugun bolge diye bir
-- adim ekle; il, ilce, ulke secimi olsun" -> "zorunlu secilecek ama
-- profilinde ayarlarda isterse gizleyebilecek" -> "profilde ilk etapta
-- gizli olacak; profilde goster yaparsa sectigi il/ilce gorunecek;
-- sadece ulke hep gizli kalacak".
--
-- `yasadigi_ulke` ISO 3166-1 alpha-2 (TR, DE, ...). Il/ilce listesi
-- yalnizca Turkiye icin var (`public.ilceler`, OSM poligonlarindan);
-- baska bir ulke secilince il/ilce BOS kalir - serbest metin
-- alinmiyor (2026-09-11 kurali: gosterilen deger listeden gelmek
-- zorunda).
--
-- `bolge_gizli` VARSAYILAN TRUE: yeni hesap bolgeyi baskasina
-- gostermez; kisi ayarlardan "profilde goster" derse il/ilce acilir.
-- ULKE HICBIR ZAMAN baskasina dondurulmez - `baskasinin_profili`
-- sutunu hic tasimiyor. Kural SUNUCUDA; istemci gizlemeyi atlayamaz.

alter table public.profiller
  add column if not exists yasadigi_ulke text;

alter table public.profiller
  drop constraint if exists profiller_yasadigi_ulke_bicim;
alter table public.profiller
  add constraint profiller_yasadigi_ulke_bicim
  check (yasadigi_ulke is null or yasadigi_ulke ~ '^[A-Z]{2}$');

-- Il dolu ise ulke ya bos (eski kayitlar - TR sayilir) ya da 'TR'.
alter table public.profiller
  drop constraint if exists profiller_il_yalnizca_turkiye;
alter table public.profiller
  add constraint profiller_il_yalnizca_turkiye
  check (yasadigi_il is null or yasadigi_ulke is null or yasadigi_ulke = 'TR');

alter table public.profiller
  add column if not exists bolge_gizli boolean not null default true;

grant update (yasadigi_ulke, bolge_gizli) on public.profiller to authenticated;

-- BASKASININ PROFILI: il/ilce yalnizca bolge_gizli = false ise; ulke
-- hic yok. Donus tipi degismedi (ulke eklenmedi), CREATE OR REPLACE yeter.
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
           case when p.bolge_gizli then null else p.yasadigi_il end,
           case when p.bolge_gizli then null else p.yasadigi_ilce end,
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
