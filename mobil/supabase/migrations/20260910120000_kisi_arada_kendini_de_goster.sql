-- ARAMADA KISI KENDINI DE GORUR
--
-- Kullanicinin bildirdigi kusur (2026-09-10): "aramaya kendi kullanici
-- adimi yazdigimda kendi profilim cikmiyor, cikmasi gerek."
--
-- `p.id <> auth.uid()` kosulu KALDIRILDI. O kosul "kendine arkadaslik
-- istegi gonderemezsin" mantigindan geliyordu, ama arama bir EYLEM
-- listesi degil bir BULMA yuzeyi; kisinin kendi adini yazip kendini
-- bulamamasi beklenmedik. Kendi profiline dokununca ekran zaten
-- `/profil`e yonlendiriyor (ayni gun eklendi).
--
-- `aramada_gorunsun` KENDIM ICIN UYGULANMIYOR: o ayar BASKALARINA
-- gorunmekle ilgili. Uygulansaydi ayari kapatan kisi kendi profilini de
-- bulamaz ve sebebini goremezdi. Canli olculdu: ayar kapaliyken kendim
-- cikiyorum, BASKASI beni gormuyor.
--
-- Askiya alma kontrolu degismedi: cagiran askidaysa fonksiyon zaten
-- yukarida bos donuyor.

create or replace function public.kisi_ara(p_metin text)
returns table(id uuid, kullanici_adi text, ad text, fotograf text)
language plpgsql
security definer
set search_path to 'public'
as $function$
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
  v_desen_kad := replace(replace(replace(v_metin, '\', '\'), '%', '\%'), '_', '\_');
  v_desen_isim := replace(replace(replace(v_ham, '\', '\'), '%', '\%'), '_', '\_');

  return query
    select p.id,
           p.kullanici_adi,
           p.ad,
           case
             when array_length(p.fotograflar, 1) > 0 then p.fotograflar[1]
             else null
           end
    from public.profiller p
    -- KENDIM HER ZAMAN GORUNURUM; baskasi icin tercih gecerli.
    where (p.id = auth.uid() or p.aramada_gorunsun)
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
    -- KENDIM USTTE: kendi adini yazan kisi kendini ariyordur.
    order by (p.id = auth.uid()) desc,
             (p.kullanici_adi = v_metin) desc,
             (p.kullanici_adi like v_desen_kad || '%' escape '\') desc,
             p.kullanici_adi
    limit 20;
end;
$function$;
