-- PAYLASIMIN NOTU DUZENLENEBILIR OLDU.
--
-- Kullanicinin istegi (2026-09-02): "birde duzenlemeyle alakali bir
-- buton ekmeleyiz icerigi yaptigi paylasimi duzenleyebilecek yaptigi
-- etiketi kaldirabilir yazdigi notu silebilir degistirebilir".
--
-- Etiket kaldirma icin YENI BIR SEY GEREKMIYOR: `check_in_etiketleri`
-- silme politikasi zaten check-in'in sahibine de etiketlenen kisiye de
-- izin veriyor (migrasyon 20260826200000, canli dogrulama senaryo 64).
-- Eksik olan tek sey NOTUN degistirilmesiydi.
--
-- NEDEN RPC: `check_inler` uzerinde dogrudan update `authenticated`
-- rolunden geri alinmis durumda. Sebep tarihsel ve hala gecerli -
-- `gorunurluk` ve ozellikle `mekan_id` dogrudan yazilabilseydi kisi
-- kendi satirini baska bir mekana tasiyip mekan kapisini taklit
-- edebilirdi (bkz. sema-dogrula.ts, "check_inler sutun yetkisi").
-- Bu yuzden yetkiyi acmak yerine YALNIZCA NOTU yazan dar bir kapi
-- aciliyor.
--
-- MEKAN VE ZAMAN BILEREK DISARIDA. Bir check-in "su saatte suradaydim"
-- iddiasidir; notu ve etiketi kisinin kendi icerigi ama mekani ya da
-- saati sonradan degistirmek kaydin kendisini uydurma haline getirir.
-- Ustelik etiketlenen kisi de o konuma bakarak onay vermisti - mekan
-- degisseydi verdigi onay baska bir seyin onayina donusurdu.
--
-- Moderasyon karariyla gizlenmis satir duzenlenemiyor: sahibi onu zaten
-- goremiyor (select politikasi `not moderasyon_gizli` diyor), yani
-- duzenleyebilmesi tutarsiz olurdu.

create or replace function public.check_in_notunu_guncelle(
  p_check_in_id uuid,
  p_not text default null
)
returns public.check_inler
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_satir public.check_inler;
  v_temiz text;
begin
  if auth.uid() is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  if not moderasyon.hesap_aktif_mi(auth.uid()) then
    raise exception 'Hesabin su anda kullanilamiyor';
  end if;

  -- Bos ya da yalnizca boslukten olusan not NULL yaziliyor: "notu sil"
  -- ayri bir islem degil, alani bosaltip kaydetmek. Kart `not_metni`
  -- dolu mu diye baktigi icin NULL ile bos dize ayni gorunmemeli.
  v_temiz := nullif(btrim(coalesce(p_not, '')), '');

  update public.check_inler
  set not_metni = v_temiz
  where id = p_check_in_id
    and kullanici_id = auth.uid()
    and not moderasyon_gizli
  returning * into v_satir;

  -- Sahibi olmayan bir satir icin "yetkin yok" demiyoruz: satirin var
  -- olup olmadigini da soylemiyor. Ayni ortu engelleme ve silinmis
  -- hesap yollarinda da kullaniliyor.
  if v_satir.id is null then
    raise exception 'Bu paylasim bulunamadi';
  end if;

  return v_satir;
end;
$function$;

revoke all on function public.check_in_notunu_guncelle(uuid, text) from public;
grant execute on function public.check_in_notunu_guncelle(uuid, text) to authenticated;

comment on function public.check_in_notunu_guncelle(uuid, text) is
  'Paylasimin notunu degistirir ya da bosaltir. Yalnizca sahibi; mekan ve zaman degismez.';
