-- MODERASYON PANELI OZET SAYFASI (2026-09-18, panel yeniden tasarimi).
--
-- Tek cagrida sayaclar: bekleyen sikayet (ve en eskisinin zamani),
-- bugun/7 gunde verilen karar, askida ve yasakli hesap, bekleyen mekan
-- duzenleme talebi. Liste RPC'lerini sayim icin cagirmak hem uc istek
-- hem sayfalama yuzunden yanlis olurdu.
--
-- Liste ekranlarinda gezinme gibi bu da denetim izine DUSMEZ (spec
-- karar 61): kisisel veriye erisim degil, toplam sayilar.

create or replace function public.moderasyon_ozet()
returns table (
  bekleyen_sikayet     bigint,
  en_eski_bekleyen     timestamptz,
  bugun_karar          bigint,
  yedi_gun_karar       bigint,
  askida_hesap         bigint,
  yasakli_hesap        bigint,
  bekleyen_talep       bigint
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  perform moderasyon.yetkili_mi_zorla();

  return query
  select
    (select count(*) from public.sikayetler s where s.durum = 'yeni'),
    (select min(s.olusturuldu) from public.sikayetler s where s.durum = 'yeni'),
    (select count(*) from public.sikayetler s
      where s.karar_zamani >= date_trunc('day', now())),
    (select count(*) from public.sikayetler s
      where s.karar_zamani >= now() - interval '7 days'),
    (select count(*) from public.hesap_durumlari h
      where h.durum = 'askida' and (h.aski_bitisi is null or h.aski_bitisi > now())),
    (select count(*) from public.hesap_durumlari h where h.durum = 'yasakli'),
    (select count(*) from public.mekan_duzenleme_talepleri t where t.durum = 'beklemede');
end;
$fn$;

revoke execute on function public.moderasyon_ozet() from public, anon;
grant execute on function public.moderasyon_ozet() to authenticated;
