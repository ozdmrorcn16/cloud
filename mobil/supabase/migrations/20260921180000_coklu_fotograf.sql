-- COKLU FOTOGRAF (kullanicinin karari 2026-09-21, referans:
-- tasarim/checkin-duzenle-referans.png). Spec:
-- docs/superpowers/specs/2026-09-21-coklu-fotograf-ve-duzenleme-sayfasi-design.md
--
-- 1) check_inler.fotograflar text[] (en fazla 5). Eski `fotograf` sutunu
--    GENERATED (fotograflar[1]) olarak kalir: moderasyon RPC'leri, panel
--    JSON'u, canli senaryolar ve OTA'yi henuz almamis istemci onu okumaya
--    devam eder; iki sutun birbirinden kayamaz.
-- 2) Kova okuma politikasi `name = any(fotograflar)` + kendi klasoru;
--    GIN indeks (politika her fotograf erisiminde calisiyor).
-- 3) check_in_yap: p_fotograflar eklendi, p_fotograf uyumluluk icin
--    duruyor; ESKI 7 PARAMETRELI IMZA DUSURULDU (asiri yukleme tuzagi).
-- 4) check_in_fotograflarini_guncelle: diziyi yazar, KALDIRILAN eski
--    yollari dondurur (istemci kovadan siler). Bugunku tekil
--    check_in_fotografini_guncelle ince sarmalayici (OTA 9ec78c2e).
-- 5) mekan_fotograflari fotograf basina bir satir; verilerimi_disa_aktar
--    `fotograflar`.

-- 1) sutun + backfill + sinir
alter table public.check_inler
  add column if not exists fotograflar text[] not null default '{}';

update public.check_inler
set fotograflar = array[fotograf]
where fotograf is not null and cardinality(fotograflar) = 0;

alter table public.check_inler
  drop constraint if exists check_inler_fotograflar_en_fazla_5;
alter table public.check_inler
  add constraint check_inler_fotograflar_en_fazla_5
  check (cardinality(fotograflar) <= 5);

-- 2) fotograf -> generated; politikalar ve indeksler
drop policy if exists "check-in fotografini gorunurluk kuraliyla okuyabilir" on storage.objects;
drop index if exists public.check_inler_fotograf_idx;
drop index if exists public.check_inler_mekan_fotograf_idx;

alter table public.check_inler drop column fotograf;
alter table public.check_inler
  add column fotograf text generated always as (fotograflar[1]) stored;

create index if not exists check_inler_fotograflar_gin
  on public.check_inler using gin (fotograflar);

-- mekan galerisi: fotografli satirlar, mekan + zaman
create index if not exists check_inler_mekan_fotograf_idx
  on public.check_inler (mekan_id, olusturma_zamani desc)
  where cardinality(fotograflar) > 0;

create policy "check-in fotografini gorunurluk kuraliyla okuyabilir"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'check-in-fotograflari'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.check_inler c
        where storage.objects.name = any(c.fotograflar)
      )
    )
  );

-- 3) check_in_yap
drop function if exists public.check_in_yap(uuid, double precision, double precision, text, text, text, text);

create or replace function public.check_in_yap(
  p_mekan_id uuid, p_lat double precision, p_lng double precision,
  p_not_metni text default null, p_fotograf text default null,
  p_bulunurluk text default 'herkese_acik', p_ifade text default null,
  p_fotograflar text[] default null
) returns public.check_inler
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_mekan_konum geography;
  v_mekan_kapali boolean;
  v_kullanici_adi text;
  v_not text;
  v_fotograf text;
  v_fotograflar text[];
  v_yol text;
  v_ifade text;
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

  -- COKLU FOTOGRAF (2026-09-21): yeni istemci p_fotograflar gonderir;
  -- bir onceki JS surumu (OTA'yi henuz almamis) hala p_fotograf
  -- gonderebilir - ikisi de kabul, p_fotograflar oncelikli.
  v_fotograf := nullif(btrim(coalesce(p_fotograf, '')), '');
  v_fotograflar := coalesce(
    p_fotograflar,
    case when v_fotograf is not null then array[v_fotograf] else '{}'::text[] end
  );
  if cardinality(v_fotograflar) > 5 then
    raise exception 'En fazla 5 fotograf eklenebilir';
  end if;
  foreach v_yol in array v_fotograflar loop
    -- Storage okuma politikasi bu diziye bakarak dosyayi acar; baskasinin
    -- yolu buraya girerse o dosya sizardi (2026-09-19 kurali).
    if v_yol is null or btrim(v_yol) = ''
       or split_part(v_yol, '/', 1) <> auth.uid()::text
       or split_part(v_yol, '/', 2) = '' then
      raise exception 'Bu fotograf sana ait degil';
    end if;
  end loop;

  -- Ifade: sozlukte olmali. Bilinmeyen deger sessizce dusurulmez,
  -- reddedilir - istemci listeyi sunucudan degil manifestten okuyor,
  -- ikisi ayrilirsa burada gorunur.
  v_ifade := nullif(btrim(coalesce(p_ifade, '')), '');
  if v_ifade is not null and not exists (select 1 from public.ifadeler i where i.slug = v_ifade) then
    raise exception 'Gecersiz ifade';
  end if;

  select konum, kapali into v_mekan_konum, v_mekan_kapali
  from public.mekanlar where id = p_mekan_id;
  if v_mekan_konum is null then
    raise exception 'Mekan bulunamadi';
  end if;

  if v_mekan_kapali then
    raise exception 'Bu mekan kalici olarak kapandi';
  end if;

  if not ST_DWithin(v_mekan_konum, ST_MakePoint(p_lng, p_lat)::geography, 1000) then
    raise exception 'Mekana cok uzaksin (~1 km icinde olmalisin)';
  end if;

  select ad into v_kullanici_adi from public.profiller where id = auth.uid();

  update public.check_inler
  set konum = null,
      gorunurluk = bag.ani_gorunurlugu(bulunurluk, gorunurluk)
  where kullanici_id = auth.uid()
    and konum is not null
    and bitis_zamani > now();

  insert into public.check_inler (
    kullanici_id, mekan_id, not_metni, fotograflar, bitis_zamani, konum,
    kullanici_adi, bulunurluk, ifade
  )
  values (
    auth.uid(), p_mekan_id, v_not, v_fotograflar, now() + interval '1 hour',
    ST_MakePoint(p_lng, p_lat)::geography, v_kullanici_adi, p_bulunurluk, v_ifade
  )
  returning * into v_yeni;

  return v_yeni;
end;
$$;

revoke execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text, text, text[]) from public, anon;
grant execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text, text, text[]) to authenticated, service_role;

-- 4) duzenleme RPC'leri
create or replace function public.check_in_fotograflarini_guncelle(p_check_in_id uuid, p_fotograflar text[] default '{}')
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eski text[];
  v_yeni text[];
  v_yol text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  v_yeni := coalesce(p_fotograflar, '{}'::text[]);
  if cardinality(v_yeni) > 5 then
    raise exception 'En fazla 5 fotograf eklenebilir';
  end if;
  foreach v_yol in array v_yeni loop
    if v_yol is null or btrim(v_yol) = ''
       or split_part(v_yol, '/', 1) <> auth.uid()::text
       or split_part(v_yol, '/', 2) = '' then
      raise exception 'Bu fotograf sana ait degil';
    end if;
  end loop;

  select fotograflar into v_eski
  from public.check_inler
  where id = p_check_in_id
    and kullanici_id = auth.uid()
    and not moderasyon_gizli
  for update;

  if not found then
    raise exception 'Bu paylasim bulunamadi';
  end if;

  update public.check_inler
  set fotograflar = v_yeni
  where id = p_check_in_id;

  -- Kaldirilanlar: eskide olup yenide olmayanlar (sira eskiye gore).
  return coalesce(array(
    select e from unnest(v_eski) as e
    where e <> all(v_yeni)
  ), '{}'::text[]);
end;
$$;

revoke execute on function public.check_in_fotograflarini_guncelle(uuid, text[]) from public, anon;
grant execute on function public.check_in_fotograflarini_guncelle(uuid, text[]) to authenticated, service_role;

-- Tekil surum: bugunku OTA (9ec78c2e) bunu cagiriyor; ince sarmalayici.
create or replace function public.check_in_fotografini_guncelle(p_check_in_id uuid, p_fotograf text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kaldirilan text[];
begin
  v_kaldirilan := public.check_in_fotograflarini_guncelle(
    p_check_in_id,
    case when nullif(btrim(coalesce(p_fotograf, '')), '') is null
         then '{}'::text[] else array[btrim(p_fotograf)] end
  );
  return v_kaldirilan[1];
end;
$$;

revoke execute on function public.check_in_fotografini_guncelle(uuid, text) from public, anon;
grant execute on function public.check_in_fotografini_guncelle(uuid, text) to authenticated, service_role;

-- 5) mekan galerisi: fotograf basina bir satir (sira korunur)
create or replace function public.mekan_fotograflari(
  p_mekan_id uuid,
  p_limit integer default 30,
  p_ofset integer default 0
)
returns table (
  id uuid,
  kullanici_id uuid,
  kullanici_adi text,
  olusturma_zamani timestamptz,
  fotograf text
)
language sql
stable
set search_path to ''
as $function$
  select c.id, c.kullanici_id, c.kullanici_adi, c.olusturma_zamani, f.yol as fotograf
  from public.check_inler c
  cross join lateral unnest(c.fotograflar) with ordinality as f(yol, sira)
  where c.mekan_id = p_mekan_id
    and cardinality(c.fotograflar) > 0
  order by c.olusturma_zamani desc, c.id desc, f.sira
  limit least(greatest(coalesce(p_limit, 30), 1), 60)
  offset greatest(coalesce(p_ofset, 0), 0);
$function$;

revoke execute on function public.mekan_fotograflari(uuid, integer, integer) from public, anon;
grant execute on function public.mekan_fotograflari(uuid, integer, integer) to authenticated, service_role;

-- verilerimi_disa_aktar: check_inler bloguna fotograflar (govde canli
-- tanimla karsilastirildi, 2026-09-21).
create or replace function public.verilerimi_disa_aktar()
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare
  v_kisi uuid := auth.uid();
  v_sonuc jsonb;
begin
  if v_kisi is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  select jsonb_build_object(
    'surum', 1,
    'olusturuldu', now(),
    'aciklama',
      'Slooin hesabindaki kendi verilerin. Fotograf baglantilari 24 saat gecerlidir.',

    'profil', (
      select to_jsonb(x) from (
        select p.id, p.kullanici_adi, p.ad, p.biyografi, p.instagram,
               p.yasadigi_ulke, p.yasadigi_il, p.yasadigi_ilce, p.dogum_tarihi,
               p.fotograflar, p.aramada_gorunsun, p.profil_gizli,
               p.etiket_onayi_gerekli, p.varsayilan_bulunurluk,
               p.dil, p.olusturuldu
        from public.profiller p where p.id = v_kisi
      ) x
    ),

    'check_inler', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturma_zamani desc) from (
        select c.id, m.ad as mekan, m.semt as ilce, m.il,
               c.not_metni, c.ifade, c.fotograf, c.fotograflar, c.bulunurluk, c.gorunurluk,
               c.olusturma_zamani, c.bitis_zamani,
               case when c.konum is null then null
                    else jsonb_build_object(
                      'enlem', ST_Y(c.konum::geometry),
                      'boylam', ST_X(c.konum::geometry))
               end as konum
        from public.check_inler c
        join public.mekanlar m on m.id = c.mekan_id
        where c.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'yorumlarim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select y.id, y.check_in_id, y.metin, y.olusturuldu
        from public.yorumlar y where y.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'begenilerim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select b.check_in_id, b.olusturuldu
        from public.begeniler b where b.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'etiketlendiklerim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select e.check_in_id, e.durum, e.olusturuldu, p.kullanici_adi as etiketleyen
        from public.check_in_etiketleri e
        join public.check_inler c on c.id = e.check_in_id
        left join public.profiller p on p.id = c.kullanici_id
        where e.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'arkadaslarim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select p.kullanici_adi, t.durum, t.olusturuldu
        from public.takipler t
        join public.profiller p on p.id = t.takip_edilen_id
        where t.takip_eden_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'sohbet_isteklerim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select case when s.gonderen_id = v_kisi then 'gonderdim' else 'aldim' end as yon,
               p.kullanici_adi as karsi_taraf, s.durum, s.olusturuldu
        from public.sohbet_istekleri s
        join public.profiller p
          on p.id = case when s.gonderen_id = v_kisi then s.alan_id else s.gonderen_id end
        where s.gonderen_id = v_kisi or s.alan_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'gonderdigim_mesajlar', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select m.konusma_id, m.metin, m.olusturuldu
        from public.mesajlar m where m.gonderen_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'aldigim_mesajlar_ozeti', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.son_mesaj desc) from (
        select p.kullanici_adi as karsi_taraf,
               count(*)::int as mesaj_sayisi,
               max(m.olusturuldu) as son_mesaj
        from public.mesajlar m
        join public.konusma_uyeleri ben
          on ben.konusma_id = m.konusma_id and ben.kullanici_id = v_kisi
        left join public.profiller p on p.id = m.gonderen_id
        where m.gonderen_id <> v_kisi
        group by p.kullanici_adi
      ) x
    ), '[]'::jsonb),

    'engelledigim_kisiler', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select p.kullanici_adi, e.olusturuldu
        from public.engellemeler e
        join public.profiller p on p.id = e.engellenen_id
        where e.engelleyen_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'gonderdigim_sikayetler', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select s.hedef_tur, s.sebep, s.aciklama, s.durum, s.olusturuldu
        from public.sikayetler s where s.sikayet_eden_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'mekan_duzenleme_taleplerim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select t.onerilen_ad, t.onerilen_adres, t.onerilen_tur,
               t.onerilen_mahalle, t.onerilen_il, t.onerilen_ilce,
               t.kapali_bildirimi, t.durum, t.olusturuldu, t.karar_zamani
        from public.mekan_duzenleme_talepleri t where t.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'mekan_puanlarim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.guncelleme_zamani desc) from (
        select m.ad as mekan, m.semt as ilce, m.il, mp.puan,
               mp.olusturma_zamani, mp.guncelleme_zamani
        from public.mekan_puanlari mp
        join public.mekanlar m on m.id = mp.mekan_id
        where mp.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'onaylarim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.zaman desc) from (
        select k.onay_turu, k.metin_surumu, k.verildi_mi, k.zaman
        from public.kvkk_onaylari k where k.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'hesap_durumu', (
      select to_jsonb(x) from (
        select h.durum, h.gerekce, h.aski_bitisi, h.guncellendi
        from public.hesap_durumlari h where h.kullanici_id = v_kisi
      ) x
    ),

    'bildirim_cihazlarim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.guncellendi desc) from (
        select j.platform, j.guncellendi
        from public.bildirim_jetonlari j where j.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb)
  ) into v_sonuc;

  return v_sonuc;
end;
$$;

revoke execute on function public.verilerimi_disa_aktar() from public, anon;
grant execute on function public.verilerimi_disa_aktar() to authenticated, service_role;
