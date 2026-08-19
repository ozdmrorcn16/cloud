-- GECERSIZ: bu migrasyon hatali bir kacis yazimi iceriyor
-- (E'\' / E'\\' — E onekli dize, niyet edilen davranisi uretmiyor).
-- Hemen ardindaki 20260819130917_kisi_ara_override.sql bu fonksiyonu
-- dogru kacis yazimiyla yeniden tanimlar ve bunu gecersiz kilar.
-- Dosya silinmedi cunku uzak veritabaninda uygulanmis olarak kayitli;
-- silmek yerel ve uzak migrasyon gecmisini birbirinden ayirirdi.
-- Buradaki kacis yazimini ornek almayin.

create or replace function public.kisi_ara(p_metin text)
returns table (id uuid, kullanici_adi text, ad text, fotograf text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_metin text;
  v_desen text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  v_metin := lower(trim(coalesce(p_metin, '')));

  -- Tek harfle butun kullanici tablosunu dokmeyi engeller.
  if length(v_metin) < 2 then
    return;
  end if;

  -- like/ilike joker karakterlerini kacir. Alt cizgi kullanici adinda
  -- gecerli bir karakter oldugu icin bu sart: kacirilmazsa "a_b"
  -- aramasi "axb" ile de eslesir.
  v_desen := replace(replace(replace(v_metin, E'\', E'\\'), '%', '\%'), '_', '\_');

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
        p.kullanici_adi like v_desen || '%' escape '\'
        or p.ad ilike '%' || v_desen || '%' escape '\'
      )
      -- Engelleme iki yonde de gizler ve "bulunamadi" gibi davranir;
      -- baskasinin_profili'ndeki mantigin aynisi (Faz 2b).
      and not exists (
        select 1 from public.engellemeler e
        where (e.engelleyen_id = auth.uid() and e.engellenen_id = p.id)
           or (e.engelleyen_id = p.id and e.engellenen_id = auth.uid())
      )
    order by (p.kullanici_adi = v_metin) desc,
             (p.kullanici_adi like v_desen || '%' escape '\') desc,
             p.kullanici_adi
    limit 20;
end;
$$;

revoke execute on function public.kisi_ara from public, anon;
grant execute on function public.kisi_ara to authenticated;
