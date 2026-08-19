-- Takip tek yonlu: A, B'yi takip etmek icin istek gonderir, B kabul
-- ederse A takipci olur. B'nin de A'yi takip etmesi ayri bir istektir.
--
-- Red satiri TUTULMAZ, silinir (karar #37): red bir sonraki istegi
-- engellemedigi icin red kaydinin hicbir islevi kalmiyor.
create table public.takipler (
  takip_eden_id uuid not null references auth.users(id) on delete cascade,
  takip_edilen_id uuid not null references auth.users(id) on delete cascade,
  durum text not null default 'beklemede',
  olusturuldu timestamptz not null default now(),
  primary key (takip_eden_id, takip_edilen_id),
  constraint takipler_kendine_yok check (takip_eden_id <> takip_edilen_id),
  constraint takipler_durum check (durum in ('beklemede', 'kabul'))
);

-- Gorunurluk sorgusunun sicak yolu: "X, Y'yi takip ediyor mu".
create index takipler_kabul_idx
  on public.takipler (takip_edilen_id, takip_eden_id)
  where durum = 'kabul';

alter table public.takipler enable row level security;

-- Kullanici yalnizca kendisinin tarafi oldugu satirlari gorur.
create policy "kendi takip iliskilerini gorebilir"
  on public.takipler for select to authenticated
  using (takip_eden_id = auth.uid() or takip_edilen_id = auth.uid());

-- Yazma islemleri yalnizca RPC uzerinden. Insert/update/delete
-- politikasi bilerek tanimlanmiyor; boylece kurallar (engelleme
-- kontrolu, gunluk tavan, yalnizca alici kabul edebilir) atlanamaz.
