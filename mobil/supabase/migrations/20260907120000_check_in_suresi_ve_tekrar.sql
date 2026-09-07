-- ------------------------------------------------------------------ --
-- CHECK-IN SURESI VE TEKRAR KURALI (kullanicinin karari 2026-09-07)
--
-- Kullanicinin ifadesi:
--   "Check-in yapan biri yaptigi an 'su an burada' kisminda gorunuyor.
--    Konumun icine girildiginde son check-inlerde 'su an burada';
--    1 saati dolunca '1 saat once', kac saat gecmisse o sekilde devam
--    eden bir gosterme. Yapilan bir check-in 24 saatini doldurdugunda
--    son check-inlerden silinir. Ayni kisi ayni yerde 24 saati
--    dolmadan yine check-in yaparsa yaptigi saate gore check-in
--    guncellenir. Liderlik tablosu en cok o konumda check-in yapan
--    3 kisi, sabit kalir her zaman."
--
-- Bu, 2026-08-29'da konan 30 DAKIKA kuralinin YERINI ALIYOR. Ayrica
-- 2026-09-04'te "sure kullanici tarafindan secilecek" diye acik
-- birakilan karar da kapaniyor: sure SABIT ve 1 SAAT.
--
-- ------------------------------------------------------------------ --
-- BURADA COZULEN CELISKI - kayda geciyor, cunku sessizce secilemezdi.
--
-- "Check-in guncellenir" kurali kisi basina TEK SATIR birakir;
-- `mekan_liderlik` ise satir sayiyor (count(*)). Ikisi bir arada olsa
-- her gun gelen birinin sayaci 1'de takilirdi ve liderlik tablosu
-- anlamsizlasirdi.
--
-- Kullanicinin secimi: 24 SAATLIK PENCERE ILK KAYITTAN SAYILIR.
-- Yani ayni gun icindeki tekrarlar tek satiri gunceller, 24 saat
-- dolduktan sonraki check-in YENI satir acar. Boylece her gun gelen
-- biri gunde bir satir biriktirir ve liderlik "kac kez geldi"
-- sorusunu dogru cevaplar. Yeni bir sayac sutunu gerekmedi.
-- ------------------------------------------------------------------ --

-- ------------------------------------------------------------------ --
-- 1) ilk_check_in: 24 saatlik pencerenin CAPASI
--
-- Neden ayri bir sutun: pencere ILK kayittan sayiliyor, ama ekranda
-- gorunen zaman EN SON check-in. `olusturma_zamani` guncellendigi
-- icin capayi o tasiyamaz - guncelleme onu ileri ittikce pencere de
-- kayar ve her gun gelen biri hic yeni satir acmazdi (tam da
-- yukaridaki celiski).
--
-- Mevcut satirlar icin capa olusturma zamani: geriye donuk dogru
-- deger o, cunku hicbiri henuz guncellenmedi.
-- ------------------------------------------------------------------ --
alter table public.check_inler
  add column if not exists ilk_check_in timestamptz;

update public.check_inler
set ilk_check_in = olusturma_zamani
where ilk_check_in is null;

alter table public.check_inler
  alter column ilk_check_in set default now(),
  alter column ilk_check_in set not null;

-- Tekrar kontrolu (kullanici + mekan + capa) her check-in'de
-- kosuyor; indeks olmadan tablo buyudukce yavaslar.
create index if not exists check_inler_kullanici_mekan_ilk_idx
  on public.check_inler (kullanici_id, mekan_id, ilk_check_in desc);

-- ------------------------------------------------------------------ --
-- 2) check_in_yap: 1 SAAT + 24 saat icinde GUNCELLE
-- ------------------------------------------------------------------ --
create or replace function public.check_in_yap(
  p_mekan_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_not_metni text default null,
  p_fotograf text default null,
  p_bulunurluk text default 'herkese_acik'
)
returns check_inler
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_mekan_konum geography;
  v_kullanici_adi text;
  v_not text;
  v_hedef_id uuid;
  v_yeni public.check_inler;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  if p_bulunurluk is null or p_bulunurluk not in ('herkese_acik', 'takipcilerim', 'gizli') then
    raise exception 'Gecersiz bulunurluk degeri';
  end if;

  v_not := nullif(btrim(coalesce(p_not_metni, '')), '');
  if length(coalesce(v_not, '')) > 500 then
    raise exception 'Not en fazla 500 karakter olabilir';
  end if;

  select konum into v_mekan_konum from public.mekanlar where id = p_mekan_id;
  if v_mekan_konum is null then
    raise exception 'Mekan bulunamadi';
  end if;

  if not ST_DWithin(v_mekan_konum, ST_MakePoint(p_lng, p_lat)::geography, 1000) then
    raise exception 'Mekana cok uzaksin (~1 km icinde olmalisin)';
  end if;

  select ad into v_kullanici_adi from public.profiller where id = auth.uid();

  -- AYNI MEKANDA 24 SAAT ICINDE bir kaydim var mi? Varsa yenisini
  -- acmak yerine onu guncelleyecegiz.
  --
  -- `moderasyon_gizli` olan satir DISLANIYOR: moderasyon karariyla
  -- gizlenmis bir kaydi guncelleyip yeniden gorunur kilmak, kararin
  -- etrafindan dolanmak olurdu. O durumda yeni satir aciliyor.
  select id into v_hedef_id
  from public.check_inler
  where kullanici_id = auth.uid()
    and mekan_id = p_mekan_id
    and ilk_check_in > now() - interval '24 hours'
    and not coalesce(moderasyon_gizli, false)
  order by ilk_check_in desc
  limit 1;

  -- BASKA mekanlardaki canli check-in'i kapat (tek aktif check-in
  -- kurali). Guncelleyecegimiz satir bu temizlikten MUAF: yoksa
  -- konumu once silinir, sonra yeniden yazilirdi - ayni sonuc ama
  -- gereksiz iki yazma ve gorunurluk kademesi bir tur bozulurdu.
  update public.check_inler
  set konum = null,
      gorunurluk = bag.ani_gorunurlugu(bulunurluk, gorunurluk)
  where kullanici_id = auth.uid()
    and konum is not null
    and bitis_zamani > now()
    and id is distinct from v_hedef_id;

  if v_hedef_id is not null then
    -- GUNCELLEME. `ilk_check_in` DOKUNULMUYOR - 24 saatlik pencerenin
    -- capasi o; guncellenirse pencere her ziyarette ileri kayar ve
    -- yeni satir hic acilmaz.
    --
    -- Not ve fotograf yalnizca YENISI VERILDIYSE degisiyor: kullanici
    -- ikinci check-in'inde bir sey yazmadiysa ilk yazdigini silmek
    -- veri kaybi olurdu.
    --
    -- `gorunurluk` CANLI VARSAYILANINA donuyor. Guncellenen satir bir
    -- ANI olmus olabilir; ani olurken `bag.ani_gorunurlugu` onu bir
    -- ani kademesine cevirmisti. Yeniden canli olduguna gore yeni bir
    -- check-in'le ayni degeri tasimasi gerekiyor - sutunun varsayilani
    -- da bu ('herkese_acik'), yani insert dali ile ayni sonuc.
    update public.check_inler
    set olusturma_zamani = now(),
        bitis_zamani = now() + interval '1 hour',
        konum = ST_MakePoint(p_lng, p_lat)::geography,
        kullanici_adi = v_kullanici_adi,
        bulunurluk = p_bulunurluk,
        gorunurluk = 'herkese_acik',
        not_metni = coalesce(v_not, not_metni),
        fotograf = coalesce(p_fotograf, fotograf)
    where id = v_hedef_id
    returning * into v_yeni;
  else
    insert into public.check_inler (
      kullanici_id, mekan_id, not_metni, fotograf, bitis_zamani, konum,
      kullanici_adi, bulunurluk
    )
    values (
      auth.uid(), p_mekan_id, v_not, p_fotograf, now() + interval '1 hour',
      ST_MakePoint(p_lng, p_lat)::geography, v_kullanici_adi, p_bulunurluk
    )
    returning * into v_yeni;
  end if;

  return v_yeni;
end;
$function$;

-- ------------------------------------------------------------------ --
-- 3) mekan_son_check_inler: 24 SAAT penceresi + KISI BASINA TEK SATIR
--
-- Iki suzgec birlikte gerekiyor. 24 saat penceresi kullanicinin
-- kuralindan ("24 saatini doldurdugunda son check-inlerden silinir").
-- Kisi basina teklestirme ise sunun icin: guncelleme penceresi ILK
-- kayittan sayildigi icin ayni kisinin iki satiri kisa bir sure
-- CAKISABILIR (dunku satir henuz 24 saatini doldurmamisken bugunku
-- yeni satir acilmis olabilir). Teklestirme olmadan o kisi listede
-- iki kez gorunurdu - guncelleme kuralinin amaci tam bunu onlemek.
--
-- SILME YOK: kayit yalnizca bu LISTEDEN dusuyor. Check-in kisinin
-- anisi; satiri silmek onun gecmisini, begenilerini ve yorumlarini
-- goturur. "Silinir" ifadesi listeye ait.
-- ------------------------------------------------------------------ --
create or replace function public.mekan_son_check_inler(
  p_mekan_id uuid,
  p_limit integer default 20
)
returns table (
  id uuid,
  kullanici_id uuid,
  kullanici_adi text,
  olusturma_zamani timestamptz,
  not_metni text,
  canli_mi boolean
)
language sql
stable
set search_path to ''
as $function$
  select s.id, s.kullanici_id, s.kullanici_adi, s.olusturma_zamani,
         s.not_metni, s.canli_mi
  from (
    select distinct on (c.kullanici_id)
           c.id, c.kullanici_id, c.kullanici_adi, c.olusturma_zamani,
           c.not_metni, (c.konum is not null) as canli_mi
    from public.check_inler c
    where c.mekan_id = p_mekan_id
      and c.olusturma_zamani > now() - interval '24 hours'
    order by c.kullanici_id, c.olusturma_zamani desc
  ) s
  order by s.olusturma_zamani desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$function$;

-- ------------------------------------------------------------------ --
-- 4) mekan_liderlik: HER ZAMAN 3 KISI
--
-- Kullanicinin ifadesi "en cok o konumda check-in yapan 3 kisi SABIT
-- kalir her zaman". Bu yuzden yalnizca varsayilan degil UST SINIR da
-- 3: cagiran taraf daha genis bir liste isteyemiyor. Sayi tek yerde
-- durdugu icin ileride degistirilecekse burasi.
--
-- 24 SAAT SUZGECI YOK, bilerek: liderlik "kim en cok geldi" sorusunu
-- cevapliyor ve o gecmise bakan bir olcu. Son check-inler listesi
-- guncel olani, liderlik ise birikimi gosteriyor.
-- ------------------------------------------------------------------ --
create or replace function public.mekan_liderlik(
  p_mekan_id uuid,
  p_limit integer default 3
)
returns table (
  kullanici_id uuid,
  kullanici_adi text,
  check_in_sayisi integer
)
language sql
stable
set search_path to ''
as $function$
  select c.kullanici_id,
         (array_agg(c.kullanici_adi order by c.olusturma_zamani desc))[1],
         count(*)::int
  from public.check_inler c
  where c.mekan_id = p_mekan_id
  group by c.kullanici_id
  order by count(*) desc, min(c.ilk_check_in) asc
  limit least(greatest(coalesce(p_limit, 3), 1), 3);
$function$;

-- Drop/create degil replace kullanildi, yani yetkiler duruyor. Yine de
-- acikca veriliyor: imza degismedigi halde bir gun drop gerekirse bu
-- satirlarin varligi hatirlatici olur.
grant execute on function public.mekan_son_check_inler(uuid, integer) to authenticated;
grant execute on function public.mekan_liderlik(uuid, integer) to authenticated;
grant execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text) to authenticated;
