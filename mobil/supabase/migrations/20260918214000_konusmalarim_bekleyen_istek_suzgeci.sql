-- konusmalarim: BEKLEYEN MESAJ ISTEGI LISTEDE GORUNMEZ - SUZGEC GERI KONDU
-- (2026-09-18 aksam, canli test:gorunurluk senaryo 36 yakaladi).
--
-- 2026-09-01'de (mesaj istekleri, MCP ile canliya) konusmalarim'a
-- "alicisi ben olan BEKLEYEN istek listeye girmez" kosulu konmustu;
-- dosyada yalnizca not vardi, govde yoktu. 2026-09-14'te konusmayi_sil
-- (20260914120000) fonksiyonu 20260822100000 dosyasindaki ESKI govdeden
-- kopyalayinca o kosul DUSTU: yabancinin ilk mesaji Istekler'e dusuyor
-- ama Mesajlar listesinde de gorunuyordu. Dort gun canlida kaldi.
--
-- DERS: bir fonksiyonu "ayni dosyadan kopyala" derken CANLI tanimi
-- (pg_get_functiondef) ile karsilastir; dosyada olmayan ama canlida
-- olan bir degisiklik boyle kaybolur. Bu dosya artik TAM govdeyi tasiyor.
--
-- Kosul yalnizca ALICI icin: gonderen kendi yazdigi mesaji listesinde
-- gorur ("Istek gonderildi" durumu ekranda). Alicida konusma, istek
-- kabul edilene (cevap yazilana) kadar Istekler kutusunda kalir.

create or replace function public.konusmalarim()
returns table (
  konusma_id uuid,
  kisi_id uuid,
  kullanici_adi text,
  ad text,
  son_mesaj text,
  son_mesaj_zamani timestamptz,
  okunmamis int,
  yazilabilir_mi boolean
)
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  return query
  select
    k.id,
    d.kullanici_id,
    p.kullanici_adi,
    p.ad,
    sm.metin,
    sm.olusturuldu,
    (
      select count(*)::int from public.mesajlar m
      where m.konusma_id = k.id
        and (m.gonderen_id is null or m.gonderen_id <> auth.uid())
        and (benim.son_okuma is null or m.olusturuldu > benim.son_okuma)
        and (benim.silme_zamani is null or m.olusturuldu > benim.silme_zamani)
    ),
    bag.yazabilir_mi(d.kullanici_id)
  from public.konusmalar k
  join public.konusma_uyeleri benim
    on benim.konusma_id = k.id and benim.kullanici_id = auth.uid()
  left join public.konusma_uyeleri d
    on d.konusma_id = k.id and d.kullanici_id <> auth.uid()
  left join public.profiller p on p.id = d.kullanici_id
  left join lateral (
    select m.metin, m.olusturuldu
    from public.mesajlar m
    where m.konusma_id = k.id
      and (benim.silme_zamani is null or m.olusturuldu > benim.silme_zamani)
    order by m.olusturuldu desc
    limit 1
  ) sm on true
  where k.tur = 'birebir'
    and benim.gizlendi_mi = false
    and (d.kullanici_id is null or not gizli.engelli_mi(d.kullanici_id))
    -- Bana gelmis BEKLEYEN istek: Mesajlar'da degil Istekler'de.
    and not exists (
      select 1 from public.sohbet_istekleri s
      where s.gonderen_id = d.kullanici_id
        and s.alan_id = auth.uid()
        and s.durum = 'beklemede'
    )
  order by sm.olusturuldu desc nulls last;
end;
$fn$;
