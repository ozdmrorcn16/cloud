-- CHECK-IN'DE ARKADAS ETIKETLEME
--
-- Kullanicinin istegi (2026-08-26): check-in satirinda kisi, mekan ve
-- ETIKETLENEN ARKADASLAR birlikte gorunsun; etikete basilinca o kisinin
-- profiline gidilsin.
--
-- GIZLILIK KISITI - bu ozelligin cekirdegi:
-- Etiketlenmek, kisinin KIMLIGININ BIR KONUMA BAGLANMASI demek. Yani
-- etiketleme, etiketlenen kisi hakkinda konum verisi uretiyor. Iki kural
-- bu yuzden politikalara gomuldu, arayuze birakilmadi:
--
--   1. YALNIZCA KARSILIKLI BAGLI OLDUGUN KISI etiketlenebilir. Tanimadigin
--      birini bir yere "koymak" mumkun degil. Takip karsilikli oldugu icin
--      (karar #42) tek yonlu kontrol yeterli.
--   2. ETIKETLENEN KISI KENDI ETIKETINI KALDIRABILIR. Onay almadan
--      etiketlenmis olabilir; en azindan geri alabilmeli.
--
-- Gorunurluk ayri bir kural GEREKTIRMIYOR: select politikasi check_inler'e
-- bakiyor ve o tablonun kendi RLS'i devrede oldugu icin, bir check-in'i
-- goremeyen onun etiketlerini de goremiyor. Gorunurluk mantigi tek yerde
-- kaliyor.

create table public.check_in_etiketleri (
  check_in_id uuid not null references public.check_inler(id) on delete cascade,
  kullanici_id uuid not null references auth.users(id) on delete cascade,
  olusturuldu timestamptz not null default now(),
  primary key (check_in_id, kullanici_id)
);

-- Bir kisinin etiketlendigi check-in'leri bulmak icin.
create index check_in_etiketleri_kullanici_idx
  on public.check_in_etiketleri (kullanici_id);

alter table public.check_in_etiketleri enable row level security;

-- OKUMA: check-in'i gorebiliyorsan etiketlerini de gorursun.
create policy "etiketler check-in ile birlikte gorunur"
  on public.check_in_etiketleri for select
  to authenticated
  using (
    exists (
      select 1 from public.check_inler c
      where c.id = check_in_etiketleri.check_in_id
    )
  );

-- YAZMA: yalnizca check-in'in sahibi, yalnizca karsilikli bagli oldugu
-- kisiyi ve yalnizca kendisi disindakileri etiketleyebilir.
create policy "kendi check-in'ine bagli oldugu kisiyi etiketleyebilir"
  on public.check_in_etiketleri for insert
  to authenticated
  with check (
    kullanici_id <> auth.uid()
    and exists (
      select 1 from public.check_inler c
      where c.id = check_in_etiketleri.check_in_id
        and c.kullanici_id = auth.uid()
    )
    and bag.takip_ediyor_mu(auth.uid(), check_in_etiketleri.kullanici_id)
  );

-- SILME: check-in'in sahibi ya da ETIKETLENEN KISININ KENDISI.
create policy "etiketi sahibi ya da etiketlenen kaldirabilir"
  on public.check_in_etiketleri for delete
  to authenticated
  using (
    kullanici_id = auth.uid()
    or exists (
      select 1 from public.check_inler c
      where c.id = check_in_etiketleri.check_in_id
        and c.kullanici_id = auth.uid()
    )
  );

-- Guncelleme yok: etiket ya vardir ya yoktur.
revoke update on public.check_in_etiketleri from authenticated;
