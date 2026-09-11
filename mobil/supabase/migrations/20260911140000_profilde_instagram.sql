-- PROFILDE INSTAGRAM KULLANICI ADI
--
-- Kullanicinin istegi (2026-09-11): "profiline kullanicilar
-- instagramini baglayabilir mi ya da instagram adresini
-- ekleyebilsinler."
--
-- ------------------------------------------------------------------ --
-- "BAGLAMA" (OAUTH) MUMKUN DEGIL - arastirildi, tekrar denenmesin
--
-- Meta, Instagram Basic Display API'yi 4 Aralik 2024'te KAPATTI ve
-- kisisel hesap destegini tamamen kaldirdi. Yerine gelen "Instagram
-- API with Instagram Login" ve Graph API yalnizca ISLETME/ICERIK
-- URETICI hesaplariyla calisiyor; siradan bir kullanici hesabini
-- donusturmeden baglayamaz.
--
-- Dolayisiyla elimizdeki sey DOGRULANMIS BIR BAG degil, kisinin
-- BEYANI. Kullaniciya acikca soylendi ve bu haliyle onaylandi:
-- doğrulama olmadigi icin kisi teorik olarak baskasinin adini da
-- yazabilir; karsiligi mevcut sikayet akisi.
--
-- Instagram'in kendi "baglantilar" alani da tam olarak boyle calisiyor.
-- ------------------------------------------------------------------ --
--
-- BICIM KISITI: Instagram kullanici adi en fazla 30 karakter ve
-- yalnizca harf, rakam, nokta ve alt cizgi iceriyor. Kisit burada
-- ESAS OLARAK COPU ENGELLIYOR - tam URL, bosluklu metin ya da olta
-- baglantisi yazilamasin. Noktanin basta/sonda olamamasi gibi ince
-- kurallar ISTEMCIDE, cunku orada kullaniciya sebebini soyleyen bir
-- mesaj gosterilebiliyor.
alter table public.profiller
  add column if not exists instagram text
    check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$');

comment on column public.profiller.instagram is
  'Kisinin BEYAN ETTIGI Instagram kullanici adi. DOGRULANMIS DEGIL: Meta 2024-12-04''te kisisel hesaplar icin OAuth yolunu kapatti.';

-- SUTUN DUZEYINDE YETKI. `profiller` uzerinde update yetkisi sutun
-- sutun veriliyor (Faz 2c'den beri): `kullanici_adi` gibi kurala bagli
-- alanlar disarida kaliyor. Instagram serbest bir alan, dogrudan
-- yazilabilir.
grant update (instagram) on public.profiller to authenticated;

-- BASKASININ PROFILI de alani donduruyor. Donus tipi degistigi icin
-- DROP + CREATE sart (`create or replace` yeni sutunu kabul etmiyor,
-- 42P13). Drop yetkileri de siliyor; grant hemen altinda.
drop function if exists public.baskasinin_profili(uuid);

create or replace function public.baskasinin_profili(p_kullanici_id uuid)
returns table (
  id uuid,
  kullanici_adi text,
  ad text,
  biyografi text,
  instagram text,
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
