-- CHECK-IN IFADELERI (2026-09-21).
--
-- Kullanicinin karari: check-in yaparken not alaninda 108 ifadelik setten
-- (12 kategori) TEK ifade secilebilir; ifade akis kartinda notun basinda
-- gorunur. Ifade bir kullanici icerigidir - not gibi: ayni RLS, ayni
-- gorunurluk, ayni silme; verilerimi_disa_aktar'a girer (KVKK m.11).
--
-- Sozluk tablosu: gecerli slug'lar sunucuda kilitli (istemci yalnizca
-- listedekini gonderebilir). Etiketler mobil/assets/ifadeler/manifest.json
-- ile ayni; kaynak orasi (araclar/ifade-seti-kes.py uretir).

create table if not exists public.ifadeler (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  kategori text not null,
  etiket text not null,
  sira int not null
);
alter table public.ifadeler enable row level security;
drop policy if exists "ifadeler herkese okunur" on public.ifadeler;
create policy "ifadeler herkese okunur" on public.ifadeler for select to authenticated, anon using (true);
grant select on public.ifadeler to authenticated, anon;

insert into public.ifadeler (slug, kategori, etiket, sira) values
  ('cay-molasi', 'icecekler', 'Çay molası', 0),
  ('kahve-keyfi', 'icecekler', 'Kahve keyfi', 1),
  ('turk-kahvesi', 'icecekler', 'Türk kahvesi', 2),
  ('buzlu-kahve', 'icecekler', 'Buzlu kahve', 3),
  ('matcha-zamani', 'icecekler', 'Matcha zamanı', 4),
  ('limonata-ferahligi', 'icecekler', 'Limonata ferahlığı', 5),
  ('smoothie-molasi', 'icecekler', 'Smoothie molası', 6),
  ('bubble-tea', 'icecekler', 'Bubble tea', 7),
  ('su-molasi', 'icecekler', 'Su molası', 8),
  ('kahvalti-keyfi', 'yemekler', 'Kahvaltı keyfi', 9),
  ('simit-molasi', 'yemekler', 'Simit molası', 10),
  ('pizza-zamani', 'yemekler', 'Pizza zamanı', 11),
  ('burger-keyfi', 'yemekler', 'Burger keyfi', 12),
  ('kebap-molasi', 'yemekler', 'Kebap molası', 13),
  ('sushi-zamani', 'yemekler', 'Sushi zamanı', 14),
  ('hafif-bir-ogun', 'yemekler', 'Hafif bir öğün', 15),
  ('makarna-keyfi', 'yemekler', 'Makarna keyfi', 16),
  ('patates-molasi', 'yemekler', 'Patates molası', 17),
  ('dondurma-keyfi', 'tatlilar-ve-atistirmaliklar', 'Dondurma keyfi', 18),
  ('tatli-kacamagi', 'tatlilar-ve-atistirmaliklar', 'Tatlı kaçamağı', 19),
  ('waffle-zamani', 'tatlilar-ve-atistirmaliklar', 'Waffle zamanı', 20),
  ('baklava-keyfi', 'tatlilar-ve-atistirmaliklar', 'Baklava keyfi', 21),
  ('donut-molasi', 'tatlilar-ve-atistirmaliklar', 'Donut molası', 22),
  ('kruvasan-keyfi', 'tatlilar-ve-atistirmaliklar', 'Kruvasan keyfi', 23),
  ('cikolata-mutlulugu', 'tatlilar-ve-atistirmaliklar', 'Çikolata mutluluğu', 24),
  ('film-atistirmasi', 'tatlilar-ve-atistirmaliklar', 'Film atıştırması', 25),
  ('meyve-molasi', 'tatlilar-ve-atistirmaliklar', 'Meyve molası', 26),
  ('cok-mutluyum', 'ruh-hali', 'Çok mutluyum', 27),
  ('kahkahadayim', 'ruh-hali', 'Kahkahadayım', 28),
  ('kalbim-burada', 'ruh-hali', 'Kalbim burada', 29),
  ('huzurluyum', 'ruh-hali', 'Huzurluyum', 30),
  ('dusunceliyim', 'ruh-hali', 'Düşünceliyim', 31),
  ('biraz-uzgunum', 'ruh-hali', 'Biraz üzgünüm', 32),
  ('pilim-bitti', 'ruh-hali', 'Pilim bitti', 33),
  ('biraz-sinirliyim', 'ruh-hali', 'Biraz sinirliyim', 34),
  ('cok-sasirdim', 'ruh-hali', 'Çok şaşırdım', 35),
  ('cak-bir-beslik', 'arkadaslik-ve-iliskiler', 'Çak bir beşlik', 36),
  ('ekiple-birlikte', 'arkadaslik-ve-iliskiler', 'Ekiple birlikte', 37),
  ('aile-zamani', 'arkadaslik-ve-iliskiler', 'Aile zamanı', 38),
  ('randevu-zamani', 'arkadaslik-ve-iliskiler', 'Randevu zamanı', 39),
  ('seni-bekliyorum', 'arkadaslik-ve-iliskiler', 'Seni bekliyorum', 40),
  ('kendi-basima', 'arkadaslik-ve-iliskiler', 'Kendi başıma', 41),
  ('iyi-ki-varsin', 'arkadaslik-ve-iliskiler', 'İyi ki varsın', 42),
  ('sen-de-gel', 'arkadaslik-ve-iliskiler', 'Sen de gel', 43),
  ('ozledim', 'arkadaslik-ve-iliskiler', 'Özledim', 44),
  ('yoldayim', 'yolculuk-ve-ulasim', 'Yoldayım', 45),
  ('trafikteyim', 'yolculuk-ve-ulasim', 'Trafikteyim', 46),
  ('yuruyerek', 'yolculuk-ve-ulasim', 'Yürüyerek', 47),
  ('bisikletle', 'yolculuk-ve-ulasim', 'Bisikletle', 48),
  ('scooter-ile', 'yolculuk-ve-ulasim', 'Scooter ile', 49),
  ('tren-yolculugu', 'yolculuk-ve-ulasim', 'Tren yolculuğu', 50),
  ('otobusteyim', 'yolculuk-ve-ulasim', 'Otobüsteyim', 51),
  ('ucus-zamani', 'yolculuk-ve-ulasim', 'Uçuş zamanı', 52),
  ('tatil-basladi', 'yolculuk-ve-ulasim', 'Tatil başladı', 53),
  ('calisiyorum', 'gunluk-yasam', 'Çalışıyorum', 54),
  ('ders-zamani', 'gunluk-yasam', 'Ders zamanı', 55),
  ('alisveristeyim', 'gunluk-yasam', 'Alışverişteyim', 56),
  ('ev-keyfi', 'gunluk-yasam', 'Ev keyfi', 57),
  ('market-turu', 'gunluk-yasam', 'Market turu', 58),
  ('bakim-zamani', 'gunluk-yasam', 'Bakım zamanı', 59),
  ('saglik-molasi', 'gunluk-yasam', 'Sağlık molası', 60),
  ('patili-dostumla', 'gunluk-yasam', 'Patili dostumla', 61),
  ('toplantidayim', 'gunluk-yasam', 'Toplantıdayım', 62),
  ('antrenmandayim', 'spor-ve-hareket', 'Antrenmandayım', 63),
  ('kosu-zamani', 'spor-ve-hareket', 'Koşu zamanı', 64),
  ('mac-keyfi', 'spor-ve-hareket', 'Maç keyfi', 65),
  ('basket-zamani', 'spor-ve-hareket', 'Basket zamanı', 66),
  ('tenis-zamani', 'spor-ve-hareket', 'Tenis zamanı', 67),
  ('yuzuyorum', 'spor-ve-hareket', 'Yüzüyorum', 68),
  ('yoga-molasi', 'spor-ve-hareket', 'Yoga molası', 69),
  ('doga-yuruyusu', 'spor-ve-hareket', 'Doğa yürüyüşü', 70),
  ('bowling-zamani', 'spor-ve-hareket', 'Bowling zamanı', 71),
  ('sahil-keyfi', 'gezi-ve-eglence', 'Sahil keyfi', 72),
  ('kamptayim', 'gezi-ve-eglence', 'Kamptayım', 73),
  ('piknik-zamani', 'gezi-ve-eglence', 'Piknik zamanı', 74),
  ('sinemadayim', 'gezi-ve-eglence', 'Sinemadayım', 75),
  ('konserdeyim', 'gezi-ve-eglence', 'Konserdeyim', 76),
  ('dans-zamani', 'gezi-ve-eglence', 'Dans zamanı', 77),
  ('oyun-molasi', 'gezi-ve-eglence', 'Oyun molası', 78),
  ('kesif-turu', 'gezi-ve-eglence', 'Keşif turu', 79),
  ('balik-tutuyorum', 'gezi-ve-eglence', 'Balık tutuyorum', 80),
  ('gunesli-gun', 'hava-ve-gunun-saati', 'Güneşli gün', 81),
  ('yagmur-keyfi', 'hava-ve-gunun-saati', 'Yağmur keyfi', 82),
  ('kar-zamani', 'hava-ve-gunun-saati', 'Kar zamanı', 83),
  ('ruzgarli', 'hava-ve-gunun-saati', 'Rüzgârlı', 84),
  ('cok-sicak', 'hava-ve-gunun-saati', 'Çok sıcak', 85),
  ('usudum', 'hava-ve-gunun-saati', 'Üşüdüm', 86),
  ('gun-batimi', 'hava-ve-gunun-saati', 'Gün batımı', 87),
  ('gece-modu', 'hava-ve-gunun-saati', 'Gece modu', 88),
  ('bulutlu-gun', 'hava-ve-gunun-saati', 'Bulutlu gün', 89),
  ('iyi-ki-dogdun', 'kutlamalar-ve-ozel-anlar', 'İyi ki doğdun', 90),
  ('mezun-oldum', 'kutlamalar-ve-ozel-anlar', 'Mezun oldum', 91),
  ('basardim', 'kutlamalar-ve-ozel-anlar', 'Başardım', 92),
  ('kucuk-bir-surpriz', 'kutlamalar-ve-ozel-anlar', 'Küçük bir sürpriz', 93),
  ('yil-donumumuz', 'kutlamalar-ve-ozel-anlar', 'Yıl dönümümüz', 94),
  ('dugun-zamani', 'kutlamalar-ve-ozel-anlar', 'Düğün zamanı', 95),
  ('yeni-baslangic', 'kutlamalar-ve-ozel-anlar', 'Yeni başlangıç', 96),
  ('sans-benimle', 'kutlamalar-ve-ozel-anlar', 'Şans benimle', 97),
  ('kutlama-zamani', 'kutlamalar-ve-ozel-anlar', 'Kutlama zamanı', 98),
  ('buradayim', 'mekan-ve-check-in', 'Buradayım', 99),
  ('ilk-kez-buradayim', 'mekan-ve-check-in', 'İlk kez buradayım', 100),
  ('yine-buradayim', 'mekan-ve-check-in', 'Yine buradayım', 101),
  ('burasi-kalabalik', 'mekan-ve-check-in', 'Burası kalabalık', 102),
  ('tam-kafa-dinlemelik', 'mekan-ve-check-in', 'Tam kafa dinlemelik', 103),
  ('manzara-sahane', 'mekan-ve-check-in', 'Manzara şahane', 104),
  ('cok-lezzetli', 'mekan-ve-check-in', 'Çok lezzetli', 105),
  ('bekledigim-gibi-degil', 'mekan-ve-check-in', 'Beklediğim gibi değil', 106),
  ('gizli-bir-guzellik', 'mekan-ve-check-in', 'Gizli bir güzellik', 107)
on conflict (slug) do update set kategori = excluded.kategori, etiket = excluded.etiket, sira = excluded.sira;

alter table public.check_inler
  add column if not exists ifade text null references public.ifadeler(slug);

-- check_in_yap: yeni parametre p_ifade. ESKI IMZA DUSURULUR - ayni adla
-- ikinci bir asiri yukleme PostgREST'te belirsizlik yaratir (yasandi).
drop function if exists public.check_in_yap(uuid, double precision, double precision, text, text, text);

create or replace function public.check_in_yap(
  p_mekan_id uuid, p_lat double precision, p_lng double precision,
  p_not_metni text default null, p_fotograf text default null,
  p_bulunurluk text default 'herkese_acik', p_ifade text default null
) returns public.check_inler
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_mekan_konum geography;
  v_mekan_kapali boolean;
  v_kullanici_adi text;
  v_not text;
  v_fotograf text;
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

  v_fotograf := nullif(btrim(coalesce(p_fotograf, '')), '');
  if v_fotograf is not null
     and (split_part(v_fotograf, '/', 1) <> auth.uid()::text
          or split_part(v_fotograf, '/', 2) = '') then
    raise exception 'Bu fotograf sana ait degil';
  end if;

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
    kullanici_id, mekan_id, not_metni, fotograf, bitis_zamani, konum,
    kullanici_adi, bulunurluk, ifade
  )
  values (
    auth.uid(), p_mekan_id, v_not, v_fotograf, now() + interval '1 hour',
    ST_MakePoint(p_lng, p_lat)::geography, v_kullanici_adi, p_bulunurluk, v_ifade
  )
  returning * into v_yeni;

  return v_yeni;
end;
$$;

grant execute on function public.check_in_yap(uuid, double precision, double precision, text, text, text, text) to authenticated;


-- verilerimi_disa_aktar: check_inler bloguna `ifade` (KVKK m.11 - kisinin
-- kendi icerigi dosyada eksiksiz olmali). Govde CANLI tanimdan alindi
-- (pg_get_functiondef, 2026-09-21) - eski migrasyondan kopyalanmadi
-- (2026-09-18 dersi).
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
               c.not_metni, c.ifade, c.fotograf, c.bulunurluk, c.gorunurluk,
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
