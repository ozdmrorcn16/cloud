-- ANLIK ARSIVI (2026-09-24, kullanicinin karari).
--
-- "Anliklar 24 saat duracak; sag ustte atilan anliklarin kayitli
-- kalabilecegi bir alan olsun, sureli olmayacaklar." Kararlar:
--   * Arsivi YALNIZCA SAHIBI gorur. 24 saat sonra arkadaslar/herkes
--     artik goremez (mevcut "hikaye gorunurlugu" politikasi bitis > now()
--     ile zaten boyle); sahibine ayri politika acilir.
--   * Anlik ve fotografi ARTIK SILINMEZ; sahibi silene ya da hesabini
--     silene kadar saklanir.
--   * Goruntulemeler (kim gordu + attigi ifade) ve eski arkadas etiketleri
--     BASKALARININ verisi oldugu icin 24 saatte SILINIR (kullanicinin
--     secimi) - arsivde yalnizca fotograf, mekan ve zaman kalir.
--
-- KVKK: yeni saklama suresi = "sahibi silene kadar"; dayanak sozlesmenin
-- ifasi (kisinin kendi arsivi); goren yalnizca sahibi; disa aktarimda
-- zaten var (hikayelerim suresiz okuyor). Hesap silinince fotograflar
-- `hesap-sil` Edge Function'da kovadan silinir (ayni is kaleminde eklendi;
-- once 24 saatlik temizlik bunu ortuyordu).

-- 1) Sahibi kendi anliklarini (suresi dolmus dahil) okur.
create policy "kendi anlik arsivi" on public.hikayeler
  for select to authenticated
  using (kullanici_id = auth.uid() and not moderasyon_gizli);

-- 2) Saatlik is: anlik/fotograf DEGIL, baskalarinin verisi silinir.
select cron.unschedule('hikaye-suresi-dolanlari-sil');
select cron.schedule(
  'hikaye-suresi-dolanlari-sil',
  '7 * * * *',
  $$
    delete from public.hikaye_goruntulemeler g
     using public.hikayeler h
     where g.hikaye_id = h.id and h.bitis <= now();
    delete from public.hikaye_etiketleri e
     using public.hikayeler h
     where e.hikaye_id = h.id and h.bitis <= now();
  $$
);

-- 3) Arsiv listesi: kendi anliklarim, en yeni once, sayfali.
create function public.anlik_arsivim(p_once timestamptz default null, p_adet int default 60)
returns table(id uuid, fotograf text, mekan_id uuid, mekan_adi text, olusturuldu timestamptz, bitis timestamptz, gorunurluk text)
language sql
stable
security invoker
set search_path to 'public'
as $$
  select h.id, h.fotograf, h.mekan_id, m.ad, h.olusturuldu, h.bitis, h.gorunurluk
    from public.hikayeler h
    left join public.mekanlar m on m.id = h.mekan_id
   where h.kullanici_id = auth.uid()
     and not h.moderasyon_gizli
     and (p_once is null or h.olusturuldu < p_once)
   order by h.olusturuldu desc
   limit least(greatest(coalesce(p_adet, 60), 1), 200);
$$;
revoke all on function public.anlik_arsivim(timestamptz, int) from public, anon;
grant execute on function public.anlik_arsivim(timestamptz, int) to authenticated;

notify pgrst, 'reload schema';

-- 4) hikaye_akisi (security INVOKER) sure suzgecini RLS'e birakiyordu;
-- sahibine arsiv politikasi acilinca kisinin ESKI anliklari kendi
-- seridine dusecekti. Suzgec artik fonksiyonda ACIK. Canli tanimdan
-- devam (CLAUDE.md kurali): yalnizca order by oncesine kosul eklenir.
do $$
declare d text; eski constant text := '  order by h.olusturuldu asc;';
begin
  select pg_get_functiondef(p.oid) into d from pg_proc p where proname = 'hikaye_akisi';
  if position('and h.bitis > now()' in d) > 0 then return; end if;
  if position(eski in d) = 0 then raise exception 'hikaye_akisi beklenen metni icermiyor'; end if;
  d := replace(d, eski, '    -- Serit/izleyici yalnizca AKTIF anliklar (2026-09-24).
    and h.bitis > now()
  order by h.olusturuldu asc;');
  execute d;
end $$;
