-- VERI DISA AKTARIMINA MEKAN PUANLARI EKLENDI (2026-09-13).
--
-- `verilerimi_disa_aktar` govdesi 20260911180000'den birebir alinip
-- yalnizca 'mekan_puanlarim' anahtari eklendi ('onaylarim'dan once).
-- Fonksiyon tek govde oldugu icin kismi degisiklik mumkun degil;
-- degisiklik bir sonraki surumde de bu dosyadan devam etmeli.

create or replace function public.verilerimi_disa_aktar()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_kisi uuid := auth.uid();
  v_sonuc jsonb;
begin
  if v_kisi is null then
    raise exception 'Kimlik dogrulamasi gerekli';
  end if;

  -- ASKIDAKI HESAP DA VERISINI ALABILIR: erisim hakki hesabin
  -- durumuna bagli degil. `hesap_aktif_mi` kontrolu bilerek YOK.

  select jsonb_build_object(
    'surum', 1,
    'olusturuldu', now(),
    'aciklama',
      'Slooin hesabindaki kendi verilerin. Fotograf baglantilari 24 saat gecerlidir.',

    'profil', (
      select to_jsonb(x) from (
        select p.id, p.kullanici_adi, p.ad, p.biyografi, p.instagram,
               p.yasadigi_il, p.yasadigi_ilce, p.dogum_tarihi,
               p.fotograflar, p.aramada_gorunsun, p.profil_gizli,
               p.etiket_onayi_gerekli, p.varsayilan_bulunurluk,
               p.dil, p.olusturuldu
        from public.profiller p where p.id = v_kisi
      ) x
    ),

    -- KOORDINAT DA GIRIYOR: canli bir check-in'in konumu kisinin kendi
    -- verisi. Suresi dolmus check-in'lerde zaten null (cron siliyor).
    'check_inler', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturma_zamani desc) from (
        select c.id, m.ad as mekan, m.semt as ilce, m.il,
               c.not_metni, c.fotograf, c.bulunurluk, c.gorunurluk,
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

    -- Etiketin iki yonu de kisinin verisi: etiketlendigi ve kendi
    -- check-in'inde baskasini etiketledigi. Karsi tarafin KULLANICI
    -- ADI zaten uygulamada ona gorunuyor.
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

    -- KENDI GONDERDIGIM mesajlar TAM METINLE.
    'gonderdigim_mesajlar', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select m.konusma_id, m.metin, m.olusturuldu
        from public.mesajlar m where m.gonderen_id = v_kisi
      ) x
    ), '[]'::jsonb),

    -- KARSI TARAFIN yazdiklari METINSIZ: kac mesaj, en sonuncusu ne
    -- zaman. Kullanicinin karari - baskasinin cumleleri onun verisi.
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

    -- KENDI ENGELLEDIKLERIM. Beni engelleyenler ASLA girmiyor.
    'engelledigim_kisiler', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.olusturuldu desc) from (
        select p.kullanici_adi, e.olusturuldu
        from public.engellemeler e
        join public.profiller p on p.id = e.engellenen_id
        where e.engelleyen_id = v_kisi
      ) x
    ), '[]'::jsonb),

    -- KENDI GONDERDIGIM sikayetler. Hakkimdakiler girmiyor.
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

    -- MEKAN PUANLARIM (2026-09-13): kisinin verdigi oylar. Mekan
    -- adiyla birlikte; puan 1 kotu / 2 iyi / 3 harika.
    'mekan_puanlarim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.guncelleme_zamani desc) from (
        select m.ad as mekan, m.semt as ilce, m.il, mp.puan,
               mp.olusturma_zamani, mp.guncelleme_zamani
        from public.mekan_puanlari mp
        join public.mekanlar m on m.id = mp.mekan_id
        where mp.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    'onaylarim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.zaman desc) from (
        select k.onay_turu, k.metin_surumu, k.verildi_mi, k.zaman
        from public.kvkk_onaylari k where k.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb),

    -- HESAP DURUMU giriyor (kisiyi dogrudan etkiliyor, zaten ekranda
    -- goruyor) ama KARAR VEREN MODERATORUN KIMLIGI girmiyor.
    'hesap_durumu', (
      select to_jsonb(x) from (
        select h.durum, h.gerekce, h.aski_bitisi, h.guncellendi
        from public.hesap_durumlari h where h.kullanici_id = v_kisi
      ) x
    ),

    -- Jetonun KENDISI girmiyor: ise yaramaz ve ele gecerse bildirim
    -- gondermeye yarar. Yalnizca hangi cihaz turunde kayitli oldugu.
    'bildirim_cihazlarim', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.guncellendi desc) from (
        select j.platform, j.guncellendi
        from public.bildirim_jetonlari j where j.kullanici_id = v_kisi
      ) x
    ), '[]'::jsonb)
  ) into v_sonuc;

  return v_sonuc;
end;
$fn$;
