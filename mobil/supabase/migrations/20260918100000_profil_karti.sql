-- PROFIL PAYLASIM KARTI (kullanicinin istegi 2026-09-18: "profilimi
-- paylastigim zaman daha profesyonel gorunsun").
--
-- Paylasilan baglanti artik `https://slooin.com/<kullanici_adi>`. O
-- sayfayi Cloudflare Pages Function sunucuda ciziyor ve Open Graph
-- etiketleri icin buradaki RPC'ye (Edge Function `profil-karti`
-- uzerinden) soruyor. Cagiran KIMLIKSIZ (WhatsApp'in onizleme robotu
-- gibi), bu yuzden `anon`a acik ve dondurdugu sey UYGULAMADA ZATEN
-- HERKESE ACIK OLANLA sinirli: ad, kullanici adi, ilk profil fotografi.
-- Biyografi, bolge, anilar, sayaclar YOK.
--
-- GIZLILIK KURALLARI (KVKK listesi "Profil paylasim karti"):
--   - Hesap aktif degilse (askida/yasakli/silinmis): satir yok -> 404.
--   - `profil_gizli` VEYA `aramada_gorunsun = false` ise kart yalnizca
--     kullanici adini tasir (`gizli = true`); ad ve fotograf NULL.
--     Kisi paylasimi kendi baslatsa bile bu iki ayar "beni gormesinler"
--     demek; kimliksiz bir robotun adini ve yuzunu almasi o ayarla
--     celisirdi. Kullanici adi zaten baglantinin kendisinde.
--   - Kimliksiz cagri oldugu icin engelleme suzgeci uygulanamiyor;
--     engellenen kisi baglantiyi tarayicidan acarsa yalnizca bu kadarini
--     gorur (uygulamada zaten "bulunamadi" alir).
--
-- SAYIM SIZINTISI: kullanici adi denenerek "boyle biri var mi" ogrenilebilir.
-- Bu uygulamadaki kisi aramanin zaten verdigi bilgi; ayrica ustteki iki
-- ayar kapaliysa isim ve fotograf gelmiyor.

create or replace function public.profil_karti(p_kullanici_adi text)
returns table (
  id uuid,
  kullanici_adi text,
  ad text,
  fotograf text,
  gizli boolean
)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_ad text;
begin
  v_ad := lower(trim(p_kullanici_adi));
  if v_ad is null or v_ad !~ '^[a-z0-9._]{3,20}$' then
    return;
  end if;

  return query
    select p.id,
           p.kullanici_adi,
           case when p.profil_gizli or not p.aramada_gorunsun then null else p.ad end,
           case when p.profil_gizli or not p.aramada_gorunsun then null
                else p.fotograflar[1] end,
           (p.profil_gizli or not p.aramada_gorunsun)
    from public.profiller p
    where p.kullanici_adi = v_ad
      and moderasyon.hesap_aktif_mi(p.id);
end;
$fn$;

revoke execute on function public.profil_karti(text) from public;
grant execute on function public.profil_karti(text) to anon, authenticated;

-- YASAKLI KULLANICI ADLARI: `slooin.com/<ad>` artik profil sayfasi.
-- Sitenin kendi yollariyla (gizlilik, kosullar, destek, posta, _astro)
-- ve ileride acilabilecek acik adlarla cakismasin. Cloudflare Pages
-- statik dosyayi fonksiyondan ONCE eslestirir; "gizlilik" adli bir
-- profil hic acilamazdi. Dil kodlari iki harf, kural en az uc istiyor -
-- ayrica yazilmadi. Mevcut 7 profilin hicbiri listede degil (olculdu).
alter table public.profiller
  drop constraint if exists profiller_kullanici_adi_yasakli;
alter table public.profiller
  add constraint profiller_kullanici_adi_yasakli
  check (kullanici_adi !~ '^(gizlilik|kosullar|destek|posta|_astro|slooin|admin|moderasyon|api|www|giris|kayit|mekan|mekanlar|kullanici|profil|ayarlar|hakkinda|iletisim|indir|uygulama|app|404|robots|sitemap|hesap_sil|kesfet|mesajlar|bildirimler)$');
