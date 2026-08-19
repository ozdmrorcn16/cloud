-- Kullanici adi: benzersiz, kucuk harfle saklanir, bicimi kisitlidir.
-- Once null kabul eder halde eklenip mevcut satirlar dolduruluyor,
-- ancak ondan sonra not null / unique / check ekleniyor. Sira onemli:
-- tersi mevcut profilleri (test hesaplari dahil) kirar.
alter table public.profiller add column kullanici_adi text;

update public.profiller
  set kullanici_adi = 'kullanici_' || left(id::text, 8)
  where kullanici_adi is null;

alter table public.profiller
  alter column kullanici_adi set not null,
  add constraint profiller_kullanici_adi_benzersiz unique (kullanici_adi),
  add constraint profiller_kullanici_adi_bicim
    check (kullanici_adi ~ '^[a-z0-9._]{3,20}$');

-- Son degisiklik ani. null = hic degistirilmemis (kayittan beri).
alter table public.profiller add column kullanici_adi_degistirildi timestamptz;

-- Kisi aramasindan tamamen cikma tercihi.
alter table public.profiller
  add column aramada_gorunsun boolean not null default true;
