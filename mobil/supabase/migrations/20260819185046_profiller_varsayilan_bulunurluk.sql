alter table public.profiller add column varsayilan_bulunurluk text;

update public.profiller
  set varsayilan_bulunurluk = case when varsayilan_gizli then 'gizli' else 'herkese_acik' end;

alter table public.profiller
  alter column varsayilan_bulunurluk set not null,
  alter column varsayilan_bulunurluk set default 'herkese_acik',
  add constraint profiller_varsayilan_bulunurluk
    check (varsayilan_bulunurluk in ('herkese_acik', 'takipcilerim', 'gizli'));

alter table public.profiller drop column varsayilan_gizli;

-- Faz 2c'de kurulan sutun duzeyindeki update yetkisi listesi guncelleniyor:
-- varsayilan_gizli artik yok, yerine varsayilan_bulunurluk giriyor.
-- kullanici_adi ve kullanici_adi_degistirildi disarida kaliyor (30 gun
-- kuralini baglayici yapan sey bu).
revoke update on public.profiller from authenticated;

grant update (ad, dogum_tarihi, biyografi, fotograflar,
              varsayilan_bulunurluk, aramada_gorunsun)
  on public.profiller to authenticated;
