-- ---------------------------------------------------------------- --
-- Foursquare kimligi (2026-08-30)
-- ---------------------------------------------------------------- --
--
-- Kullanicinin karari: Overture ile Foursquare OS Places BIRLESIYOR.
-- Kapali ve bayrakli Foursquare kayitlari alinmiyor; ayni mekan iki
-- kaynakta da varsa TEK kayit kaliyor (Overture satiri, uzerine
-- Foursquare kimligi islenir), olmayanlar `kaynak = 'foursquare'` ile
-- yeni satir olur. Rapor: docs/foursquare-denemesi-2026-08-30.md.
--
-- fsq_place_id: Foursquare'in kalici kimligi; aylik tazeleme ve
-- tekillestirme bu anahtarla yapilir. gers_id ile ayni desen.

alter table public.mekanlar
  add column if not exists fsq_place_id text;

create unique index if not exists mekanlar_fsq_place_id_benzersiz
  on public.mekanlar (fsq_place_id) where fsq_place_id is not null;

comment on column public.mekanlar.fsq_place_id is
  'Foursquare OS Places kimligi. Dolu ise kayit Foursquare''dan geldi ya da Foursquare ile eslestirildi (2026-08-30).';

-- kaynak kisitina 'foursquare' eklendi (ayni gun, aktarim sirasinda bulundu:
-- eski kisit yalnizca kullanici/osm/overture kabul ediyordu).
alter table public.mekanlar drop constraint if exists mekanlar_kaynak_gecerli;
alter table public.mekanlar add constraint mekanlar_kaynak_gecerli
  check (kaynak = any (array['kullanici'::text, 'osm'::text, 'overture'::text, 'foursquare'::text]));
