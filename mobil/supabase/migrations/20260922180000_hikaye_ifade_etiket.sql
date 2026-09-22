-- HIKAYEYE IFADE VE ARKADAS ETIKETI (2026-09-22)
--
-- Kullanicinin istegi: "hikaye eklemeye basinca siyah ekran gelsin,
-- altta yaptigi check-in yeri gelsin isterse kaldirabilsin, not ekleme
-- kalsin, kendi ifade setimizden de ekleme yapabilsin, arkadas ekleme
-- bunlar eklensin."
--
-- Hikayede bugune kadar YALNIZCA fotograf + yazi + mekan vardi. Bu
-- migrasyon check-in'deki iki alani hikayeye de getiriyor:
--   * `ifade`  -> `public.ifadeler` sozlugunden tek secim (check-in ile
--                 AYNI sozluk; ayri bir set uretilmedi).
--   * etiket   -> `hikaye_etiketleri`, arkadas etiketleme.
--
-- ETIKET ONAYI CHECK-IN ILE AYNI KURALA TABI. `profiller.
-- etiket_onayi_gerekli` acik olan biri hikayede de onayi olmadan
-- etiketlenemez: tetikleyici durumu sunucuda belirliyor (istemcinin
-- yazdigi deger yok sayiliyor) ve onay bekleyen etiket izleyicide
-- GORUNMUYOR. Ayar kalici bir gizlilik tercihi; hikayenin 24 saatlik
-- olmasi onu delmek icin gerekce degil.

-- ---------------------------------------------------------------------
-- 1) Ifade
-- ---------------------------------------------------------------------
alter table public.hikayeler
  add column if not exists ifade text references public.ifadeler(slug);

comment on column public.hikayeler.ifade is
  'Istege bagli ifade (public.ifadeler sozlugu; check-in ile ayni set).';

-- ---------------------------------------------------------------------
-- 2) Etiketler
-- ---------------------------------------------------------------------
create table if not exists public.hikaye_etiketleri (
  hikaye_id uuid not null references public.hikayeler(id) on delete cascade,
  kullanici_id uuid not null references auth.users(id) on delete cascade,
  durum text not null default 'bekliyor' check (durum in ('bekliyor', 'onaylandi', 'reddedildi')),
  olusturuldu timestamp with time zone not null default now(),
  primary key (hikaye_id, kullanici_id)
);

create index if not exists hikaye_etiketleri_kullanici_idx
  on public.hikaye_etiketleri (kullanici_id, durum);

alter table public.hikaye_etiketleri enable row level security;

-- OKUMA: hikayeyi gorebilen etiketi de gorur (hikayeler RLS'i zaten
-- sahibi + arkadas + engel + moderasyon kurallarini uyguluyor), ya da
-- etiketlenen kisi kendi satirini gorur (onay bekleyeni gorebilmeli).
drop policy if exists hikaye_etiketleri_oku on public.hikaye_etiketleri;
create policy hikaye_etiketleri_oku on public.hikaye_etiketleri
  for select to authenticated
  using (
    kullanici_id = auth.uid()
    or exists (select 1 from public.hikayeler h where h.id = hikaye_id)
  );

-- YAZMA yalnizca RPC uzerinden (security definer): dogrudan insert yok.
revoke insert, update, delete on public.hikaye_etiketleri from authenticated;

-- Durumu SUNUCU belirliyor - check-in'deki `gizli.etiket_durumunu_belirle`
-- ile ayni gerekce: istemci kendi etiketini "onaylanmis" yazamamali.
create or replace function gizli.hikaye_etiket_durumu()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_onay_gerekli boolean;
begin
  select etiket_onayi_gerekli into v_onay_gerekli
  from public.profiller
  where id = new.kullanici_id;

  -- Profil bulunamazsa GUVENLI TARAF: onay bekle.
  new.durum := case when coalesce(v_onay_gerekli, true) then 'bekliyor' else 'onaylandi' end;
  return new;
end;
$$;

drop trigger if exists hikaye_etiket_durumu on public.hikaye_etiketleri;
create trigger hikaye_etiket_durumu
  before insert on public.hikaye_etiketleri
  for each row execute function gizli.hikaye_etiket_durumu();

-- ---------------------------------------------------------------------
-- 3) hikaye_ekle - YENI IMZA (eski asiri yukleme DUSURULUYOR)
-- ---------------------------------------------------------------------
drop function if exists public.hikaye_ekle(text, text, uuid);

create or replace function public.hikaye_ekle(
  p_fotograf text,
  p_yazi text default null,
  p_mekan_id uuid default null,
  p_ifade text default null,
  p_etiketler uuid[] default null
)
returns public.hikayeler
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_ben uuid := auth.uid();
  v_hikaye public.hikayeler;
  v_kisi uuid;
begin
  if v_ben is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;
  if not moderasyon.hesap_aktif_mi(v_ben) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;
  -- Yol sahipligi: baskasinin klasorundeki dosya hikayeye baglanamaz.
  if p_fotograf is null or split_part(p_fotograf, '/', 1) <> v_ben::text then
    raise exception 'Bu fotograf sana ait degil';
  end if;
  if p_yazi is not null and length(p_yazi) > 200 then
    raise exception 'Hikaye yazisi en fazla 200 karakter olabilir';
  end if;
  if p_mekan_id is not null and not exists (select 1 from public.mekanlar where id = p_mekan_id) then
    raise exception 'Mekan bulunamadi';
  end if;
  if p_ifade is not null and not exists (select 1 from public.ifadeler where slug = p_ifade) then
    raise exception 'Gecersiz ifade';
  end if;
  if (select count(*) from public.hikayeler
       where kullanici_id = v_ben and bitis > now()) >= 10 then
    raise exception 'Ayni anda en fazla 10 hikayen olabilir';
  end if;

  insert into public.hikayeler (kullanici_id, fotograf, yazi, mekan_id, ifade)
  values (v_ben, p_fotograf, nullif(trim(p_yazi), ''), p_mekan_id, p_ifade)
  returning * into v_hikaye;

  -- ETIKETLER: yalnizca KARSILIKLI ARKADAS etiketlenebilir (check-in
  -- ile ayni kural). Arkadas olmayan sessizce atlanmiyor, reddediliyor -
  -- istemci listeyi zaten arkadaslardan kuruyor, aksi bir durum hatadir.
  if p_etiketler is not null then
    foreach v_kisi in array p_etiketler loop
      if v_kisi = v_ben then
        raise exception 'Kendini etiketleyemezsin';
      end if;
      if not bag.takip_ediyor_mu(v_ben, v_kisi) then
        raise exception 'Yalnizca arkadaslarini etiketleyebilirsin';
      end if;
      insert into public.hikaye_etiketleri (hikaye_id, kullanici_id)
      values (v_hikaye.id, v_kisi)
      on conflict do nothing;
    end loop;
  end if;

  return v_hikaye;
end;
$$;

revoke execute on function public.hikaye_ekle(text, text, uuid, text, uuid[]) from public, anon;
grant execute on function public.hikaye_ekle(text, text, uuid, text, uuid[]) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 4) hikaye_akisi - ifade ve ONAYLANMIS etiketler
-- ---------------------------------------------------------------------
-- `hikaye_akisi` security INVOKER; `profiller` uzerinde okuma politikasi
-- YOK (her sey definer RPC'lerden geciyor), bu yuzden gomulu bir
-- profiller join'i etiketi SESSIZCE dusuruyordu - 2026-09-18'de check-in
-- etiketlerinde yasanan tuzagin aynisi; canli testte olculdu. Adlari
-- definer bir yardimci veriyor; `gizli` semasinda oldugu icin
-- PostgREST'e acik degil, hikayeyi goremeyen biri dogrudan cagiramaz.
create or replace function gizli.hikaye_etiketleri_json(p_hikaye_id uuid)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object('kullaniciId', e.kullanici_id, 'kullaniciAdi', p.kullanici_adi)),
    '[]'::jsonb)
  from public.hikaye_etiketleri e
  join public.profiller p on p.id = e.kullanici_id
  where e.hikaye_id = p_hikaye_id
    and e.durum = 'onaylandi'
    -- Askidaki/yasakli hesap ve iki yonlu engel: etiket de gorunmez.
    and moderasyon.hesap_aktif_mi(e.kullanici_id)
    and not gizli.engelli_mi(e.kullanici_id);
$$;

revoke execute on function gizli.hikaye_etiketleri_json(uuid) from public, anon;
grant execute on function gizli.hikaye_etiketleri_json(uuid) to authenticated, service_role;

drop function if exists public.hikaye_akisi();

create or replace function public.hikaye_akisi()
returns table (
  id uuid,
  kullanici_id uuid,
  fotograf text,
  yazi text,
  ifade text,
  mekan_id uuid,
  mekan_adi text,
  etiketler jsonb,
  olusturuldu timestamp with time zone,
  bitis timestamp with time zone,
  gordum boolean,
  goruntulenme_sayisi integer
)
language sql
security invoker
set search_path to 'public'
as $$
  select
    h.id,
    h.kullanici_id,
    h.fotograf,
    h.yazi,
    h.ifade,
    h.mekan_id,
    mk.ad,
    -- YALNIZCA ONAYLANMIS etiketler: onay bekleyen kimseye gorunmez.
    gizli.hikaye_etiketleri_json(h.id),
    h.olusturuldu,
    h.bitis,
    (h.kullanici_id = auth.uid())
      or exists (select 1 from public.hikaye_goruntulemeler g
                  where g.hikaye_id = h.id and g.kullanici_id = auth.uid()),
    case when h.kullanici_id = auth.uid()
      then (select count(*)::integer from public.hikaye_goruntulemeler g where g.hikaye_id = h.id)
      else 0 end
  from public.hikayeler h
  left join public.mekanlar mk on mk.id = h.mekan_id
  order by h.olusturuldu asc;
$$;

revoke execute on function public.hikaye_akisi() from public, anon;
grant execute on function public.hikaye_akisi() to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 5) Onay bekleyen HIKAYE etiketleri ve yanitlama
-- ---------------------------------------------------------------------
create or replace function public.bekleyen_hikaye_etiketlerim()
returns table (
  hikaye_id uuid,
  fotograf text,
  mekan_adi text,
  etiketleyen_id uuid,
  etiketleyen_ad text,
  etiketleyen_kullanici_adi text,
  olusturuldu timestamp with time zone
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  return query
  select e.hikaye_id, h.fotograf, mk.ad, h.kullanici_id, p.ad, p.kullanici_adi, e.olusturuldu
  from public.hikaye_etiketleri e
  join public.hikayeler h on h.id = e.hikaye_id
  join public.profiller p on p.id = h.kullanici_id
  left join public.mekanlar mk on mk.id = h.mekan_id
  where e.kullanici_id = auth.uid()
    and e.durum = 'bekliyor'
    -- Suresi dolmus hikayenin etiketi onaylanamaz; zaten silinecek.
    and h.bitis > now()
    and not h.moderasyon_gizli
    and moderasyon.hesap_aktif_mi(h.kullanici_id)
    and not gizli.engelli_mi(h.kullanici_id)
  order by e.olusturuldu desc;
end;
$$;

revoke execute on function public.bekleyen_hikaye_etiketlerim() from public, anon;
grant execute on function public.bekleyen_hikaye_etiketlerim() to authenticated, service_role;

create or replace function public.hikaye_etiketini_yanitla(p_hikaye_id uuid, p_onay boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  update public.hikaye_etiketleri
     set durum = case when p_onay then 'onaylandi' else 'reddedildi' end
   where hikaye_id = p_hikaye_id
     and kullanici_id = auth.uid()
     and durum = 'bekliyor';

  if not found then
    raise exception 'Yanitlanacak etiket bulunamadi';
  end if;
end;
$$;

revoke execute on function public.hikaye_etiketini_yanitla(uuid, boolean) from public, anon;
grant execute on function public.hikaye_etiketini_yanitla(uuid, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 6) verilerimi_disa_aktar - hikaye ifadesi ve etiketler
-- ---------------------------------------------------------------------
-- KVKK erisim hakki (m.11): yeni alanlar da dosyaya girer. Iki yon var -
-- kendi hikayemde ETIKETLEDIKLERIM ve baskasinin hikayesinde
-- ETIKETLENDIGIM satirlar. Ikincisi benim verimdir (kimin etiketledigi
-- ve durumu), hikayenin fotografi ya da yazisi DEGIL - o baskasinin.
-- Fonksiyon govdesi tek parca oldugu icin 20260922150000'den kopyalanip
-- alan eklendi; sonraki degisiklik BU dosyadan devam etmeli.

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

    'hikayelerim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select h.id, h.yazi, h.ifade, h.fotograf, m.ad as mekan, h.olusturuldu, h.bitis,
               coalesce((select jsonb_agg(p.kullanici_adi)
                           from public.hikaye_etiketleri e
                           join public.profiller p on p.id = e.kullanici_id
                          where e.hikaye_id = h.id), '[]'::jsonb) as etiketlediklerim
        from public.hikayeler h
        left join public.mekanlar m on m.id = h.mekan_id
        where h.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'hikaye_goruntulemelerim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.goruldu desc) from (
        select g.hikaye_id, p.kullanici_adi as izleyen, g.goruldu
        from public.hikaye_goruntulemeler g
        join public.hikayeler h on h.id = g.hikaye_id
        left join public.profiller p on p.id = g.kullanici_id
        where h.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'hikaye_etiketlerim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select p.kullanici_adi as etiketleyen, e.durum, e.olusturuldu
        from public.hikaye_etiketleri e
        join public.hikayeler h on h.id = e.hikaye_id
        left join public.profiller p on p.id = h.kullanici_id
        where e.kullanici_id = v_kisi
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
