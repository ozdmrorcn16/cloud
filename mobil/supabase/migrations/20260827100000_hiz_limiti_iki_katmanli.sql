-- HIZ SINIRI COK KULLANICIYA GORE YENIDEN KURULDU.
--
-- Kullanicinin karari (2026-08-27): "Gercek kullanima gore ayarlamak
-- gerekiyor her adimimizi", "Cok kullanici articak sekilde on gorerek".
--
-- ONCEKI TASARIMIN HATASI: tek olcut IP idi ve tavan 15/saat idi. Bu
-- sayi TEK KISILIK test durumuna gore secilmisti. Gercek kullanimda
-- mobil operatorler CGNAT kullanir; yuzlerce abone ayni genel IP'den
-- cikar. Uygulama buyudugunde ayni operatordeki mesru kullanicilar
-- birbirinin hakkini yer ve kayit ekranindaki hizli yol calismaz olur.
-- Tek bir olcut birden fazla kullanici tarafindan PAYLASILIYORSA o
-- olcut tek basina hiz siniri anahtari olamaz.
--
-- YENI TASARIM: IKI KATMAN, ikisi de gecilmek zorunda.
--
--   CIHAZ katmani (dar): cihaz basina saatte az sayida sorgu. Mesru
--     bir kullanicinin ihtiyaci 1-3 sorgudur; bu katman normal
--     kullaniciyi hic gormez ama tek bir cihazdan liste taramayi
--     hemen keser. Cihaz kimligi istemcide uretiliyor, yani taklit
--     edilebilir - bu yuzden tek basina yeterli DEGIL.
--   IP katmani (genis): ayni IP'den saatte cok daha yuksek bir tavan.
--     CGNAT'in arkasindaki kalabaligi rahatsiz etmiyor ama cihaz
--     kimligini surekli degistiren birinin toplu taramasini yine de
--     sinirliyor.
--
-- SAYILAR SABIT DEGIL: `public.hiz_limitleri` tablosunda duruyorlar.
-- Gercek kullanim verisi geldiginde migrasyon yazmadan, tek UPDATE
-- ile degistirilebilirler. Kullanicinin kurali tam olarak buydu.
--
-- OLCUM: sayilari gercek kullanima gore ayarlayabilmek icin veri
-- gerekiyor. Gunluk satirlari 1 saat sonra siliniyor (kisisel veri),
-- ama silinmeden once SAATLIK OZETE toplaniyor: kac cagri, kac farkli
-- kaynak. Ozette IP yok, yalnizca sayilar var.

-- ---------------------------------------------------------------- --
-- 1. Ayarlanabilir limitler
-- ---------------------------------------------------------------- --
create table if not exists public.hiz_limitleri (
  anahtar text primary key,
  deger int not null check (deger > 0),
  aciklama text not null,
  guncellendi timestamptz not null default now()
);

alter table public.hiz_limitleri enable row level security;
revoke all on table public.hiz_limitleri from anon, authenticated;

insert into public.hiz_limitleri (anahtar, deger, aciklama) values
  (
    'telefon_kontrol_cihaz',
    10,
    'Kayit ekranindaki numara kontrolu: bir cihazdan saatte en fazla kac sorgu. Mesru kullanicinin ihtiyaci 1-3.'
  ),
  (
    'telefon_kontrol_ip',
    300,
    'Ayni IP''den saatte en fazla kac sorgu. CGNAT arkasindaki kalabaligi bogmayacak kadar genis, toplu taramayi sinirlayacak kadar dar.'
  )
on conflict (anahtar) do nothing;

-- ---------------------------------------------------------------- --
-- 2. Gunluge katman turu, ve saatlik ozet tablosu
-- ---------------------------------------------------------------- --
alter table public.telefon_kontrol_gunlugu
  add column if not exists tur text not null default 'ip';

create table if not exists public.telefon_kontrol_ozeti (
  saat timestamptz not null,
  tur text not null,
  cagri int not null default 0,
  -- Yaklasik: her budama turunda gorulen farkli kaynak sayisinin en
  -- buyugu. Tam bir tekil sayim degil, egilimi gostermek icin.
  farkli_kaynak int not null default 0,
  primary key (saat, tur)
);

alter table public.telefon_kontrol_ozeti enable row level security;
revoke all on table public.telefon_kontrol_ozeti from anon, authenticated;

comment on table public.telefon_kontrol_ozeti is
  'Kayit ekrani numara kontrolunun saatlik kullanim ozeti. IP ya da numara TASIMAZ; hiz limitlerini gercek kullanima gore ayarlamak icin tutulur.';

-- ---------------------------------------------------------------- --
-- 3. Fonksiyon
-- ---------------------------------------------------------------- --
create or replace function public.telefon_kayitli_mi(
  p_telefon text,
  p_cihaz text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_basliklar jsonb;
  v_xff text;
  v_parcalar text[];
  v_ip text;
  v_cihaz text;
  v_ip_tavan int;
  v_cihaz_tavan int;
  v_sayi int;
  v_sonuc boolean;
begin
  if p_telefon is null or p_telefon !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Telefon numarasi bicimi gecersiz';
  end if;

  -- Limitler tablodan; satir yoksa guvenli varsayilanlar.
  select coalesce(
    (select deger from public.hiz_limitleri where anahtar = 'telefon_kontrol_ip'),
    300
  ) into v_ip_tavan;

  select coalesce(
    (select deger from public.hiz_limitleri where anahtar = 'telefon_kontrol_cihaz'),
    10
  ) into v_cihaz_tavan;

  -- IP: once cf-connecting-ip (istemci ezemiyor), sonra
  -- x-forwarded-for'un SON parcasi. Gerekce 20260827093000'de.
  v_basliklar := coalesce(current_setting('request.headers', true)::jsonb, '{}'::jsonb);
  v_ip := nullif(trim(coalesce(v_basliklar ->> 'cf-connecting-ip', '')), '');
  if v_ip is null then
    v_xff := coalesce(v_basliklar ->> 'x-forwarded-for', '');
    if v_xff <> '' then
      v_parcalar := string_to_array(v_xff, ',');
      v_ip := nullif(trim(v_parcalar[array_upper(v_parcalar, 1)]), '');
    end if;
  end if;
  v_ip := coalesce(v_ip, 'bilinmiyor');

  -- Cihaz kimligi istemciden geliyor. Bicimi dogrulaniyor ki tabloya
  -- serbest metin yazilmasin; gelmezse cihaz katmani IP'ye duesuyor,
  -- yani eski (dar) davranisa. Boylece kimlik gondermemek bir kacis
  -- yolu olmuyor.
  v_cihaz := nullif(trim(coalesce(p_cihaz, '')), '');
  if v_cihaz is null or v_cihaz !~ '^[a-zA-Z0-9-]{8,64}$' then
    v_cihaz := 'ipten:' || v_ip;
  end if;

  -- Budama + saatlik ozete toplama. Kisisel veri (IP) 1 saatten uzun
  -- durmuyor; ozette yalnizca sayilar kaliyor.
  with silinen as (
    delete from public.telefon_kontrol_gunlugu
    where zaman < now() - interval '1 hour'
    returning kaynak, tur, zaman
  ), toplam as (
    select date_trunc('hour', zaman) as saat,
           tur,
           count(*)::int as cagri,
           count(distinct kaynak)::int as farkli
    from silinen
    group by 1, 2
  )
  insert into public.telefon_kontrol_ozeti (saat, tur, cagri, farkli_kaynak)
  select saat, tur, cagri, farkli from toplam
  on conflict (saat, tur) do update
    set cagri = public.telefon_kontrol_ozeti.cagri + excluded.cagri,
        farkli_kaynak = greatest(
          public.telefon_kontrol_ozeti.farkli_kaynak,
          excluded.farkli_kaynak
        );

  -- DAR KATMAN ONCE: cihaz.
  select count(*) into v_sayi
  from public.telefon_kontrol_gunlugu
  where tur = 'cihaz' and kaynak = v_cihaz and zaman > now() - interval '1 hour';

  if v_sayi >= v_cihaz_tavan then
    raise exception 'Cok fazla deneme yapildi, biraz sonra tekrar deneyin';
  end if;

  -- GENIS KATMAN: IP.
  select count(*) into v_sayi
  from public.telefon_kontrol_gunlugu
  where tur = 'ip' and kaynak = v_ip and zaman > now() - interval '1 hour';

  if v_sayi >= v_ip_tavan then
    raise exception 'Cok fazla deneme yapildi, biraz sonra tekrar deneyin';
  end if;

  insert into public.telefon_kontrol_gunlugu (kaynak, tur)
  values (v_cihaz, 'cihaz'), (v_ip, 'ip');

  select exists (
    select 1
    from auth.users u
    join public.profiller p on p.id = u.id
    where u.phone = ltrim(p_telefon, '+')
  ) into v_sonuc;

  return v_sonuc;
end;
$$;

-- Tek parametreli eski imza dusuruluyor: iki imza birden durursa
-- istemci hangisini cagirdigini kaybediyor ve cihaz katmani sessizce
-- atlanabiliyor.
drop function if exists public.telefon_kayitli_mi(text);

revoke all on function public.telefon_kayitli_mi(text, text) from public;
grant execute on function public.telefon_kayitli_mi(text, text) to anon, authenticated;

create index if not exists telefon_kontrol_gunlugu_tur_kaynak_zaman
  on public.telefon_kontrol_gunlugu (tur, kaynak, zaman desc);
