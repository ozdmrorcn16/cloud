-- BASKASININ PROFILINDE ANI SAYISI (kullanicinin bildirimi 2026-09-20:
-- "anilari olmasina ragmen guncel ani rakamlari gorunmuyor").
--
-- Ekran sayaci `anilar.length`ten turetiyordu; gizli profilde anilar
-- RLS ile gelmedigi icin sayac 0 kaliyordu (canlida 5 check-in'i olan
-- profil 0 gosterdi). Sayi artik sunucudan, arkadas sayisiyla ayni
-- desende: `baskasinin_profili` yeni `ani_sayisi` sutunu donduruyor.
--
-- Sayilan: moderasyonla gizlenmemis ve kullanicinin "gizli"
-- ('kimse') yapmadigi check-in'ler: baskasinin hicbir zaman goremeyecegi
-- anilar sayilmaz.
-- Anilarin ICERIGI hala RLS'te (arkadas olmayan gizli profilde
-- gelmez); yalnizca ADET aciliyor. Adet konum degil; Instagram'in
-- gizli hesapta gonderi sayisini gostermesiyle ayni cizgi.
--
-- Donus tipi degistigi icin drop + create. YETKI ACIKCA KAPATILIYOR:
-- 20260919100000'in varsayilan yetkisi yalnizca `postgres` rolunun
-- yarattigi fonksiyonlara isliyor; MCP ile uygulanan migrasyon baska
-- rolle kostugu icin anon + PUBLIC EXECUTE almisti (olculdu, ayni gun
-- geri alindi). Her yeni fonksiyonda bu revoke yazilmali.

drop function if exists public.baskasinin_profili(uuid);

create function public.baskasinin_profili(p_kullanici_id uuid)
returns table (
  id uuid,
  kullanici_adi text,
  ad text,
  biyografi text,
  instagram text,
  fotograflar text[],
  profil_gizli boolean,
  arkadas_sayisi integer,
  ani_sayisi integer
)
language plpgsql
security definer
set search_path = public
as $$
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
           ),
           (
             select count(*)::int
             from public.check_inler c
             where c.kullanici_id = p.id
               and not c.moderasyon_gizli
               and c.gorunurluk <> 'kimse'
           )
    from public.profiller p
    where p.id = p_kullanici_id;
end;
$$;

revoke execute on function public.baskasinin_profili(uuid) from public, anon;
