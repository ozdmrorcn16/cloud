-- Spec karar 69. Hesap silme, "her konusmanin tam iki uyesi var"
-- invaryantini kiriyor: konusma_uyeleri.kullanici_id birincil anahtarin
-- parcasi oldugu icin null olamaz, satir cascade ile gidiyor ve konusma
-- TEK UYELI kaliyor. Uc okuyucu bu duruma gore duzeltiliyor.
--
-- docs/faz3b-takip-isleri.md madde 1a bu degisiklikle guncellendi.

-- 1) yazabilir_mi: karsi uye yoksa false. Govde
--    20260822091000_hesap_aktif_yazma_kapilari_bag.sql'deki SON
--    surumden birebir kopyalandi; tek fark bastaki null kontrolu.
create or replace function bag.yazabilir_mi(p_hedef uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $fn$
  select
    p_hedef is not null
    and moderasyon.hesap_aktif_mi(auth.uid())
    and moderasyon.hesap_aktif_mi(p_hedef)
    and not gizli.engelli_mi(p_hedef)
    and (
      (
        bag.takip_ediyor_mu(auth.uid(), p_hedef)
        and bag.takip_ediyor_mu(p_hedef, auth.uid())
      )
      or exists (
        select 1 from public.sohbet_istekleri s
        where s.durum = 'kabul'
          and (
            (s.gonderen_id = auth.uid() and s.alan_id = p_hedef)
            or (s.gonderen_id = p_hedef and s.alan_id = auth.uid())
          )
      )
    );
$fn$;

grant execute on function bag.yazabilir_mi(uuid) to authenticated;

-- 2) konusmalarim: karsi uye ve profil join'leri LEFT oldu. Eskiden
--    INNER idi, yani karsi taraf silinince konusma listeden TAMAMEN
--    kaybolurdu - kullanicinin kendi gecmisi gozunun onunde yok olurdu.
--    Govde 20260820134912_mesaj_okuma_rpcleri.sql'den kopyalandi;
--    degisen yalnizca iki join turu ve engelleme kosulunun null'a
--    dayanikli hale gelmesi.
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
    order by m.olusturuldu desc
    limit 1
  ) sm on true
  where k.tur = 'birebir'
    and benim.gizlendi_mi = false
    -- Karsi uye yoksa engelleme kontrolu anlamsiz; null durumunda
    -- konusma listede kalmali.
    and (d.kullanici_id is null or not gizli.engelli_mi(d.kullanici_id))
  order by sm.olusturuldu desc nulls last;
end;
$fn$;

revoke execute on function public.konusmalarim() from public, anon;
grant execute on function public.konusmalarim() to authenticated;

-- 3) mesajlari_getir: karsi uye yoksa engelleme kontrolu ATLANIYOR.
--    Kontrol edilecek kimse yok; eskiden v_diger_id null kaldiginda
--    davranis tanimsizdi. Govde 20260820134912'den kopyalandi; degisen
--    yalnizca yorum ve null kolunun acikca ele alinmasi.
create or replace function public.mesajlari_getir(
  p_konusma_id uuid,
  p_once timestamptz default null,
  p_limit int default 50
) returns table (
  id uuid,
  gonderen_id uuid,
  metin text,
  olusturuldu timestamptz
)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_diger_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not exists (
    select 1 from public.konusma_uyeleri u
    where u.konusma_id = p_konusma_id and u.kullanici_id = auth.uid()
  ) then
    raise exception 'Konusma bulunamadi';
  end if;

  -- Bu fonksiyon security definer, yani mesajlar RLS'ini atliyor;
  -- engelleme kurali burada AYRICA zorlanmali.
  --
  -- `limit 1` hala dogru satiri seciyor ama artik SIFIR satir da
  -- donebilir: karsi taraf hesabini sildiyse uyelik satiri cascade ile
  -- gitmistir (spec karar 69). O durumda engelleme kontrolu atlanir -
  -- kontrol edilecek kimse yok - ve gecmis okunabilir kalir. Yazma
  -- yolu bag.yazabilir_mi(null) ile zaten kapali.
  select u.kullanici_id into v_diger_id
  from public.konusma_uyeleri u
  where u.konusma_id = p_konusma_id and u.kullanici_id <> auth.uid()
  limit 1;

  if v_diger_id is not null and gizli.engelli_mi(v_diger_id) then
    raise exception 'Konusma bulunamadi';
  end if;

  return query
  select m.id, m.gonderen_id, m.metin, m.olusturuldu
  from public.mesajlar m
  where m.konusma_id = p_konusma_id
    and (p_once is null or m.olusturuldu < p_once)
  order by m.olusturuldu desc
  limit least(coalesce(p_limit, 50), 100);
end;
$fn$;

revoke execute on function public.mesajlari_getir(uuid, timestamptz, int) from public, anon;
grant execute on function public.mesajlari_getir(uuid, timestamptz, int) to authenticated;
