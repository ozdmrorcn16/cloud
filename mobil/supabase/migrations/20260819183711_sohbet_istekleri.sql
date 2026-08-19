-- Sohbet istegi takipten ayri bir bag: "su an konusmak istiyorum".
-- Kabul edilince konusma acilir (mesaj ekrani Faz 3b'de gelir), ama
-- takip bagi kurulmaz. Yapisi takipler ile birebir ayni; iki tablo ayni
-- RPC bicimini paylasiyor.
create table public.sohbet_istekleri (
  gonderen_id uuid not null references auth.users(id) on delete cascade,
  alan_id uuid not null references auth.users(id) on delete cascade,
  durum text not null default 'beklemede',
  olusturuldu timestamptz not null default now(),
  primary key (gonderen_id, alan_id),
  constraint sohbet_istekleri_kendine_yok check (gonderen_id <> alan_id),
  constraint sohbet_istekleri_durum check (durum in ('beklemede', 'kabul'))
);

create index sohbet_istekleri_alan_idx
  on public.sohbet_istekleri (alan_id, gonderen_id)
  where durum = 'beklemede';

alter table public.sohbet_istekleri enable row level security;

create policy "kendi sohbet isteklerini gorebilir"
  on public.sohbet_istekleri for select to authenticated
  using (gonderen_id = auth.uid() or alan_id = auth.uid());

-- Yazma yalnizca RPC uzerinden (takipler ile ayni gerekce).
