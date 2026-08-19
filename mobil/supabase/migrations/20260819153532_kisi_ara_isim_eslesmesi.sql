-- kisi_ara arama metnini lower() ile kucultup hem kullanici_adi hem ad
-- sutununda ayni kucuk harfli metni kullaniyordu. lower() bazi
-- ortamlarda (ozellikle Turkce harflerde) birlestirici noktali bir
-- karakter uretebiliyor ve bu da ilike eslesmesini bozabiliyor. ilike
-- zaten buyuk/kucuk harf duyarsiz oldugu icin ad sutununda lower()'a
-- hic gerek yok; kullanici_adi sutunu ise zaten hep kucuk harf
-- saklaniyor, oradaki like icin kucuk harfli metni kullanmaya devam
-- ediyoruz.

create or replace function public.kisi_ara(p_metin text)
returns table (id uuid, kullanici_adi text, ad text, fotograf text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ham text;
  v_metin text;
  v_desen_kad text;
  v_desen_isim text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
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
$$;

revoke execute on function public.kisi_ara from public, anon;
grant execute on function public.kisi_ara to authenticated;
