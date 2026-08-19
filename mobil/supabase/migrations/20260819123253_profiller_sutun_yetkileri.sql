-- RLS satir duzeyindedir, sutun duzeyinde degil. Bu yuzden "kendi
-- profilini guncelleyebilir" politikasi kullanicinin kullanici_adi
-- sutununu dogrudan yazmasina izin verir ve kullanici_adi_degistir
-- RPC'sindeki 30 gun kurali atlanabilir hale gelir. Istemcinin
-- cagirmayi secebilecegi bir kural, kural degildir.
revoke update on public.profiller from authenticated;

grant update (ad, dogum_tarihi, biyografi, fotograflar,
              varsayilan_gizli, aramada_gorunsun)
  on public.profiller to authenticated;
