-- Birebir konusmalar ve (3c icin) mekan odalari ayni tabloda durur.
-- birebir_anahtar sirali ciftten turer ve BENZERSIZ oldugu icin bir
-- ciftin tek konusmasi olur; bul-ya-olustur yarisa acik degildir.
-- Ayni cift hem takiplesip hem sohbet istegiyle baglanmis olsa bile
-- tek konusma. mekan_odasi satirlarinda null kalir (unique null saymaz).
create table public.konusmalar (
  id               uuid primary key default gen_random_uuid(),
  tur              text not null default 'birebir'
                     check (tur in ('birebir', 'mekan_odasi')),
  birebir_anahtar  text unique,
  olusturuldu      timestamptz not null default now()
);

-- RLS acik, YAZMA POLITIKASI YOK: yazma tamamen RPC uzerinden.
alter table public.konusmalar enable row level security;

revoke insert, update, delete on public.konusmalar from authenticated;
