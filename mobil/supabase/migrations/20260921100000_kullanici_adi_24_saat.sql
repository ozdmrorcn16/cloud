-- KULLANICI ADI 24 SAATTE BIR (kullanicinin karari 2026-09-21; 30 gun
-- kurali 2026-08-19'dan beriydi). Mesaj bicimi degisti: istemci
-- `hata-metni.ts` deseni "Kalan sure: N saat" bekliyor.

create or replace function public.kullanici_adi_degistir(p_yeni_ad text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mevcut_ad text;
  v_son_degisiklik timestamptz;
  v_kalan_saat int;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  if p_yeni_ad is null or p_yeni_ad !~ '^[a-z0-9._]{3,20}$' then
    raise exception 'Kullanici adi kurallara uymuyor';
  end if;

  select kullanici_adi, kullanici_adi_degistirildi
    into v_mevcut_ad, v_son_degisiklik
    from public.profiller
    where id = auth.uid();

  if not found then
    raise exception 'Profil bulunamadi';
  end if;

  -- Ayni adi yeniden yazmak 24 saatlik hakki harcamamali.
  if v_mevcut_ad = p_yeni_ad then
    raise exception 'Zaten bu kullanici adini kullaniyorsun';
  end if;

  if v_son_degisiklik is not null
     and v_son_degisiklik > now() - interval '24 hours' then
    v_kalan_saat := greatest(1, ceil(
      extract(epoch from (v_son_degisiklik + interval '24 hours' - now())) / 3600
    ));
    raise exception
      'Kullanici adini 24 saatte bir degistirebilirsin. Kalan sure: % saat', v_kalan_saat;
  end if;

  if exists (
    select 1 from public.profiller
    where kullanici_adi = p_yeni_ad and id <> auth.uid()
  ) then
    raise exception 'Bu kullanici adi alinmis';
  end if;

  update public.profiller
    set kullanici_adi = p_yeni_ad,
        kullanici_adi_degistirildi = now()
    where id = auth.uid();
end;
$$;

revoke execute on function public.kullanici_adi_degistir(text) from public, anon;
grant execute on function public.kullanici_adi_degistir(text) to authenticated, service_role;
