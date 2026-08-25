-- KVKK onayi artik KAYIT ANINDA DEGIL, dogrulamadan sonraki adimda
-- aliniyor. Tetikleyicinin de o adimi gormesi gerekiyor.
--
-- Sebep (kullanicinin karari, 2026-08-25): kayit akisi ucе bolundu -
-- once yalnizca telefon numarasi, sonra SMS kodu, sonra sifre + onay.
-- Ilk adimda kullanici `signInWithOtp` ile OLUSUYOR, yani onay
-- metadatasi o anda henuz yok. Onay bir sonraki adimda
-- `updateUser({ data })` ile yaziliyor; eski tetikleyici yalnizca
-- AFTER INSERT oldugu icin bu guncellemeyi hic gormuyordu ve onay
-- kaydi HIC olusmuyordu.
--
-- Ayni fonksiyon iki tetikleyiciden de cagriliyor. Iki kez yazmamasi
-- icin ayni (kullanici, onay turu, metin surumu) uclusu varsa yeniden
-- eklemiyor - guncelleme her metadata degisikliginde tetiklendigi icin
-- bu sart.
create or replace function public.kvkk_onaylarini_kaydet()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_surum text := new.raw_user_meta_data ->> 'gizlilik_metni_surumu';
begin
  if v_surum is null then
    return new;
  end if;

  if coalesce((new.raw_user_meta_data ->> 'aydinlatma_onayi')::boolean, false) then
    insert into public.kvkk_onaylari (kullanici_id, onay_turu, metin_surumu)
    select new.id, 'aydinlatma', v_surum
    where not exists (
      select 1 from public.kvkk_onaylari
      where kullanici_id = new.id
        and onay_turu = 'aydinlatma'
        and metin_surumu = v_surum
    );
  end if;

  if coalesce((new.raw_user_meta_data ->> 'konum_rizasi')::boolean, false) then
    insert into public.kvkk_onaylari (kullanici_id, onay_turu, metin_surumu)
    select new.id, 'konum_rizasi', v_surum
    where not exists (
      select 1 from public.kvkk_onaylari
      where kullanici_id = new.id
        and onay_turu = 'konum_rizasi'
        and metin_surumu = v_surum
    );
  end if;

  return new;
end;
$$;

-- INSERT tetikleyicisi yerinde duruyor; UPDATE icin ikincisi ekleniyor.
drop trigger if exists kvkk_onaylarini_guncellemede_kaydet_tetik on auth.users;

create trigger kvkk_onaylarini_guncellemede_kaydet_tetik
  after update of raw_user_meta_data on auth.users
  for each row
  execute function public.kvkk_onaylarini_kaydet();
