-- Orijinal kaynak kategorisi. Bugune kadar SAKLANMIYORDU: yukleme
-- betigi Overture kategorisini dort ture (kafe/bar/restoran/park)
-- sikistirip atiyordu. Sonuc yaniltici etiketlerdi - plaj "park",
-- apartman "park" gorunuyordu - ve hangi kaydin neden o turu aldigi
-- geriye donuk sorulamiyordu.
--
-- Bu sutun kaynagi koruyor: `tur` kullaniciya gosterilen Turkce ad,
-- `kategori` ise kaynaktaki ham deger. Esleme sonradan duzeltilecekse
-- veriyi yeniden indirmeye gerek kalmaz.
alter table public.mekanlar
  add column kategori text;

comment on column public.mekanlar.kategori is
  'Kaynaktaki ham kategori (Overture categories.primary). tur bundan turetilir; esleme degisirse bu sutundan yeniden hesaplanabilir.';

create index mekanlar_kategori_idx on public.mekanlar (kategori);
