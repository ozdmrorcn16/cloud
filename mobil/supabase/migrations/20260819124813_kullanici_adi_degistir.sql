create or replace function public.kullanici_adi_degistir(p_yeni_ad text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mevcut_ad text;
  v_son_degisiklik timestamptz;
  v_kalan_gun int;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
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

  -- Ayni adi yeniden yazmak 30 gunluk hakki harcamamali.
  if v_mevcut_ad = p_yeni_ad then
    raise exception 'Zaten bu kullanici adini kullaniyorsun';
  end if;

  if v_son_degisiklik is not null
     and v_son_degisiklik > now() - interval '30 days' then
    v_kalan_gun := ceil(
      extract(epoch from (v_son_degisiklik + interval '30 days' - now())) / 86400
    );
    raise exception
      'Kullanici adini 30 gunde bir degistirebilirsin. Kalan sure: % gun', v_kalan_gun;
  end if;

  -- Asil guvence unique kisiti; buradaki kontrol yalnizca daha okunakli
  -- bir hata mesaji uretmek icin. Iki es zamanli cagri yarisirsa
  -- kaybeden taraf kisit ihlaliyle (23505) doner, bu da dogru davranis.
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

revoke execute on function public.kullanici_adi_degistir from public, anon;
grant execute on function public.kullanici_adi_degistir to authenticated;
