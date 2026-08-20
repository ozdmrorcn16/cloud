-- Faz 3b Task 9: Realtime yayini ve mesaj sikayeti.
--
-- 1) mesajlar tablosu Realtime yayinina ekleniyor, canli mesaj teslimi
--    bunu gerektiriyor. Yetki kontrolu ayrica kurulmuyor: abonelikte
--    kim neyi gorur sorusunun cevabi zaten tablonun mevcut select RLS
--    politikasindan geliyor ("mesaj uyeligi", 20260820131833_mesajlar.sql).
--    Ayni kurali iki yerde (RLS + ayri bir abonelik filtresi) tekrar
--    etmek, ikisinin zamanla ayrisip birinin digerinden gevsek kalmasi
--    demek olurdu.
alter publication supabase_realtime add table public.mesajlar;

-- 2) sikayet_gonder hedef turlerine 'mesaj' ekleniyor. Govde
--    20260820070000_sohbet_geri_cek_sikayet_dogrulama_gunluk_budama.sql'deki
--    SON surumden birebir kopyalandi; tek fark asagidaki not in (...)
--    listesine 'mesaj' eklenmesi. Auth guard, p_hedef_tur/p_hedef_id/
--    p_sebep dogrulamalari (sira dahil - p_hedef_id null kontrolu
--    kendini sikayet karsilastirmasindan ONCE gelmeli, yoksa NULL
--    karsilastirmasi sessizce false/NULL doner ve kontrolu atlar), kendini
--    sikayet kontrolu ve insert sutun listesi degismedi.
create or replace function public.sikayet_gonder(
  p_hedef_tur text,
  p_hedef_id uuid,
  p_sebep text,
  p_aciklama text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if p_hedef_tur is null or p_hedef_tur not in ('kullanici', 'check_in', 'mesaj') then
    raise exception 'Gecersiz sikayet hedefi';
  end if;

  if p_hedef_id is null then
    raise exception 'Gecersiz sikayet hedefi';
  end if;

  if p_sebep is null or trim(p_sebep) = '' then
    raise exception 'Sikayet sebebi belirtilmeli';
  end if;

  if p_hedef_tur = 'kullanici' and p_hedef_id = auth.uid() then
    raise exception 'Kendini sikayet edemezsin';
  end if;

  insert into public.sikayetler (sikayet_eden_id, hedef_tur, hedef_id, sebep, aciklama)
  values (auth.uid(), p_hedef_tur, p_hedef_id, p_sebep, p_aciklama);
end;
$$;

revoke execute on function public.sikayet_gonder from public, anon;
grant execute on function public.sikayet_gonder to authenticated;
