-- kisi_ara ve baskasinin_profili security definer, yani profiller'in
-- RLS'ini atliyorlar; aktiflik kontrolu govdelerinde AYRICA zorlanmali.
--
-- kisi_ara govdesi 20260819153532_kisi_ara_isim_eslesmesi.sql'den,
-- baskasinin_profili govdesi
-- 20260819131609_baskasinin_profili_kullanici_adi.sql'den birebir
-- kopyalandi (yorumlar dahil); yalnizca eklenen satirlar farkli.

create or replace function public.kisi_ara(p_metin text)
returns table (id uuid, kullanici_adi text, ad text, fotograf text)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_ham text;
  v_metin text;
  v_desen_kad text;
  v_desen_isim text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Askidaki cagiran hic sonuc almaz. `return` (raise degil): arama bos
  -- sonuc donmeyi zaten normal bir durum olarak isliyor, hata firlatmak
  -- ekranin akisini bozardi.
  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    return;
  end if;

  v_ham := trim(coalesce(p_metin, ''));
  v_metin := lower(v_ham);

  -- Tek harfle butun kullanici tablosunu dokmeyi engeller.
  if length(v_metin) < 2 then
    return;
  end if;

  -- like/ilike joker karakterlerini kacir. Alt cizgi kullanici adinda
  -- gecerli bir karakter oldugu icin bu sart: kacirilmazsa "a_b"
  -- aramasi "axb" ile de eslesir. Kullanici adi icin kucuk harfli
  -- metin, isim icin ham (yalnizca kirpilmis) metin kaciriliyor.
  v_desen_kad := replace(replace(replace(v_metin, '\', '\\'), '%', '\%'), '_', '\_');
  v_desen_isim := replace(replace(replace(v_ham, '\', '\\'), '%', '\%'), '_', '\_');

  return query
    select p.id,
           p.kullanici_adi,
           p.ad,
           case
             when array_length(p.fotograflar, 1) > 0 then p.fotograflar[1]
             else null
           end
    from public.profiller p
    where p.id <> auth.uid()
      and p.aramada_gorunsun
      -- Askidaki hedefler listeden dusuyor.
      and moderasyon.hesap_aktif_mi(p.id)
      and (
        p.kullanici_adi like v_desen_kad || '%' escape '\'
        or p.ad ilike '%' || v_desen_isim || '%' escape '\'
      )
      -- Engelleme iki yonde de gizler ve "bulunamadi" gibi davranir;
      -- baskasinin_profili'ndeki mantigin aynisi (Faz 2b).
      and not exists (
        select 1 from public.engellemeler e
        where (e.engelleyen_id = auth.uid() and e.engellenen_id = p.id)
           or (e.engelleyen_id = p.id and e.engellenen_id = auth.uid())
      )
    order by (p.kullanici_adi = v_metin) desc,
             (p.kullanici_adi like v_desen_kad || '%' escape '\') desc,
             p.kullanici_adi
    limit 20;
end;
$fn$;

revoke execute on function public.kisi_ara from public, anon;
grant execute on function public.kisi_ara to authenticated;

create or replace function public.baskasinin_profili(p_kullanici_id uuid)
returns table (id uuid, kullanici_adi text, ad text, biyografi text, fotograflar text[])
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- Askidaki hedef "bulunamadi" gibi davranir; engellemeyle ayni
  -- sessizlik. Askidaki cagiran da baskasinin profilini acamaz.
  if not moderasyon.hesap_aktif_mi(auth.uid())
     or not moderasyon.hesap_aktif_mi(p_kullanici_id) then
    return;
  end if;

  -- Engelleme her iki yonde de profili gizler; "bulunamadi" gibi davranir.
  if exists (
    select 1 from public.engellemeler e
    where (e.engelleyen_id = auth.uid() and e.engellenen_id = p_kullanici_id)
       or (e.engelleyen_id = p_kullanici_id and e.engellenen_id = auth.uid())
  ) then
    return;
  end if;

  -- Dogum tarihi hicbir kosulda donmuyor (Faz 2b karar #27).
  return query
    select p.id, p.kullanici_adi, p.ad, p.biyografi, p.fotograflar
    from public.profiller p
    where p.id = p_kullanici_id;
end;
$fn$;

revoke execute on function public.baskasinin_profili from public, anon;
grant execute on function public.baskasinin_profili to authenticated;
